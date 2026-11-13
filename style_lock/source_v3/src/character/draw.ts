// 2D character drawing on a Canvas2D context.
// Units: 1 unit = 1 HEAD WIDTH. Origin = between the feet, on the ground. y grows DOWN (canvas),
// so the body is at negative y. Body height (feet → top of skull) ≈ 3.08 head widths.

export const UNITS = { left: -1.2, right: 1.2, top: -4.15, bottom: 0.15 };
export const UNITS_W = UNITS.right - UNITS.left; // 2.4
export const UNITS_H = UNITS.bottom - UNITS.top; // 3.9
export const PX_PER_UNIT = 480; // head = 480 px in the texture → sharp up to close-ups (~50 % of 1080)

// Body layout (head widths).
export const HEAD = { cy: -2.6, rx: 0.5, ry: 0.475 }; // top of skull at -3.075
export const NECK_Y = -2.16;
const TORSO = { top: -2.18, bottom: -1.06, halfTop: 0.26, halfMid: 0.345, halfBottom: 0.31 };
const HIP_Y = -1.3;
const LEG_X = 0.12;
const SHOULDER = { x: 0.25, y: -1.98 };
const ARM_LEN = 0.68;

// Line widths in head widths (STYLE_SHEET §1.2): head outline 3.4 %, limbs 5 % (≈1.5×).
export const LW = { outline: 0.034, limb: 0.05, detail: 0.022, face: 0.032 };

export type View = "front" | "back";
export type Mouth = "line" | "smile" | "open" | "flat" | "frown";

export type Pose = {
  view: View;
  blink: number; // 0 open .. 1 closed
  lookX: number; // -1..1 eye direction
  lookY: number;
  browRaise: number; // -1 angry .. 1 surprised
  mouth: Mouth;
  armL: number; // radians from hanging (screen-left arm). + = outward / up
  armR: number;
  elbowL?: number; // bend, + = elbow out
  elbowR?: number;
  headTilt: number; // radians
  breathe: number; // 0..1
  legSpread?: number;
};

export const DEFAULT_POSE: Pose = {
  view: "front",
  blink: 0,
  lookX: 0,
  lookY: 0,
  browRaise: 0,
  mouth: "line",
  armL: 0.12,
  armR: 0.12,
  headTilt: 0,
  breathe: 0,
};

export type Ctx = CanvasRenderingContext2D;

export type CharacterSpec = {
  id: string;
  name: string;
  role: string;
  ink: string;
  skin: string;
  shirt: string;
  pants: string;
  boots?: { color: string; len: number };
  eyes: "dot" | "ring";
  brows: "thin" | "bushy" | "flat";
  blush?: string;
  freckles?: boolean;
  // Hooks, all in body units (origin at feet). Head hooks are called in HEAD-LOCAL coords (origin = head center).
  behindBody?: (ctx: Ctx, pose: Pose) => void;
  behindHead?: (ctx: Ctx, pose: Pose) => void;
  overHead?: (ctx: Ctx, pose: Pose) => void;
  overFace?: (ctx: Ctx, pose: Pose) => void;
  torso?: (ctx: Ctx, pose: Pose) => void;
  underArms?: (ctx: Ctx, pose: Pose) => void;
  overArms?: (ctx: Ctx, pose: Pose) => void;
  armFixed?: { L?: number; R?: number; elbowL?: number; elbowR?: number };
  poseDefaults?: Partial<Pose>;
};

// ---------- helpers ----------
export const strokeFill = (ctx: Ctx, fill: string | null, ink: string, lw = LW.outline) => {
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  ctx.stroke();
};

export const circle = (ctx: Ctx, x: number, y: number, r: number) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
};

export const ellipse = (ctx: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
};

export const line = (ctx: Ctx, pts: [number, number][], color: string, lw: number) => {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.stroke();
};

// Torso is DESIGNED in a reference box [-2.18, -1.06] (spec hooks use these numbers) and mapped to the
// real box [-2.18, TORSO_BOTTOM]. Breathing scales it slightly around the bottom.
const DESIGN_TOP = -2.18;
const DESIGN_BOTTOM = -1.06;
export const TORSO_BOTTOM = -1.24;
export const torsoY = (v: number, breathe = 0) => {
  const m = DESIGN_TOP + (v - DESIGN_TOP) * ((TORSO_BOTTOM - DESIGN_TOP) / (DESIGN_BOTTOM - DESIGN_TOP));
  return TORSO_BOTTOM + (m - TORSO_BOTTOM) * (1 + 0.012 * breathe);
};

