// Kit catalog (scenes plan, session 1): every piece of src/world/kit/ alone on a plain ground, one piece per frame.
// tools/kit_catalog.py renders all frames and builds the labelled contact sheet references/sets/kit_catalog.jpg.
// Catalog only: neutral daylight (dayExterior, light haze), nothing here is used by a set or a video.
// When the kit grows: add an entry to KIT below (one line `name: "...", file: "...", theme: "..."`, the tool parses it)
// and a row to references/sets/KIT.md. `name` = the kit export(s) the tile shows, joined by " + ".
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { OBox, OMesh } from "../three/Outlined";
import { CameraRig, SceneSetup, glProps, type Cam } from "../three/Rig";
import { grassTex, plasterTex, riverTex } from "../three/textures";
import { DAY_EXTERIOR, DayExteriorLights } from "../world/lights/dayExterior";
import { Building } from "../world/kit/Building";
import { Branch } from "../world/kit/Branch";
import { DaySky } from "../world/kit/DaySky";
import { Glow } from "../world/kit/Glow";
import { HangingLantern } from "../world/kit/HangingLantern";
import { NightSky } from "../world/kit/NightSky";
import { DayContext, Window } from "../world/kit/Window";
import { Chair, PendantLamp, Picture, RoomShell, Rug, Shelf, Table } from "../world/kit/interior";
import { Barrel, Bench, Chimney, ClothesLine, Crate, DistantRooftops, FlowerBox, Pipe, PottedPlant, StreetLamp } from "../world/kit/props";
import { Boat, Bunting, Cart, Flowers, GrassTufts, Haystack, LinePosts, Reeds, Sacks, Stall, VegBed, WoodPile } from "../world/kit/country";
import { HOME, HomePiece } from "../world/kit/home";
import { AjarDoor, Bed, BedsideLamp, CeilingPipe, CornerWeb, DarkOpening, Darkness, DrapeWeb, Furnace, HangingSpider, Stairs, WebSheet } from "../world/kit/house";
import { CastleRing, MedievalPiece, Tower } from "../world/kit/medieval";
import { Backpack, CampStove, Campfire, MountainHut, PeakCamp, SnowGround, SnowPeak, SnowPines, SnowRange, SnowRocks, Tent } from "../world/kit/snow";
import { Barn, HillTown, MountainRange, Trees, Windmill, gridLine, hedgeTrees, makeTerrain, type TownHouse, type TreeAt } from "../world/kit/land";

export const KIT_TILE = 720;
type V3 = [number, number, number];
type Piece = {
  name: string;
  file: string;
  theme: string;
  center: V3; // what the camera looks at
  r: number; // radius that must fit in the tile (m)
  az?: number; // camera direction around y (deg, 0 = from +z)
  el?: number; // camera elevation (deg)
  cam?: Cam; // fixed camera instead of center/r (skies)
  ground?: boolean; // default true
  draw: (frame: number) => React.ReactNode;
};

