// The bridge set's far land (v4 VFX item 8 on the wide view C3, + parts of items 7 and 13):
// fields + hedgerows, many trees of three kinds, a farm with a windmill, a town on a rise (church spire,
// mill chimneys), rolling uneven hills and faint moorland ridges (choice (a), 2026-11-11).
// Layout: the flat bank box |x| 10.2…42, |z| ≤ 42 stays (props, houses); everything beyond is a terrain
// heightfield. The river runs on between the walls to z ≈ -100, then the land closes over it (a bend).
import { useMemo } from "react";
import { OMesh, texturedBox } from "../../three/Outlined";
import { type TerrainSpec, type TownHouse, type TreeAt, Barn, HillTown, MountainRange, Trees, Windmill, gridLine, hedgeTrees, makeTerrain, noise2 } from "../kit/land";
import { rng } from "../../three/textures";
import { Haystack } from "../kit/country";

const Y = 3.2; // = DECK_Y (ground of the banks)
export const NEAR = 42; // half-size of the flat bank box
const RIVER = 10.4; // terrain inside |x| < RIVER is the river bed (under the water)
const SKY_R = 150; // the bridge's sky dome radius (DaySky radius)
const FAR_HAZE = 0.6; // fog cap of the far land (= the locked fog up to ~80 m)