export const torsoPath = (ctx: Ctx, breathe = 0, inset = 0) => {
  const { top, bottom, halfTop, halfMid, halfBottom } = TORSO;
  const y = (v: number) => torsoY(v, breathe);
  const ht = halfTop - inset;
  const hm = halfMid - inset;
  const hb = halfBottom - inset;
  ctx.beginPath();
  ctx.moveTo(-ht, y(top + 0.04));
  ctx.bezierCurveTo(-hm - 0.02, y(-1.95), -hm - 0.02, y(-1.45), -hb, y(-1.2));
  ctx.bezierCurveTo(-hb + 0.06, y(bottom - 0.01 + inset), hb - 0.06, y(bottom - 0.01 + inset), hb, y(-1.2));
  ctx.bezierCurveTo(hm + 0.02, y(-1.45), hm + 0.02, y(-1.95), ht, y(top + 0.04));
  ctx.bezierCurveTo(ht - 0.1, y(top - 0.04), -ht + 0.1, y(top - 0.04), -ht, y(top + 0.04));
  ctx.closePath();
};

// Arm geometry so hooks can attach props to hands.
export const armPoints = (side: -1 | 1, angle: number, elbow = 0.06) => {
  const sx = side * SHOULDER.x;
  const sy = SHOULDER.y;
  const a = angle + 0.16;
  const hx = sx + side * Math.sin(a) * ARM_LEN;
  const hy = sy + Math.cos(a) * ARM_LEN;
  const mx = (sx + hx) / 2;
  const my = (sy + hy) / 2;
  // perpendicular, pointing outward
  const dx = hx - sx;
  const dy = hy - sy;
  const len = Math.hypot(dx, dy);
  let px = -dy / len;
  let py = dx / len;
  if (px * side < 0) {
    px = -px;
    py = -py;
  }
  return { sx, sy, hx, hy, cx: mx + px * elbow, cy: my + py * elbow };
};

const drawArm = (ctx: Ctx, spec: CharacterSpec, side: -1 | 1, angle: number, elbow: number) => {
  const p = armPoints(side, angle, elbow);
  ctx.beginPath();
  ctx.moveTo(p.sx, p.sy);
  ctx.quadraticCurveTo(p.cx, p.cy, p.hx, p.hy);
  ctx.strokeStyle = spec.ink;
  ctx.lineWidth = LW.limb;
  ctx.stroke();
  circle(ctx, p.hx, p.hy, 0.058);
  ctx.fillStyle = spec.ink;
  ctx.fill();
};

const drawLegs = (ctx: Ctx, spec: CharacterSpec, pose: Pose) => {
  const spread = pose.legSpread ?? 0;
  for (const side of [-1, 1] as const) {
    const hx = side * LEG_X;
    const fx = side * (LEG_X + 0.03 + spread);
    // gentle S curve, like a drawn stroke
    ctx.beginPath();
    ctx.moveTo(hx, HIP_Y);
    ctx.bezierCurveTo(hx + side * 0.03, -0.85, fx - side * 0.03, -0.4, fx, -0.02);
    ctx.lineTo(fx + side * 0.075, -0.0);
    ctx.strokeStyle = spec.pants;
    ctx.lineWidth = LW.limb;
    ctx.stroke();
    if (spec.boots) {
      ctx.beginPath();
      ctx.moveTo(fx - side * 0.004, -spec.boots.len);
      ctx.lineTo(fx, -0.02);
      ctx.lineTo(fx + side * 0.08, -0.0);
      ctx.strokeStyle = spec.boots.color;
      ctx.lineWidth = LW.limb * 1.25;
      ctx.stroke();
    }
  }
};

