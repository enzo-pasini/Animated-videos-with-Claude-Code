// Insert cards (D11): flat 2D diagrams that explain the mechanism (RULEBOOK §7 "Inserts").
// Same style as the world: flat palette colors, dark ink outlines, no text (captions carry the words).
// Every shape appears on its own frame (a word anchor in the plan): shapes pop in, arrows draw themselves.
// A 2D camera keeps the locked motion rules: slow push-in, drift, small roll, never still.
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { INK, PALETTE } from "../../style/palette";

export type Shape =
  | { type: "circle"; x: number; y: number; r: number; fill: string; at?: number }
  | { type: "rect"; x: number; y: number; w: number; h: number; fill: string; radius?: number; at?: number }
  | { type: "blob"; x: number; y: number; r: number; fill: string; wobble?: number; seed?: number; at?: number }
  | { type: "dots"; x: number; y: number; w: number; h: number; n: number; r: number; fill: string; seed?: number; drift?: [number, number]; at?: number }
  | { type: "arrow"; from: [number, number]; to: [number, number]; color?: string; width?: number; at?: number };

export type InsertProps = {
  background: "paper" | "night";
  shapes: Shape[];
};

export type Camera2D = { rate: number; drift: [number, number]; roll: [number, number]; lenS: number; zoom0?: number };

const OUT = 6; // ink outline in px (between world lines ~2 px and character outlines ~9 px)
const pop = (f: number, at = 0) =>
  interpolate(f, [at, at + 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
const draw = (f: number, at = 0) =>
  interpolate(f, [at, at + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

const rng = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

const blobPath = (x: number, y: number, r: number, wobble: number, seed: number) => {
  const rand = rng(seed + 11);
  const n = 9;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + (rand() - 0.5) * wobble);
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
  });
  // smooth closed curve through the points (Catmull-Rom → cubic Bézier)
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6}, ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6}, ${p2[0]} ${p2[1]}`;
  }
  return d + " Z";
};

const ShapeView: React.FC<{ s: Shape; f: number }> = ({ s, f }) => {
  const at = s.at ?? 0;
  if (s.type === "arrow") {
    const k = draw(f, at);
    if (k <= 0) return null;
    const [x0, y0] = s.from;
    const x1 = x0 + (s.to[0] - x0) * k;
    const y1 = y0 + (s.to[1] - y0) * k;
    const a = Math.atan2(y1 - y0, x1 - x0);
    const w = s.width ?? 16;
    const head = w * 2.4;
    const hx = x1 - Math.cos(a) * head * 0.8;
    const hy = y1 - Math.sin(a) * head * 0.8;
    const color = s.color ?? PALETTE.brick;
    const headPts = `${x1},${y1} ${hx + Math.cos(a + Math.PI / 2) * head * 0.6},${hy + Math.sin(a + Math.PI / 2) * head * 0.6} ${hx + Math.cos(a - Math.PI / 2) * head * 0.6},${hy + Math.sin(a - Math.PI / 2) * head * 0.6}`;
    return (
      <g>
        <line x1={x0} y1={y0} x2={hx} y2={hy} stroke={INK} strokeWidth={w + OUT * 2} strokeLinecap="round" />
        <polygon points={headPts} fill={INK} stroke={INK} strokeWidth={OUT * 2} strokeLinejoin="round" />
        <line x1={x0} y1={y0} x2={hx} y2={hy} stroke={color} strokeWidth={w} strokeLinecap="round" />
        <polygon points={headPts} fill={color} />
      </g>
    );
  }
  const k = pop(f, at);
  if (k <= 0) return null;
  const cx = "x" in s ? s.x + ("w" in s && s.type === "rect" ? s.w / 2 : 0) : 0;
  const cy = "y" in s ? s.y + ("h" in s && s.type === "rect" ? s.h / 2 : 0) : 0;
  const tf = `translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})`;
  if (s.type === "circle")
    return <circle cx={s.x} cy={s.y} r={s.r} fill={s.fill} stroke={INK} strokeWidth={OUT} transform={tf} />;
  if (s.type === "rect")
    return <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.radius ?? 24} fill={s.fill} stroke={INK} strokeWidth={OUT} transform={tf} />;
  if (s.type === "blob")
    return <path d={blobPath(s.x, s.y, s.r, s.wobble ?? 0.18, s.seed ?? 1)} fill={s.fill} stroke={INK} strokeWidth={OUT} transform={tf} />;
  // dots: a cloud of small particles that slowly drifts once it has appeared (gas, molecules, crowds)
  const rand = rng(s.seed ?? 3);
  const t = Math.max(0, f - at) / 30;
  const [dx, dy] = s.drift ?? [0, 0];
  return (
    <g opacity={Math.min(1, k)}>
      {Array.from({ length: s.n }, (_, i) => {
        const px = s.x + rand() * s.w + dx * t * (0.6 + rand() * 0.8);
        const py = s.y + rand() * s.h + dy * t * (0.6 + rand() * 0.8);
        return <circle key={i} cx={px} cy={py} r={s.r * k} fill={s.fill} stroke={INK} strokeWidth={OUT * 0.6} />;
      })}
    </g>
  );
};

const Paper: React.FC<{ kind: InsertProps["background"] }> = ({ kind }) => {
  const base = kind === "paper" ? "#e6dccb" : PALETTE.plum;
  const grid = kind === "paper" ? "rgba(110,125,184,0.28)" : "rgba(157,170,193,0.16)";
  return (
    <>
      <defs>
        <pattern id="grid" width={60} height={60} patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke={grid} strokeWidth={3} />
        </pattern>
        <radialGradient id="paperShade" cx="50%" cy="45%" r="75%">
          <stop offset="55%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor={kind === "paper" ? "rgba(90,60,69,0.35)" : "rgba(0,0,0,0.4)"} />
        </radialGradient>
      </defs>
      <rect x={-400} y={-400} width={1880} height={2720} fill={base} />
      <rect x={-400} y={-400} width={1880} height={2720} fill="url(#grid)" />
      <rect x={-400} y={-400} width={1880} height={2720} fill="url(#paperShade)" />
    </>
  );
};

export const InsertShot: React.FC<{ insert: InsertProps; camera: Camera2D; from: number }> = ({ insert, camera, from }) => {
  const local = useCurrentFrame();
  const g = from + local; // shape anchors are global frames
  const t = local / 30;
  const zoom = (camera.zoom0 ?? 1) * Math.pow(1 + camera.rate, t);
  const u = camera.lenS ? Math.min(1, t / camera.lenS) : 0;
  const roll = camera.roll[0] + (camera.roll[1] - camera.roll[0]) * u;
  const tx = camera.drift[0] * 1080 * t;
  const ty = camera.drift[1] * 1920 * t;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform={`translate(540 960) rotate(${roll}) scale(${zoom}) translate(${-540 + tx} ${-960 + ty})`}>
          <Paper kind={insert.background} />
          {insert.shapes.map((s, i) => (
            <ShapeView key={i} s={s} f={g} />
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
