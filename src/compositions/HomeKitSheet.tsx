// Theme kit picture "home interiors" (scenes plan 3): every HomePiece alone in a small room corner (warmInterior light),
// then a few combos that show the pieces fit together and the finishes. One tile per frame.
// `.venv/Scripts/python -I tools/kit_catalog.py --theme home` renders it → references/sets/kit_home.jpg.
// When the theme grows: a HOME entry in src/world/kit/home.tsx + a line in TILES below (`name / file / theme`).
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { OMesh } from "../three/Outlined";
import { CameraRig, SceneSetup, glProps, type Cam } from "../three/Rig";
import { plasterTex, woodTex } from "../three/textures";
import { WARM_INTERIOR, WarmInteriorLights } from "../world/lights/warmInterior";
import { COUNTER_H, HOME, HomePiece, type HomeFinish, type HomeKind } from "../world/kit/home";
import { usePackSize } from "../world/kit/pack";

export const HOME_TILE = 720;
type V3 = [number, number, number];
type Tile = { name: string; file: string; theme: string; kind?: HomeKind; finish?: HomeFinish; combo?: () => React.ReactNode; cam?: Cam };

const fit = (center: V3, r: number, az = 28, el = 15): Cam => {
  const fov = 34;
  const d = (r / Math.tan(THREE.MathUtils.degToRad(fov / 2))) * 1.1;
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return { pos: [center[0] + d * Math.cos(e) * Math.sin(a), center[1] + d * Math.sin(e), center[2] + d * Math.cos(e) * Math.cos(a)], target: center, fov };
};

// ---- combos (pieces against the wall at z = 0; widths from the loaded sizes, see home.tsx) ----
const KitchenRow: React.FC<{ cab?: HomeFinish; app?: HomeFinish }> = ({ cab = "oak", app = "cream" }) => (
  <>
    <HomePiece kind="fridge" position={[-1.55, 0, 0]} finish={app} />
    <HomePiece kind="cabinet" position={[-0.76, 0, 0]} finish={cab} />
    <HomePiece kind="oven" position={[0, 0, 0]} finish={app} />
    <HomePiece kind="cabinetDrawers" position={[0.76, 0, 0]} finish={cab} />
    <HomePiece kind="kitchenSink" position={[1.48, 0, 0]} finish={app} />
    <HomePiece kind="upperCabinet" position={[-0.76, HOME.upperCabinet.y, 0]} finish={cab} />
    <HomePiece kind="hood" position={[0, HOME.hood.y, 0]} />
    <HomePiece kind="upperCabinet" position={[0.76, HOME.upperCabinet.y, 0]} finish={cab} />
    <HomePiece kind="microwave" position={[-0.82, COUNTER_H, 0.3]} />
    <HomePiece kind="toaster" position={[0.95, COUNTER_H, 0.35]} />
    <HomePiece kind="coffeeMachine" position={[0.55, COUNTER_H, 0.3]} />
    <HomePiece kind="plate" position={[-0.5, COUNTER_H, 0.6]} />
  </>
);
const Bathroom: React.FC = () => (
  <>
    <HomePiece kind="bathtub" position={[-1.15, 0, 0.42]} rotY={Math.PI / 2} />
    <HomePiece kind="towelRack" position={[-1.15, HOME.towelRack.y, 0]} />
    <HomePiece kind="toilet" position={[0.15, 0, 0]} />
    <HomePiece kind="toiletPaper" position={[0.6, 0, 0.25]} />
    <HomePiece kind="bathroomSink" position={[1.15, 0, 0]} />
    <HomePiece kind="mirror" position={[1.15, HOME.mirror.y + 0.2, 0]} />
    <HomePiece kind="houseplant" position={[1.85, 0, 0.35]} />
  </>
);

