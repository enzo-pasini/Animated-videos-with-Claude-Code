// v4 LOOK track, L1 "head shading + outline" (recipe references/looks/head-shading.md). LOCKED 2026-11-10 and
// ALWAYS ON: every character, every composition. A render can switch it off with `"look": null` in its props
// (Episode, StyleTest → setLook), e.g. to check that the v3 drawing path still matches the v3 frames.
// Light comes from a FIXED side, like the reference: top-left light, shadow at the bottom-right (user, 2026-11-10).
// Numbers measured on eSRnuL-fVSE (references/effects/frames/L1-head-shading f135, f1110, f1415):
//   outline lit side 1.4–2.1 % of the head width, shadow side 3.3–5 % (≈2.4×); rim 1–2 % near-white, bright even
//   in a dark scene; face centre luma 235 → edges 226, bottom-right 222 (≈ −6 %); a soft light streak on hair/hats.
import { headPath } from "./head";
type Ctx = CanvasRenderingContext2D;

export type Look = {
  on: boolean;
  thin: number; // outline width on the lit side (head widths); v3 = 0.034 everywhere
  inkD: number; // the ink copy behind a shape is moved this far toward the shadow side → thick bottom-right outline
  inkAng: number; // direction of the shadow side (radians, screen: 0 = right, + = down)
  rim: number; // 0..1 opacity of the light "sticker" rim
  rimW: number; // rim width on an edge that faces the light straight on (head widths); 0 on the shadow side
  rimColor: string;
  shade: number; // 0..1 strength of the soft head shading (1 = the measured −6 %)
  gloss: number; // 0..1 opacity of the light streak on hair and hats
  // L2 3D clothing (references/looks/cloth-3d.md). LOCKED 2026-11-10, always on; 0 = off (tests only)
  body: number; // 0..1 torso shading: cylinder core shadow on the right, light edge band + white streak on the left
  turn: number; // 0..1 the torso details turn with the 3D face (body yaw = turn × TURN_K × face yaw)
};

export const LOOK_L1: Look = {
  on: true,
  thin: 0.016,
  inkD: 0.04,
  inkAng: (50 * Math.PI) / 180,
  rim: 0.5, // the user chose the half rim for every scene (2026-11-10)
  rimW: 0.014,
  rimColor: "#f7f2e8",
  shade: 1,
  gloss: 0.4,
  body: 1, // L2 locked 2026-11-10
  turn: 1,
};

let cur: Look = { ...LOOK_L1 };
export const look = () => cur;
// missing (undefined) = the locked L1; null = off (the v3 look); an object = L1 with those values changed
export const setLook = (l?: Partial<Look> | null) => {
  cur = l === undefined ? { ...LOOK_L1 } : l === null ? { ...LOOK_L1, on: false } : { ...LOOK_L1, ...l };
};

const pxPerUnit = (ctx: Ctx) => {
  const m = ctx.getTransform();
  return Math.hypot(m.a, m.b);
};

// Outline-weight shapes (head, hair, hats, torso): fill with an ink copy shifted to the shadow side behind it
// (canvas shadows are in screen pixels, so the shadow side stays bottom-right under the head tilt), then a thin
// stroke. Ink width: lit side = thin, shadow side = thin/2 + inkD. Uses the current path.
export const inkFill = (ctx: Ctx, fill: string, ink: string, lw: number) => {
  const k = lw / 0.034;
  const d = cur.inkD * k * pxPerUnit(ctx);
  ctx.save();
  ctx.shadowColor = ink;
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = Math.cos(cur.inkAng) * d;
  ctx.shadowOffsetY = Math.sin(cur.inkAng) * d;
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = ink;
  ctx.lineWidth = cur.thin * k;
  ctx.stroke();
};

