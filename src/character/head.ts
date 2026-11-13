// Character identity (PLAN D19, references/looks/character-identity.md): the signature head shapes.
//   round   = the v3 ellipse, drawn exactly as before (ctx.ellipse); used when the look is off ("look": null)
//   gumdrop = MEN: round top (hats fit), flat wide jaw
//   chibi   = WOMEN: round top, short soft-U chin + the chibi face layout (big low eyes, small low mouth)
// Who gets which: src/cast/cast_meta.json ("gender", optional "head" override) → src/cast/registry.ts.
// Every shape keeps the top of the skull at -ry (hats and hair sit where they sit today).
type Ctx = CanvasRenderingContext2D;

export type HeadShape = "round" | "gumdrop" | "chibi";
export const HEAD_SHAPES: { id: HeadShape; name: string; note: string }[] = [
  { id: "round", name: "Round (v3)", note: "ellipse" },
  { id: "gumdrop", name: "Gumdrop (men)", note: "round top, flat wide jaw" },
  { id: "chibi", name: "Chibi (women)", note: "soft U chin, big low eyes" },
];
// default head per gender; a character can override it in cast_meta.json ("head")
export const HEAD_FOR_GENDER: Record<"male" | "female", HeadShape> = { male: "gumdrop", female: "chibi" };

let shape: HeadShape = "round";

// Face layout: where the eyes and mouth sit and how big they are. The default = the v3 numbers.
export type FaceLayout = { eyeY: number; eyeK: number; mouthY: number; mouthK: number; blushY: number };
export const DEFAULT_FACE: FaceLayout = { eyeY: 0.03, eyeK: 1, mouthY: 0.22, mouthK: 1, blushY: 0.17 };
const SHAPE_FACE: Partial<Record<HeadShape, FaceLayout>> = {
  chibi: { eyeY: 0.15, eyeK: 1.22, mouthY: 0.37, mouthK: 0.8, blushY: 0.27 },
};
export const faceLayout = (): FaceLayout => SHAPE_FACE[shape] ?? DEFAULT_FACE;
export const faceLayoutOn = () => !!SHAPE_FACE[shape];
export const headShape = () => shape;
export const setHeadShape = (s?: HeadShape | null) => {
  shape = s ?? "round";
};

// superellipse helper: n = 2 → circle, n > 2 → squarer
const se = (c: number, n: number) => Math.sign(c) * Math.abs(c) ** (2 / n);

// point of the outline at angle t (0 = right, + = down), for a head with half sizes rx, ry
const point = (s: HeadShape, t: number, rx: number, ry: number): [number, number] => {
  const c = Math.cos(t);
  const n = Math.sin(t); // -1 top .. 1 bottom
  if (n <= 0) return [rx * c, ry * n]; // top half = the v3 ellipse for every shape
  switch (s) {
    case "gumdrop": {
      const w = 1 + 0.07 * n; // the jaw gets a little wider than the skull
      return [rx * w * se(c, 5), ry * 0.9 * se(n, 5)];
    }
    case "chibi":
      return [rx * se(c, 2.3), ry * 1.08 * se(n, 2.3)];
    default:
      return [rx * c, ry * n];
  }
};

// the whole outline as points (clockwise on screen)
const outline = (rx: number, ry: number): [number, number][] =>
  Array.from({ length: 145 }, (_, i) => point(shape, (i / 144) * Math.PI * 2, rx, ry));

// the head outline as the current path. inset > 0 = smaller (for clips inside the outline). dy = move down.
export const headPath = (ctx: Ctx, rx: number, ry: number, inset = 0, dy = 0) => {
  ctx.beginPath();
  if (shape === "round") {
    ctx.ellipse(0, dy, rx - inset, ry - inset, 0, 0, Math.PI * 2);
    return;
  }
  const pts = outline(rx, ry);
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const k = inset ? 1 - inset / Math.max(0.05, Math.hypot(x, y)) : 1;
    if (i === 0) ctx.moveTo(x * k, y * k + dy);
    else ctx.lineTo(x * k, y * k + dy);
  }
  ctx.closePath();
};

// lowest point of the head (the anger liquid starts below it)
export const headBottom = (rx: number, ry: number) => Math.max(...outline(rx, ry).map((p) => p[1]));