const sm = (v: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const n1 = noise2(11);
const n2 = noise2(23);
// explicit rises: [x, z, radius, height]
const RISES: [number, number, number, number][] = [
  [32, -58, 16, 3], // the town's rise (low: C3 sees the far land only in the top ~25 % of the frame)
  [70, -78, 26, 14], [8, -128, 30, 16], [-55, -85, 28, 12], [-90, -30, 30, 10], [95, 10, 30, 9], [-30, 95, 30, 10], [45, 100, 30, 11],
];
const rises = (x: number, z: number) => RISES.reduce((h, [rx, rz, r, hh]) => h + hh * Math.exp(-((x - rx) ** 2 + (z - rz) ** 2) / (r * r)), 0);

// height above Y of the land outside the bank box
const outer = (x: number, z: number) => {
  const ax = Math.abs(x);
  const az = Math.abs(z);
  const d = Math.hypot(Math.max(0, ax - NEAR), Math.max(0, az - NEAR));
  const roll = 8 * n1(x / 36, z / 36) + 3 * n2(x / 13, z / 13) - 4.5;
  let h = sm(d, 0, 30) * Math.max(0, roll) + rises(x, z);
  if (z > -100 && z < 85) h *= sm(ax - RIVER, 3, 26); // a flat strip along the river
  h += sm(Math.hypot(x, z), 100, 140) * 7; // the rim: no flat edge at the horizon (low, so the ridges show over it)
  return 0.03 + Math.max(0, h);
};

// absolute y of the land at (x, z) (for placing things)
export const landY = (x: number, z: number) => {
  const ax = Math.abs(x);
  if (ax < RIVER) {
    // the river bed; past z -100 / +85 the land rises over the river (it bends out of sight)
    const k = z < -100 ? sm(z, -100, -124) : z > 85 ? sm(z, 85, 108) : 0;
    return -1.5 + k * (Y + 1.5 + outer(x, z));
  }
  if (ax <= NEAR && Math.abs(z) <= NEAR) return Y;
  return Y + outer(x, z);
};

// terrain mesh height: inside the bank box it hides 0.6 m under the grass box (no shared plane)
const meshY = (x: number, z: number) => (Math.abs(x) >= RIVER + 0.05 && Math.abs(x) <= NEAR && Math.abs(z) <= NEAR ? Y - 0.6 : landY(x, z));

// field patchwork: rotated cells of ~16 x 10 m, 6 colours; a dirt road; grass along the river
const FIELD = ["#7fb04f", "#6aa046", "#8fbf5a", "#e2c35a", "#c9b05a", "#9a6a44", "#5f9a40"];
const hash = (i: number, j: number) => {
  const s = Math.sin(i * 91.7 + j * 47.3) * 43758.5453;
  return s - Math.floor(s);
};
const roadZ = (x: number) => 2.5 * Math.sin(x / 18);
const landColor = (x: number, z: number, y: number) => {
  const ax = Math.abs(x);
  if (ax < RIVER) return y < 0 ? "#3a5a7a" : "#5f9a40";
  if (ax > NEAR && Math.abs(z - roadZ(x)) < 1.7) return "#b89a6a"; // the road goes on as a dirt road
  if (ax - RIVER < 4 || y > Y + 16) return "#6aa046"; // river strip, hill tops: grass
  const a = 0.35 * Math.sign(x) + 0.2 * Math.sign(z);
  const u = x * Math.cos(a) + z * Math.sin(a);
  const v = -x * Math.sin(a) + z * Math.cos(a);
  return FIELD[Math.floor(hash(Math.floor(u / 16), Math.floor(v / 10)) * FIELD.length)];
};

const EXTRA = [-RIVER - 0.05, -RIVER, RIVER, RIVER + 0.05, -NEAR - 0.05, -NEAR, NEAR, NEAR + 0.05];
const SPEC: TerrainSpec = {
  xs: gridLine(-SKY_R, SKY_R, 2.5, EXTRA),
  zs: gridLine(-SKY_R, SKY_R, 2.5, [-NEAR - 0.05, -NEAR, NEAR, NEAR + 0.05]),
  height: meshY,
  color: landColor,
};

// ---- near fields on the flat bank box (behind the houses): [x0, x1, z0, z1, colour] ----
const NEAR_FIELDS: [number, number, number, number, string][] = [
  [13, 22, -30, -19.5, "#8fbf5a"], [13, 22, -41.5, -30.8, "#e2c35a"], [23, 31.5, -41.5, -26, "#6aa046"], [32, 41.5, -41.5, -28, "#9a6a44"],
  [-22, -13, -30, -19.5, "#9a6a44"], [-22, -13, -41.5, -30.8, "#6aa046"], [-31.5, -23, -41.5, -26, "#e2c35a"], [-41.5, -32, -41.5, -18, "#8fbf5a"],
  [13, 24, 19, 30, "#e2c35a"], [25, 41.5, 19, 41.5, "#6aa046"], [-24, -13, 19, 30, "#8fbf5a"], [-41.5, -25, 19, 41.5, "#9a6a44"],
];
const NearFields: React.FC = () => {
  const geoms = useMemo(() => NEAR_FIELDS.map(([x0, x1, z0, z1]) => texturedBox(x1 - x0, 0.08, z1 - z0)), []);
  return (
    <>
      {NEAR_FIELDS.map(([x0, x1, z0, z1, c], i) => (
        // top Y + 0.05, bottom Y - 0.03: never on the grass plane
        <OMesh key={i} geometry={geoms[i]} position={[(x0 + x1) / 2, Y + 0.01, (z0 + z1) / 2]} color={c} lineColor="#4a6a3a" threshold={30} />
      ))}
    </>
  );
};

// ---- the town on its rise ----
const TOWN: TownHouse[] = (() => {
  const r = rng(301);
  const out: TownHouse[] = [];
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2;
    const d = 3 + r() * 11;
    const x = 32 + Math.cos(a) * d * 1.2;
    const z = -56 + Math.sin(a) * d * 0.8;
    if (Math.hypot(x - 27, z - 50) < 6) continue; // the church
    const w = 3 + r() * 1.6;
    out.push([x, landY(x, z), z, w, 3.8 + r() * 1.4, 3 + r() * 1.8, Math.round(r() * 3) * (Math.PI / 2) + (r() - 0.5) * 0.3]);
  }
  return out;
})();
const CHURCH: [number, number, number] = [27, landY(27, -50), -50];
const CHIMNEYS: [number, number, number][] = [[44, landY(44, -60), -60], [21, landY(21, -64), -64]];

