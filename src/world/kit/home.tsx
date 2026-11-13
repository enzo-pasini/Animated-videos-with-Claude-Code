// Theme kit "home interiors" (kitchen, bathroom): free CC0 pack pieces (Quaternius + Kenney, public/packs/home-interior/,
// LICENSE.txt + sources.txt there) drawn in our look by PackPiece (pack.tsx). Picture: references/sets/kit_home.jpg
// (`.venv/Scripts/python -I tools/kit_catalog.py --theme home`). Style test approved 2026-11-12 (look C).
//
// Use: <HomePiece kind="oven" position={[x, 0, z]} rotY={...} finish="sage" />
// - `h` = real height in m (default per piece, below); the piece keeps its proportions.
// - `position` y: 0 = on the floor. Wall pieces have a usual mount height `y` (bottom edge), counter pieces `on: "counter"`
//   (y = COUNTER_H): pass the y yourself, e.g. position={[x, HOME.upperCabinet.y, z]}.
// - Fronts look to +z (Kenney pieces are turned for you). Wall pieces (kitchen units, toilet, door...) are placed by
//   their back: `position` = the point on the wall (wall face at that z), the piece stands in front of it.
//   `free` pieces (counter items, table, stool, bathtub...) are placed by their center.
import { PackPiece } from "./pack";

export const COUNTER_H = 0.9; // Kenney cabinets at h 0.9 = counter top

type Spec = {
  file: string;
  h: number;
  room: "kitchen" | "bathroom" | "any";
  y?: number; // usual mount height (bottom edge) of a wall / ceiling piece
  on?: "counter";
  threshold?: number; // ink crease angle (40 for round pieces)
  free?: boolean; // placed by its center (not against a wall)
};
const q = (f: string) => `home-interior/q_${f}.glb`; // Quaternius
const k = (f: string) => `home-interior/k_${f}.glb`; // Kenney (front to -z: turned)

export const HOME = {
  // kitchen: big pieces (on the floor, back to the wall)
  fridge: { file: q("kitchen_fridge"), h: 1.8, room: "kitchen" },
  oven: { file: q("oven"), h: 0.9, room: "kitchen" },
  kitchenSink: { file: q("kitchen_sink"), h: 1.1, room: "kitchen" },
  cabinet: { file: k("kitchen_cabinet"), h: COUNTER_H, room: "kitchen" },
  cabinetDrawers: { file: k("kitchen_cabinet_drawer"), h: COUNTER_H, room: "kitchen" },
  cabinetCorner: { file: k("kitchen_cabinet_corner"), h: COUNTER_H, room: "kitchen" },
  upperCabinet: { file: k("kitchen_cabinet_upper"), h: 0.78, room: "kitchen", y: 1.45 },
  hood: { file: k("kitchen_hood_large"), h: 0.74, room: "kitchen", y: 1.5 },
  // kitchen: small pieces (on the counter)
  microwave: { file: k("kitchen_microwave"), h: 0.3, room: "kitchen", on: "counter", free: true },
  toaster: { file: k("toaster"), h: 0.2, room: "kitchen", on: "counter", free: true },
  blender: { file: k("kitchen_blender"), h: 0.38, room: "kitchen", on: "counter", threshold: 40, free: true },
  coffeeMachine: { file: k("kitchen_coffee_machine"), h: 0.33, room: "kitchen", on: "counter", free: true },
  plate: { file: q("square_plate"), h: 0.016, room: "kitchen", on: "counter", free: true },
  // kitchen / any room: furniture
  roundTable: { file: q("table_round_small"), h: 0.75, room: "any", threshold: 40, free: true },
  stool: { file: q("stool"), h: 0.65, room: "any", threshold: 40, free: true },
  dresser: { file: q("drawer"), h: 0.8, room: "any" },
  trashcan: { file: q("trashcan"), h: 0.6, room: "any", threshold: 40, free: true },
  // bathroom
  bathtub: { file: q("bathtub"), h: 0.6, room: "bathroom", threshold: 40, free: true },
  toilet: { file: q("toilet"), h: 0.85, room: "bathroom", threshold: 40 },
  bathroomSink: { file: q("bathroom_sink"), h: 0.9, room: "bathroom", threshold: 40 },
  washingMachine: { file: q("washing_machine"), h: 0.85, room: "bathroom", threshold: 40 },
  shower: { file: k("shower_round"), h: 2.1, room: "bathroom", threshold: 40 },
  mirror: { file: k("bathroom_mirror"), h: 0.8, room: "bathroom", y: 1.05 },
  bathroomCabinet: { file: k("bathroom_cabinet"), h: 0.7, room: "bathroom", y: 1.2 },
  towelRack: { file: q("towel_rack"), h: 0.35, room: "bathroom", y: 1.0 },
  toiletPaper: { file: q("toilet_paper_stack"), h: 0.25, room: "bathroom", threshold: 40, free: true },
  // any room
  door: { file: q("door"), h: 2.1, room: "any" },
  window: { file: q("window_large"), h: 1.0, room: "any", y: 0.95 },
  houseplant: { file: q("houseplant"), h: 0.5, room: "any", threshold: 40, free: true },
  ceilingLight: { file: q("ceiling_light"), h: 0.5, room: "any", y: 1.9, threshold: 40, free: true },
} satisfies Record<string, Spec>;
export type HomeKind = keyof typeof HOME;

