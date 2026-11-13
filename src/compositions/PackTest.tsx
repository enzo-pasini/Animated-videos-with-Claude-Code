// Style test for free 3D pack pieces (scenes plan 3, step 3): one piece per frame, camera fitted to the piece.
// Frame = row * 3 + col; rows = pieces, cols = looks (raw / lines / ours). Prop `pack` picks the rows and the light:
// home = small room corner, locked warmInterior; medieval = grass, locked dayExterior.
// Render: node tools/render_stills.mjs --composition PackTest --props <{"pack": "..."}> --frames 0,1,... --out out/packs/...
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { OMesh } from "../three/Outlined";
import { CameraRig, SceneSetup, glProps, type Cam } from "../three/Rig";
import { grassTex, plasterTex, woodTex } from "../three/textures";
import { DAY_EXTERIOR, DayExteriorLights } from "../world/lights/dayExterior";
import { WARM_INTERIOR, WarmInteriorLights } from "../world/lights/warmInterior";
import { HOME_TONES } from "../world/kit/home";
import { MEDIEVAL_TONES } from "../world/kit/medieval";
import { PackPiece, usePackSize } from "../world/kit/pack";

export const PACK_TEST_TILE = 640;
type Row = { label: string; file: string; node?: string; h: number; threshold?: number; turn?: boolean };
export const PACK_TEST_ROWS: Record<string, Row[]> = {
  home: [
    { label: "Oven (Quaternius)", file: "home-interior/q_oven.glb", h: 0.9 },
    { label: "Kitchen cabinet (Kenney)", file: "home-interior/k_kitchen_cabinet.glb", h: 0.9, turn: true },
    { label: "Bathtub (Quaternius)", file: "home-interior/q_bathtub.glb", h: 0.6, threshold: 40 },
  ],
  medieval: [
    { label: "Castle Fortress (Quaternius)", file: "medieval/q_castle_fortress.glb", h: 14 },
    { label: "Gate wall (Kenney)", file: "medieval/k_castle_kit.glb", node: "wallNarrowGate", h: 4.5 },
    { label: "Tower + roof (Kenney)", file: "medieval/k_castle_kit.glb", node: "towerSquareRoof", h: 6.9 },
    { label: "Trebuchet (Kenney)", file: "medieval/k_castle_kit.glb", node: "siegeTrebuchet_8angles", h: 5 },
  ],
  snow: [{ label: "Rock Snow (Quaternius)", file: "snow/q_rock_snow.glb", h: 1.2 }],
};
export const PACK_TEST_LOOKS = ["raw", "lines", "ours"] as const;
const TONES: Record<string, Record<string, string>> = { home: HOME_TONES, medieval: MEDIEVAL_TONES };

const SUN: [number, number, number] = [42, 46, 24];
const floor = new THREE.BoxGeometry(8, 0.1, 6);
const wallG = new THREE.BoxGeometry(8, 3, 0.2);
const grass = new THREE.BoxGeometry(200, 0.2, 200);

const Fit: React.FC<{ row: Row }> = ({ row }) => {
  const size = usePackSize(row.file, row.h, row.node);
  if (!size) return null;
  const r = 0.5 * Math.hypot(size.x, size.y, size.z);
  const d = (r / Math.tan(THREE.MathUtils.degToRad(17))) * 1.05;
  const az = THREE.MathUtils.degToRad(32);
  const el = THREE.MathUtils.degToRad(16);
  const cy = size.y * 0.5;
  const cam: Cam = { pos: [d * Math.cos(el) * Math.sin(az), cy + d * Math.sin(el), d * Math.cos(el) * Math.cos(az)], target: [0, cy, 0], fov: 34 };
  return <CameraRig {...cam} />;
};

export const PackTest: React.FC<{ pack?: string }> = ({ pack = "home" }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const rows = PACK_TEST_ROWS[pack];
  const row = rows[Math.floor(frame / 3) % rows.length];
  const look = PACK_TEST_LOOKS[frame % 3];
  const day = pack !== "home";
  const bg = day ? "#bcd8f5" : "#3a2630";
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <ThreeCanvas shadows="soft" width={width} height={height} gl={glProps} camera={{ fov: 34, position: [3, 3, 3] }}
        style={{ filter: day ? DAY_EXTERIOR.grade : WARM_INTERIOR.grade }}>
        <color attach="background" args={[bg]} />
        {day ? (
          <>
            <SceneSetup fog={DAY_EXTERIOR.fog.color} density={0.004} />
            <DayExteriorLights sun={SUN} shadowSize={Math.max(8, row.h * 1.6)} />
            <OMesh geometry={grass} position={[0, -0.1, 0]} map={grassTex([30, 30])} color="#d8d4c4" lines={false} />
          </>
        ) : (
          <>
            <SceneSetup fog={WARM_INTERIOR.fog.color} density={WARM_INTERIOR.fog.density} />
            <WarmInteriorLights />
            <OMesh geometry={floor} position={[0, -0.05, 0]} map={woodTex([5, 2])} color="#c08a62" lines={false} />
            <OMesh geometry={wallG} position={[0, 1.5, -0.8]} map={plasterTex("packtest", "#e8d8bc", [2, 1])} lines={false} />
          </>
        )}
        <Fit row={row} />
        <PackPiece file={row.file} node={row.node} h={row.h} look={look} tones={TONES[pack]} threshold={row.threshold} turn={row.turn} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