// ---- trees ----
const TREES: TreeAt[] = (() => {
  const r = rng(77);
  const out: TreeAt[] = [];
  // poplar rows along both river banks, into the distance (rows show scale)
  for (const sx of [-1, 1]) {
    // sparse, and only past the bank box: a dense near row hid the fields (C3 test 2a)
    for (let z = -48; z > -104; z -= 9) out.push(["poplar", sx * 12.2, landY(sx * 12.2, z), z, 1.0 + 0.15 * r()]);
    for (let z = 48; z < 90; z += 9) out.push(["poplar", sx * 12.2, landY(sx * 12.2, z), z, 1.0 + 0.15 * r()]);
  }
  // the bend: a thick clump where the land closes over the river
  for (let i = 0; i < 14; i++) {
    const x = -16 + r() * 32;
    const z = -102 - r() * 14;
    out.push([r() < 0.6 ? "round" : "poplar", x, landY(x, z), z, 1.3 + r() * 0.6]);
  }
  // clusters and loose trees on the land (avoid the river, the bank box and the road)
  let n = 0;
  while (n < 110) {
    const x = (r() - 0.5) * 2 * 135;
    const z = (r() - 0.5) * 2 * 135;
    const ax = Math.abs(x);
    if (ax < RIVER + 4 || (ax <= NEAR + 2 && Math.abs(z) <= NEAR + 2) || Math.abs(z - roadZ(x)) < 3 || Math.hypot(x, z) > 132) continue;
    if (Math.hypot(x - 32, z + 56) < 15) continue; // the town
    // a cluster of 1–4 trees
    const k = 1 + Math.floor(r() * 4);
    for (let i = 0; i < k; i++) {
      const tx = x + (r() - 0.5) * 7;
      const tz = z + (r() - 0.5) * 7;
      out.push([r() < 0.75 ? "round" : "poplar", tx, landY(tx, tz), tz, 1.2 + r() * 0.7]);
    }
    n++;
  }
  // round trees by the near fields + the town
  [[22.5, -18], [31.8, -24], [-22.6, -18], [-31.8, -22], [40, -16], [24, -44], [40, -46], [22, -49], [42, -52]].forEach(([x, z]) =>
    out.push(["round", x, landY(x, z), z, 1.1 + 0.3 * r()]),
  );
  // hedgerows along the field edges and the edge of the bank box (it hides the seam to the terrain)
  const hedges: [number, number][][] = [
    [[12.5, -30.4], [22.4, -30.4]], [[22.6, -19.5], [22.6, -41.6]], [[31.8, -26], [31.8, -41.6]],
    [[-12.5, -30.4], [-22.4, -30.4]], [[-22.6, -19.5], [-22.6, -41.6]], [[-31.8, -18], [-31.8, -41.6]],
    [[11, -42.3], [42.3, -42.3], [42.3, -3]], [[-11, -42.3], [-42.3, -42.3], [-42.3, -3]],
    [[42.3, 3.5], [42.3, 42.3], [11, 42.3]], [[-42.3, 3.5], [-42.3, 42.3], [-11, 42.3]],
  ];
  for (const h of hedges) out.push(...hedgeTrees(h, landY, 1.5, 0.75));
  return out;
})();

export const BridgeFarLand: React.FC<{ frame: number }> = ({ frame }) => {
  const terrain = useMemo(() => makeTerrain(SPEC), []);
  return (
    <group>
      <OMesh geometry={terrain} vertexColors lineColor="#557a45" threshold={32} fogMax={FAR_HAZE} />
      <NearFields />
      <Trees trees={TREES} seed={5} fogMax={FAR_HAZE} />
      {/* the farm behind the right bank houses */}
      <Windmill x={27} y={Y} z={-34} rotY={0.5} frame={frame} />
      <Barn x={37} y={Y} z={-21.5} rotY={-0.2} />
      <Haystack x={16} y={Y} z={-35} s={0.8} />
      <Haystack x={19.5} y={Y} z={-38} s={0.7} rotY={1} />
      <Haystack x={-27} y={Y} z={-36} s={0.8} rotY={2} />
      <HillTown houses={TOWN} church={CHURCH} chimneys={CHIMNEYS} frame={frame} fogMax={FAR_HAZE} />
      {/* moorland ridges: two ranges, the far one taller and paler (haze baked in) */}
      {/* sized for C3: peaks ~6–8° above eye height (the frame top is ~9.6°) */}
      <MountainRange R={118} a0={-0.9} a1={1.5} height={15} y0={Y + 5} seed={4} color="#5f7a96" lineColor="#4f6684" fogMax={0.74} />
      <MountainRange R={128} a0={-0.4} a1={1.2} height={22} y0={Y + 5} seed={9} color="#7690ad" lineColor="#647d9a" depth={20} fogMax={0.84} />
    </group>
  );
};

export const BRIDGE_SKY_R = SKY_R;