const SUN: V3 = [42, 46, 24];
const wall = (key: string, base: string) => plasterTex(`kit_${key}`, base, [1, 1]);
// a short wall to hang wall pieces on (front face at z = 0)
const Wall: React.FC<{ w?: number; h?: number }> = ({ w = 3, h = 3.2 }) => (
  <OMesh geometry={new THREE.BoxGeometry(w, h, 0.3)} position={[0, h / 2, -0.15]} map={wall("w", "#e8d8bc")} />
);
const TREES: TreeAt[] = [["round", -4, 0, 0, 1], ["poplar", 0, 0, -0.5, 1], ["bush", 3.5, 0, 0.5, 1.2]];
const HEDGE = hedgeTrees([[-5, 0], [5, 0]], () => 0, 1.6, 0.8);
const TOWN: TownHouse[] = [
  [-6, 0, 0, 3, 3, 3.2, 0.1], [-2.2, 0, -1, 2.6, 3, 2.8, -0.2], [1.6, 0, 0.5, 3.2, 3, 3.6, 0.15], [5.4, 0, -0.8, 2.6, 3, 3, 0],
  [-4, 0, -4.5, 3, 3, 3.4, 0.3], [3, 0, -4.2, 3, 3, 3.1, -0.1],
];
const TERRAIN = makeTerrain({
  xs: gridLine(-12, 12, 2),
  zs: gridLine(-12, 12, 2),
  height: (x, z) => 0.9 + 0.8 * Math.sin(x * 0.35) * Math.cos(z * 0.3) + 0.04 * (x + z),
  color: (x, z) => ["#7fae55", "#c9b45e", "#5f9442", "#a7bf63"][(Math.floor((x + 12) / 6) + 2 * Math.floor((z + 12) / 6)) % 4],
});
const SACKS: [number, number, number?][] = [[0, 0], [0.55, 0.1], [0.25, -0.4], [0.3, -0.1, 0.38]];
const FLOWERS: [number, number][] = [[-0.6, 0], [-0.2, 0.3], [0.2, -0.1], [0.6, 0.25], [0, -0.4], [0.5, -0.45]];

