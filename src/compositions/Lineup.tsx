// Lineup sheet for approving a new character (PLAN §3.1): the new one next to others, at the same
// scale, in the night street with the locked lights and grade. Also a flat (unlit) row for detail.
import { ThreeCanvas } from "@remotion/three";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { DEFAULT_POSE, PX_PER_UNIT, UNITS_H, UNITS_W, drawCharacter, type Pose } from "../character/draw";
import { castMember } from "../cast/registry";
import { EXPRESSIONS } from "../cast/expressions";
import { CharacterCard } from "../three/CharacterCard";
import { CameraRig, SceneSetup, glProps, type Cam } from "../three/Rig";
import { Grade } from "../style/Grade";
import { FACADE_Z, NightStreet, sceneWarmLights } from "../world/sets/NightStreet";

export type LineupProps = { ids: string[]; expr?: string };

export const Lineup: React.FC<LineupProps> = ({ ids, expr }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const z = FACADE_Z + 1.9;
  // camera stays in the street: the houses across start at z = 6.5 (the old Proposal lineup camera at
  // z = 7.2 was inside one of them)
  const cam: Cam = { pos: [0.3, 1.3, 5.9], target: [0.0, 1.2, -1.2], fov: 52 };
  const camPos = new THREE.Vector3(...cam.pos);
  const pose: Partial<Pose> = { breathe: 0.5, ...(expr ? EXPRESSIONS[expr] : {}) };
  const spacing = 1.1;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ThreeCanvas width={width} height={height} gl={glProps} camera={{ fov: cam.fov, position: cam.pos }}>
        <SceneSetup />
        <CameraRig {...cam} />
        <NightStreet frame={frame} />
        {ids.map((id, i) => (
          <CharacterCard
            key={id}
            spec={castMember(id)}
            position={[(i - (ids.length - 1) / 2) * spacing - 0.15, 0, z + (i % 2 ? 0.15 : 0)]}
            camPos={camPos}
            warm={sceneWarmLights()}
            pose={pose}
          />
        ))}
      </ThreeCanvas>
      <Grade />
    </AbsoluteFill>
  );
};

const Flat: React.FC<{ id: string; pose?: Partial<Pose> }> = ({ id, pose }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const ctx = ref.current!.getContext("2d")!;
    drawCharacter(ctx, castMember(id), { ...DEFAULT_POSE, ...pose });
  }, [id, pose]);
  return (
    <canvas
      ref={ref}
      width={Math.round(UNITS_W * PX_PER_UNIT)}
      height={Math.round(UNITS_H * PX_PER_UNIT)}
      style={{ width: 420, height: 420 * (UNITS_H / UNITS_W) }}
    />
  );
};

// One character, flat, in several expressions (checks parts + expressions; no scene light).
export const ExpressionSheet: React.FC<{ id: string; exprs: string[] }> = ({ id, exprs }) => (
  <AbsoluteFill style={{ background: "#7d7f9e", flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
    {exprs.map((e) => (
      <div key={e} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Flat id={id} pose={EXPRESSIONS[e]} />
        <div style={{ color: "#fff", font: "600 26px sans-serif", marginTop: -20 }}>{e}</div>
      </div>
    ))}
  </AbsoluteFill>
);
