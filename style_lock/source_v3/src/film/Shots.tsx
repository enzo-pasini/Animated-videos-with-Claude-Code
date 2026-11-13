import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { type Pose, armPoints } from "../character/draw";
import { BRAM } from "../character/specs";
import { CharacterCard, HEAD_WORLD, type WarmLight } from "../three/CharacterCard";
import { CHAR_WARM, LANTERN, NightStreet, sceneWarmLights } from "../three/NightStreet";
import { CameraRig, SceneSetup, glProps } from "../three/Rig";
import { type Move, camAt } from "./camera";
import { FPS, SHOT_LEN, SHOT_START, wordFrame } from "./script";

// ---------------- story state (global frames) ----------------
const LIT = wordFrame("lit", 0) + 2; // Bram lights the lantern
const WIN = wordFrame("lit", 1) + 1; // the window across the street lights up
export const lanternOnAt = (g: number) =>
  interpolate(g, [LIT, LIT + 4, LIT + 6, LIT + 10], [0, 0.55, 0.45, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
export const acrossLitAt = (g: number) =>
  // slow warm-up (22 frames) with a small candle flicker: reads as light, not as a cut
  interpolate(g, [WIN, WIN + 6, WIN + 10, WIN + 22], [0, 0.35, 0.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
export const flickerAt = (f: number) => 1 + 0.05 * Math.sin(f * 0.37) + 0.03 * Math.sin(f * 1.13 + 1.7);


const blinkAt = (g: number, at: number[]) => (at.some((a) => g >= a && g < a + 4) ? 1 : 0);
const breatheAt = (g: number) => 0.5 + 0.5 * Math.sin((g / FPS) * 2.4);

type ShotDef = {
  move: Move;
  pose?: (g: number) => Partial<Pose>;
  extraWarm?: (g: number) => WarmLight[];
  blurWorld?: number; // px, background blur (character stays sharp)
  grade?: string | ((g: number) => string); // per-shot CSS grade on the 3D layer (night exteriors get more contrast)
};

// night exteriors (shots 2, 4): more contrast + brighter highlights, a bit less saturation
const NIGHT_EXT_GRADE = "brightness(1.3) contrast(1.34) saturate(0.68)";

const ease = { easing: Easing.inOut(Easing.cubic), extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

export const SHOTS: ShotDef[] = [
  // 1 — HOOK: fast push-in from a wide street view onto Bram, who lifts his pole and lights the lantern
  {
    move: {
      // head 12.6 % (wide) → 24 % after the zoom (0.8 s) → 29 % at the end
      target: [0.1, 1.45, -1.4],
      dir: [0.5, 0.06, 1],
      d0: 5.56,
      fov: 44,
      fovStart: 70,
      rate: 0.13,
      fast: { dur: 0.8, factor: 1 },
      drift: [-0.12, 0, 0],
      roll: [-1.2, 0.4],
      lenS: SHOT_LEN[0] / FPS,
    },
    grade: "brightness(1.18) contrast(0.88)",
    pose: (g) => ({
      armL: interpolate(g, [LIT - 22, LIT - 3], [0.62, 1.46], ease),
      lookX: interpolate(g, [LIT - 26, LIT - 12], [0, -0.7], ease),
      lookY: interpolate(g, [LIT - 26, LIT - 12], [0, -0.9], ease),
      mouth: g > LIT + 2 ? "smile" : "flat",
      blink: blinkAt(g, [10]),
    }),
  },
  // 2 — "a street where nobody lived": reverse angle on the dark, empty houses across the street
  {
    move: {
      target: [3.0, 6.0, 6.4],
      dir: [-0.56, -0.5, -0.66],
      d0: 8.5,
      fov: 50,
      rate: 0.15,
      drift: [0.22, 0.02, 0],
      roll: [0.8, 2.0],
      lenS: SHOT_LEN[1] / FPS,
    },
    grade: NIGHT_EXT_GRADE,
  },
  // 3 — close-up: "the whole town laughed at him" (background blur σ≈3 px, the 1-in-5 blur shot)
  {
    move: {
      // close-up: head 40.5 % → 51 % (rate kept lower so it never passes the 51 % close-up max)
      target: [0.0, 1.42, -1.42],
      dir: [-0.12, 0.03, 1],
      d0: 4.5,
      fov: 30,
      rate: 0.09,
      drift: [0.06, 0, 0],
      roll: [1.5, 0.5],
      lenS: SHOT_LEN[2] / FPS,
    },
    blurWorld: 3,
    pose: (g) => ({
      armL: 0.62,
      lookX: -0.4,
      lookY: 0.7,
      mouth: "flat",
      browRaise: -0.45,
      headTilt: -0.04,
      blink: blinkAt(g, [168]),
    }),
  },
  // 4 — the window across the street lights up (cool → warm)
  {
    move: {
      target: [0.9, 4.25, 6.5],
      dir: [-0.1, -0.42, -1],
      d0: 7.6,
      fov: 40,
      rate: 0.14,
      drift: [0.16, 0, 0],
      roll: [-0.5, -1.8],
      lenS: SHOT_LEN[3] / FPS,
    },
    // the night grade relaxes as the window lights up (a big bright window + strong contrast = too harsh)
    grade: (g) => {
      const l = acrossLitAt(g);
      return `brightness(${(1.3 - 0.28 * l).toFixed(3)}) contrast(${(1.34 - 0.44 * l).toFixed(3)}) saturate(${(0.68 + 0.3 * l).toFixed(3)})`;
    },
  },
  // 5 — Bram looks up, surprised, then smiles ("someone had been waiting")
  {
    move: {
      // medium, opposite diagonal to shot 1: head 24 % → 32 %
      target: [0.0, 1.35, -1.42],
      dir: [-0.45, 0.02, 1],
      d0: 7.1,
      fov: 32,
      rate: 0.11,
      drift: [-0.12, 0, 0],
      roll: [0.0, -1.5],
      lenS: SHOT_LEN[4] / FPS,
    },
    pose: (g) => ({
      armL: 0.62,
      lookX: 0.15,
      lookY: -0.6,
      browRaise: interpolate(g, [SHOT_START[4], wordFrame("waiting")], [1, 0.35], ease),
      mouth: g < wordFrame("someone") ? "open" : "smile",
      headTilt: interpolate(g, [SHOT_START[4], SHOT_START[4] + 60], [0, 0.06], ease),
      blink: blinkAt(g, [wordFrame("had") + 2]),
    }),
    extraWarm: (g) => [{ pos: [0.6, 2.7, 1.4], color: CHAR_WARM, strength: 0.45 * acrossLitAt(g), range: 3.4 }],
  },
];

// Bram stands so that, seen from the shot-1 camera at the lighting moment, his raised pole touches the lantern.
export const BRAM_POS: [number, number, number] = (() => {
  const cam = camAt(SHOTS[0].move, LIT - SHOT_START[0]);
  const tip = armPoints(-1, 1.46, 0.1).hx * HEAD_WORLD; // pole x in the card, meters (negative = screen-left)
  let x = LANTERN.x;
  let z = LANTERN.z;
  for (let i = 0; i < 4; i++) {
    const yaw = Math.atan2(cam.pos[0] - x, cam.pos[2] - z);
    x = LANTERN.x - Math.cos(yaw) * tip;
    z = LANTERN.z + Math.sin(yaw) * tip;
  }
  return [x, 0.14, z];
})();

export const Shot: React.FC<{ index: number }> = ({ index }) => {
  const local = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const def = SHOTS[index];
  const g = SHOT_START[index] + local;
  const cam = camAt(def.move, local);
  const camPos = new THREE.Vector3(...cam.pos);
  const lanternOn = lanternOnAt(g);
  const acrossLit = acrossLitAt(g);
  const flicker = flickerAt(g);
  const showBram = !!def.pose;
  const warm: WarmLight[] = [...(def.extraWarm?.(g) ?? []), ...sceneWarmLights(flicker, acrossLit, lanternOn)].slice(0, 2);

  const bram = showBram ? (
    <CharacterCard
      spec={BRAM}
      position={BRAM_POS}
      camPos={camPos}
      warm={warm}
      pose={{ breathe: breatheAt(g), ...def.pose!(g) }}
    />
  ) : null;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ThreeCanvas
        shadows="soft"
        width={width}
        height={height}
        gl={glProps}
        camera={{ fov: cam.fov, position: cam.pos }}
        style={
          def.blurWorld
            ? { filter: `blur(${def.blurWorld}px)`, transform: "scale(1.02)" }
            : def.grade
              ? { filter: typeof def.grade === "function" ? def.grade(g) : def.grade }
              : undefined
        }
      >
        <SceneSetup />
        <CameraRig {...cam} />
        <NightStreet frame={g} lanternOn={lanternOn} acrossLit={acrossLit} />
        {def.blurWorld ? null : bram}
      </ThreeCanvas>
      {def.blurWorld && bram ? (
        <AbsoluteFill>
          <ThreeCanvas width={width} height={height} gl={{ ...glProps, alpha: true }} camera={{ fov: cam.fov, position: cam.pos }}>
            <CameraRig {...cam} />
            {bram}
          </ThreeCanvas>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