const drawFace = (ctx: Ctx, spec: CharacterSpec, pose: Pose) => {
  const ex = 0.17;
  const ey = 0.03;
  const lx = pose.lookX * 0.045;
  const ly = pose.lookY * 0.035;
  // blush / freckles under everything
  if (spec.blush) {
    for (const s of [-1, 1]) {
      ellipse(ctx, s * 0.27, 0.17, 0.075, 0.042);
      ctx.fillStyle = spec.blush;
      ctx.fill();
    }
  }
  if (spec.freckles) {
    ctx.fillStyle = "#b8735a";
    for (const s of [-1, 1])
      for (const [fx, fy] of [
        [0.22, 0.13],
        [0.27, 0.11],
        [0.25, 0.16],
      ]) {
        circle(ctx, s * fx, fy, 0.011);
        ctx.fill();
      }
  }
  // eyes
  for (const s of [-1, 1]) {
    const x = s * ex + lx;
    const y = ey + ly;
    if (pose.blink > 0.5) {
      line(
        ctx,
        [
          [x - 0.045, y + 0.005],
          [x + 0.045, y + 0.005],
        ],
        spec.ink,
        LW.face,
      );
    } else if (spec.eyes === "ring") {
      ellipse(ctx, x, y, 0.062, 0.068 * (1 - pose.blink));
      ctx.fillStyle = "#fbf8f2";
      ctx.fill();
      ctx.strokeStyle = spec.ink;
      ctx.lineWidth = 0.022;
      ctx.stroke();
      circle(ctx, x + lx * 0.5, y + ly * 0.5, 0.026);
      ctx.fillStyle = spec.ink;
      ctx.fill();
    } else {
      ellipse(ctx, x, y, 0.04, 0.05 * (1 - pose.blink * 0.8));
      ctx.fillStyle = spec.ink;
      ctx.fill();
    }
  }
  // brows
  const by = -0.1 - pose.browRaise * 0.035;
  for (const s of [-1, 1]) {
    const x = s * ex + lx * 0.4;
    const tilt = -pose.browRaise * 0.03 + (pose.browRaise < 0 ? 0.04 : 0);
    if (spec.brows === "bushy") {
      ctx.beginPath();
      ctx.moveTo(x - s * 0.08, by + 0.015 - tilt * s * 0);
      ctx.quadraticCurveTo(x, by - 0.05, x + s * 0.09, by + tilt);
      ctx.strokeStyle = spec.ink;
      ctx.lineWidth = 0.075;
      ctx.stroke();
      ctx.strokeStyle = "#e4e2ec";
      ctx.lineWidth = 0.045;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x - s * 0.07, by + (s > 0 ? 0 : 0) + (pose.browRaise < 0 ? -0.0 : 0.005));
      ctx.quadraticCurveTo(x, by - (spec.brows === "flat" ? 0.005 : 0.025), x + s * 0.07, by + tilt + 0.01);
      ctx.strokeStyle = spec.ink;
      ctx.lineWidth = spec.brows === "flat" ? LW.face * 1.1 : LW.face * 0.85;
      ctx.stroke();
    }
  }
  // mouth
  const my = 0.22 + ly * 0.3;
  const mx = lx * 0.6;
  ctx.strokeStyle = spec.ink;
  ctx.lineWidth = LW.face * 0.9;
  if (pose.mouth === "line") {
    line(
      ctx,
      [
        [mx - 0.055, my],
        [mx + 0.05, my - 0.008],
      ],
      spec.ink,
      LW.face * 0.9,
    );
  } else if (pose.mouth === "flat") {
    line(
      ctx,
      [
        [mx - 0.035, my],
        [mx + 0.035, my],
      ],
      spec.ink,
      LW.face * 0.9,
    );
  } else if (pose.mouth === "smile") {
    ctx.beginPath();
    ctx.moveTo(mx - 0.07, my - 0.02);
    ctx.quadraticCurveTo(mx, my + 0.05, mx + 0.07, my - 0.025);
    ctx.stroke();
  } else if (pose.mouth === "frown") {
    ctx.beginPath();
    ctx.moveTo(mx - 0.06, my + 0.02);
    ctx.quadraticCurveTo(mx, my - 0.03, mx + 0.06, my + 0.02);
    ctx.stroke();
  } else {
    ellipse(ctx, mx, my + 0.01, 0.04, 0.05);
    ctx.fillStyle = "#3a1a24";
    ctx.fill();
    ctx.stroke();
  }
};

// ---------- main ----------
export const drawCharacter = (ctx: Ctx, spec: CharacterSpec, pose: Pose) => {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.setTransform(PX_PER_UNIT, 0, 0, PX_PER_UNIT, -UNITS.left * PX_PER_UNIT, -UNITS.top * PX_PER_UNIT);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const armL = spec.armFixed?.L ?? pose.armL;
  const armR = spec.armFixed?.R ?? pose.armR;
  const elbowL = spec.armFixed?.elbowL ?? pose.elbowL ?? 0.06;
  const elbowR = spec.armFixed?.elbowR ?? pose.elbowR ?? 0.06;
  const front = pose.view === "front";

  spec.behindBody?.(ctx, pose);
  drawLegs(ctx, spec, pose);

  // torso
  torsoPath(ctx, pose.breathe);
  ctx.fillStyle = spec.shirt;
  ctx.fill();
  ctx.save();
  torsoPath(ctx, pose.breathe);
  ctx.clip();
  spec.torso?.(ctx, pose);
  ctx.restore();
  torsoPath(ctx, pose.breathe);
  ctx.strokeStyle = spec.ink;
  ctx.lineWidth = LW.outline;
  ctx.stroke();

  spec.underArms?.(ctx, pose);
  // arms (screen-left = side -1)
  drawArm(ctx, spec, -1, armL, elbowL);
  drawArm(ctx, spec, 1, armR, elbowR);
  spec.overArms?.(ctx, pose);

  // head (local coords)
  ctx.save();
  ctx.translate(0, NECK_Y);
  ctx.rotate(pose.headTilt);
  ctx.translate(0, HEAD.cy - NECK_Y);
  spec.behindHead?.(ctx, pose);
  ellipse(ctx, 0, 0, HEAD.rx, HEAD.ry);
  strokeFill(ctx, spec.skin, spec.ink, LW.outline);
  if (front) drawFace(ctx, spec, pose);
  if (front) spec.overFace?.(ctx, pose);
  spec.overHead?.(ctx, pose);
  ctx.restore();
};
