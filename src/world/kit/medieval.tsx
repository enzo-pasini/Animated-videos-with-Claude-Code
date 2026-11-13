// Theme kit "medieval" (castle, army camp, battlefield): free CC0 packs in public/packs/medieval/ (LICENSE.txt +
// sources.txt there), drawn in our look by PackPiece (pack.tsx). Style test approved 2026-11-12 (look C); main castle =
// Quaternius Castle Fortress (A/B/C test: references/sets/castle_abc.jpg). Picture: references/sets/kit_medieval.jpg
// (`.venv/Scripts/python -I tools/kit_catalog.py --theme medieval`).
//
// Kenney Castle Kit = ONE file with many pieces on a 1-unit grid; CASTLE_S scales it (a wall = 4.6 m high, a tile = 3.5 m).
// - <MedievalPiece kind="trebuchet" position={[x, 0, z]} rotY={...} stone="grey" roof="red" />
// - <Tower x z floors={2} top="high" />: a square tower stacked from base + middles + top (or `hex`)
// - <CastleRing nx={11} nz={9} />: a wall ring with a gate (+z side) and 4 corner towers, centered on `center`
import { PackPiece } from "./pack";

export const CASTLE_S = 3.5; // Kenney Castle Kit scale: 1 unit = 3.5 m
export const TILE = CASTLE_S; // one wall tile (m)
const KIT = "medieval/k_castle_kit.glb";

// Pack material names → our colors (look C).
export const MEDIEVAL_TONES: Record<string, string> = {
  // Kenney Castle Kit
  wall: "#d9c9a8",
  wallDark: "#a8957a",
  FrontColor: "#d9c9a8",
  wood: "#8e5a40",
  roof: "#4a5f96",
  roofRed: "#a8483a",
  cotton: "#e8e0d0",
  dark: "#2e1d35",
  // Quaternius Castle Fortress
  Stone: "#8f8a86",
  Stone_Light: "#c4bca8",
  Wood: "#6b4433",
  Main: "#9a3f35",
};
// Finishes on top of MEDIEVAL_TONES: stone sand (default) / grey, roofs blue (default) / red.
export const STONE = { sand: {}, grey: { wall: "#c2bdb2", wallDark: "#8d8984", FrontColor: "#c2bdb2" } };
export const ROOF = { blue: {}, red: { roof: "#a8483a" } };

type Spec = { node?: string; file?: string; h?: number; threshold?: number };
export const MEDIEVAL = {
  // main building (Quaternius, a whole castle: put it inside a CastleRing, or far away on a hill)
  fortress: { file: "medieval/q_castle_fortress.glb", h: 18 },
  // walls (1 tile each; the wall runs along x, rotY π/2 for side walls)
  wall: { node: "wall" },
  wallCorner: { node: "wallCorner" },
  wallHalf: { node: "wallHalf" },
  wallNarrow: { node: "wallNarrow" },
  wallGate: { node: "wallNarrowGate" }, // passage along x: rotY π/2 in a wall along x
  wallDoor: { node: "wallDoor" },
  wallPillar: { node: "wallPillar" },
  metalGate: { node: "metalGate" },
  bridge: { node: "bridgeStraight_exclusive" },
  stairs: { node: "stairsStone" },
  // tower parts (use <Tower>): heights in units base 1.01, mid 1.01, tops below
  towerBase: { node: "towerSquareBase" },
  towerMid: { node: "towerSquareMid" },
  towerMidWindows: { node: "towerSquareMidWindows" },
  towerMidDoor: { node: "towerSquareMidDoor_exclusive" },
  towerTopHigh: { node: "towerSquareTopRoofHigh" },
  towerTopRoof: { node: "towerSquareTopRoof" },
  towerTopFlat: { node: "towerSquareTop" },
  hexBase: { node: "towerHexagonBase_exclusive" },
  hexMid: { node: "towerHexagonMid_exclusive" },
  hexRoof: { node: "towerHexagonRoof_exclusive" },
  // flags
  flagBlue: { node: "flagBlue" },
  flagWhite: { node: "flagWhite" },
  bannerLong: { node: "flagBannerLong" },
  bannerShort: { node: "flagBannerShort" },
  // siege camp / battlefield
  trebuchet: { node: "siegeTrebuchet_8angles", threshold: 35 },
  catapult: { node: "siegeCatapult_8angles", threshold: 35 },
  ballista: { node: "siegeBallista_8angles", threshold: 35 },
  ram: { node: "siegeRam_8angles", threshold: 35 },
  siegeTower: { node: "siegeTower_8angles", threshold: 35 },
  // props (hand size at CASTLE_S: use s = 1 for a real sword / shield)
  shieldRed: { node: "shieldRed" },
  shieldBlue: { node: "shieldBlue" },
  sword: { node: "sword" },
} satisfies Record<string, Spec>;
export type MedievalKind = keyof typeof MEDIEVAL;

