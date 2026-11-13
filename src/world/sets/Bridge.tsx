// Set "bridge": an iron chain suspension bridge over a river by day (first used in
// videos/2026-11-07-bridge-break-step). Light preset: dayExterior (locked v3.1). Marks: bridge.json.
// The bridge spans x = -9 … 9 at deck height DECK_Y; the river runs along z; the camera side is +z.
// Two animated "lights" (levels 0–1 from the plan): bounce = the deck bounces with the marching cadence,
// drop = the left end falls into the river (the 1831 collapse). march = the soldiers bob in step.
// sign = the modern BREAK STEP notice is there (1) or not (0, the 1831 shots).
import { useMemo } from "react";
import * as THREE from "three";
import { OBox, OMesh, boxGeom, texturedBox } from "../../three/Outlined";
import { breakStepSignTex, cobbleTex, deckTex, grassTex, plasterTex, riverTex, stoneTex } from "../../three/textures";
import { Building } from "../kit/Building";
import { DaySky } from "../kit/DaySky";
import { Barrel, Bench, Chimney, ClothesLine, Crate, StreetLamp } from "../kit/props";
import { type Area, Boat, Bunting, Cart, Flowers, GrassTufts, Haystack, LinePosts, Reeds, Sacks, Stall, VegBed, WoodPile } from "../kit/country";
import { DayContext, Window } from "../kit/Window";
import { DayExteriorLights } from "../lights/dayExterior";
import { BRIDGE_SKY_R, BridgeFarLand, NEAR } from "./bridge_land";
import type { LightLevels } from "../../episode/sets";

export const DECK_Y = 3.2;
export const SPAN: [number, number] = [-9, 9];
const HALF_W = 1.3; // deck half width (four abreast)
const TOWER_X = 9.4;
const COL_Z = 1.5;
const COL_TOP = 8.0;
const CHAIN_LOW = DECK_Y + 0.75;
const CADENCE = 2; // steps per second
export const SHADOW_SIZE = 76; // half-size of the sun shadow box (m); keep bridge.json "review.shadow_size" equal
// FB7: this set's sun — high, from the right of the usual camera side. The day street's SUN [-30, 48, 42] sat right
// behind the wide cameras: house shadows fell straight back (hidden) and side walls were lit like the fronts. Now the
// left walls are in shade and shadows run out from the corners onto the grass. Same locked dayExterior light
// (intensity, colours); only the direction is the set's. Keep bridge.json "review.sun" equal.
export const BRIDGE_SUN: [number, number, number] = [42, 46, 24];
export const SIGN = { x: -11.2, y: DECK_Y, z: 2.1 };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const stepWave = (frame: number) => Math.abs(Math.sin(Math.PI * CADENCE * (frame / 30)));

// vertical deck displacement (m) at x: bounce (in time with the steps) + the collapse of the left end
export const deckDY = (x: number, frame: number, levels: LightLevels) => {
  if (x < SPAN[0] || x > SPAN[1]) return 0;
  const u = (x - SPAN[0]) / (SPAN[1] - SPAN[0]);
  const bounce = -0.16 * (levels.bounce ?? 0) * Math.sin(Math.PI * u) * stepWave(frame);
  const drop = -(DECK_Y - 0.35) * (levels.drop ?? 0) * clamp01(1 - u / 0.45);
  return bounce + drop;
};

// where an actor's feet go this frame: on the deck they ride the bounce/drop; everyone bobs while marching
export const bridgeActorOffset = (frame: number, levels: LightLevels, pos: [number, number, number]): [number, number, number] => {
  const onDeck = Math.abs(pos[1] - DECK_Y) < 0.3 && Math.abs(pos[2]) <= HALF_W + 0.1;
  const dy = onDeck ? deckDY(pos[0], frame, levels) : 0;
  return [0, dy + 0.05 * (levels.march ?? 0) * stepWave(frame), 0];
};

const chainY = (x: number) => CHAIN_LOW + (COL_TOP - 0.3 - CHAIN_LOW) * (x / TOWER_X) ** 2;

const planeUV = (w: number, d: number) => {
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
  return g;
};

