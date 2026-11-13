// 2D character drawing on a Canvas2D context.
// Units: 1 unit = 1 HEAD WIDTH. Origin = between the feet, on the ground. y grows DOWN (canvas),
// so the body is at negative y. Body height (feet → top of skull) ≈ 3.08 head widths.
import {
  atFace, drawAngerBrows, drawAngerFill, drawAngerSmoke, drawCloth, drawEyeShape, drawFanAir, drawGritMouth, drawLaughMouth, drawPantMouth,
  drawLandingDust, drawSmirkMouth, drawSquintLid, drawSweatDrop, drawTiredLid, drawWavyMouth, drawYellMouth, type EyeShape, faceClip, type FaceTurn,
  faceTurnOf, squintClip, tiredClip, turnWhole,
} from "./fx";
import { drawWithGloss, inkFill, look, rimPass, shadeHead, shadeTorso, TURN_K, TURN_MAX, turnTorso } from "./look";
import { faceLayout, faceLayoutOn, type HeadShape, headPath, headShape, setHeadShape } from "./head";

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
export type Mouth = "line" | "smile" | "open" | "flat" | "frown" | "grit" | "yell" | "yell_o" | "wavy" | "pant" | "smirk" | "laugh" | "openSmile"; // v4: grit, yell, yell_o (anger); wavy, pant (heat); smirk, laugh, openSmile (3D face)

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
  // v4 effects (src/character/fx.ts); off when missing
  angerFill?: number; // 0..1 purple level in the head
  angerT?: number; // frames since the anger effect started (wave phase)
  angerSmoke?: number; // frames since the smoke started; < 0 = no smoke
  browAnger?: number; // 0..1+ thick V brows drawn over glasses (replaces the normal brows when > 0); > 1 = steeper
  browDY?: number; // move the anger brows down (+) or up (−), head widths
  eyeSquint?: number; // 0..1 angry lids that cut the top of the eyes
  sweat?: number; // frames since the sweat drop appeared; < 0 = none
  sweatSide?: -1 | 1; // temple of the drop (default: the cloth side, else screen-right)
  eyeTired?: number; // 0..1 heavy flat lids (0.5 = half closed, 1 = closed)
  cloth?: number; // 1 = a cloth in the free hand (the hand that is not spec.busyHand)
  clothArm?: number; // angle / elbow of the cloth arm (override armL or armR)
  clothElbow?: number;
  clothFront?: number; // 1 = draw the cloth arm in front of the head (wiping the temple)
  clothTilt?: number; // head tilt toward the cloth hand (radians)
  clothT?: number; // frames, for the flapping cloth tails
  clothSwing?: number; // extra sideways swing of the tails
  clothReach?: number; // 0..1 hand distance from the shoulder (1 = straight arm; < 1 bends the elbow out)
  clothRot?: number; // rotation of the cloth around the hand, toward the face (radians; 0 = tails hang down)
  clothAir?: number; // 0..1 air lines from the cloth to the face (fanning)
  // v4 3D face (references/effects/face-stretch.md): the face turns on the round head; off when missing/0
  faceYaw?: number; // radians, + = the face turns to screen right
  facePitch?: number; // radians, + = the face looks down
  eyeShape?: EyeShape; // new eye shape instead of the v3 eyes
  hand?: number; // 1 = the free hand (not spec.busyHand) follows handArm/handElbow/handReach (e.g. hand at the chin)
  handArm?: number;
  handElbow?: number;
  handReach?: number;
  handFront?: number; // 1 = draw that arm in front of the head
  handFold?: number; // 0..1 folded arm: upper arm down to the chest, forearm up, fist under the chin (thinking)
  handTap?: number; // 0..1 the folded fist taps up against the chin
  // v4 jump combo (references/effects/jump.md); off when missing
  knee?: number; // 0..1 knees bend out and the body drops (crouch before the take-off, landing)
  toes?: number; // 0..1 the feet hang toes-down (in the air)
  stretch?: number; // the body (never the head) gets taller and thinner: 1 = none
  lift?: number; // jump height in head widths: the card moves up (CharacterCard), the shadow stays on the ground
  dust?: number; // frames since the landing dust started; < 0 = none
  // v4 walk (references/effects/walk.md, VFX item 12); off when missing
  walkDrop?: number; // head widths: the body above the hips drops (the step dip); the feet stay on the ground
  footL?: number; // 0..1 the screen-left foot lifts, its knee bends out (the swinging leg)
  footR?: number;
  strideL?: number; // −1 back .. +1 front: where the screen-left foot is (a foot behind is drawn higher)
  strideR?: number;
  sway?: number; // head widths: the body above the hips shifts sideways (+ = screen right), over the standing leg
  lean?: number; // radians: the body leans around the hips (+ = the top goes screen right)
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
  busyHand?: -1 | 1; // v4: the hand that holds a prop (set by parts); effects use the other hand
  glasses?: boolean; // v4: wears glasses (set by parts) -> shock uses dot eyes instead of ring eyes
  overFaceTurns?: boolean; // v4: the overFace hook turns its own pieces with the 3D face (else it is turned as one piece)
  poseDefaults?: Partial<Pose>;
  headShape?: HeadShape; // character identity (head.ts, D19): set by the cast from gender; missing = round. Look off = round
  bg?: boolean; // v4 look L2: a background actor (props "bg": true) → outfits draw only their big shapes (detailBg)
};

