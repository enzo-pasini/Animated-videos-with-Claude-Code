// A whole video from render props (tools/build_props.py). Same building blocks as the locked
// StyleTest: TransitionSeries with 8-frame dissolves, ThreeCanvas per shot, Grade, Captions.
import { ThreeCanvas } from "@remotion/three";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Fragment } from "react";
import * as THREE from "three";
import {
  AbsoluteFill,
  Audio,
  type CalculateMetadataFunction,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Pose } from "../character/draw";
import { setLook } from "../character/look";
import { EXPRESSIONS } from "../cast/expressions";
import { FX, JUMPS, WALKS, walkStepFrames, walkStop } from "../cast/fx";
import { castMember } from "../cast/registry";
import type { HeadShape } from "../character/head";
// one stable spec object per (character, head shape, background), so the character card does not redo its setup every frame
const headSpecs = new Map<string, ReturnType<typeof castMember>>();
const actorSpec = (who: string, head?: string, bg?: boolean) => {
  if (!head && !bg) return castMember(who);
  const key = who + '|' + (head ?? '') + '|' + (bg ? 'bg' : '');
  if (!headSpecs.has(key)) headSpecs.set(key, { ...castMember(who), ...(head ? { headShape: head as HeadShape } : {}), ...(bg ? { bg: true } : {}) });
  return headSpecs.get(key)!;
};
import { Captions } from "../film/Captions";
import { camAt } from "../film/camera";
import { EdgeLines } from "../film/EdgeLines";
import { Grade } from "../style/Grade";
import { CharacterCard, type WarmLight } from "../three/CharacterCard";
import { CameraRig, SceneSetup, glProps } from "../three/Rig";
import { type LightLevels, SETS } from "./sets";
import { type Camera2D, InsertShot } from "../world/inserts/Diagram";
import { Branch } from "../world/kit/Branch";
import type { Move } from "../film/camera";
import type { Actor, EpisodeProps, Grade as GradeT, Keys, ShotProps } from "./types";

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const ease = { easing: Easing.inOut(Easing.cubic), ...clamp };

const keysAt = (k: Keys, g: number, eased = false) =>
  k.frames.length === 1 ? k.values[0] : interpolate(g, k.frames, k.values, eased ? ease : clamp);

export const lightLevels = (lights: EpisodeProps["lights"], g: number): LightLevels =>
  Object.fromEntries(Object.entries(lights).map(([name, k]) => [name, keysAt(k, g)]));

const breatheAt = (g: number, fps: number) => 0.5 + 0.5 * Math.sin((g / fps) * 2.4);
const blinkAt = (g: number, at: number[]) => (at.some((a) => g >= a && g < a + 4) ? 1 : 0);

const stepAt = (steps: [number, string][], g: number) => {
  let v = steps[0]?.[1];
  for (const [f, val] of steps) if (g >= f) v = val;
  return v;
};

// v4 effects: the active "fx" step and how many frames ago it started (before its first step = none)
// The effect before it (at the switch frame) is passed as `prev`, so a chain of 3D-face expressions turns on smoothly.
const fxAt = (steps: [number, string][], g: number): Partial<Pose> => {
  let name = "none";
  let from = 0;
  let prevName = "none";
  let prevFrom = 0;
  for (const [f, val] of steps) if (g >= f) [prevName, prevFrom, name, from] = [name, from, val, f];
  const fx = FX[name];
  if (!fx) throw new Error(`unknown fx ${name}`);
  const before = FX[prevName];
  if (!before) throw new Error(`unknown fx ${prevName}`);
  return fx(g - from, prevName === "none" ? undefined : before(from - prevFrom));
};

// v4 jump combo: the active "jump" step (body only) and how many frames ago it started
const jumpAt = (steps: [number, string][], g: number): Partial<Pose> => {
  let name = "none";
  let from = 0;
  for (const [f, val] of steps) if (g >= f) [name, from] = [val, f];
  const jump = JUMPS[name];
  if (!jump) throw new Error(`unknown jump ${name}`);
  return jump(g - from);
};

// v4 walk: the active "walk" step (body only) and how many frames ago it started
const walkAt = (steps: [number, string][], g: number): Partial<Pose> => {
  let name = "none";
  let from = 0;
  let prevName = "none";
  let prevFrom = 0;
  for (const [f, val] of steps) if (g >= f) [prevName, prevFrom, name, from] = [name, from, val, f];
  if (name === "stop") return walkStop(prevName, Math.round((from - prevFrom) / walkStepFrames(prevName)), g - from);
  const walk = WALKS[name];
  if (!walk) throw new Error(`unknown walk ${name}`);
  return walk(g - from);
};

// v4 walk: an actor with a "path" moves along it (straight lines between the points, constant speed per part)
const pathAt = (a: Actor, g: number): [number, number, number] => {
  if (!a.path) return a.pos;
  const { frames, points } = a.path;
  return [0, 1, 2].map((i) =>
    frames.length === 1 ? points[0][i] : interpolate(g, frames, points.map((p) => p[i]), clamp),
  ) as [number, number, number];
};