const Tree: React.FC<{ x: number; z: number; s?: number }> = ({ x, z, s = 1 }) => {
  const crown = useMemo(() => new THREE.IcosahedronGeometry(1.3, 0), []);
  const trunk = useMemo(() => new THREE.CylinderGeometry(0.14, 0.2, 2.2, 8), []);
  return (
    <group position={[x, DECK_Y, z]} scale={[s, s, s]}>
      <OMesh geometry={trunk} position={[0, 1.1, 0]} color="#6a4a36" threshold={60} />
      <OMesh geometry={crown} position={[0, 2.9, 0]} color="#5f8a45" threshold={70} />
      <OMesh geometry={crown} position={[0.7, 2.4, 0.3]} scale={[0.7, 0.7, 0.7]} color="#6f9a4f" threshold={70} />
    </group>
  );
};

// one side chain as a tube; the left end follows the top of the falling column
const Chain: React.FC<{ z: number; leftTop: [number, number] }> = ({ z, leftTop }) => {
  const geom = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i++) {
      const x = -TOWER_X + (2 * TOWER_X * i) / 48;
      const w = clamp01(1 - (x + TOWER_X) / TOWER_X); // weight of the left end's move
      const y = chainY(x) + (leftTop[1] - (COL_TOP - 0.3)) * w * w;
      pts.push(new THREE.Vector3(x + (leftTop[0] + TOWER_X) * w * w, y, z));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.07, 6, false);
  }, [z, leftTop[0], leftTop[1]]);
  return <OMesh geometry={geom} color="#3a3850" threshold={80} />;
};

const Column: React.FC<{ x: number; z: number; tilt?: number }> = ({ x, z, tilt = 0 }) => (
  <group position={[x, DECK_Y, z]} rotation={[0, 0, -tilt]}>
    <OBox size={[0.42, COL_TOP - DECK_Y, 0.42]} position={[0, (COL_TOP - DECK_Y) / 2, 0]} color="#4b4a66" />
    <OBox size={[0.62, 0.22, 0.62]} position={[0, COL_TOP - DECK_Y, 0]} color="#3a3850" />
    <OBox size={[0.62, 0.2, 0.62]} position={[0, 0.1, 0]} color="#3a3850" />
  </group>
);

// ---- FB3: the background — a small 1830s town on both banks, hills, bushes, a fence ----
// day plasters = the same warm paints as day_street (shared texture keys)
const dayPlasters = () => ({
  a: plasterTex("a_day", "#efd39a", [0.33, 0.33], "#b8613f"),
  b: plasterTex("b_day", "#e28a5c", [0.33, 0.33], "#9c4430"),
  c: plasterTex("c_day", "#8fc4d6", [0.33, 0.33], "#a0563c"),
  d: plasterTex("d_day", "#f2b6a0", [0.33, 0.33], "#a85848"),
});
type House = [x0: number, x1: number, zFront: number, height: number, wall: "a" | "b" | "c" | "d"];
const HOUSES: House[] = [
  [-28, -23.5, -10, 6.2, "a"], [-23.2, -19.4, -9.4, 5.2, "b"], [-19.1, -14.8, -10.4, 6.8, "c"], [-14.5, -11.2, -12, 5.0, "d"],
  [11.6, 15.4, -12.5, 5.4, "b"], [15.7, 20.2, -9.6, 6.4, "a"], [20.5, 24.5, -10.2, 5.0, "d"], [24.8, 29.5, -9.8, 6.6, "c"],
];
const ROOF_TINT = "#ffb4a0"; // warm red-brown tiles