// v4 look L2: true while a background actor is drawn. Outfit hooks skip their small details (buttons, pockets,
// stitches): base colour + at most 2 big shapes (the user's rule, references/looks/README.md L2c/L2i)
let bgNow = false;
export const detailBg = () => bgNow;

// ---------- helpers ----------
export const strokeFill = (ctx: Ctx, fill: string | null, ink: string, lw = LW.outline) => {
  if (fill && lw >= 0.028 && look().on) return inkFill(ctx, fill, ink, lw); // v4 look L1: thin lit side, thick shadow side
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
// reach < 1 (v4, heat fan): the hand comes closer to the shoulder and the elbow bends out to keep the arm length
export const armPoints = (side: -1 | 1, angle: number, elbow = 0.06, reach = 1) => {
  const sx = side * SHOULDER.x;
  const sy = SHOULDER.y;
  const a = angle + 0.16;
  const hx = sx + side * Math.sin(a) * ARM_LEN * reach;
  const hy = sy + Math.cos(a) * ARM_LEN * reach;
  if (reach < 1) elbow += 1.8 * Math.sqrt(Math.max(0, (ARM_LEN / 2) ** 2 - ((ARM_LEN * reach) / 2) ** 2));
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

// v4 3D face "think": a folded arm. k = 0 hanging (v3 rest) → 1 fist under the chin. The curve's control point
// is set so the curve passes through the elbow at the chest (a narrow U: upper arm down, forearm up).
const FOLD = { elbow: [0.2, -1.5], fist: [0.04, -2.17], tap: 0.025 };
const drawFoldedArm = (ctx: Ctx, spec: CharacterSpec, side: -1 | 1, k: number, tap: number) => {
  const rest = armPoints(side, 0.12, 0.06);
  const m = (a: number, b: number) => a + (b - a) * k;
  const ex = m((rest.sx + rest.hx) / 2, side * FOLD.elbow[0]);
  const ey = m((rest.sy + rest.hy) / 2, FOLD.elbow[1]);
  const hx = m(rest.hx, side * FOLD.fist[0]);
  const hy = m(rest.hy, FOLD.fist[1]) - FOLD.tap * tap;
  ctx.beginPath();
  ctx.moveTo(rest.sx, rest.sy);
  ctx.quadraticCurveTo(2 * ex - (rest.sx + hx) / 2, 2 * ey - (rest.sy + hy) / 2, hx, hy);
  ctx.strokeStyle = spec.ink;
  ctx.lineWidth = LW.limb;
  ctx.stroke();
  circle(ctx, hx, hy, 0.058);
  ctx.fillStyle = spec.ink;
  ctx.fill();
};

const drawArm = (ctx: Ctx, spec: CharacterSpec, side: -1 | 1, angle: number, elbow: number, reach = 1) => {
  const p = armPoints(side, angle, elbow, reach);
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

// v4 jump: knees and pointed feet. KNEE.drop = how far the body drops at knee 1 (reference 11: the head drops
// 0.12 head heights, the legs get 9 % shorter); the knees go out so the legs keep their length.
export const KNEE = { drop: 0.16, out: 0.2, dir: -1 }; // dir: both knees go to screen left (reads as knees forward)
const drawJumpLegs = (ctx: Ctx, spec: CharacterSpec, pose: Pose) => {
  const spread = pose.legSpread ?? 0;
  const knee = pose.knee ?? 0;
  const toes = pose.toes ?? 0;
  const hipY = HIP_Y + knee * KNEE.drop;
  for (const side of [-1, 1] as const) {
    const hx = side * LEG_X;
    const fx = side * (LEG_X + 0.03 + spread);
    const fy = -0.02;
    // knee: half way down. Both knees go the same way (+ a little apart), like a 3/4 crouch (reference 11 f55),
    // fast at first like a real bend: a small drop = a big knee move. Bowed-out knees looked like an "O" (test 1)
    const out = KNEE.out * Math.sqrt(knee);
    const kx = (hx + fx) / 2 + KNEE.dir * out + side * out * 0.2;
    const ky = (hipY + fy) / 2;
    ctx.beginPath();
    ctx.moveTo(hx, hipY);
    if (out > 0.001) ctx.quadraticCurveTo(2 * kx - (hx + fx) / 2, 2 * ky - (hipY + fy) / 2, fx, fy);
    else ctx.bezierCurveTo(hx + side * 0.03, -0.85, fx - side * 0.03, -0.4, fx, fy);
    // the foot turns from flat (toward the outside) to hanging toes-down
    const a = toes * 1.2;
    const tx = fx + side * 0.075 * Math.cos(a);
    const ty = fy + 0.075 * Math.sin(a) + 0.02 * (1 - toes);
    ctx.lineTo(tx, ty);
    ctx.strokeStyle = spec.pants;
    ctx.lineWidth = LW.limb;
    ctx.stroke();
    if (spec.boots) {
      // the shaft follows the shin (foot → knee direction)
      const dx = (out > 0.001 ? kx : fx - side * 0.004) - fx;
      const dy = (out > 0.001 ? ky : -spec.boots.len) - fy;
      const d = Math.hypot(dx, dy);
      ctx.beginPath();
      ctx.moveTo(fx + (dx / d) * spec.boots.len, fy + (dy / d) * spec.boots.len);
      ctx.lineTo(fx, fy);
      ctx.lineTo(fx + side * 0.08 * Math.cos(a), fy + 0.08 * Math.sin(a) + 0.02 * (1 - toes));
      ctx.strokeStyle = spec.boots.color;
      ctx.lineWidth = LW.limb * 1.25;
      ctx.stroke();
    }
  }
};

// v4 walk: front view, the legs scissor (reference 12b). Each foot has a place front ↔ back (stride +1 / −1): a foot
// behind is drawn higher (further away; the front foot stays on the ground line, so nothing goes under the ground).
// The swinging leg lifts its foot (toes toward the camera) and its knee comes FORWARD: up + a soft move to screen
// left (the jump's "knees forward" convention, KNEE.dir), not out to the side (test 1: too wide, read as sliding).
// The standing leg keeps the v3 S curve, from the dropped (and swayed) hips.
export const WALK_LEG = { lift: 0.16, back: 0.13, kneeUp: 0.1, kneeFwd: 0.07, kneeSide: 0.02, toe: 0.9 };
const drawWalkLegs = (ctx: Ctx, spec: CharacterSpec, pose: Pose) => {
  const spread = pose.legSpread ?? 0;
  const hipY = HIP_Y + (pose.walkDrop ?? 0);
  const shift = pose.sway ?? 0;
  for (const side of [-1, 1] as const) {
    const lift = Math.max(0, side === -1 ? (pose.footL ?? 0) : (pose.footR ?? 0));
    const stride = side === -1 ? (pose.strideL ?? 0) : (pose.strideR ?? 0);
    const hx = side * LEG_X + shift;
    const fx = side * (LEG_X + 0.03 + spread);
    const fy = -0.02 - WALK_LEG.back * Math.max(0, -stride) - WALK_LEG.lift * lift;
    const out = lift > 0.001 ? 1 : 0;
    const kx = (hx + fx) / 2 + (KNEE.dir * WALK_LEG.kneeFwd + side * WALK_LEG.kneeSide) * lift;
    const ky = (hipY + fy) / 2 - WALK_LEG.kneeUp * lift;
    ctx.beginPath();
    ctx.moveTo(hx, hipY);
    if (out > 0.001) ctx.quadraticCurveTo(2 * kx - (hx + fx) / 2, 2 * ky - (hipY + fy) / 2, fx, fy);
    else ctx.bezierCurveTo(hx + side * 0.03, -0.85, fx - side * 0.03, -0.4, fx, fy);
    const a = lift * WALK_LEG.toe; // the lifted foot points down, toward the camera
    ctx.lineTo(fx + side * 0.075 * Math.cos(a), fy + 0.075 * Math.sin(a) + 0.02 * (1 - lift));
    ctx.strokeStyle = spec.pants;
    ctx.lineWidth = LW.limb;
    ctx.stroke();
    if (spec.boots) {
      const dx = (out > 0.001 ? kx : fx - side * 0.004) - fx;
      const dy = (out > 0.001 ? ky : -spec.boots.len) - fy;
      const d = Math.hypot(dx, dy);
      ctx.beginPath();
      ctx.moveTo(fx + (dx / d) * spec.boots.len, fy + (dy / d) * spec.boots.len);
      ctx.lineTo(fx, fy);
      ctx.lineTo(fx + side * 0.08 * Math.cos(a), fy + 0.08 * Math.sin(a) + 0.02 * (1 - lift));
      ctx.strokeStyle = spec.boots.color;
      ctx.lineWidth = LW.limb * 1.25;
      ctx.stroke();
    }
  }
};
const walking = (pose: Pose) => pose.walkDrop !== undefined || pose.footL !== undefined || pose.footR !== undefined || pose.strideL !== undefined;

const drawLegs = (ctx: Ctx, spec: CharacterSpec, pose: Pose) => {
  if (walking(pose)) return drawWalkLegs(ctx, spec, pose);
  if (pose.knee || pose.toes) return drawJumpLegs(ctx, spec, pose);
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

// v3 eye at (x, y) (lx, ly = look offset). Moved out of drawFace for the 3D face; the drawing calls are the v3 ones.
const v3Eye = (ctx: Ctx, spec: CharacterSpec, pose: Pose, x: number, y: number, s: number, lx: number, ly: number) => {
  const closed = pose.blink > 0.5 || (pose.eyeTired ?? 0) >= 0.98;
  const squint = closed ? 0 : (pose.eyeSquint ?? 0);
  const tired = closed ? 0 : (pose.eyeTired ?? 0);
  const eyeH = spec.eyes === "ring" ? 0.068 : 0.05;
  if (squint > 0 || tired > 0) ctx.save();
  if (squint > 0) squintClip(ctx, x, y, s, squint);
  if (tired > 0) tiredClip(ctx, x, y, eyeH, tired);
  if (closed) {
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
  if (squint > 0 || tired > 0) ctx.restore();
  if (squint > 0) drawSquintLid(ctx, x, y, s, squint, spec.ink, LW.face);
  if (tired > 0) drawTiredLid(ctx, x, y, s, eyeH, tired, spec.ink, LW.face);
};

// v3 brow with its center at (x, by)
const v3Brow = (ctx: Ctx, spec: CharacterSpec, pose: Pose, x: number, by: number, s: number) => {
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
};

// mouth at (mx, my)
const drawMouth = (ctx: Ctx, spec: CharacterSpec, mouth: Mouth, mx: number, my: number) => {
  ctx.strokeStyle = spec.ink;
  ctx.lineWidth = LW.face * 0.9;
  if (mouth === "line") {
    line(
      ctx,
      [
        [mx - 0.055, my],
        [mx + 0.05, my - 0.008],
      ],
      spec.ink,
      LW.face * 0.9,
    );
  } else if (mouth === "flat") {
    line(
      ctx,
      [
        [mx - 0.035, my],
        [mx + 0.035, my],
      ],
      spec.ink,
      LW.face * 0.9,
    );
  } else if (mouth === "smile") {
    ctx.beginPath();
    ctx.moveTo(mx - 0.07, my - 0.02);
    ctx.quadraticCurveTo(mx, my + 0.05, mx + 0.07, my - 0.025);
    ctx.stroke();
  } else if (mouth === "frown") {
    ctx.beginPath();
    ctx.moveTo(mx - 0.06, my + 0.02);
    ctx.quadraticCurveTo(mx, my - 0.03, mx + 0.06, my + 0.02);
    ctx.stroke();
  } else if (mouth === "grit") {
    drawGritMouth(ctx, mx, my, spec.ink, LW.face * 0.8);
  } else if (mouth === "yell" || mouth === "yell_o") {
    drawYellMouth(ctx, mx, my, mouth, spec.ink, LW.face * 0.8);
  } else if (mouth === "wavy") {
    drawWavyMouth(ctx, mx, my, spec.ink, LW.face * 0.9);
  } else if (mouth === "pant") {
    drawPantMouth(ctx, mx, my, spec.ink, LW.face * 0.8);
  } else if (mouth === "smirk") {
    drawSmirkMouth(ctx, mx, my, spec.ink, LW.face * 0.9);
  } else if (mouth === "laugh" || mouth === "openSmile") {
    drawLaughMouth(ctx, mx, my, mouth, spec.ink, LW.face * 0.75);
  } else {
    ellipse(ctx, mx, my + 0.01, 0.04, 0.05);
    ctx.fillStyle = "#3a1a24";
    ctx.fill();
    ctx.stroke();
  }
};

// blush / freckles (v4: they fade out as the anger fill rises over the cheeks). place() puts each one on the face.
const drawBlush = (ctx: Ctx, spec: CharacterSpec, pose: Pose, place: (x: number, y: number, draw: (x: number, y: number) => void) => void) => {
  ctx.save();
  ctx.globalAlpha = 1 - Math.min(1, Math.max(0, ((pose.angerFill ?? 0) - 0.2) / 0.2));
  if (spec.blush) {
    for (const s of [-1, 1])
      place(s * 0.27, 0.17, (x, y) => {
        ellipse(ctx, x, y, 0.075, 0.042);
        ctx.fillStyle = spec.blush!;
        ctx.fill();
      });
  }
  if (spec.freckles) {
    ctx.fillStyle = "#b8735a";
    for (const s of [-1, 1])
      for (const [fx, fy] of [
        [0.22, 0.13],
        [0.27, 0.11],
        [0.25, 0.16],
      ])
        place(s * fx, fy, (x, y) => {
          ctx.fillStyle = "#b8735a";
          circle(ctx, x, y, 0.011);
          ctx.fill();
        });
  }
  ctx.restore();
};

// v4 3D face: every feature is drawn at its turned place on the round head (fx.ts atFace), clipped to the head
const drawFaceTurned = (ctx: Ctx, spec: CharacterSpec, pose: Pose, turn: FaceTurn) => {
  const F = faceLayout(); // default = the v3 numbers (eyes 0.17 / 0.03, mouth 0.22)
  const ex = 0.17 * F.eyeK;
  const ey = F.eyeY;
  const big = (draw: () => void, k: number) => () => {
    if (k !== 1) ctx.scale(k, k);
    draw();
  };
  const lx = pose.lookX * 0.045;
  const ly = pose.lookY * 0.035;
  ctx.save();
  faceClip(ctx, HEAD.rx, HEAD.ry, LW.outline);
  drawBlush(ctx, spec, pose, (x, y, draw) => atFace(ctx, turn, x, y + F.blushY - 0.17, () => draw(0, 0)));
  const closed = pose.blink > 0.5 || (pose.eyeTired ?? 0) >= 0.98;
  const shape = pose.eyeShape === "ring" && spec.glasses ? "bigDot" : pose.eyeShape; // glasses: dot eyes, not rings (user)
  for (const s of [-1, 1]) {
    if (shape && !closed) {
      const ring = shape === "ring"; // the ring stays in place, its pupil looks
      atFace(ctx, turn, s * ex + (ring ? 0 : lx), ey + (ring ? 0 : ly), big(() => drawEyeShape(ctx, shape, ring ? lx : 0, ring ? ly : 0, spec.ink, LW.face), F.eyeK));
    } else atFace(ctx, turn, s * ex + lx, ey + ly, big(() => v3Eye(ctx, spec, pose, 0, 0, s, lx, ly), F.eyeK));
  }
  const by = ey - 0.13 * F.eyeK - pose.browRaise * 0.035;
  if (!pose.browAnger) for (const s of [-1, 1]) atFace(ctx, turn, s * ex + lx * 0.4, by, () => v3Brow(ctx, spec, pose, 0, 0, s));
  atFace(ctx, turn, lx * 0.6, F.mouthY + ly * 0.3, big(() => drawMouth(ctx, spec, pose.mouth, 0, 0), F.mouthK));
  ctx.restore();
};

const drawFace = (ctx: Ctx, spec: CharacterSpec, pose: Pose) => {
  const turn = faceTurnOf(pose);
  if (turn || pose.eyeShape || faceLayoutOn()) return drawFaceTurned(ctx, spec, pose, turn ?? { yaw: 0, pitch: 0 });
  const ex = 0.17;
  const ey = 0.03;
  const lx = pose.lookX * 0.045;
  const ly = pose.lookY * 0.035;
  drawBlush(ctx, spec, pose, (x, y, draw) => draw(x, y));
  // eyes (v4: eyeTired ≥ 0.98 closes them like a blink)
  for (const s of [-1, 1]) v3Eye(ctx, spec, pose, s * ex + lx, ey + ly, s, lx, ly);
  // brows
  const by = -0.1 - pose.browRaise * 0.035;
  for (const s of pose.browAnger ? [] : [-1, 1]) v3Brow(ctx, spec, pose, s * ex + lx * 0.4, by, s);
  // mouth
  drawMouth(ctx, spec, pose.mouth, lx * 0.6, 0.22 + ly * 0.3);
};

// ---------- main ----------
export const drawCharacter = (ctx: Ctx, spec: CharacterSpec, pose: Pose) => {
  // character identity (D19): the head shape is part of the v4 look; "look": null draws the v3 round head
  const want: HeadShape = (look().on && spec.headShape) || "round";
  bgNow = look().on && !!spec.bg;
  if (want === headShape()) {
    drawCharacterBody(ctx, spec, pose);
    bgNow = false;
    return;
  }
  const prev = headShape();
  setHeadShape(want);
  try {
    drawCharacterBody(ctx, spec, pose);
  } finally {
    setHeadShape(prev);
    bgNow = false;
  }
};

const drawCharacterBody = (ctx: Ctx, spec: CharacterSpec, pose: Pose) => {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.setTransform(PX_PER_UNIT, 0, 0, PX_PER_UNIT, -UNITS.left * PX_PER_UNIT, -UNITS.top * PX_PER_UNIT);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  let armL = spec.armFixed?.L ?? pose.armL;
  let armR = spec.armFixed?.R ?? pose.armR;
  let elbowL = spec.armFixed?.elbowL ?? pose.elbowL ?? 0.06;
  let elbowR = spec.armFixed?.elbowR ?? pose.elbowR ?? 0.06;
  const front = pose.view === "front";
  // v4 cloth (heat): it goes in the free hand, whose arm follows clothArm
  const clothSide: -1 | 0 | 1 = pose.cloth ? (spec.busyHand ? (-spec.busyHand as -1 | 1) : 1) : 0;
  if (clothSide === -1) [armL, elbowL] = [pose.clothArm ?? armL, pose.clothElbow ?? elbowL];
  if (clothSide === 1) [armR, elbowR] = [pose.clothArm ?? armR, pose.clothElbow ?? elbowR];
  const clothInFront = clothSide !== 0 && front && !!pose.clothFront;
  // v4 free-hand pose (3D face "think": hand at the chin)
  const handSide: -1 | 0 | 1 = !pose.cloth && pose.hand ? (spec.busyHand ? (-spec.busyHand as -1 | 1) : 1) : 0;
  const handInFront = handSide !== 0 && front && !!pose.handFront;
  const handArm = (side: -1 | 1) =>
    pose.handFold !== undefined
      ? drawFoldedArm(ctx, spec, side, pose.handFold, pose.handTap ?? 0)
      : drawArm(ctx, spec, side, pose.handArm ?? 0.12, pose.handElbow ?? 0.06, pose.handReach ?? 1);
  const clothArm = (side: -1 | 1) => {
    const [a, e] = side === -1 ? [armL, elbowL] : [armR, elbowR];
    const reach = pose.clothReach ?? 1;
    drawArm(ctx, spec, side, a, e, reach);
    const h = armPoints(side, a, e, reach);
    const rot = side * (pose.clothRot ?? 0);
    drawCloth(ctx, h.hx, h.hy, pose.clothT ?? 0, side * (pose.clothSwing ?? 0), spec.ink, rot);
    if (pose.clothAir) drawFanAir(ctx, h.hx, h.hy, rot, pose.clothT ?? 0, pose.clothAir, spec.ink);
  };

  // v4 jump: the body (legs, torso, arms) stretches from the feet; the knees drop everything above the hips.
  // The head keeps its shape and only moves with the neck (jumpBody / jumpHead).
  const sy = pose.stretch ?? 1;
  const sx = sy === 1 ? 1 : 1 / Math.pow(sy, 0.9);
  const drop = (pose.knee ?? 0) * KNEE.drop + (pose.walkDrop ?? 0);
  // v4 walk: the body above the hips also shifts sideways (sway) and leans around the hips
  const swayX = pose.sway ?? 0;
  const lean = pose.lean ?? 0;
  const jump = sy !== 1 || drop !== 0 || swayX !== 0 || lean !== 0;
  const jumpBody = () => {
    ctx.save();
    if (sy !== 1) ctx.scale(sx, sy);
  };
  const upperBody = () => {
    if (swayX) ctx.translate(swayX, drop);
    else if (drop) ctx.translate(0, drop);
    if (lean) {
      ctx.translate(0, HIP_Y);
      ctx.rotate(lean);
      ctx.translate(0, -HIP_Y);
    }
  };
  if (jump) jumpBody();
  spec.behindBody?.(ctx, pose);
  drawLegs(ctx, spec, pose);
  upperBody();

  // torso
  const L1 = look().on; // v4 look L1 (src/character/look.ts); off = v3
  torsoPath(ctx, pose.breathe);
  if (L1) inkFill(ctx, spec.shirt, spec.ink, LW.outline);
  ctx.fillStyle = spec.shirt;
  ctx.fill();
  // v4 look L2: the torso details turn with the 3D face (a cylinder), then the torso shading goes over them
  const tTop = torsoY(TORSO.top, pose.breathe);
  const tBottom = torsoY(DESIGN_BOTTOM, pose.breathe);
  const tHalf = TORSO.halfMid + 0.02;
  const bodyYaw = L1 && look().turn > 0 ? look().turn * Math.max(-TURN_MAX, Math.min(TURN_MAX, TURN_K * (pose.faceYaw ?? 0))) : 0;
  ctx.save();
  torsoPath(ctx, pose.breathe);
  ctx.clip();
  if (spec.torso && Math.abs(bodyYaw) > 0.004)
    turnTorso(ctx, bodyYaw, tHalf, tTop, tBottom, (c) => torsoPath(c, pose.breathe), (c) => spec.torso!(c, pose));
  else spec.torso?.(ctx, pose);
  ctx.restore();
  if (L1) shadeTorso(ctx, (c, inset) => torsoPath(c, pose.breathe, inset), tHalf, tTop, tBottom);
  torsoPath(ctx, pose.breathe);
  ctx.strokeStyle = spec.ink;
  ctx.lineWidth = L1 ? look().thin : LW.outline;
  ctx.stroke();

  spec.underArms?.(ctx, pose);
  // arms (screen-left = side -1)
  for (const side of [-1, 1] as const) {
    if (side === clothSide) {
      if (!clothInFront) clothArm(side);
    } else if (side === handSide) {
      if (!handInFront) handArm(side);
    } else drawArm(ctx, spec, side, side === -1 ? armL : armR, side === -1 ? elbowL : elbowR);
  }
  spec.overArms?.(ctx, pose);
  if (jump) {
    ctx.restore();
    ctx.save();
    if (!swayX && !lean) ctx.translate(0, sy * (NECK_Y + drop) - NECK_Y); // the head rides on the stretched neck, unscaled
    else {
      // walk: the neck point after the sway + lean (around the hips), then the head turns with the lean
      const r = NECK_Y - HIP_Y;
      ctx.translate(sx * (swayX - r * Math.sin(lean)), sy * (HIP_Y + r * Math.cos(lean) + drop));
      ctx.rotate(lean);
      ctx.translate(0, -NECK_Y);
    }
  }

  // head (local coords)
  ctx.save();
  ctx.translate(0, NECK_Y);
  ctx.rotate(pose.headTilt + clothSide * (pose.clothTilt ?? 0));
  ctx.translate(0, HEAD.cy - NECK_Y);
  spec.behindHead?.(ctx, pose);
  headPath(ctx, HEAD.rx, HEAD.ry); // round = the v3 ellipse; gumdrop / chibi = character identity (head.ts)
  strokeFill(ctx, spec.skin, spec.ink, LW.outline);
  if (L1) shadeHead(ctx, HEAD.rx, HEAD.ry);
  if (front && pose.angerFill) drawAngerFill(ctx, pose.angerFill, pose.angerT ?? 0, HEAD.rx, HEAD.ry, spec.ink, LW.outline);
  if (front) drawFace(ctx, spec, pose);
  const moved = front && !!spec.overFace && faceLayoutOn(); // chibi face layout: glasses follow the moved, bigger eyes
  if (moved) {
    const F = faceLayout();
    ctx.save();
    faceClip(ctx, HEAD.rx, HEAD.ry, LW.outline);
    ctx.translate(0, F.eyeY);
    ctx.scale(F.eyeK, F.eyeK);
    ctx.translate(0, -0.03);
  }
  if (front) {
    const turn = faceTurnOf(pose);
    if (!turn) spec.overFace?.(ctx, pose);
    else if (spec.overFace) {
      // v4 3D face: glasses etc. turn with the face; a hook that doesn't know the turn is turned as one piece
      ctx.save();
      faceClip(ctx, HEAD.rx, HEAD.ry, LW.outline);
      if (spec.overFaceTurns) spec.overFace(ctx, pose);
      else turnWhole(ctx, turn, () => spec.overFace!(ctx, pose));
      ctx.restore();
    }
  }
  if (moved) ctx.restore();
  if (front && pose.browAnger) drawAngerBrows(ctx, pose.lookX * 0.045 * 0.4, pose.lookY * 0.035 + (pose.browDY ?? 0) + faceLayout().eyeY - 0.03, pose.browAnger, spec.ink);
  if (L1 && spec.overHead) drawWithGloss(ctx, (c) => spec.overHead!(c, pose));
  else spec.overHead?.(ctx, pose);
  if (pose.angerSmoke !== undefined) drawAngerSmoke(ctx, pose.angerSmoke, HEAD.rx, spec.ink);
  if (front && pose.sweat !== undefined) drawSweatDrop(ctx, pose.sweat, pose.sweatSide ?? (clothSide || 1), spec.ink);
  ctx.restore();
  if (jump) {
    ctx.restore();
    jumpBody();
    upperBody();
  }
  if (clothInFront) clothArm(clothSide as -1 | 1); // fanning / wiping: the arm passes in front of the face
  if (handInFront) handArm(handSide as -1 | 1); // hand at the chin, in front of the face
  if (jump) ctx.restore();
  if (pose.dust !== undefined && pose.dust >= 0) drawLandingDust(ctx, pose.dust, spec.ink);
  if (L1) rimPass(ctx, PX_PER_UNIT);
};