// Soft shading inside the head (multiply): lightest a little up-left of the centre, ≈ −4 % at the top-left edge,
// ≈ −6.5 % at the bottom-right edge. Eyes and mouth are drawn after it, so they stay flat ink.
export const shadeHead = (ctx: Ctx, rx: number, ry: number) => {
  if (cur.shade <= 0) return;
  ctx.save();
  headPath(ctx, rx, ry);
  ctx.clip();
  const cx = -0.07;
  const cy = -0.09;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 0.64);
  const c = (k: number) => {
    const v = 1 - (1 - k) * cur.shade;
    return `rgb(${Math.round(255 * v)},${Math.round(253 * v)},${Math.round(255 * Math.min(1, v + 0.012))})`;
  };
  g.addColorStop(0, c(1));
  g.addColorStop(0.4, c(0.99));
  g.addColorStop(0.6, c(0.962));
  g.addColorStop(0.95, c(0.935));
  g.addColorStop(1, c(0.93));
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = g;
  ctx.fillRect(-rx * 1.3, -ry * 1.3, rx * 2.6, ry * 2.6);
  ctx.restore();
};

// offscreen buffers, one set per canvas size
const bufs = new Map<string, HTMLCanvasElement[]>();
const buffers = (w: number, h: number) => {
  const key = `${w}x${h}`;
  if (!bufs.has(key))
    bufs.set(
      key,
      [0, 1].map(() => {
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        return c;
      }),
    );
  return bufs.get(key)!;
};
const reset = (c: HTMLCanvasElement) => {
  const x = c.getContext("2d")!;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = "source-over";
  x.globalAlpha = 1;
  x.filter = "none";
  x.clearRect(0, 0, c.width, c.height);
  return x;
};