const Town: React.FC = () => {
  const P = dayPlasters();
  const mill = useMemo(() => new THREE.CylinderGeometry(0.55, 0.85, 15, 12), []);
  return (
    <DayContext.Provider value>
      <group position={[0, DECK_Y, 0]}>
        {HOUSES.map(([x0, x1, z, h, wall], i) => {
          const w = x1 - x0;
          const xs = [x0 + w * 0.28, x0 + w * 0.72];
          return (
            <Building key={i} x0={x0} x1={x1} zFront={z} depth={5} height={h} wall={P[wall]} roofColor={ROOF_TINT}>
              {xs.map((wx, k) =>
                i % 2 === 0 && k === 0 ? (
                  // FB4: the door front must not sit on the kit base slab front (zFront + 0.08): door front at zFront + 0.12
                  <OBox key={k} size={[1.0, 2.1, 0.12]} position={[wx, 1.05, z + 0.06]} color="#6a4a36" />
                ) : (
                  <Window key={k} x={wx} y={1.7} z={z + 0.03} w={0.95} h={1.25} />
                ),
              )}
              {h > 5.1
                ? xs.map((wx, k) => <Window key={`u${k}`} x={wx} y={h - 1.55} z={z + 0.03} w={0.85} h={1.1} shutters={(i + k) % 2 === 0} />)
                : null}
              <Chimney x={x0 + w * (i % 2 ? 0.25 : 0.75)} y={h + 0.6} z={z - 2.2} h={1.1} />
            </Building>
          );
        })}
        {/* a mill chimney on the right bank (Manchester, 1831) */}
        <OMesh geometry={mill} position={[27, 7.5, -21]} map={plasterTex("mill", "#a0563c", [0.33, 0.33], "#7a3a2c")} threshold={70} />
        <OBox size={[1.5, 0.3, 1.5]} position={[27, 15.1, -21]} color="#4a3442" />
      </group>
    </DayContext.Provider>
  );
};

// FB6 round hills were replaced by the far land (item 8, bridge_land.tsx): faceted terrain, fields, trees, ridges.

// bush clusters on the banks
const BUSHES: [number, number, number][] = [
  [-11.4, -3.2, 1], [-16.2, -1.8, 0.8], [-25.5, -3.5, 1.1], [-12.2, 5.5, 0.9], [-19.5, 6.5, 1],
  [11.2, -3.6, 0.9], [18.6, -2.2, 1.1], [26, -3.4, 0.9], [12.4, 5.2, 1], [22.5, 6.0, 0.8],
];
const Bushes: React.FC = () => {
  const g = useMemo(() => new THREE.IcosahedronGeometry(0.55, 0), []);
  return (
    <>
      {BUSHES.map(([x, z, s], i) => (
        <group key={i} position={[x, DECK_Y + 0.35 * s, z]} scale={[s, s, s]}>
          <OMesh geometry={g} color="#4f8a3e" threshold={70} />
          <OMesh geometry={g} position={[0.55, -0.1, 0.2]} scale={[0.8, 0.8, 0.8]} color="#5f9a48" threshold={70} />
          <OMesh geometry={g} position={[-0.5, -0.12, -0.1]} scale={[0.75, 0.75, 0.75]} color="#6aa651" threshold={70} />
        </group>
      ))}
    </>
  );
};

// wooden fence along the road (behind it on the left, both sides on the right; the sign side stays open)
const Fence: React.FC<{ x0: number; x1: number; z: number }> = ({ x0, x1, z }) => {
  const n = Math.floor(Math.abs(x1 - x0) / 1.5);
  const dir = Math.sign(x1 - x0);
  const len = Math.abs(x1 - x0);
  const cx = (x0 + x1) / 2;
  return (
    <group>
      {Array.from({ length: n + 1 }, (_, i) => (
        <OBox key={i} size={[0.1, 1.0, 0.1]} position={[x0 + dir * i * 1.5, DECK_Y + 0.5, z]} color="#8b6a4c" />
      ))}
      <OBox size={[len, 0.08, 0.05]} position={[cx, DECK_Y + 0.8, z]} color="#9a7a58" />
      <OBox size={[len, 0.08, 0.05]} position={[cx, DECK_Y + 0.45, z]} color="#9a7a58" />
    </group>
  );
};

