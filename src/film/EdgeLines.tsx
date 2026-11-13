// v4 VFX item 5 — edge lines ("focus lines", the camera feeling). Recipe: references/effects/edge-lines.md.
// Thin tapered lines come in from all four frame edges and point at the subject (the camera aims at it, so the
// default center is the screen center), leaving a clear oval around the character. Mostly white, some dark grey.
// New random lines every 2 frames (half of them change on odd frames, half on even), so they flicker.
// Timing measured on the reference (VS1Z_Q-Klt8 0:04.73–0:05.23, clip frames f22–f36): ~3 frames to fill,
// held, then fewer and fainter lines over the last 5 frames. A shot switches them on with "lines" in the props.
import { AbsoluteFill } from "remotion";

export type EdgeLinesProps = {
  at: number; // global frame where the lines start (build_props resolves the word anchor)
  len?: number; // frames, default 15 (the reference: 0.5 s)
  center?: [number, number]; // screen point the lines aim at, fractions of width/height (default the camera aim)
  n?: number; // lines at the peak (default 22)
};

const W = 1080;
const H = 1920;
const FADE = 5; // frames of fading at the end
const RAMP = [0.2, 0.55]; // share of the lines on the first frames, then all
const CLEAR = { rx: 0.24 * W, ry: 0.13 * H }; // the oval around the subject that stays clear
const WHITE = "#ffffff";
const DARK = "#3a3442"; // the dark lines: a see-through dark grey (measured on the reference)

const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// distance from (cx, cy) along (dx, dy) to the frame border
const toEdge = (cx: number, cy: number, dx: number, dy: number) => {
  const tx = dx > 0 ? (W - cx) / dx : dx < 0 ? -cx / dx : Infinity;
  const ty = dy > 0 ? (H - cy) / dy : dy < 0 ? -cy / dy : Infinity;
  return Math.min(tx, ty);
};

export const edgeLinesAt = (p: EdgeLinesProps, g: number) => {
  const len = p.len ?? 15;
  const t = g - p.at;
  if (t < 0 || t >= len) return [];
  const left = len - t; // frames left, 1 on the last frame
  const share = Math.min(t < RAMP.length ? RAMP[t] : 1, left <= FADE ? left / (FADE + 1) : 1);
  const fade = left <= FADE ? 0.45 + 0.55 * (left / (FADE + 1)) : 1;
  const [fx, fy] = p.center ?? [0.5, 0.5];
  const cx = fx * W;
  const cy = fy * H;
  const n = p.n ?? 22;
  const lines: { points: string; fill: string; opacity: number }[] = [];
  for (let i = 0; i < n; i++) {
    const s = i * 131 + Math.floor((t + (i % 2)) / 2) * 977 + Math.round(p.at) * 7;
    if (rand(s) > share) continue;
    const a = ((i + 0.15 + 0.7 * rand(s + 1)) / n) * Math.PI * 2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const d = toEdge(cx, cy, dx, dy);
    const outer = d + 40; // start beyond the border, so the wide end is never visible
    const clear = 1 / Math.sqrt((dx / CLEAR.rx) ** 2 + (dy / CLEAR.ry) ** 2);
    const inner = Math.max(clear, d * (1 - (0.4 + 0.42 * rand(s + 2))));
    if (outer - inner < 60) continue;
    const w = (5 + 9 * rand(s + 3)) * (outer / d); // 5–14 px wide at the border (reference)
    const ox = cx + dx * outer;
    const oy = cy + dy * outer;
    const [px, py] = [-dy * w * 0.5, dx * w * 0.5];
    const dark = rand(s + 4) > 0.6; // ~40 % dark
    lines.push({
      points: `${ox + px},${oy + py} ${ox - px},${oy - py} ${cx + dx * inner},${cy + dy * inner}`,
      fill: dark ? DARK : WHITE,
      opacity: (dark ? 0.5 + 0.2 * rand(s + 5) : 0.82 + 0.18 * rand(s + 5)) * fade,
    });
  }
  return lines;
};

export const EdgeLines: React.FC<{ lines: EdgeLinesProps; g: number }> = ({ lines, g }) => {
  const list = edgeLinesAt(lines, g);
  if (!list.length) return null;
  return (
    <AbsoluteFill>
      <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {list.map((l, i) => (
          <polygon key={i} points={l.points} fill={l.fill} opacity={l.opacity} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