// Hair and hats (the overHead hook): drawn in a layer, then a soft light streak inside their top edge (the side
// that faces the light), faded out at the sides so it reads as one short stroke, like the reference (f1110, f420).
export const drawWithGloss = (ctx: Ctx, draw: (c: Ctx) => void) => {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const [layer, band] = buffers(W, H);
  const lc = reset(layer);
  lc.setTransform(ctx.getTransform());
  lc.lineJoin = ctx.lineJoin;
  lc.lineCap = ctx.lineCap;
  draw(lc);
  const s = pxPerUnit(ctx);
  if (cur.gloss > 0) {
    const [ux, uy] = [-0.34, -0.94]; // toward the light (mostly from above)
    const s1 = 0.045 * s;
    const s2 = 0.075 * s;
    const bc = reset(band);
    bc.drawImage(layer, -ux * s1, -uy * s1); // pixel p shows the layer at p + u·s1
    bc.globalCompositeOperation = "destination-in";
    bc.drawImage(layer, 0, 0);
    bc.globalCompositeOperation = "destination-out";
    bc.drawImage(layer, -ux * s2, -uy * s2); // keep only a band s1..s2 deep from the lit edge
    // fade the ends: strongest left of the centre (head-local x), like a short stroke
    bc.globalCompositeOperation = "destination-in";
    bc.setTransform(ctx.getTransform());
    const g = bc.createLinearGradient(-0.46, 0, 0.3, 0);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.25, "rgba(0,0,0,1)");
    g.addColorStop(0.6, "rgba(0,0,0,1)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    bc.fillStyle = g;
    bc.fillRect(-1, -2, 2, 4);
    bc.setTransform(1, 0, 0, 1, 0, 0);
    bc.globalCompositeOperation = "source-in";
    bc.fillStyle = "#ffffff";
    bc.fillRect(0, 0, W, H);
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(layer, 0, 0);
  if (cur.gloss > 0) {
    ctx.globalAlpha = cur.gloss;
    ctx.filter = `blur(${(0.006 * s).toFixed(1)}px)`;
    ctx.drawImage(band, 0, 0);
  }
  ctx.restore();
};

// The light "sticker" rim outside the whole character, on the edges that FACE THE LIGHT: the silhouette is slid
// toward the light (top-left) by up to rimW, and the part that sticks out is filled with rimColor, behind the
// character. Width on an edge = rimW × how much it faces the light (top-left edge: rimW, top ≈ 0.8, left ≈ 0.6,
// bottom-right: 0). Like the reference (f1415): the bodies have more rim on the lit side, and thin legs get ONE
// light line on their lit side, not a white double line. The slide starts at 1 px, so no cream shows through the
// soft edge pixels on the shadow side.
// Drawn in the card texture, so the scene light tints it like everything else (as in the reference, f1415).
export const rimPass = (ctx: Ctx, pxPerHead: number) => {
  if (cur.rim <= 0) return;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const [src, rim] = buffers(W, H);
  reset(src).drawImage(ctx.canvas, 0, 0);
  const rc = reset(rim);
  const r = cur.rimW * pxPerHead;
  const lx = -Math.cos(cur.inkAng);
  const ly = -Math.sin(cur.inkAng);
  const n = Math.max(2, Math.ceil((r - 1) / 0.7));
  for (let i = 0; i <= n; i++) {
    const t = 1 + ((r - 1) * i) / n;
    rc.drawImage(src, lx * t, ly * t);
  }
  rc.globalCompositeOperation = "source-in";
  rc.fillStyle = cur.rimColor;
  rc.fillRect(0, 0, W, H);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = cur.rim;
  ctx.drawImage(rim, 0, 0);
  ctx.globalAlpha = 1;
  ctx.drawImage(src, 0, 0);
  ctx.restore();
};

// ---------------------------------------------------------------------------------------------------------------
// L2 3D clothing, LOCKED 2026-11-10 (always on; recipe references/looks/cloth-3d.md). Measured on the user's references (pixel rows across the torso):
//   HxqtHI62otM f020 (policeman, dark jail) and Mz72MuPgnGY f144 (captain, day), the same 4 zones, left → right:
//   ink | light edge band ≈3 % of the width, +90 % (64 → 120) | white streak ≈3 %, near white (240) |
//   fade to the base over ≈9 % | flat base | core shadow from 55 % to 80 % of the width, −39 % (64 → 39) to the edge.
// The light stays fixed (top-left, like L1): when the body turns, the outline, shading and streak stay; only the
// details slide (turnTorso).
const L2 = {
  dark: 0.43, // core shadow depth (0.43 in the texture → −38 % on screen after the scene light, measured)
  band: 1, // the edge band lightens the torso with ITS OWN colour (self-screen): navy stays navy, dark straps stay
  // dark (a white screen turned dark green into a grey haze). Measured: dark green 85 → 150 at the edge (ref 64 → 120)
  bandW: 0.07, // the band is a stroke this deep from the edge (head widths), then blurred by bandBlur
  bandBlur: 0.015,
  streak: 0.95,
  streakIn: 0.035, // streak centre, inside the edge (head widths): 3 % band + half the 3 % streak of a 0.7 torso
  streakW: 0.017,
};

// lit-side mask: the left edge and the left of the shoulders; ty = [fraction, alpha] stops from top to bottom
const litMask = (c: Ctx, half: number, top: number, bottom: number, ty: [number, number][]) => {
  c.globalCompositeOperation = "destination-in";
  const gx = c.createLinearGradient(-half, 0, half, 0);
  gx.addColorStop(0, "rgba(0,0,0,1)");
  gx.addColorStop(0.27, "rgba(0,0,0,1)");
  gx.addColorStop(0.42, "rgba(0,0,0,0)");
  gx.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = gx;
  c.fillRect(-half - 0.2, top - 0.2, 2 * half + 0.4, bottom - top + 0.4);
  const gy = c.createLinearGradient(0, top, 0, bottom);
  for (const [f, a] of ty) gy.addColorStop(f, `rgba(0,0,0,${a})`);
  c.fillStyle = gy;
  c.fillRect(-half - 0.2, top - 0.2, 2 * half + 0.4, bottom - top + 0.4);
};

// Torso shading, drawn over the shirt and its details, before the outline. path(c, inset) = the torso path.
export const shadeTorso = (ctx: Ctx, path: (c: Ctx, inset: number) => void, half: number, top: number, bottom: number) => {
  const k = cur.body;
  if (k <= 0) return;
  const s = pxPerUnit(ctx);
  const m0 = ctx.getTransform();
  ctx.save();
  path(ctx, 0);
  ctx.clip();
  // 1. core shadow (multiply): a cylinder lit from the left, the dark side a little cool like the L1 head shading
  const g = ctx.createLinearGradient(-half, 0, half, 0);
  const c = (m: number) => {
    const v = 1 - (1 - m) * k;
    return `rgb(${Math.round(255 * v)},${Math.round(255 * v)},${Math.round(255 * Math.min(1, v + 0.03 * k))})`;
  };
  for (const [u, m] of [[0, 1], [0.55, 1], [0.62, 0.95], [0.7, 0.82], [0.78, 1 - L2.dark * 0.97], [1, 1 - L2.dark]] as const)
    g.addColorStop(u, c(m));
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = g;
  ctx.fillRect(-half - 0.2, top - 0.2, 2 * half + 0.4, bottom - top + 0.4);
  ctx.globalCompositeOperation = "source-over";
  // 2. light edge band (screen) and 3. the white streak, both along the curve of the lit edge
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const [layer, band] = buffers(W, H);
  const layerOf = (inset: number, width: number, ty: [number, number][]) => {
    const lc = reset(layer);
    lc.setTransform(m0);
    lc.lineJoin = "round";
    path(lc, inset);
    lc.strokeStyle = "#ffffff";
    lc.lineWidth = width;
    lc.stroke();
    litMask(lc, half, top, bottom, ty);
    return layer;
  };
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  layerOf(0, 2 * L2.bandW, [[0, 1], [0.6, 1], [0.95, 0]]);
  const bc = reset(band);
  bc.filter = `blur(${(L2.bandBlur * s).toFixed(1)}px)`;
  bc.drawImage(layer, 0, 0); // the soft band mask
  bc.filter = "none";
  bc.globalCompositeOperation = "source-in";
  bc.drawImage(ctx.canvas, 0, 0); // the torso as it is now, inside the mask
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = L2.band * k;
  ctx.drawImage(band, 0, 0);
  ctx.restore();
  ctx.save();
  path(ctx, 0);
  ctx.clip();
  layerOf(L2.streakIn, L2.streakW, [[0.05, 0], [0.15, 1], [0.68, 1], [0.86, 0]]); // shoulder → ~80 % (ref L2d, L2h)
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = L2.streak * k;
  ctx.filter = `blur(${(0.003 * s).toFixed(1)}px)`;
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
};

// Body turn: the torso details are drawn in a layer and put back as if printed on a cylinder of radius `half`
// that turned by `yaw` (+ = to screen right, like faceYaw). One pixel column at a time: the far details get
// narrower and slide off the edge, the near edge shows the plain shirt (its side). The outline does not change.
// body yaw = TURN_K × face yaw, at most TURN_MAX. The reference (L2h f120–f144) turns the body MORE than the face:
// the button rows go from the centre to half-way to the edge while the face moves a little.
export const TURN_K = 1.4;
export const TURN_MAX = 0.85;
export const turnTorso = (ctx: Ctx, yaw: number, half: number, top: number, bottom: number, clip: (c: Ctx) => void, draw: (c: Ctx) => void) => {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  const [layer] = buffers(W, H);
  const lc = reset(layer);
  const m = ctx.getTransform();
  lc.setTransform(m);
  lc.lineJoin = ctx.lineJoin;
  lc.lineCap = ctx.lineCap;
  lc.save();
  clip(lc);
  lc.clip();
  draw(lc);
  lc.restore();
  const s = Math.hypot(m.a, m.b);
  const cx = m.e;
  const R = half * s;
  const sy = Math.max(0, Math.floor(m.f + (top - 0.1) * s));
  const sh = Math.min(H, Math.ceil(m.f + (bottom + 0.1) * s)) - sy;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let X = Math.floor(-R); X < Math.ceil(R); X++) {
    const xm = X + 0.5; // pixel centre
    if (Math.abs(xm) >= R) continue;
    const th2 = Math.asin(xm / R);
    const th = th2 - yaw;
    if (Math.abs(th) >= Math.PI / 2) continue; // the back of the shirt: plain shirt colour (already there)
    const x = R * Math.sin(th);
    const sw = Math.min(4, Math.max(0.2, Math.cos(th) / Math.max(0.05, Math.cos(th2))));
    ctx.drawImage(layer, cx + x - sw / 2, sy, sw, sh, cx + X, sy, 1, sh);
  }
  ctx.restore();
};