// ---- v4 VFX item 8: background filling (references/effects/README.md §8) ----
// LOCKED 2026-11-11 (user's choice: B, the most props) + the far land (bridge_land.tsx). Recipe:
// references/effects/depth-filling.md. Rule learned on test 1: the cameras of this set look from the +z side at ±27° (dir [±0.45, *, 0.89]), at eye
// height. Props only show where those view cones run (behind the marks: the near banks x ±10.6…17, z −2.3…−9)
// and only if they are TALL (stall, laundry, stacks, haystacks, lamps); flat props show only at the frame bottom.
// Tall clusters in the view cones (the big tree that blocked the left cone moved back), then every layer full:
// laundry, bunting, foreground props on the camera-side banks, grass tufts, flowers, boats, reeds.
const Y = DECK_Y; // ground on the banks
const lift = (y: number): [number, number, number] => [0, y, 0];
type R4 = [number, number, number, number];
// footprints the grass tufts keep out of (x0, x1, z0, z1)
const FOOTPRINTS: R4[] = [
  [-30, 30, -1.45, 1.45], // road
  [-15.1, -12.5, -5.6, -3.6], [-16.6, -15.0, -4.9, -3.5], [-20, -16.6, -5.4, -2.8], [-24.5, -21.9, -5.8, -2.3],
  [-28.3, -26.1, -5.5, -3.3], [-28.5, -26.7, -8.3, -6.5], // left
  [13.8, 17, -6.2, -4.6], [11.4, 13.4, -7.6, -5.6], [15.0, 17.4, -9, -7.4], [17.8, 19.2, -9.3, -7.9],
  [22.4, 25.6, -5.6, -3.2], [26.4, 28.8, -6.4, -4], // right
  [-17.4, -13.6, 7.4, 9], [-23.8, -21.2, 7.2, 9.8], [-16, -14.4, 3.6, 4.4], [18.4, 21, 3.6, 6.8], [13, 14.2, 2.9, 4.3],
];
const offFootprint = (x: number, z: number) => FOOTPRINTS.some(([x0, x1, z0, z1]) => x > x0 && x < x1 && z > z0 && z < z1);
const TUFT_AREAS: Area[] = [
  [-32, -10.7, -9.2, -1.5], [-32, -10.7, 1.5, 16],
  [10.7, 32, -9.2, -1.5], [10.7, 32, 1.5, 16],
];
// flowers: in front of every house (not at the door), along the fences, and in the camera-side foreground
const FLOWERS: [number, number][] = (() => {
  const out: [number, number][] = [];
  HOUSES.forEach(([x0, x1, z], i) => {
    const door = x0 + (x1 - x0) * 0.28;
    for (let x = x0 + 0.5; x < x1 - 0.4; x += 1.1) if (!(i % 2 === 0 && Math.abs(x - door) < 0.8)) out.push([x, z + 0.45]);
  });
  for (let x = -13.6; x > -25; x -= 1.7) out.push([x, -2.15]);
  for (let x = 11.6; x < 24; x += 1.7) out.push([x, -2.15], [x + 0.6, 2.15]);
  out.push([-10.9, 4.6], [-11.0, 7.0], [-11.6, 8.2], [-13.2, 6.4], [11.2, 3.5], [11.5, 5.6], [12.0, 7.5], [-10.95, -3.0], [10.95, -3.4]);
  return out;
})();
const SACKS_L: [number, number, number?][] = [[-12.0, -6.3], [-11.6, -6.6], [-11.8, -6.45, 0.2]];
const SACKS_R: [number, number, number?][] = [[22.4, -6.0], [22.8, -6.3], [22.6, -6.1, 0.2], [14.6, 6.6], [14.95, 6.9]];
const CLOTHS_R: [number, string, number, number][] = [
  [0.2, "#f2b6a0", 0.5, 0.6],
  [0.42, "#e8dccb", 0.6, 0.72],
  [0.66, "#8fc4d6", 0.45, 0.5],
  [0.84, "#e8dccb", 0.4, 0.55],
];
// a clothesline running along x (the kit line runs along z): world (x, z) -> the turned group's local (-z, x)
const LineAlongX: React.FC<{ z: number; x0: number; x1: number; cloths?: typeof CLOTHS_R }> = ({ z, x0, x1, cloths }) => (
  <>
    <LinePosts y={Y} a={[x0, z]} b={[x1, z]} />
    <group rotation={[0, Math.PI / 2, 0]}>
      <ClothesLine a={[-z, Y + 2.0, x0]} b={[-z, Y + 2.0, x1]} sag={0.32} cloths={cloths} />
    </group>
  </>
);

