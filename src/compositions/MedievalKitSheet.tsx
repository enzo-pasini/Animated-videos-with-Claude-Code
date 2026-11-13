// Theme kit picture "medieval" (scenes plan 3): every MedievalPiece alone on grass (locked dayExterior), then towers,
// finishes and combos (castle with the fortress, siege camp). One tile per frame.
// `.venv/Scripts/python -I tools/kit_catalog.py --theme medieval` renders it → references/sets/kit_medieval.jpg.
// When the theme grows: a MEDIEVAL entry in src/world/kit/medieval.tsx + a line in TILES below (`name / file / theme`).
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { OMesh } from "../three/Outlined";
import { CameraRig, SceneSetup, glProps, type Cam } from "../three/Rig";
import { grassTex } from "../three/textures";
import { DAY_EXTERIOR, DayExteriorLights } from "../world/lights/dayExterior";
import { CASTLE_S, CastleRing, MEDIEVAL, MedievalPiece, TILE, Tower, medievalFile, type MedievalKind } from "../world/kit/medieval";
import { usePack } from "../world/kit/pack";

export const MEDIEVAL_TILE = 720;
type V3 = [number, number, number];
type Tile = { name: string; file: string; theme: string; kind?: MedievalKind; combo?: () => React.ReactNode; cam?: Cam; shadow?: number };

const fit = (center: V3, r: number, az = 30, el = 16): Cam => {
  const fov = 34;
  const d = (r / Math.tan(THREE.MathUtils.degToRad(fov / 2))) * 1.1;
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return { pos: [center[0] + d * Math.cos(e) * Math.sin(a), center[1] + d * Math.sin(e), center[2] + d * Math.cos(e) * Math.cos(a)], target: center, fov };
};

const SiegeCamp: React.FC = () => (
  <>
    <MedievalPiece kind="trebuchet" position={[-6, 0, -2]} rotY={0.3} />
    <MedievalPiece kind="catapult" position={[4, 0, -4]} rotY={-0.4} />
    <MedievalPiece kind="siegeTower" position={[-1, 0, -9]} rotY={0.1} />
    <MedievalPiece kind="ballista" position={[6, 0, 4]} rotY={-0.6} />
    <MedievalPiece kind="ram" position={[-3, 0, 6]} rotY={Math.PI / 2 + 0.2} />
    <MedievalPiece kind="bannerShort" position={[1, 0, 2]} rotY={0.5} />
    <MedievalPiece kind="flagBlue" position={[-9, 0, 4]} />
    <MedievalPiece kind="flagWhite" position={[9, 0, -8]} />
  </>
);
const Towers: React.FC = () => (
  <>
    <Tower x={-2 * TILE} z={0} floors={1} top="flat" />
    <Tower x={-TILE * 0.7} z={0} floors={2} top="roof" />
    <Tower x={TILE * 0.7} z={0} floors={3} top="high" />
    <Tower x={2 * TILE} z={0} hex />
  </>
);
const Finishes: React.FC = () => (
  <>
    <Tower x={-1.5 * TILE} z={0} floors={2} />
    <MedievalPiece kind="wall" position={[-0.5 * TILE, 0, 0]} />
    <Tower x={0.5 * TILE} z={0} floors={2} stone="grey" roof="red" />
    <MedievalPiece kind="wall" position={[1.5 * TILE, 0, 0]} stone="grey" />
    <Tower x={2.5 * TILE} z={0} floors={2} stone="grey" />
  </>
);