export const medievalFile = (kind: MedievalKind) => (MEDIEVAL[kind] as Spec).file ?? KIT;

export const MedievalPiece: React.FC<{
  kind: MedievalKind;
  position?: [number, number, number];
  rotY?: number;
  s?: number; // Kenney pieces: default CASTLE_S
  h?: number; // whole buildings (fortress): real height in m
  stone?: keyof typeof STONE;
  roof?: keyof typeof ROOF;
  tones?: Record<string, string>;
}> = ({ kind, position, rotY, s, h, stone = "sand", roof = "blue", tones }) => {
  const spec: Spec = MEDIEVAL[kind];
  return (
    <PackPiece
      file={spec.file ?? KIT}
      node={spec.node}
      h={spec.file ? (h ?? spec.h) : undefined}
      s={s ?? CASTLE_S}
      position={position}
      rotY={rotY}
      threshold={spec.threshold}
      tones={{ ...MEDIEVAL_TONES, ...STONE[stone], ...ROOF[roof], ...tones }}
    />
  );
};

// Square tower: base + `floors` middles (the first with windows) + top; or a hexagonal tower (`hex`).
const U = 1.01; // square tower part height (units)
export const Tower: React.FC<{
  x: number;
  z: number;
  y?: number;
  floors?: number;
  top?: "high" | "roof" | "flat";
  hex?: boolean;
  rotY?: number;
  stone?: keyof typeof STONE;
  roof?: keyof typeof ROOF;
}> = ({ x, z, y = 0, floors = 2, top = "high", hex, rotY = 0, stone, roof }) => {
  const P = (kind: MedievalKind, units: number, key: string) => (
    <MedievalPiece key={key} kind={kind} position={[x, y + units * CASTLE_S, z]} rotY={rotY} stone={stone} roof={roof} />
  );
  if (hex) return <>{[P("hexBase", 0, "b"), P("hexMid", 1.31, "m"), P("hexRoof", 1.77, "r")]}</>;
  const parts = [P("towerBase", 0, "b")];
  for (let i = 0; i < floors; i++) parts.push(P(i === 0 ? "towerMidWindows" : "towerMid", U * (i + 1), `m${i}`));
  const topKind: MedievalKind = top === "high" ? "towerTopHigh" : top === "roof" ? "towerTopRoof" : "towerTopFlat";
  parts.push(P(topKind, U * (floors + 1), "t"));
  return <>{parts}</>;
};

// Wall ring: nx tiles along x (front with the gate at +z, back), nz tiles along z (sides), 4 corner towers.
export const CastleRing: React.FC<{
  nx?: number; // odd = the gate is centered
  nz?: number;
  center?: [number, number];
  gate?: boolean;
  floors?: number; // corner tower floors
  stone?: keyof typeof STONE;
  roof?: keyof typeof ROOF;
}> = ({ nx = 11, nz = 9, center = [0, 0], gate = true, floors = 2, stone, roof }) => {
  const [cx, cz] = center;
  const xe = ((nx + 1) / 2) * TILE;
  const ze = ((nz + 1) / 2) * TILE;
  const p: React.ReactNode[] = [];
  const W = (key: string, kind: MedievalKind, x: number, z: number, rotY = 0) =>
    p.push(<MedievalPiece key={key} kind={kind} position={[cx + x, 0, cz + z]} rotY={rotY} stone={stone} roof={roof} />);
  for (let i = 0; i < nx; i++) {
    const x = (i - (nx - 1) / 2) * TILE;
    if (gate && i === Math.floor(nx / 2)) W(`g${i}`, "wallGate", x, ze, Math.PI / 2);
    else W(`f${i}`, "wall", x, ze);
    W(`b${i}`, "wall", x, -ze);
  }
  for (let i = 0; i < nz; i++) {
    const z = (i - (nz - 1) / 2) * TILE;
    W(`l${i}`, "wall", -xe, z, Math.PI / 2);
    W(`r${i}`, "wall", xe, z, Math.PI / 2);
  }
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]])
    p.push(<Tower key={`t${sx}${sz}`} x={cx + sx * xe} z={cz + sz * ze} floors={floors} stone={stone} roof={roof} />);
  return <>{p}</>;
};