const Filling: React.FC = () => (
  <group>
    {/* tall clusters in the view cones, then the mid banks */}
    <Stall x={-13.8} y={Y} z={-4.6} rotY={0.45} />
    <Crate position={[-15.4, Y + 0.23, -3.9]} rotY={0.25} />
    <Crate position={[-15.45, Y + 0.75, -3.95]} rotY={0.6} />
    <Barrel position={[-16.2, Y + 0.405, -4.5]} />
    <Cart x={-18.6} y={Y} z={-4.0} rotY={0.5} />
    <VegBed x={-23.2} y={Y} z={-5.0} w={2.6} d={1.5} />
    <Haystack x={-27.2} y={Y} z={-4.4} />
    <Barrel position={[-25.4, Y + 0.405, -9.45]} />
    <Crate position={[-24.5, Y + 0.23, -9.5]} rotY={0.2} />
    <Haystack x={12.4} y={Y} z={-6.6} s={0.9} rotY={0.5} />
    <VegBed x={15.4} y={Y} z={-5.4} w={3} d={1.4} />
    <Stall x={16.2} y={Y} z={-8.2} rotY={-0.45} stripe="#3d6a9a" />
    <WoodPile x={18.5} y={Y} z={-8.6} />
    <Cart x={24.0} y={Y} z={-4.4} rotY={-2.4} />
    <Haystack x={27.6} y={Y} z={-5.2} s={1.1} rotY={1} />
    <Barrel position={[12.6, Y + 0.405, -11.6]} />
    <Crate position={[13.4, Y + 0.23, -11.9]} rotY={-0.3} />
    {/* street lamps at the bridge ends */}
    <group position={lift(Y - 0.02)}>
      <StreetLamp x={-10.75} z={-1.85} />
      <StreetLamp x={10.75} z={-1.85} />
      <StreetLamp x={10.75} z={1.85} />
    </group>

    {/* back layer: laundry facing the cameras, bunting from the lamps to the stalls, sacks, wood */}
    <LineAlongX z={-7.0} x0={-11.2} x1={-15.4} />
    <LineAlongX z={-3.0} x0={14.8} x1={19.6} cloths={CLOTHS_R} />
    <Bunting a={[-10.75, Y + 3.25, -1.85]} b={[-13.14, Y + 2.3, -5.42]} sag={0.35} n={9} />
    <Bunting a={[10.75, Y + 3.25, -1.85]} b={[15.54, Y + 2.3, -9.02]} sag={0.6} n={14} />
    <VegBed x={-23.2} y={Y} z={-3.0} w={2.6} d={1.3} />
    <Sacks y={Y - 0.02} at={SACKS_L} />
    <Sacks y={Y - 0.02} at={SACKS_R} />
    <WoodPile x={-13.0} y={Y} z={-10.8} />
    <Haystack x={-27.6} y={Y} z={-7.4} s={0.8} rotY={2} />

    {/* foreground: the camera-side banks */}
    {/* the kit bench stands on a 0.14 m sidewalk: its legs end at y 0.14 */}
    <group position={lift(Y - 0.16)}>
      <Bench x={-16} z={4.0} />
    </group>
    <Barrel position={[-12.0, Y + 0.405, 4.2]} />
    <Crate position={[-12.6, Y + 0.23, 4.8]} rotY={0.6} />
    <VegBed x={-15.5} y={Y} z={8.2} w={3.5} d={1.4} />
    <Haystack x={-22.5} y={Y} z={8.5} s={1.2} />
    <WoodPile x={13.6} y={Y} z={3.6} rotY={0.3} />
    <Cart x={19.6} y={Y} z={5.2} rotY={1.2} load={false} />

    {/* ground cover */}
    <GrassTufts y={Y} areas={TUFT_AREAS} perM2={1.2} seed={81} avoid={offFootprint} />
    <Flowers y={Y} at={FLOWERS} seed={82} />

    {/* the river: boats at their posts, reeds at the foot of the walls */}
    <Boat x={-8.3} z={-16} rotY={Math.PI / 2 + 0.1} post={[-9.55, 0, -15]} />
    <Boat x={8.2} z={-24} rotY={Math.PI / 2 - 0.08} color="#b0705a" post={[9.55, 0, -23]} />
    <Boat x={-8.4} z={11} rotY={Math.PI / 2} color="#6f9a7a" post={[-9.55, 0, 10]} />
    <Reeds y={0} x={-9.65} z0={-70} z1={-4} seed={91} />
    <Reeds y={0} x={-9.65} z0={4} z1={70} seed={92} />
    <Reeds y={0} x={9.65} z0={-70} z1={-4} seed={93} />
    <Reeds y={0} x={9.65} z0={4} z1={70} seed={94} />
  </group>
);

