import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { CHARACTERS, type CharacterId } from "../character/specs";
import { CharacterCard } from "../three/CharacterCard";
import { FACADE_Z, NightStreet, sceneWarmLights } from "../three/NightStreet";
import { CameraRig, SceneSetup, glProps, type Cam } from "../three/Rig";
import { Grade } from "../style/Grade";

export const CHAR_POS: [number, number, number] = [-0.2, 0, FACADE_Z + 1.9];

export const Proposal: React.FC<{ charId: CharacterId; lineup?: boolean }> = ({ charId, lineup }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const cam: Cam = lineup
    ? { pos: [0.3, 1.3, 7.2], target: [0.0, 1.25, -1.2], fov: 42 }
    : { pos: [1.5, 1.05, CHAR_POS[2] + 5.45], target: [CHAR_POS[0], 1.12, CHAR_POS[2]], fov: 35 };
  const camPos = new THREE.Vector3(...cam.pos);
  const warm = sceneWarmLights();
  const ids: CharacterId[] = lineup ? ["pell", "juno", "bram"] : [charId];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <ThreeCanvas width={width} height={height} gl={glProps} camera={{ fov: cam.fov, position: cam.pos }}>
        <SceneSetup />
        <CameraRig {...cam} />
        <NightStreet frame={frame} />
        {ids.map((id, i) => (
          <CharacterCard
            key={id}
            spec={CHARACTERS[id]}
            position={lineup ? [-1.4 + i * 1.25, 0, CHAR_POS[2] + (i === 1 ? 0.15 : 0)] : CHAR_POS}
            camPos={camPos}
            warm={warm}
            pose={{ breathe: 0.5, lookX: lineup ? 0 : -0.2 }}
          />
        ))}
      </ThreeCanvas>
      <Grade />
    </AbsoluteFill>
  );
};