export const TILES: Tile[] = [
  // kitchen
  { name: "fridge", file: "Quaternius", theme: "kitchen", kind: "fridge" },
  { name: "oven", file: "Quaternius", theme: "kitchen", kind: "oven" },
  { name: "kitchenSink", file: "Quaternius", theme: "kitchen", kind: "kitchenSink" },
  { name: "cabinet", file: "Kenney", theme: "kitchen", kind: "cabinet" },
  { name: "cabinetDrawers", file: "Kenney", theme: "kitchen", kind: "cabinetDrawers" },
  { name: "cabinetCorner", file: "Kenney", theme: "kitchen", kind: "cabinetCorner" },
  { name: "upperCabinet", file: "Kenney", theme: "kitchen (wall)", kind: "upperCabinet" },
  { name: "hood", file: "Kenney", theme: "kitchen (wall)", kind: "hood" },
  { name: "microwave", file: "Kenney", theme: "kitchen (counter)", kind: "microwave" },
  { name: "toaster", file: "Kenney", theme: "kitchen (counter)", kind: "toaster" },
  { name: "blender", file: "Kenney", theme: "kitchen (counter)", kind: "blender" },
  { name: "coffeeMachine", file: "Kenney", theme: "kitchen (counter)", kind: "coffeeMachine" },
  { name: "plate", file: "Quaternius", theme: "kitchen (counter)", kind: "plate" },
  // any room
  { name: "roundTable", file: "Quaternius", theme: "any room", kind: "roundTable" },
  { name: "stool", file: "Quaternius", theme: "any room", kind: "stool" },
  { name: "dresser", file: "Quaternius", theme: "any room", kind: "dresser" },
  { name: "trashcan", file: "Quaternius", theme: "any room", kind: "trashcan" },
  { name: "door", file: "Quaternius", theme: "any room", kind: "door" },
  { name: "window", file: "Quaternius", theme: "any room (wall)", kind: "window" },
  { name: "houseplant", file: "Quaternius", theme: "any room", kind: "houseplant" },
  { name: "ceilingLight", file: "Quaternius", theme: "any room (ceiling)", kind: "ceilingLight" },
  // bathroom
  { name: "bathtub", file: "Quaternius", theme: "bathroom", kind: "bathtub" },
  { name: "toilet", file: "Quaternius", theme: "bathroom", kind: "toilet" },
  { name: "bathroomSink", file: "Quaternius", theme: "bathroom", kind: "bathroomSink" },
  { name: "washingMachine", file: "Quaternius", theme: "bathroom", kind: "washingMachine" },
  { name: "shower", file: "Kenney", theme: "bathroom", kind: "shower" },
  { name: "mirror", file: "Kenney", theme: "bathroom (wall)", kind: "mirror" },
  { name: "bathroomCabinet", file: "Kenney", theme: "bathroom (wall)", kind: "bathroomCabinet" },
  { name: "towelRack", file: "Quaternius", theme: "bathroom (wall)", kind: "towelRack" },
  { name: "toiletPaper", file: "Quaternius", theme: "bathroom", kind: "toiletPaper" },
  // combos + finishes
  { name: "kitchen row: oak + cream", file: "combo", theme: "kitchen", combo: () => <KitchenRow />, cam: fit([0.05, 1.05, 0.4], 1.75, 12, 10) },
  { name: "kitchen row: sage + mint", file: "combo", theme: "kitchen", combo: () => <KitchenRow cab="sage" app="mint" />, cam: fit([0.05, 1.05, 0.4], 1.75, 12, 10) },
  { name: "kitchen row: white + butter", file: "combo", theme: "kitchen", combo: () => <KitchenRow cab="white" app="butter" />, cam: fit([0.05, 1.05, 0.4], 1.75, 12, 10) },
  { name: "bathroom", file: "combo", theme: "bathroom", combo: () => <Bathroom />, cam: fit([0.3, 0.8, 0.5], 1.45, 14, 12) },
];

// one piece, camera fitted to its loaded size; counter pieces stand on a cabinet
const One: React.FC<{ kind: HomeKind }> = ({ kind }) => {
  const s = HOME[kind] as (typeof HOME)[HomeKind] & { y?: number; on?: string; free?: boolean };
  const size = usePackSize(s.file, s.h);
  if (!size) return null;
  const counter = s.on === "counter";
  const y0 = counter ? COUNTER_H : (s.y ?? 0);
  const z = counter ? 0.45 : s.free ? size.z / 2 + 0.12 : 0;
  const zc = s.free || counter ? z : size.z / 2;
  const low = counter ? COUNTER_H - 0.1 : y0;
  const top = y0 + size.y;
  const r = Math.max(0.35, 0.5 * Math.hypot(size.x, top - low, size.z));
  return (
    <>
      <CameraRig {...fit([0, (low + top) / 2, zc], r)} />
      {counter ? <HomePiece kind="cabinet" position={[0, 0, 0]} /> : null}
      <HomePiece kind={kind} position={[0, y0, z]} />
    </>
  );
};

const floor = new THREE.BoxGeometry(12, 0.1, 8);
const wallG = new THREE.BoxGeometry(12, 3.2, 0.2);

export const HomeKitSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = TILES[Math.min(frame, TILES.length - 1)];
  const cam = t.cam ?? fit([0, 1, 0.5], 1.5);
  return (
    <AbsoluteFill style={{ backgroundColor: "#3a2630" }}>
      <ThreeCanvas shadows="soft" width={width} height={height} gl={glProps} camera={{ fov: cam.fov, position: cam.pos }}
        style={{ filter: WARM_INTERIOR.grade }}>
        <color attach="background" args={["#3a2630"]} />
        <SceneSetup fog={WARM_INTERIOR.fog.color} density={WARM_INTERIOR.fog.density} />
        {t.cam ? <CameraRig {...t.cam} /> : null}
        <WarmInteriorLights />
        <OMesh geometry={floor} position={[0, -0.05, 2]} map={woodTex([7, 3])} color="#c08a62" lines={false} />
        <OMesh geometry={wallG} position={[0, 1.6, -0.1]} map={plasterTex("homekit", "#e8d8bc", [3, 1])} lines={false} />
        {t.kind ? <One kind={t.kind} /> : t.combo?.()}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