// order: breathing → named expression (base, then switched on words) → fixed fields → moving tracks → steps → fx → jump → walk → blinks
const poseAt = (a: Actor, g: number, fps: number): Partial<Pose> => {
  const { expr, ...fixed } = a.base as Partial<Pose> & { expr?: string };
  const exprNow = a.steps.expr ? stepAt(a.steps.expr as [number, string][], g) : expr;
  const p: Record<string, unknown> = { breathe: breatheAt(g, fps), ...(exprNow ? EXPRESSIONS[exprNow] : {}), ...fixed };
  for (const [field, k] of Object.entries(a.tracks)) p[field] = keysAt(k, g, true);
  for (const [field, steps] of Object.entries(a.steps)) {
    if (field !== "expr" && field !== "fx" && field !== "jump" && field !== "walk") p[field] = stepAt(steps as [number, string][], g);
  }
  if (a.steps.fx) Object.assign(p, fxAt(a.steps.fx as [number, string][], g));
  if (a.steps.jump) Object.assign(p, jumpAt(a.steps.jump as [number, string][], g)); // the body; the face stays free
  if (a.steps.walk) Object.assign(p, walkAt(a.steps.walk as [number, string][], g)); // the body; the face stays free
  if (a.blink.length) p.blink = blinkAt(g, a.blink);
  return p as Partial<Pose>;
};

const gradeAt = (grade: GradeT, levels: LightLevels): string | undefined => {
  if (!grade) return undefined;
  if (typeof grade === "string") return grade;
  const l = levels[grade.follow] ?? 0;
  const [b, c, s] = grade.from.map((v, i) => v + (grade.to[i] - v) * l);
  return `brightness(${b.toFixed(3)}) contrast(${c.toFixed(3)}) saturate(${s.toFixed(3)})`;
};

const EpisodeShot: React.FC<{ shot: ShotProps; lights: EpisodeProps["lights"]; fps: number }> = (props) =>
  props.shot.set === "insert" && props.shot.insert ? (
    <InsertShot insert={props.shot.insert} camera={props.shot.camera as Camera2D} from={props.shot.from} />
  ) : (
    <WorldShot {...props} />
  );

const WorldShot: React.FC<{ shot: ShotProps; lights: EpisodeProps["lights"]; fps: number }> = ({ shot, lights, fps }) => {
  const local = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const g = shot.from + local;
  const set = SETS[shot.set];
  if (!set) throw new Error(`unknown set ${shot.set}`);
  const cam = camAt(shot.camera as Move, local);
  const camPos = new THREE.Vector3(...cam.pos);
  const levels = lightLevels(lights, g);
  const extra: WarmLight[] = shot.extra_warm.map((w) => ({
    pos: w.pos,
    color: w.color,
    strength: w.strength * (w.follow ? (levels[w.follow] ?? 0) : 1),
    range: w.range,
  }));
  const warm = [...extra, ...set.warmLights(g, levels)].slice(0, 2);
  const actorPos = (p: [number, number, number]): [number, number, number] => {
    if (!set.actorOffset) return p;
    const o = set.actorOffset(g, levels, p);
    return [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
  };
  const actors = shot.actors.map((a, i) => (
    <CharacterCard key={i} spec={actorSpec(a.who, a.head, a.bg)} position={actorPos(pathAt(a, g))} camPos={camPos} warm={warm} {...(set.character ?? {})}
      pose={poseAt(a, g, fps)} />
  ));
  const blur = shot.blur_bg;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ThreeCanvas
        shadows="soft"
        width={width}
        height={height}
        gl={glProps}
        camera={{ fov: cam.fov, position: cam.pos }}
        style={
          // v3 rule: a blur shot gets no shot grade. A set grade (the set's light preset) applies to every shot.
          blur
            ? { filter: `${set.grade ? set.grade + " " : ""}blur(${blur}px)`, transform: "scale(1.02)" }
            : shot.grade
              ? { filter: gradeAt(shot.grade, levels) }
              : set.grade
                ? { filter: set.grade }
                : undefined
        }
      >
        {set.fog ? <SceneSetup fog={set.fog.color} density={set.fog.density} /> : <SceneSetup />}
        <CameraRig {...cam} />
        <set.Scene frame={g} lights={levels} />
        {shot.branch ? <Branch cam={cam} cam0={camAt(shot.camera as Move, 0)} corner={shot.branch.corner} t={local / fps} /> : null}
        {blur ? null : actors}
      </ThreeCanvas>
      {blur && actors.length ? (
        <AbsoluteFill>
          <ThreeCanvas width={width} height={height} gl={{ ...glProps, alpha: true }} camera={{ fov: cam.fov, position: cam.pos }}>
            <CameraRig {...cam} />
            {actors}
          </ThreeCanvas>
        </AbsoluteFill>
      ) : null}
      {shot.lines ? <EdgeLines lines={shot.lines} g={g} /> : null}
    </AbsoluteFill>
  );
};

export const episodeMetadata: CalculateMetadataFunction<EpisodeProps> = ({ props }) => ({
  durationInFrames: Math.max(1, props.frames),
  fps: props.fps,
});

export const Episode: React.FC<EpisodeProps> = (props) => {
  setLook(props.look); // v4 look track: before any character card draws
  return (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <TransitionSeries>
      {props.shots.map((shot, i) => (
        <Fragment key={shot.id}>
          {i > 0 && shot.transition_in === "dissolve" ? (
            <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: props.dissolve })} />
          ) : null}
          <TransitionSeries.Sequence durationInFrames={shot.len}>
            <EpisodeShot shot={shot} lights={props.lights} fps={props.fps} />
          </TransitionSeries.Sequence>
        </Fragment>
      ))}
    </TransitionSeries>
    <Grade />
    <Captions chunks={props.captions} />
    {props.audio ? <Audio src={staticFile(props.audio)} /> : null}
  </AbsoluteFill>
  );
};