export const Bridge: React.FC<{ frame: number; lights: LightLevels }> = ({ frame, lights }) => {
  const drop = lights.drop ?? 0;
  // FB6: the river and its banks run far into the haze both ways (no end block, no grass edge at the horizon)
  const water = useMemo(() => planeUV(90, 420), []);
  // FB2: every top face at its own height (they were all at DECK_Y and flickered = z-fighting):
  // wall top DECK_Y - 0.04 (under the grass edge), grass DECK_Y, pier cap DECK_Y + 0.05, road top DECK_Y + 0.08
  const bankWall = useMemo(() => texturedBox(0.6, DECK_Y + 0.96, 420), []);
  const pier = useMemo(() => texturedBox(1.6, DECK_Y + 1.05, 3.8), []);
  // item 8 far land: the banks are a near box (|x| 10.2…42, |z| ≤ 42) + a terrain beyond it (bridge_land.tsx)
  const grassNear = useMemo(() => texturedBox(NEAR - (TOWER_X + 0.8), 0.4, 2 * NEAR), []);
  const roadNear = useMemo(() => texturedBox(NEAR - TOWER_X, 0.06, 2.6), []);
  // the near-side left column falls toward the bridge (+x) as the end drops
  const tilt = 0.75 * clamp01(drop * 1.4);
  const h = COL_TOP - 0.3 - DECK_Y;
  const leftTop: [number, number] = [-TOWER_X + Math.sin(tilt) * h, DECK_Y + Math.cos(tilt) * h];
  const bays = [];
  for (let i = 0; i < SPAN[1] - SPAN[0]; i++) {
    const x0 = SPAN[0] + i;
    const xc = x0 + 0.5;
    const y0 = DECK_Y + deckDY(x0 + 0.001, frame, lights);
    const y1 = DECK_Y + deckDY(x0 + 0.999, frame, lights);
    const yc = (y0 + y1) / 2;
    const slope = Math.atan2(y1 - y0, 1);
    bays.push(
      <group key={i} position={[xc, yc, 0]} rotation={[0, 0, slope]}>
        <OMesh geometry={boxGeom(1.0, 0.16, HALF_W * 2)} position={[0, -0.08, 0]} map={deckTex([1, 1])} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <OBox size={[1.0, 0.07, 0.07]} position={[0, 1.0, s * HALF_W]} color="#3a3850" lines={false} />
            <OBox size={[0.06, 1.0, 0.06]} position={[-0.5, 0.5, s * HALF_W]} color="#3a3850" lines={false} />
          </group>
        ))}
      </group>,
    );
    // hangers: from the chain down to the deck edge (stretch with the bounce; hidden once the end drops away)
    for (const s of [-1, 1]) {
      const top = chainY(xc);
      const len = Math.max(0.05, top - yc);
      if (drop > 0.05 && xc < 0) continue;
      bays.push(
        <OMesh key={`h${i}${s}`} geometry={boxGeom(0.04, 1, 0.04)} position={[xc, yc + len / 2, s * (HALF_W + 0.12)]} scale={[1, len, 1]}
          color="#3a3850" lines={false} />,
      );
    }
  }
  // splash where the end hits the water
  const splash = clamp01((drop - 0.55) / 0.45);

  return (
    <group>
      <DaySky sun={BRIDGE_SUN} radius={BRIDGE_SKY_R} />
      {/* FB7: the whole set (houses up to 31 m, hills ~48 m from the sun axis) inside the shadow box */}
      <DayExteriorLights sun={BRIDGE_SUN} shadowSize={SHADOW_SIZE} shadowMapSize={8192} />

      {/* river */}
      <mesh geometry={water} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial map={riverTex([0.25, 0.25])} roughness={0.6} />
      </mesh>

      {/* banks: grass on both sides, stone walls down to the water, the road onto the bridge */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <OMesh geometry={grassNear} map={grassTex([0.25, 0.25])} position={[s * (TOWER_X + 0.8 + NEAR) / 2, DECK_Y - 0.2, 0]} />
          <OMesh geometry={bankWall} map={stoneTex([0.5, 0.5])} position={[s * (TOWER_X + 0.8), (DECK_Y - 1.04) / 2, 0]} />
          <OMesh geometry={roadNear} map={cobbleTex([0.5, 0.5], true)} position={[s * (TOWER_X + NEAR) / 2, DECK_Y + 0.05, 0]} />
          <OMesh geometry={pier} map={stoneTex([0.5, 0.5])} position={[s * TOWER_X, (DECK_Y - 0.95) / 2, 0]} />
        </group>
      ))}

      {/* iron columns (the near-left one falls in the collapse) */}
      <Column x={-TOWER_X} z={-COL_Z} />
      <Column x={-TOWER_X} z={COL_Z} tilt={tilt} />
      <Column x={TOWER_X} z={-COL_Z} />
      <Column x={TOWER_X} z={COL_Z} />
      <Chain z={-COL_Z} leftTop={[-TOWER_X, COL_TOP - 0.3]} />
      <Chain z={COL_Z} leftTop={leftTop} />

      {/* deck bays, rails, hangers */}
      {bays}

      {splash > 0 ? (
        <group position={[-8.2, 0, 0.4]}>
          {/* foam ring on the water + droplets thrown up and out */}
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.6 + 1.6 * splash, 0.4 + 1.0 * splash, 1]}>
            <ringGeometry args={[0.55, 1, 32]} />
            <meshStandardMaterial color="#f4fbff" roughness={1} transparent opacity={0.9 - 0.4 * splash} />
          </mesh>
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const r = (0.5 + 1.4 * splash) * (0.7 + 0.3 * ((i * 7) % 3));
            const up = Math.sin(Math.PI * Math.min(1, splash * 1.2)) * (0.6 + 0.5 * ((i * 5) % 3));
            return (
              <mesh key={i} position={[Math.cos(a) * r, up, Math.sin(a) * r * 0.6]}>
                <sphereGeometry args={[0.07 + 0.04 * (i % 3), 8, 6]} />
                <meshStandardMaterial color="#f4fbff" roughness={1} />
              </mesh>
            );
          })}
        </group>
      ) : null}

      {/* the notice at the left entrance: "ALL TROOPS MUST BREAK STEP ON THIS BRIDGE" (light "sign": 0 = not there yet, e.g. in 1831) */}
      <group position={[SIGN.x, SIGN.y, SIGN.z]} rotation={[0, 0.35, 0]} visible={(lights.sign ?? 1) > 0.5}>
        <OBox size={[0.1, 1.4, 0.1]} position={[-0.5, 0.7, -0.02]} color="#2c2a3c" />
        <OBox size={[0.1, 1.4, 0.1]} position={[0.5, 0.7, -0.02]} color="#2c2a3c" />
        <OBox size={[1.36, 0.88, 0.06]} position={[0, 1.78, 0]} color="#2c2a3c" />
        <mesh position={[0, 1.78, 0.032]}>
          <planeGeometry args={[1.28, 0.8]} />
          <meshStandardMaterial map={breakStepSignTex()} roughness={0.9} />
        </mesh>
      </group>

      {/* trees on the banks */}
      {/* item 8: this tree moved back out of the left view cone (at -14, -4 it hid the stall) */}
      <Tree x={-16.6} z={-8.6} s={1.1} />
      <Tree x={-17.5} z={2.5} />
      <Tree x={-12.8} z={-9} s={0.9} />
      <Tree x={13.5} z={-3.2} />
      <Tree x={16.5} z={3.5} s={1.25} />
      <Tree x={12.6} z={-10} s={1.1} />
      <Tree x={-21} z={-6} s={1.3} />
      <Tree x={21} z={-7} s={1.2} />

      {/* FB3: a real town on the banks, bushes, fences; item 8: the far land (fields, trees, farm, town, hills, ridges) */}
      <Town />
      <BridgeFarLand frame={frame} />
      <Bushes />
      <Fence x0={-13} x1={-25} z={-1.7} />
      <Fence x0={11} x1={24} z={-1.7} />
      <Fence x0={11} x1={24} z={1.7} />
      <Filling />
    </group>
  );
};