export const KIT: Piece[] = [
  // ---- town / street (Building.tsx, Window.tsx, props.tsx) ----
  { name: "Building + Roof", file: "Building.tsx", theme: "town", center: [0, 3, 0], r: 5.4, az: 28,
    draw: () => (
      <DayContext.Provider value>
        <Building x0={-3} x1={3} zFront={2} depth={4} height={5} wall={wall("b", "#efd39a")} roofColor="#ffb4a0">
          <Window x={-1.5} y={3.4} z={2.06} w={0.9} h={1.2} shutters />
          <Window x={1.5} y={3.4} z={2.06} w={0.9} h={1.2} shutters />
          <OBox size={[1.0, 2.1, 0.12]} position={[0, 1.05, 2.06]} color="#6a4a36" />
        </Building>
      </DayContext.Provider>
    ) },
  { name: "Window", file: "Window.tsx", theme: "town", center: [0, 1.8, 0], r: 1.9, az: 15, el: 8,
    draw: () => (
      <>
        <Wall />
        <DayContext.Provider value>
          <Window x={-0.75} y={1.8} z={0.06} w={0.9} h={1.2} shutters />
        </DayContext.Provider>
        <Window x={0.85} y={1.8} z={0.06} w={0.9} h={1.2} lit={1} />
      </>
    ) },
  { name: "HangingLantern", file: "HangingLantern.tsx", theme: "town, night", center: [0, 2.3, 0.3], r: 1.0, az: 30, el: 8,
    draw: () => (
      <>
        <Wall w={2} />
        <HangingLantern x={0} y={2.2} z={0.45} wallZ={0} flicker={1} on={1} intensity={3} />
      </>
    ) },
  { name: "StreetLamp", file: "props.tsx", theme: "town", center: [0, 1.8, 0], r: 2.0, el: 10, draw: () => <StreetLamp x={0} z={0} /> },
  { name: "Chimney", file: "props.tsx", theme: "town", center: [0, 0.8, 0], r: 1.2, draw: () => <Chimney x={0} y={0} z={0} /> },
  { name: "Pipe", file: "props.tsx", theme: "town", center: [0, 1.3, 0], r: 1.5, el: 10, draw: () => <><Wall w={1.5} /><Pipe x={0} z={0.1} h={2.8} /></> },
  { name: "FlowerBox", file: "props.tsx", theme: "town", center: [0, 1.3, 0.2], r: 0.9, el: 15, draw: () => <><Wall w={2} /><FlowerBox x={0} y={1.2} z={0} /></> },
  { name: "ClothesLine", file: "props.tsx", theme: "town, country", center: [0, 1.8, 0], r: 2.6, el: 8,
    draw: () => <><LinePosts y={0} a={[-2.2, 0]} b={[2.2, 0]} h={2.4} /><ClothesLine a={[-2.2, 2.38, 0]} b={[2.2, 2.38, 0]} sag={0.35} /></> },
  { name: "Bench", file: "props.tsx", theme: "town", center: [0, 0.4, 0], r: 0.9, draw: () => <Bench x={-0.45} z={0} /> },
  { name: "Crate + Barrel", file: "props.tsx", theme: "town, country", center: [0, 0.45, 0], r: 1.1,
    draw: () => <><Crate position={[-0.45, 0.3, 0]} rotY={0.3} /><Barrel position={[0.5, 0.42, 0]} /></> },
  { name: "PottedPlant", file: "props.tsx", theme: "town, interior", center: [0, 0.4, 0], r: 0.6, draw: () => <PottedPlant position={[0, 0, 0]} /> },
  { name: "DistantRooftops", file: "props.tsx", theme: "town (far haze)", center: [1, 5, -14], r: 17, el: 8,
    draw: () => <DistantRooftops day /> },
  // ---- country (country.tsx) ----
  { name: "GrassTufts", file: "country.tsx", theme: "country", center: [0, 0.1, 0], r: 1.6, el: 30,
    draw: () => <GrassTufts y={0} areas={[[-1.5, 1.5, -1.2, 1.2]]} perM2={6} seed={3} /> },
  { name: "Flowers", file: "country.tsx", theme: "country", center: [0, 0.15, 0], r: 0.9, el: 30, draw: () => <Flowers y={0} at={FLOWERS} seed={2} /> },
  { name: "VegBed", file: "country.tsx", theme: "country", center: [0, 0.2, 0], r: 1.8, el: 30, draw: () => <VegBed x={0} y={0} z={0} /> },
  { name: "Haystack", file: "country.tsx", theme: "country", center: [0, 1.2, 0], r: 1.8, draw: () => <Haystack x={0} y={0} z={0} /> },
  { name: "Sacks", file: "country.tsx", theme: "country, market", center: [0.25, 0.3, -0.1], r: 0.8, draw: () => <Sacks y={0} at={SACKS} /> },
  { name: "Cart", file: "country.tsx", theme: "country, market", center: [0, 0.7, 0], r: 1.4, draw: () => <Cart x={0} y={0} z={0} /> },
  { name: "WoodPile", file: "country.tsx", theme: "country", center: [0, 0.35, 0], r: 0.8, draw: () => <WoodPile x={0} y={0} z={0} /> },
  { name: "Boat", file: "country.tsx", theme: "river, coast", center: [0, 0.4, 0], r: 1.8,
    draw: () => (
      <>
        <OMesh geometry={new THREE.BoxGeometry(8, 0.3, 6)} position={[0, 0.15, 0]} map={riverTex([2, 2])} lines={false} />
        <Boat x={0} z={0} water={0.3} post={[1.6, 0, -0.6]} />
      </>
    ) },
  { name: "Reeds", file: "country.tsx", theme: "river", center: [0, 0.6, 0], r: 1.6, az: 80, el: 12,
    draw: () => <Reeds y={0} x={0} z0={-1.6} z1={1.6} seed={4} /> },
  { name: "Stall", file: "country.tsx", theme: "market, country", center: [0, 1.2, 0], r: 1.7, draw: () => <Stall x={0} y={0} z={0} /> },
  { name: "Bunting + LinePosts", file: "country.tsx", theme: "market, fair", center: [0, 1.8, 0], r: 2.6, el: 8,
    draw: () => <><LinePosts y={0} a={[-2.2, 0]} b={[2.2, 0]} h={2.5} /><Bunting a={[-2.2, 2.45, 0]} b={[2.2, 2.45, 0]} sag={0.3} /></> },
  // ---- far land (land.tsx) ----
  { name: "Trees", file: "land.tsx", theme: "country, park", center: [0, 2.6, 0], r: 5, el: 10, draw: () => <Trees trees={TREES} seed={1} /> },
  { name: "hedgeTrees", file: "land.tsx", theme: "country", center: [0, 0.5, 0], r: 4.5, el: 20, draw: () => <Trees trees={HEDGE} seed={2} /> },
  { name: "makeTerrain", file: "land.tsx", theme: "country (far)", center: [0, 1, 0], r: 13, el: 30,
    ground: false, draw: () => <OMesh geometry={TERRAIN} vertexColors threshold={50} /> },
  { name: "Windmill", file: "land.tsx", theme: "country", center: [0, 5, 0], r: 6.5, el: 8, draw: (f) => <Windmill x={0} y={0} z={0} frame={f * 20} /> },
  { name: "Barn", file: "land.tsx", theme: "country", center: [0, 2.4, 0], r: 6.2, draw: () => <Barn x={0} y={0} z={0} /> },
  { name: "HillTown", file: "land.tsx", theme: "town (far)", center: [0, 2.5, -2], r: 7.5, el: 15,
    draw: (f) => <HillTown houses={TOWN} church={[0, 0, -7]} chimneys={[[4.5, 0, -6]]} frame={f} /> },
  { name: "MountainRange", file: "land.tsx", theme: "any outdoor (far)", center: [0, 6, -60], r: 40, el: 4, az: 0,
    ground: false, draw: () => <MountainRange R={60} a0={-1.1} a1={1.1} height={14} y0={0} seed={5} color="#8fa2b8" lineColor="#5a6a80" fogMax={0.15} /> },
  // ---- interior (interior.tsx) ----
  { name: "RoomShell", file: "interior.tsx", theme: "interior", center: [0, 1.6, -1], r: 4.2, el: 12,
    draw: () => <RoomShell x0={-3} x1={3} zBack={-3} zFront={1} height={3.2} wall={wall("room", "#e9cfa8")} /> },
  { name: "Table + Chair", file: "interior.tsx", theme: "interior", center: [0, 0.6, 0], r: 1.4,
    draw: () => <><Table x={0} z={0} /><Chair x={-0.5} z={0.75} rotY={Math.PI} /></> },
  { name: "Shelf", file: "interior.tsx", theme: "interior", center: [0, 1.5, 0.1], r: 1.1, az: 15, el: 8, draw: () => <><Wall w={2.2} /><Shelf x={0} y={1.4} z={0.15} /></> },
  { name: "PendantLamp", file: "interior.tsx", theme: "interior", center: [0, 2.2, 0], r: 0.9, el: 0, draw: () => <PendantLamp x={0} y={2.1} z={0} ceiling={3} intensity={2} /> },
  { name: "Rug", file: "interior.tsx", theme: "interior", center: [0, 0, 0], r: 1.6, el: 40, draw: () => <Rug x={0} z={0} /> },
  { name: "Picture", file: "interior.tsx", theme: "interior", center: [0, 1.6, 0], r: 0.8, az: 10, el: 5, draw: () => <><Wall w={2} /><Picture x={0} y={1.6} z={0.04} /></> },
  // ---- skies, light, camera pieces ----
  { name: "Glow", file: "Glow.tsx", theme: "night lights", center: [0, 1.6, 0], r: 1.2, el: 5,
    draw: () => <><OBox size={[0.1, 1.6, 0.1]} position={[0, 0.8, 0]} color="#2a2230" /><Glow position={[0, 1.7, 0]} size={1.6} color="#ffb060" /></> },
  { name: "DaySky", file: "DaySky.tsx", theme: "any day exterior", center: [0, 0, 0], r: 1, ground: false,
    cam: { pos: [0, 2, 0], target: [42, 30, 24], fov: 60 }, draw: () => <DaySky sun={SUN} /> },
  { name: "NightSky", file: "NightSky.tsx", theme: "any night exterior", center: [0, 0, 0], r: 1, ground: false,
    cam: { pos: [0, 2, 0], target: [20, 26, -60], fov: 60 }, draw: () => <NightSky moon={[20, 30, -60]} /> },
  { name: "Branch", file: "Branch.tsx", theme: "country (close shots)", center: [0, 1.5, 0], r: 1, ground: true,
    cam: { pos: [0, 1.6, 6], target: [0, 1.4, 0], fov: 40 },
    draw: () => {
      const c: Cam = { pos: [0, 1.6, 6], target: [0, 1.4, 0], fov: 40 };
      return <><group position={[0, 0, -14]}><Trees trees={TREES} seed={1} /></group><Branch cam={c} cam0={c} corner="tr" t={0} /></>;
    } },
  // ---- theme kits from free packs (pack.tsx loader, home.tsx; full theme picture: references/sets/kit_home.jpg) ----
  { name: "PackPiece + HomePiece", file: "pack.tsx + home.tsx", theme: "home (kitchen, bathroom)", center: [0.25, 1.0, 0.4], r: 1.75, az: 16, el: 12,
    draw: () => (
      <>
        <Wall w={3.4} h={2.6} />
        <HomePiece kind="cabinet" position={[-0.43, 0, 0]} finish="sage" />
        <HomePiece kind="oven" position={[0.33 + 0.02, 0, 0]} />
        <HomePiece kind="upperCabinet" position={[-0.43, HOME.upperCabinet.y, 0]} finish="sage" />
        <HomePiece kind="toaster" position={[-0.4, 0.9, 0.35]} />
        <HomePiece kind="fridge" position={[1.05, 0, 0]} finish="mint" />
      </>
    ) },
  { name: "MedievalPiece + Tower + CastleRing", file: "medieval.tsx", theme: "medieval (castle, siege camp)", center: [0, 4, 4], r: 17, az: 30, el: 22,
    draw: () => (
      <>
        <CastleRing nx={5} nz={3} center={[0, -3]} />
        <Tower x={0} z={-3} floors={3} roof="red" />
        <MedievalPiece kind="trebuchet" position={[-6, 0, 12]} rotY={0.4} />
        <MedievalPiece kind="catapult" position={[6, 0, 12]} rotY={-0.4} />
      </>
    ) },
  // ---- theme kit snow (our own pieces, snow.tsx; full theme picture: references/sets/kit_snow.jpg) ----
  { name: "SnowPeak + SnowRange + SnowGround + SnowPines + SnowRocks", file: "snow.tsx", theme: "snow (mountains, ground)", center: [0, 8, -20], r: 30, az: 10, el: 8, ground: false,
    draw: () => (
      <>
        <SnowGround area={[-80, 80, -120, 40]} step={6} height={() => 0} />
        <SnowPeak position={[-6, 0, -40]} height={30} radius={20} seed={2} />
        <SnowRange R={95} a0={-0.7} a1={0.7} height={30} y0={0} seed={4} depth={16} fogMax={0.5} />
        <SnowPines trees={[[-9, 0, -6, 1], [-6, 0, -9, 1.3], [8, 0, -4, 1.1], [11, 0, -10, 1.4]]} />
        <SnowRocks rocks={[[3, 0, 2, 1.4, 0.4], [-2, 0, 4, 0.9, 2]]} />
      </>
    ) },
  { name: "MountainHut + Smoke + PeakCamp + Tent + Campfire + CampStove + Backpack", file: "snow.tsx", theme: "snow (hut, peak camp)", center: [2, 1.6, -1], r: 7, az: 20, el: 16, ground: false,
    draw: (f) => (
      <>
        <SnowGround area={[-40, 40, -40, 40]} step={4} height={() => 0} />
        <MountainHut position={[-2.5, 0, -4]} frame={f} />
        <PeakCamp position={[3.5, 0, 1]} rotY={-0.3} frame={f} />
        <Tent position={[7, 0, -3]} color="#e8b030" />
        <Campfire position={[-4.5, 0, 2]} frame={f} />
        <CampStove position={[-3.5, 0, 2.6]} frame={f} />
        <Backpack position={[-5.2, 0, 2.8]} rotY={0.4} />
      </>
    ) },
  // ---- theme kit old house (our own pieces, house.tsx: bedroom + basement) ----
  { name: "Bed + bedSitAt + BedsideLamp", file: "house.tsx", theme: "old house (bedroom)", center: [0.3, 0.6, 0], r: 1.6, az: 30, el: 16,
    draw: () => <><Wall w={3} /><Bed position={[0, 0, 1.1]} sitter /><BedsideLamp position={[0.85, 0, 0.25]} /></> },
  { name: "Furnace + Stairs + CeilingPipe", file: "house.tsx", theme: "old house (basement)", center: [0, 1.2, 0.2], r: 2.2, az: 22, el: 10,
    draw: () => <><Wall w={5} h={2.4} /><Furnace position={[0.6, 0, 1.0]} ceiling={2.4} cracked flueBack={0.95} /><Stairs position={[-1.4, 0, 2.6]} steps={11} rail={-1} /><CeilingPipe from={[-2.5, 2.2, 0.3]} len={5} /></> },
  { name: "AjarDoor + DarkOpening + Darkness + CornerWeb + WebSheet + DrapeWeb + HangingSpider", file: "house.tsx", theme: "old house (creepy basement mood)", center: [0, 1.3, 0.3], r: 2.3, az: 12, el: 6,
    draw: () => (
      <>
        <Wall w={5} h={2.8} />
        <AjarDoor position={[-1.2, 0, 0.03]} />
        <DarkOpening position={[1.0, 0, 0.03]} />
        <Darkness position={[2.2, 1.0, 0.04]} w={0.9} h={2.0} />
        <CornerWeb corner={[-2.5, 2.8, 0]} a={[1, 0, 0]} b={[0, 0, 1]} size={0.8} />
        <DrapeWeb position={[0.0, 2.5, 0.3]} w={0.7} h={0.5} />
        <WebSheet points={[[1.4, 2.8, 0.03], [2.5, 2.8, 0.03], [2.5, 1.9, 0.03]]} seed={4} />
        <HangingSpider top={[-0.2, 2.8, 0.5]} len={0.8} />
      </>
    ) },
];

