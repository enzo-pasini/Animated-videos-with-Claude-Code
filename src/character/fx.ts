// v4 character effects (VFX), drawn on the character canvas in HEAD-LOCAL units (origin = head center,
// 1 unit = 1 head width, y down). Recipes: references/effects/<effect>.md. Every effect is off by default,
// so a pose without effect fields draws exactly the v3 character.
import type { Ctx } from "./draw";
import { look } from "./look";
import { headBottom, headPath, headShape } from "./head";

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

const mix = (a: string, b: string, k: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * k)).join(",")})`;
};

// ---------- anger: purple fill + smoke (references/effects/anger-smoke.md) ----------
export const ANGER = {
  purple: "#9a41c5", // measured median of the reference
  rim: "#6f2796", // darker purple along the outline
  surface: "#c88be6", // light band on the rising liquid
  bubble: "#dcb6f2",
  smoke: "#fbf8f6",
  smokeShade: "#d6d1df",
  smokePink: "#f2b3c7",
  fillFrames: 7, // 0 → full
  gritLead: 8, // gritted teeth this many frames before the fill starts
  smokeDelay: 2, // smoke starts this many frames after the head is full
  puffEvery: 4, // frames between puffs, per side
  puffLife: 10, // frames
  smokeOutline: 0.02, // ink outline around the puffs (head widths; feedback test 1)
};

// fill level (0..1 of the head height) at frame t of the fill. The reference was measured as AREA
// (5, 13, 26, 41, 62, 78, 93, 100 % on frames 0..7), so convert area → height of an ellipse cap.
const AREA = [0.05, 0.13, 0.26, 0.41, 0.62, 0.78, 0.93, 1.0];
const capArea = (h: number) => {
  const th = 2 * Math.acos(1 - 2 * h); // h = fraction of the height from the bottom
  return (th - Math.sin(th)) / (2 * Math.PI);
};
export const angerFillAt = (t: number) => {
  if (t < 0) return 0;
  if (t >= AREA.length - 1) return 1;
  const i = Math.floor(t);
  const a = AREA[i] + (AREA[i + 1] - AREA[i]) * (t - i);
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 24; k++) {
    const m = (lo + hi) / 2;
    if (capArea(m) < a) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

const headClip = (ctx: Ctx, rx: number, ry: number) => {
  headPath(ctx, rx, ry);
  ctx.clip();
};

// the wavy surface, left → right. `join` = continue the current path (lineTo) instead of starting a new one
const wavePath = (ctx: Ctx, rx: number, top: number, amp: number, phase: number, join = false) => {
  const x0 = -rx - 0.06;
  const y0 = top + amp * Math.sin(x0 * Math.PI * 4 + phase);
  if (join) ctx.lineTo(x0, y0);
  else ctx.moveTo(x0, y0);
  for (let x = x0; x <= rx + 0.06; x += 0.02) ctx.lineTo(x, top + amp * Math.sin(x * Math.PI * 4 + phase));
};

// purple liquid inside the head, from the chin up to `level`. Call after the head fill, before the face.
export const drawAngerFill = (ctx: Ctx, level: number, t: number, rx: number, ry: number, ink: string, outline: number) => {
  if (level <= 0) return;
  const rising = level < 0.999;
  const top = ry - level * (2 * ry + 0.06); // surface y; at level 1 it clears the top of the head with its waves
  const amp = rising ? 0.014 : 0;
  const phase = t * 0.9;
  const bottom = Math.max(ry, headBottom(rx, ry)) + 0.06;
  ctx.save();
  headClip(ctx, rx, ry);
  if (headShape() !== "round") rx *= 1.2; // gumdrop / chibi heads are wider at the jaw: the liquid spans the whole width
  // liquid body
  ctx.beginPath();
  ctx.moveTo(-rx - 0.06, bottom);
  wavePath(ctx, rx, top, amp, phase, true);
  ctx.lineTo(rx + 0.06, bottom);
  ctx.closePath();
  ctx.fillStyle = ANGER.purple;
  ctx.fill();
  // darker rim along the outline (only inside the liquid)
  ctx.save();
  ctx.clip();
  headPath(ctx, headShape() === "round" ? rx : rx / 1.2, ry, 0, 0.03);
  ctx.strokeStyle = ANGER.rim;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 0.1;
  ctx.stroke();
  ctx.restore();
  if (rising) {
    // light band on the surface + a few bubbles just below it
    ctx.beginPath();
    wavePath(ctx, rx, top + 0.012, amp, phase);
    ctx.strokeStyle = ANGER.surface;
    ctx.lineWidth = 0.024;
    ctx.stroke();
    ctx.strokeStyle = ANGER.bubble;
    ctx.lineWidth = 0.009;
    [
      [-0.2, 0.07, 0.018],
      [0.06, 0.12, 0.013],
      [0.24, 0.05, 0.015],
    ].forEach(([bx, dy, r]) => {
      const by = top + dy + 0.02 * Math.sin(t * 0.7 + bx * 9);
      if (by > ry - 0.06) return;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.stroke();
    });
  }
  ctx.restore();
  // the liquid covers the inner half of the outline → draw it again
  headPath(ctx, headShape() === "round" ? rx : rx / 1.2, ry);
  ctx.strokeStyle = ink;
  ctx.lineWidth = look().on ? look().thin : outline; // v4 look L1: thin line; the thick shadow-side ink is outside the head, not covered
  ctx.stroke();
};

// puffs of steam from both temples. `age` = frames since the smoke started (< 0 = none).
// a cloud = a big center lobe + a ring of smaller lobes → bumpy cartoon edge (feedback test 1).
// The ring is a bit flatter at the bottom, like the reference puffs.
const LOBES: [number, number, number][] = [
  [0, 0, 0.78],
  ...Array.from({ length: 7 }, (_, i): [number, number, number] => {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    return [Math.cos(a) * 0.68, Math.sin(a) * (Math.sin(a) > 0 ? 0.42 : 0.62), i % 2 ? 0.42 : 0.5];
  }),
];
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// one puff is drawn on its own layer (ink outline → shade → white), then copied with alpha, so a fading
// puff fades as one piece (the outline does not show through the white)
const LAYER_PX = 512;
let layer: OffscreenCanvas | null = null;
const puffLayer = () => (layer ??= new OffscreenCanvas(LAYER_PX, LAYER_PX));

const drawPuff = (ctx: Ctx, side: number, a: number, seed: number, rx: number, ink: string) => {
  const { puffLife } = ANGER;
  const ex = side * (rx - 0.04);
  const ey = -0.24; // temples: ~75 % up the head
  const k = clamp01(a / puffLife);
  const jx = (rand(seed) - 0.5) * 0.08;
  const jy = (rand(seed + 7) - 0.5) * 0.06;
  const x = ex + side * (0.14 * easeOut(a / 3) + 0.3 * k) + jx * k;
  const y = ey - 0.02 - 0.46 * k + jy * k;
  const r = 0.15 * easeOut((a + 1) / 3) * (1 + 0.3 * k);
  const pink = clamp01((a - 5) / 4);
  const alpha = 1 - clamp01((a - 6) / 4);
  const rot = rand(seed + 3) * Math.PI * 2;
  const m = ctx.getTransform();
  const scale = Math.hypot(m.a, m.b); // px per head width on the character canvas
  const L = puffLayer();
  const lc = L.getContext("2d")!;
  lc.setTransform(1, 0, 0, 1, 0, 0);
  lc.clearRect(0, 0, LAYER_PX, LAYER_PX);
  lc.setTransform(scale, 0, 0, scale, LAYER_PX / 2, LAYER_PX / 2);
  const lobes = (dy: number, grow: number, color: string) => {
    lc.fillStyle = color;
    for (const [lx, ly, lr] of LOBES) {
      const c = Math.cos(rot) * lx - Math.sin(rot) * ly * 0.4;
      lc.beginPath();
      lc.arc(c * r, ly * r + dy, lr * r + grow, 0, Math.PI * 2);
      lc.fill();
    }
  };
  const ow = ANGER.smokeOutline;
  lobes(0.16 * r, ow, ink); // outline around the shaded bottom
  lobes(-0.02 * r, ow, ink); // outline around the top
  lobes(0.16 * r, 0, mix(ANGER.smokeShade, ANGER.smokePink, pink * 0.8));
  lobes(-0.02 * r, 0, mix(ANGER.smoke, ANGER.smokePink, pink));
  ctx.save();
  ctx.globalAlpha = alpha;
  const half = LAYER_PX / 2 / scale;
  ctx.drawImage(L, x - half, y - half, 2 * half, 2 * half);
  ctx.restore();
};

export const drawAngerSmoke = (ctx: Ctx, age: number, rx: number, ink: string) => {
  if (age < 0) return;
  const { puffEvery, puffLife } = ANGER;
  for (const side of [-1, 1]) {
    const offset = side < 0 ? 0 : 2; // the two sides are not in sync
    const kMax = Math.floor((age - offset) / puffEvery);
    // oldest first, so new puffs sit on top
    for (let k = Math.max(0, kMax - Math.ceil(puffLife / puffEvery)); k <= kMax; k++) {
      const a = age - (offset + k * puffEvery);
      if (a < 0 || a >= puffLife) continue;
      drawPuff(ctx, side, a, k * 2 + (side > 0 ? 1 : 0), rx, ink);
    }
  }
};

// ---------- jump combo: landing dust (not in the references; approved by the user in test 1; references/effects/jump.md) ----------
// Body units (origin between the feet). Same cartoon cloud as the anger smoke (lobes, ink outline, shaded
// bottom), in a dusty cream: 2 puffs per foot slide out low along the ground, grow and fade.
export const DUST = { life: 10, light: "#f1e9dc", shade: "#cdbfa9", outline: 0.018 };
const DUST_PUFFS: [x: number, dx: number, r: number, delay: number][] = [
  [0.2, 0.5, 0.11, 0],
  [0.28, 0.28, 0.08, 1],
];
export const drawLandingDust = (ctx: Ctx, age: number, ink: string) => {
  const m = ctx.getTransform();
  const scale = Math.hypot(m.a, m.b);
  const L = puffLayer();
  const lc = L.getContext("2d")!;
  for (const side of [-1, 1]) {
    for (const [i, [x0, dx, r0, delay]] of DUST_PUFFS.entries()) {
      const a = age - delay;
      if (a < 0 || a >= DUST.life) continue;
      const k = a / DUST.life;
      const x = side * (x0 + dx * easeOut(a / 6));
      const y = -0.05 - 0.07 * easeOut(a / 8);
      const r = r0 * (0.55 + 0.6 * easeOut((a + 1) / 4)) * (1 + 0.2 * k);
      const alpha = 1 - clamp01((a - DUST.life + 5) / 5);
      const rot = rand(i * 5 + (side > 0 ? 2 : 0)) * Math.PI * 2;
      lc.setTransform(1, 0, 0, 1, 0, 0);
      lc.clearRect(0, 0, LAYER_PX, LAYER_PX);
      lc.setTransform(scale, 0, 0, scale, LAYER_PX / 2, LAYER_PX / 2);
      const lobes = (dy: number, grow: number, color: string) => {
        lc.fillStyle = color;
        for (const [lx, ly, lr] of LOBES) {
          const c = Math.cos(rot) * lx - Math.sin(rot) * ly * 0.4;
          lc.beginPath();
          lc.arc(c * r * 1.25, ly * r * 0.8 + dy, lr * r + grow, 0, Math.PI * 2); // flatter: dust hugs the ground
          lc.fill();
        }
      };
      lobes(0.16 * r, DUST.outline, ink);
      lobes(-0.02 * r, DUST.outline, ink);
      lobes(0.16 * r, 0, DUST.shade);
      lobes(-0.02 * r, 0, DUST.light);
      ctx.save();
      ctx.globalAlpha = alpha;
      const half = LAYER_PX / 2 / scale;
      ctx.drawImage(L, x - half, y - half, 2 * half, 2 * half);
      ctx.restore();
    }
  }
};

// clenched teeth: white bar with a grid (used by the anger effect)
export const drawGritMouth = (ctx: Ctx, mx: number, my: number, ink: string, lw: number) => {
  const w = 0.2;
  const h = 0.09;
  const x0 = mx - w / 2;
  const y0 = my - h / 2 + 0.005;
  ctx.beginPath();
  ctx.roundRect(x0, y0, w, h, 0.016);
  ctx.fillStyle = "#fbfaf7";
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  ctx.stroke();
  ctx.lineWidth = lw * 0.55;
  ctx.beginPath();
  ctx.moveTo(x0 + 0.01, y0 + h / 2);
  ctx.lineTo(x0 + w - 0.01, y0 + h / 2);
  for (let i = 1; i < 4; i++) {
    ctx.moveTo(x0 + (w * i) / 4, y0 + 0.008);
    ctx.lineTo(x0 + (w * i) / 4, y0 + h - 0.008);
  }
  ctx.stroke();
};

// ---------- angry face (feedback test 1: brows, narrowed eyes, shouting mouths) ----------

// thick, short V brows, drawn OVER glasses (Mira's glasses hid the normal brows). lx, ly = look offset.
export const drawAngerBrows = (ctx: Ctx, lx: number, ly: number, k: number, ink: string) => {
  ctx.fillStyle = ink;
  for (const s of [-1, 1]) {
    const x0 = s * 0.075 + lx; // inner end: low and thick
    const y0 = -0.07 - 0.01 * (1 - k) + ly;
    const x1 = s * 0.275 + lx; // outer end: high and thinner
    const y1 = -0.075 - 0.09 * k + ly;
    const len = Math.hypot(x1 - x0, y1 - y0);
    const nx = -(y1 - y0) / len;
    const ny = (x1 - x0) / len;
    const w0 = 0.034;
    const w1 = 0.02;
    ctx.beginPath();
    ctx.moveTo(x0 + nx * w0, y0 + ny * w0);
    ctx.lineTo(x1 + nx * w1, y1 + ny * w1);
    ctx.lineTo(x1 - nx * w1, y1 - ny * w1);
    ctx.lineTo(x0 - nx * w0, y0 - ny * w0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x0, y0, w0, 0, Math.PI * 2);
    ctx.arc(x1, y1, w1, 0, Math.PI * 2);
    ctx.fill();
  }
};

// angry lid: a slanted line across the top of the eye, low at the inner side (toward the nose)
const lidPoints = (x: number, y: number, s: number, k: number): [number, number, number, number] => {
  const xi = x - s * 0.065; // inner (s = -1 is the screen-left eye, its inner side is +x)
  const xo = x + s * 0.065;
  return [xi, y - 0.05 + 0.05 * k, xo, y - 0.05 + 0.02 * k];
};
export const squintClip = (ctx: Ctx, x: number, y: number, s: number, k: number) => {
  const [xi, yi, xo, yo] = lidPoints(x, y, s, k);
  ctx.beginPath();
  ctx.moveTo(xi, yi);
  ctx.lineTo(xo, yo);
  ctx.lineTo(xo, y + 0.3);
  ctx.lineTo(xi, y + 0.3);
  ctx.closePath();
  ctx.clip();
};
export const drawSquintLid = (ctx: Ctx, x: number, y: number, s: number, k: number, ink: string, lw: number) => {
  const [xi, yi, xo, yo] = lidPoints(x, y, s, k);
  ctx.beginPath();
  ctx.moveTo(xi + s * 0.012, yi);
  ctx.lineTo(xo - s * 0.008, yo);
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  ctx.stroke();
};

// shouting mouths: "yell" = wide D shape, "yell_o" = tall oval; dark inside with a tongue
export const drawYellMouth = (ctx: Ctx, mx: number, my: number, kind: "yell" | "yell_o", ink: string, lw: number) => {
  const shape = () => {
    ctx.beginPath();
    if (kind === "yell") {
      // angry shout: top edge arched up in the middle, corners pulled down (not a laugh)
      ctx.moveTo(mx - 0.12, my + 0.03);
      ctx.quadraticCurveTo(mx, my - 0.065, mx + 0.12, my + 0.03);
      ctx.quadraticCurveTo(mx + 0.12, my + 0.1, mx, my + 0.1);
      ctx.quadraticCurveTo(mx - 0.12, my + 0.1, mx - 0.12, my + 0.03);
      ctx.closePath();
    } else {
      ctx.ellipse(mx, my + 0.02, 0.05, 0.07, 0, 0, Math.PI * 2);
    }
  };
  shape();
  ctx.fillStyle = "#3a1a24";
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(mx + 0.01, my + (kind === "yell" ? 0.095 : 0.085), kind === "yell" ? 0.07 : 0.035, 0.03, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#b5506a";
  ctx.fill();
  ctx.restore();
  shape();
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  ctx.stroke();
};

// ---------- sweat drop (references/effects/heat-sweat.md) — shared by heat, shock, waking, impact ----------
export const SWEAT = {
  blue: "#aadfe7", // measured median of the reference drop
  shade: "#7cc0d6", // darker blue at the bottom of the drop
  x: 0.345, // temple, beside the outer end of the brow (head-local, ×side)
  y: -0.09,
  r: 0.048, // radius of the round bottom; the tip is 1.9 r above its center
  tilt: 0.32, // the tip leans toward the head edge
  pop: 4, // frames to pop in (small overshoot)
  slide: 0.05, // slides down this far (head widths) …
  slideFrames: 60, // … over this many frames
  outline: 0.022,
};
const easeOutBack = (x: number) => {
  const k = clamp01(x) - 1;
  return 1 + 2.70158 * k * k * k + 1.70158 * k * k;
};
const smooth01 = (x: number) => {
  const k = clamp01(x);
  return k * k * (3 - 2 * k);
};

// one drop at the temple on `side` (−1 screen-left, 1 screen-right). `age` = frames since it appeared.
export const drawSweatDrop = (ctx: Ctx, age: number, side: number, ink: string) => {
  if (age < 0) return;
  const { r } = SWEAT;
  const s = easeOutBack((age + 1) / SWEAT.pop);
  ctx.save();
  ctx.translate(side * SWEAT.x, SWEAT.y + SWEAT.slide * smooth01((age - SWEAT.pop) / SWEAT.slideFrames));
  ctx.rotate(side * SWEAT.tilt);
  ctx.scale(s, s);
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(0, -1.9 * r);
    ctx.bezierCurveTo(0.45 * r, -1.1 * r, r, -0.45 * r, r, 0);
    ctx.arc(0, 0, r, 0, Math.PI);
    ctx.bezierCurveTo(-r, -0.45 * r, -0.45 * r, -1.1 * r, 0, -1.9 * r);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = SWEAT.blue;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.arc(0.25 * r, 0.55 * r, r, 0, Math.PI * 2);
  ctx.fillStyle = SWEAT.shade;
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.restore();
  // highlight on the upper inner side
  ctx.beginPath();
  ctx.arc(0, 0, 0.58 * r, Math.PI * 1.08, Math.PI * 1.42);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.26 * r;
  ctx.stroke();
  shape();
  ctx.strokeStyle = ink;
  ctx.lineWidth = SWEAT.outline / s;
  ctx.stroke();
  ctx.restore();
};

// ---------- tired face (heat): heavy flat lids, wavy mouth, panting mouth ----------
// eye half height h: dot eyes 0.05, ring eyes 0.068. k = 0.5 → the lid cuts about the top half.
const tiredLidY = (y: number, h: number, k: number) => y - h - 0.004 + k * h * 1.9;
export const tiredClip = (ctx: Ctx, x: number, y: number, h: number, k: number) => {
  const ly = tiredLidY(y, h, k);
  ctx.beginPath();
  ctx.rect(x - 0.1, ly, 0.2, 0.4);
  ctx.clip();
};
export const drawTiredLid = (ctx: Ctx, x: number, y: number, s: number, h: number, k: number, ink: string, lw: number) => {
  const ly = tiredLidY(y, h, k);
  ctx.beginPath();
  ctx.moveTo(x - s * 0.066, ly - 0.002); // inner end
  ctx.lineTo(x + s * 0.07, ly + 0.008); // outer end droops a little
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  ctx.stroke();
};

// wobbly line (discomfort)
export const drawWavyMouth = (ctx: Ctx, mx: number, my: number, ink: string, lw: number) => {
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const u = i / 24;
    const x = mx - 0.075 + 0.15 * u;
    const y = my + 0.014 * Math.sin(u * Math.PI * 3);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  ctx.stroke();
};

// small open mouth with the tongue (panting in the heat)
export const drawPantMouth = (ctx: Ctx, mx: number, my: number, ink: string, lw: number) => {
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(mx - 0.055, my - 0.008);
    ctx.quadraticCurveTo(mx, my - 0.03, mx + 0.055, my - 0.008);
    ctx.quadraticCurveTo(mx + 0.05, my + 0.066, mx, my + 0.066);
    ctx.quadraticCurveTo(mx - 0.05, my + 0.066, mx - 0.055, my - 0.008);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = "#3a1a24";
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(mx + 0.005, my + 0.058, 0.036, 0.024, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#c25a72";
  ctx.fill();
  ctx.restore();
  shape();
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  ctx.stroke();
};

// ---------- cloth in the hand (heat: fan and wipe) ----------
export const CLOTH = { color: "#c8463d", light: "#e0705f", dots: "#f6e3d3", lw: 0.022 };

// a red handkerchief gripped in the middle: a small knot above the fist and two wide tails hanging
// below (test 1 feedback: a round dotted bunch looked like a strawberry). Body units; (hx, hy) = hand.
// `t` = frames (the tails flap), `swing` = extra sideways swing of the tails (follows the arm motion).
// `rot` turns the whole cloth around the hand (fanning: the tails point at the face).
export const drawCloth = (ctx: Ctx, hx: number, hy: number, t: number, swing: number, ink: string, rot = 0) => {
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(rot);
  ctx.translate(-hx, -hy);
  // [top offset x, tip offset x, length, half width at the top, flap phase]
  const tails: [number, number, number, number, number][] = [
    [-0.02, -0.06, 0.25, 0.062, 0],
    [0.025, 0.06, 0.2, 0.055, 1.9],
  ];
  for (const [x0, dx, len, hw, ph] of tails) {
    const sw = swing + 0.04 * Math.sin(t * 0.8 + ph);
    const tx = hx + x0 + dx + sw;
    const ty = hy + len;
    const mx = hx + x0 + (dx + sw) * 0.5;
    const my = hy + len * 0.55;
    const edge = () => {
      ctx.beginPath();
      ctx.moveTo(hx + x0 - hw * 0.6, hy - 0.01);
      ctx.quadraticCurveTo(mx - hw * 1.05, my, tx - 0.012, ty);
      ctx.lineTo(tx + 0.012, ty + 0.004);
      ctx.quadraticCurveTo(mx + hw * 1.05, my - 0.01, hx + x0 + hw * 0.6, hy - 0.01);
      ctx.closePath();
    };
    edge();
    ctx.fillStyle = CLOTH.color;
    ctx.fill();
    // a lighter fold along one side + two small dots (bandana)
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(hx + x0, hy);
    ctx.quadraticCurveTo(mx + hw * 0.5, my, tx + 0.02, ty);
    ctx.strokeStyle = CLOTH.light;
    ctx.lineWidth = hw * 0.7;
    ctx.stroke();
    ctx.fillStyle = CLOTH.dots;
    for (const k of [0.45, 0.75]) {
      ctx.beginPath();
      ctx.arc(hx + x0 + (dx + sw) * k - 0.012, hy + len * k, 0.009, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    edge();
    ctx.strokeStyle = ink;
    ctx.lineWidth = CLOTH.lw;
    ctx.stroke();
  }
  // the knot above the fist: a flat bow-like pinch, outline under, fill over
  const blobs: [number, number, number, number][] = [
    [hx - 0.04, hy - 0.045, 0.05, 0.034],
    [hx + 0.04, hy - 0.05, 0.046, 0.032],
  ];
  for (const [color, grow] of [[ink, CLOTH.lw], [CLOTH.color, 0]] as const) {
    ctx.fillStyle = color;
    for (const [x, y, rx, ry] of blobs) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx + grow, ry + grow, x < hx ? -0.5 : 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  // the fist on top
  ctx.beginPath();
  ctx.arc(hx, hy, 0.058, 0, Math.PI * 2);
  ctx.fillStyle = ink;
  ctx.fill();
};

// fanning air: 2 short outlined strokes on both sides of the cloth, pointing at the face (cloth frame: +y = along
// the tails; strokes past the tip landed on the face and looked like scribbles). New positions every 4 frames,
// so they flash with the flicks. `alpha` 0..1.
export const drawFanAir = (ctx: Ctx, hx: number, hy: number, rot: number, t: number, alpha: number, ink: string) => {
  if (alpha <= 0) return;
  const seed = Math.floor(t / 4);
  const r = (n: number) => {
    const x = Math.sin((seed * 7 + n) * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(hx, hy);
  ctx.rotate(rot);
  const strokes = [-0.125, 0.125].map((x, i): [number, number, number] => [x + (r(i) - 0.5) * 0.025, 0.08 + r(i + 3) * 0.04, 0.08 + r(i + 6) * 0.03]);
  for (const [color, w] of [[ink, 0.034], ["#ffffff", 0.015]] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    for (const [x, y, len] of strokes) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 0.008 * Math.sign(x), y + len / 2, x, y + len);
      ctx.stroke();
    }
  }
  ctx.restore();
};

// ---------- 3D face: the face turns on the round head (references/effects/face-stretch.md) ----------
// The features sit on a sphere (radius 0.5 head widths) and turn with yaw (+ = to screen right) and
// pitch (+ = looking down). With yaw = pitch = 0 every point and size is exactly the v3 one.
export const FACE = {
  R: 0.5,
  yawMax: 0.6, // further, the far eye disappears and the face reads as a back view
  pitchUp: -0.2, // further up, the eyes slide under the hair and the hats
  pitchDown: 0.35, // further down, the mouth reaches the chin outline
  hide: 0.12, // a feature is hidden when it turned this far around the back
  glassesArm: 0.4, // temple arms end here (not at the head edge, so they don't cross the whole cheek)
  center: 0.08, // face center (head-local y) for hooks that are turned as one piece
};
const clampN = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export type FaceTurn = { yaw: number; pitch: number };
export const faceTurnOf = (p: { faceYaw?: number; facePitch?: number }): FaceTurn | null =>
  p.faceYaw || p.facePitch
    ? { yaw: clampN(p.faceYaw ?? 0, -FACE.yawMax, FACE.yawMax), pitch: clampN(p.facePitch ?? 0, FACE.pitchUp, FACE.pitchDown) }
    : null;

// a front-view face point → turned point + local squeeze (sx across, sy down) + visibility
export const faceProj = (x: number, y: number, t: FaceTurn) => {
  const R = FACE.R;
  const th = Math.asin(clampN(x / R, -0.99, 0.99));
  const ph = Math.asin(clampN(y / R, -0.99, 0.99));
  const t2 = clampN(th + t.yaw, -Math.PI / 2, Math.PI / 2);
  const p2 = clampN(ph + t.pitch, -Math.PI / 2, Math.PI / 2);
  return {
    x: (R * Math.sin(t2) * Math.cos(p2)) / Math.cos(ph),
    y: R * Math.sin(p2),
    sx: Math.cos(t2) / Math.cos(th),
    sy: Math.cos(p2) / Math.cos(ph),
    vis: Math.cos(t2) * Math.cos(p2),
  };
};

// draw something centered on the face point (x, y): `draw` uses coordinates relative to that point
export const atFace = (ctx: Ctx, t: FaceTurn, x: number, y: number, draw: () => void) => {
  const p = faceProj(x, y, t);
  if (p.vis < FACE.hide) return;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.sx, p.sy);
  draw();
  ctx.restore();
};

// a whole face hook that doesn't know the turn (e.g. Pell's loupe): moved to the turned face center and squeezed
export const turnWhole = (ctx: Ctx, t: FaceTurn, draw: () => void) => {
  const p = faceProj(0, FACE.center, t);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.sx, p.sy);
  ctx.translate(0, -FACE.center);
  draw();
  ctx.restore();
};

export const faceClip = (ctx: Ctx, rx: number, ry: number, outline: number) => {
  headPath(ctx, rx, ry, outline / 2);
  ctx.clip();
};

export type EyeShape = "ring" | "bigDot" | "line" | "happy" | "down";
// one eye at the origin. lx, ly = look offset (pupils move inside ring eyes)
export const drawEyeShape = (ctx: Ctx, kind: EyeShape, lx: number, ly: number, ink: string, lw: number) => {
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  if (kind === "ring") {
    ctx.beginPath();
    ctx.arc(0, 0, 0.07, 0, Math.PI * 2);
    ctx.fillStyle = "#fbf8f2";
    ctx.fill();
    ctx.lineWidth = 0.022;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(lx * 0.45, ly * 0.45, 0.014, 0, Math.PI * 2);
    ctx.fillStyle = ink;
    ctx.fill();
  } else if (kind === "bigDot") {
    ctx.beginPath();
    ctx.ellipse(lx, ly, 0.05, 0.062, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx - 0.017, ly - 0.022, 0.014, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
  } else if (kind === "down") {
    ctx.beginPath();
    ctx.ellipse(lx, 0.012 + ly * 0.5, 0.04, 0.034, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "line") {
    ctx.beginPath();
    ctx.moveTo(-0.055, 0.005);
    ctx.lineTo(0.055, 0.005);
    ctx.lineWidth = lw;
    ctx.stroke();
  } else {
    // happy ^
    ctx.beginPath();
    ctx.moveTo(-0.06, 0.025);
    ctx.quadraticCurveTo(0, -0.06, 0.06, 0.025);
    ctx.lineWidth = lw;
    ctx.stroke();
  }
};

// small lopsided smile, one corner up (the squint before the laugh)
export const drawSmirkMouth = (ctx: Ctx, mx: number, my: number, ink: string, lw: number) => {
  ctx.beginPath();
  ctx.moveTo(mx - 0.05, my - 0.015);
  ctx.quadraticCurveTo(mx + 0.005, my + 0.035, mx + 0.055, my - 0.04);
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  ctx.stroke();
};

// open happy mouths: dark red inside, pink tongue, thin ink line (no dark mouth full of teeth: the user found it scary)
export const drawLaughMouth = (ctx: Ctx, mx: number, my: number, kind: "laugh" | "openSmile", ink: string, lw: number) => {
  const w = kind === "laugh" ? 0.12 : 0.1;
  const d = kind === "laugh" ? 0.13 : 0.085;
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(mx - w, my - 0.015);
    ctx.quadraticCurveTo(mx, my, mx + w, my - 0.015);
    ctx.quadraticCurveTo(mx + w * 0.75, my + d, mx, my + d);
    ctx.quadraticCurveTo(mx - w * 0.75, my + d, mx - w, my - 0.015);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = "#8a3446";
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(mx, my + d, w * 0.6, 0.045, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#e58aa0";
  ctx.fill();
  ctx.restore();
  shape();
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  ctx.stroke();
};