export const TILES: Tile[] = [
  { name: "fortress", file: "Quaternius", theme: "main castle", kind: "fortress" },
  // walls
  { name: "wall", file: "Kenney", theme: "castle wall", kind: "wall" },
  { name: "wallCorner", file: "Kenney", theme: "castle wall", kind: "wallCorner" },
  { name: "wallHalf", file: "Kenney", theme: "castle wall", kind: "wallHalf" },
  { name: "wallNarrow", file: "Kenney", theme: "castle wall", kind: "wallNarrow" },
  { name: "wallGate", file: "Kenney", theme: "castle wall", kind: "wallGate" },
  { name: "wallDoor", file: "Kenney", theme: "castle wall", kind: "wallDoor" },
  { name: "wallPillar", file: "Kenney", theme: "castle wall", kind: "wallPillar" },
  { name: "metalGate", file: "Kenney", theme: "castle wall", kind: "metalGate" },
  { name: "bridge", file: "Kenney", theme: "castle", kind: "bridge" },
  { name: "stairs", file: "Kenney", theme: "castle", kind: "stairs" },
  // flags
  { name: "flagBlue", file: "Kenney", theme: "flags", kind: "flagBlue" },
  { name: "flagWhite", file: "Kenney", theme: "flags", kind: "flagWhite" },
  { name: "bannerLong", file: "Kenney", theme: "flags", kind: "bannerLong" },
  { name: "bannerShort", file: "Kenney", theme: "flags", kind: "bannerShort" },
  // siege / battlefield
  { name: "trebuchet", file: "Kenney", theme: "siege camp", kind: "trebuchet" },
  { name: "catapult", file: "Kenney", theme: "siege camp", kind: "catapult" },
  { name: "ballista", file: "Kenney", theme: "siege camp", kind: "ballista" },
  { name: "ram", file: "Kenney", theme: "siege camp", kind: "ram" },
  { name: "siegeTower", file: "Kenney", theme: "siege camp", kind: "siegeTower" },
  { name: "shieldRed", file: "Kenney", theme: "props", kind: "shieldRed" },
  { name: "shieldBlue", file: "Kenney", theme: "props", kind: "shieldBlue" },
  { name: "sword", file: "Kenney", theme: "props", kind: "sword" },
  // helpers + combos
  { name: "Tower: flat / roof / high / hex", file: "Tower", theme: "castle", combo: () => <Towers />, cam: fit([0, 7.5, 0], 13, 20, 10) },
  { name: "finishes: sand+blue, grey+red, grey", file: "stone / roof", theme: "castle", combo: () => <Finishes />, cam: fit([TILE * 0.5, 4.5, 0], 10, 20, 12) },
  { name: "CastleRing + fortress", file: "combo", theme: "castle", shadow: 44,
    combo: () => (<><MedievalPiece kind="fortress" /><CastleRing /></>), cam: fit([0, 4, 0], 30, 32, 26) },
  { name: "siege camp", file: "combo", theme: "battlefield", shadow: 18, combo: () => <SiegeCamp />, cam: fit([0, 2, -1], 11, 28, 20) },
];

// one piece, camera fitted to its loaded size
const One: React.FC<{ kind: MedievalKind }> = ({ kind }) => {
  const spec = MEDIEVAL[kind] as { node?: string; file?: string; h?: number };
  const model = usePack(medievalFile(kind), spec.node);
  if (!model) return null;
  const k = spec.h ? spec.h / model.size.y : CASTLE_S;
  const size = model.size.clone().multiplyScalar(k);
  const r = Math.max(0.4, 0.5 * Math.hypot(size.x, size.y, size.z)) * (size.x > 15 ? 0.75 : 1);
  return (
    <>
      <CameraRig {...fit([0, size.y / 2, 0], r)} />
      <MedievalPiece kind={kind} />
    </>
  );
};

const SUN: V3 = [42, 46, 24];
const grass = new THREE.BoxGeometry(300, 0.2, 300);

export const MedievalKitSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = TILES[Math.min(frame, TILES.length - 1)];
  const cam = t.cam ?? fit([0, 2, 0], 4);
  return (
    <AbsoluteFill style={{ backgroundColor: "#bcd8f5" }}>
      <ThreeCanvas shadows="soft" width={width} height={height} gl={glProps} camera={{ fov: cam.fov, position: cam.pos }}
        style={{ filter: DAY_EXTERIOR.grade }}>
        <color attach="background" args={["#bcd8f5"]} />
        <SceneSetup fog={DAY_EXTERIOR.fog.color} density={0.004} />
        {t.cam ? <CameraRig {...t.cam} /> : null}
        <DayExteriorLights sun={SUN} shadowSize={t.shadow ?? 14} />
        <OMesh geometry={grass} position={[0, -0.1, 0]} map={grassTex([45, 45])} color="#d8d4c4" lines={false} />
        {t.kind ? <One kind={t.kind} /> : t.combo?.()}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