const camFor = (p: Piece): Cam => {
  if (p.cam) return p.cam;
  const fov = 34;
  const d = (p.r / Math.tan(THREE.MathUtils.degToRad(fov / 2))) * 1.05;
  const az = THREE.MathUtils.degToRad(p.az ?? 32);
  const el = THREE.MathUtils.degToRad(p.el ?? 18);
  const [cx, cy, cz] = p.center;
  return { pos: [cx + d * Math.cos(el) * Math.sin(az), cy + d * Math.sin(el), cz + d * Math.cos(el) * Math.cos(az)], target: p.center, fov };
};

export const KitSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = KIT[Math.min(frame, KIT.length - 1)];
  const cam = camFor(p);
  return (
    <AbsoluteFill style={{ backgroundColor: "#bcd8f5" }}>
      <ThreeCanvas shadows="soft" width={width} height={height} gl={glProps} camera={{ fov: cam.fov, position: cam.pos }}
        style={{ filter: DAY_EXTERIOR.grade }}>
        <color attach="background" args={["#bcd8f5"]} />
        <SceneSetup fog={DAY_EXTERIOR.fog.color} density={0.004} />
        <CameraRig {...cam} />
        <DayExteriorLights sun={SUN} shadowSize={Math.max(8, p.r * 2)} />
        {p.ground === false ? null : (
          <OMesh geometry={new THREE.BoxGeometry(160, 0.2, 160)} position={[0, -0.1, 0]} map={grassTex([24, 24])} color="#d8d4c4" lines={false} />
        )}
        {p.draw(frame)}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