// Pack material names → our colors (look C). Quaternius names start with a capital, Kenney names do not.
export const HOME_TONES: Record<string, string> = {
  // Quaternius
  White: "#e6ddcf",
  "White.002": "#e6ddcf",
  Grey: "#9a8f94",
  Black: "#3a2c34",
  LightMetal: "#a9b0c0",
  DarkMetal: "#5c5566",
  Metal: "#8a8090",
  Glass: "#a8c2d6",
  Light: "#fff1d6",
  Wood: "#a8714f",
  Wood_Light: "#c08a62",
  Wood_Dark: "#6b4433",
  Brown: "#7a4a3c",
  DarkGreen: "#5f8f4e",
  LightOrange: "#c9785a",
  Kitchen: "#7f9e8a",
  KitchenTop: "#d8cfc0",
  Cushin: "#9a5b6e",
  Red: "#8e3a3f",
  // Kenney
  wood: "#c08a62",
  woodDark: "#8e5547",
  metal: "#c9ccd0",
  metalMedium: "#6e7a86",
  metalDark: "#4a4655",
  glass: "#a8c2d6",
  carpetWhite: "#ece4d6",
  _defaultMat: "#d8d2c8",
};

// Finishes = color variations on top of HOME_TONES. Cabinets (Kenney wood): oak, white, sage, blue.
// Appliances + bathroom (Quaternius White): cream (default), mint, butter.
export const HOME_FINISHES = {
  oak: {},
  white: { wood: "#e6ddcf", woodDark: "#b9ab9b" },
  sage: { wood: "#8fa98a", woodDark: "#5f7a5c" },
  blue: { wood: "#7f9cc0", woodDark: "#53698f" },
  cream: {},
  mint: { White: "#a9d1c0" },
  butter: { White: "#f0d88a" },
} satisfies Record<string, Record<string, string>>;
export type HomeFinish = keyof typeof HOME_FINISHES;

export const HomePiece: React.FC<{
  kind: HomeKind;
  position?: [number, number, number];
  rotY?: number;
  h?: number;
  finish?: HomeFinish;
  tones?: Record<string, string>; // extra overrides (material name → color)
}> = ({ kind, position, rotY, h, finish, tones }) => {
  const s: Spec = HOME[kind];
  return (
    <PackPiece
      file={s.file}
      h={h ?? s.h}
      position={position}
      rotY={rotY}
      turn={s.file.includes("/k_")}
      threshold={s.threshold}
      tones={{ ...HOME_TONES, ...(finish ? HOME_FINISHES[finish] : {}), ...tones }}
      sink={position && position[1] > 0.05 ? 0 : 0.02}
      anchor={s.free ? "center" : "back"}
    />
  );
};
