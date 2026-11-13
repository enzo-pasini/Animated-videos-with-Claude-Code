// Three ORIGINAL characters. Each one gets identity from ONE strong silhouette item (STYLE_SHEET §1.3).
import { INK } from "../style/palette";
import {
  type CharacterSpec,
  type Ctx,
  LW,
  armPoints,
  circle,
  detailBg,
  ellipse,
  line,
  strokeFill,
  torsoY,
} from "./draw";

const cloud = (ctx: Ctx, blobs: [number, number, number][], fill: string, ink: string, lw = LW.outline) => {
  // outer outline only: thick stroke of every blob, then fill every blob on top
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw * 2;
  for (const [x, y, r] of blobs) {
    circle(ctx, x, y, r);
    ctx.stroke();
  }
  ctx.fillStyle = fill;
  for (const [x, y, r] of blobs) {
    circle(ctx, x, y, r);
    ctx.fill();
  }
};

// ---------------------------------------------------------------------------
// 1. PELL — old night clockmaker. Silhouette: white hair clouds on the sides of a bald dome + a brass loupe.
// ---------------------------------------------------------------------------
export const PELL: CharacterSpec = {
  id: "pell",
  name: "Pell",
  role: "old night clockmaker",
  ink: INK,
  skin: "#f4efe7",
  shirt: "#cf9e45",
  pants: "#3a2f42",
  eyes: "dot",
  brows: "bushy",
  blush: "rgba(232,150,140,0.55)",
  torso: (ctx, pose) => {
    const y = (v: number) => torsoY(v, pose.breathe);
    // leather apron
    ctx.beginPath();
    ctx.moveTo(-0.22, y(-1.98));
    ctx.lineTo(0.22, y(-1.98));
    ctx.lineTo(0.3, y(-1.05));
    ctx.lineTo(-0.3, y(-1.05));
    ctx.closePath();
    strokeFill(ctx, "#7a4a34", INK, LW.detail);
    // pocket + a little screwdriver
    if (!detailBg()) line(ctx, [[0.07, y(-1.66)], [0.1, y(-1.8)]], "#c9c3cf", 0.03); // v4 L2: background = apron + pocket
    ctx.beginPath();
    ctx.rect(-0.13, y(-1.66), 0.27, 0.17);
    strokeFill(ctx, "#6a3e2b", INK, LW.detail);
    if (detailBg()) return;
    // stitches
    ctx.setLineDash([0.025, 0.02]);
    line(ctx, [[-0.19, y(-1.93)], [0.19, y(-1.93)]], "#c99a72", 0.01);
    ctx.setLineDash([]);
  },
  overHead: (ctx, pose) => {
    // side hair clouds
    for (const s of [-1, 1]) {
      cloud(
        ctx,
        [
          [s * 0.47, -0.13, 0.1],
          [s * 0.55, 0.0, 0.115],
          [s * 0.49, 0.13, 0.095],
          [s * 0.4, -0.2, 0.07],
        ],
        "#ecebf3",
        INK,
      );
    }
    // a thin wisp on top
    if (pose.view === "front") {
      ctx.beginPath();
      ctx.moveTo(-0.04, -0.47);
      ctx.bezierCurveTo(-0.08, -0.6, 0.06, -0.64, 0.05, -0.55);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.016;
      ctx.stroke();
    }
  },
  overFace: (ctx, pose) => {
    const x = 0.17 + pose.lookX * 0.045;
    const yy = 0.03 + pose.lookY * 0.035;
    // strap to the side of the head
    line(ctx, [[x + 0.12, yy - 0.03], [0.49, -0.1]], "#4a3426", 0.035);
    // lens + magnified eye
    circle(ctx, x, yy, 0.12);
    ctx.fillStyle = "rgba(205,228,238,0.55)";
    ctx.fill();
    if (pose.blink < 0.5) {
      circle(ctx, x + pose.lookX * 0.02, yy, 0.062);
      ctx.fillStyle = INK;
      ctx.fill();
      circle(ctx, x - 0.02, yy - 0.025, 0.018);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    } else {
      line(ctx, [[x - 0.07, yy], [x + 0.07, yy]], INK, 0.03);
    }
    // brass ring
    circle(ctx, x, yy, 0.12);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.075;
    ctx.stroke();
    ctx.strokeStyle = "#c08a3e";
    ctx.lineWidth = 0.042;
    ctx.stroke();
  },
};

// ---------------------------------------------------------------------------
// 2. JUNO — night courier. Silhouette: pointed yellow rain hood + satchel sticking out at the hip.
// ---------------------------------------------------------------------------
const HOOD = "#efbb2c";
export const JUNO: CharacterSpec = {
  id: "juno",
  name: "Juno",
  role: "night courier",
  ink: INK,
  skin: "#f6f0e6",
  shirt: HOOD,
  pants: "#2c3159",
  boots: { color: "#c2453a", len: 0.24 },
  eyes: "ring",
  brows: "thin",
  blush: "rgba(240,150,140,0.6)",
  freckles: true,
  behindHead: () => {
  },
  overHead: (ctx, pose) => {
    // hood: a ring around the face that ends in a soft point, drawn with an even-odd hole for the face
    ctx.beginPath();
    ctx.moveTo(-0.6, 0.34);
    ctx.bezierCurveTo(-0.7, -0.15, -0.55, -0.6, -0.12, -0.72);
    ctx.bezierCurveTo(0.02, -0.76, 0.12, -0.86, 0.2, -0.98); // the point, flopping right
    ctx.bezierCurveTo(0.28, -0.82, 0.3, -0.72, 0.36, -0.6);
    ctx.bezierCurveTo(0.62, -0.42, 0.7, -0.1, 0.6, 0.34);
    ctx.bezierCurveTo(0.5, 0.5, 0.42, 0.52, 0.34, 0.47);
    // inner opening (face) back the other way
    ctx.bezierCurveTo(0.46, 0.2, 0.46, -0.28, 0.0, -0.4);
    ctx.bezierCurveTo(-0.46, -0.28, -0.46, 0.2, -0.34, 0.47);
    ctx.bezierCurveTo(-0.42, 0.52, -0.5, 0.5, -0.6, 0.34);
    ctx.closePath();
    ctx.fillStyle = HOOD;
    ctx.fill("evenodd");
    ctx.strokeStyle = INK;
    ctx.lineWidth = LW.outline;
    ctx.stroke();
    if (pose.view === "front") {
      // inner rim shade + seam
      ctx.beginPath();
      ctx.moveTo(-0.34, 0.45);
      ctx.bezierCurveTo(-0.46, 0.2, -0.46, -0.28, 0.0, -0.4);
      ctx.bezierCurveTo(0.46, -0.28, 0.46, 0.2, 0.34, 0.45);
      ctx.strokeStyle = "#c98f17";
      ctx.lineWidth = 0.05;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-0.02, -0.4);
      ctx.bezierCurveTo(0.05, -0.6, 0.12, -0.75, 0.2, -0.95);
      ctx.strokeStyle = INK;
      ctx.lineWidth = LW.detail * 0.8;
      ctx.stroke();
      // drawstrings
      for (const s of [-1, 1]) {
        line(ctx, [[s * 0.3, 0.46], [s * 0.27, 0.7]], "#f6f0e6", 0.018);
        ellipse(ctx, s * 0.27, 0.73, 0.022, 0.035);
        strokeFill(ctx, "#c2453a", INK, 0.012);
      }
    }
  },
  torso: (ctx, pose) => {
    const y = (v: number) => torsoY(v, pose.breathe);
    line(ctx, [[0.0, y(-2.2)], [0.02, y(-1.05)]], INK, LW.detail * 0.8);
    for (const ty of detailBg() ? [] : [-1.86, -1.62, -1.38]) { // v4 L2: background = opening line + strap
      ctx.beginPath();
      ctx.roundRect(-0.045, y(ty) - 0.018, 0.09, 0.036, 0.018);
      strokeFill(ctx, "#5b3b22", INK, 0.01);
    }
    // satchel strap (diagonal)
    ctx.beginPath();
    ctx.moveTo(-0.34, y(-2.06));
    ctx.lineTo(-0.25, y(-2.12));
    ctx.lineTo(0.4, y(-1.3));
    ctx.lineTo(0.31, y(-1.22));
    ctx.closePath();
    strokeFill(ctx, "#7c4a2c", INK, LW.detail * 0.8);
  },
  underArms: (ctx, pose) => {
    const y = (v: number) => torsoY(v, pose.breathe);
    ctx.beginPath();
    ctx.roundRect(0.2, y(-1.42), 0.38, 0.33, 0.06);
    strokeFill(ctx, "#8b5634", INK, LW.outline);
    ctx.beginPath();
    ctx.moveTo(0.2, y(-1.36));
    ctx.lineTo(0.58, y(-1.36));
    ctx.lineTo(0.56, y(-1.22));
    ctx.quadraticCurveTo(0.39, y(-1.18), 0.22, y(-1.22));
    ctx.closePath();
    strokeFill(ctx, "#6d4127", INK, LW.detail);
    // a sealed letter sticking out
    ctx.beginPath();
    ctx.rect(0.3, y(-1.5), 0.17, 0.12);
    strokeFill(ctx, "#f3ead8", INK, 0.012);
    circle(ctx, 0.385, y(-1.44), 0.022);
    ctx.fillStyle = "#c2453a";
    ctx.fill();
  },
};

// ---------------------------------------------------------------------------
// 3. BRAM — lamplighter. Silhouette: long floppy knit cap with pompom + a tall lighting pole.
// ---------------------------------------------------------------------------
const CAP = "#b5443a";
const CAP_STRIPE = "#3f8f88";
const capPath = (ctx: Ctx) => {
  ctx.beginPath();
  ctx.moveTo(-0.53, -0.1);
  ctx.bezierCurveTo(-0.6, -0.55, -0.35, -0.82, 0.0, -0.84);
  ctx.bezierCurveTo(0.35, -0.86, 0.62, -0.78, 0.78, -0.48); // floppy tail going right/down
  ctx.bezierCurveTo(0.84, -0.36, 0.8, -0.28, 0.74, -0.26);
  ctx.bezierCurveTo(0.66, -0.4, 0.58, -0.46, 0.46, -0.44);
  ctx.bezierCurveTo(0.52, -0.3, 0.54, -0.2, 0.53, -0.1);
  ctx.closePath();
};
export const BRAM: CharacterSpec = {
  id: "bram",
  name: "Bram",
  role: "lamplighter",
  ink: INK,
  skin: "#f3eee6",
  shirt: "#34406b",
  pants: "#262233",
  eyes: "dot",
  brows: "flat",
  armFixed: { elbowL: 0.1 },
  poseDefaults: { armL: 0.62 },
  behindBody: (ctx, pose) => {
    const h = armPoints(-1, pose.armL, 0.1);
    const x = h.hx;
    const lift = h.hy + 1.43; // pole moves with the hand (0 = resting on the ground)
    const bot = -0.01 + lift;
    const top = -3.45 + lift;
    line(ctx, [[x, bot], [x - 0.01, top]], INK, 0.062);
    line(ctx, [[x, bot], [x - 0.01, top]], "#80583a", 0.034);
    ctx.save();
    ctx.translate(0, lift);
    // brass hook + wick cup at the top
    ctx.beginPath();
    ctx.moveTo(x - 0.01, -3.45);
    ctx.bezierCurveTo(x - 0.02, -3.62, x + 0.16, -3.66, x + 0.16, -3.5);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.05;
    ctx.stroke();
    ctx.strokeStyle = "#c99a45";
    ctx.lineWidth = 0.026;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 0.05, -3.42);
    ctx.lineTo(x + 0.03, -3.42);
    ctx.lineTo(x + 0.01, -3.33);
    ctx.lineTo(x - 0.03, -3.33);
    ctx.closePath();
    strokeFill(ctx, "#c99a45", INK, 0.014);
    ctx.restore();
  },
  torso: (ctx, pose) => {
    const y = (v: number) => torsoY(v, pose.breathe);
    line(ctx, [[0.03, y(-2.1)], [0.05, y(-1.06)]], INK, LW.detail * 0.8);
    if (detailBg()) return; // v4 L2: background = opening line (+ the scarf)
    for (const by of [-1.72, -1.45]) {
      circle(ctx, 0.12, y(by), 0.03);
      strokeFill(ctx, "#d2aa5c", INK, 0.012);
    }
    line(ctx, [[-0.3, y(-1.3)], [-0.12, y(-1.3)]], INK, LW.detail * 0.7);
  },
  overArms: (ctx, pose) => {
    const y = (v: number) => torsoY(v, pose.breathe);
    // scarf band
    ctx.beginPath();
    ctx.roundRect(-0.36, y(-2.22), 0.72, 0.19, 0.09);
    strokeFill(ctx, CAP_STRIPE, INK, LW.outline);
    // hanging end
    ctx.beginPath();
    ctx.moveTo(0.08, y(-2.06));
    ctx.lineTo(0.22, y(-2.06));
    ctx.lineTo(0.26, y(-1.58));
    ctx.lineTo(0.11, y(-1.6));
    ctx.closePath();
    strokeFill(ctx, CAP_STRIPE, INK, LW.outline * 0.9);
    line(ctx, [[0.115, y(-1.75)], [0.245, y(-1.74)]], "#2f6e69", 0.03);
    for (const fx of [0.13, 0.17, 0.21, 0.245]) line(ctx, [[fx, y(-1.6)], [fx + 0.005, y(-1.53)]], INK, 0.014);
  },
  overHead: (ctx, pose) => {
    capPath(ctx);
    ctx.fillStyle = CAP;
    ctx.fill();
    ctx.save();
    capPath(ctx);
    ctx.clip();
    ctx.fillStyle = CAP_STRIPE;
    for (const sy of [-0.5, -0.74]) {
      ctx.beginPath();
      ctx.moveTo(-0.7, sy + 0.08);
      ctx.bezierCurveTo(-0.2, sy - 0.02, 0.4, sy - 0.06, 0.9, sy + 0.2);
      ctx.lineTo(0.9, sy + 0.31);
      ctx.bezierCurveTo(0.4, sy + 0.05, -0.2, sy + 0.09, -0.7, sy + 0.19);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    capPath(ctx);
    ctx.strokeStyle = INK;
    ctx.lineWidth = LW.outline;
    ctx.stroke();
    // folded brim
    ctx.beginPath();
    ctx.roundRect(-0.56, -0.25, 1.12, 0.17, 0.08);
    strokeFill(ctx, "#8f3029", INK, LW.outline);
    for (let i = -5; i <= 5; i++) line(ctx, [[i * 0.09, -0.22], [i * 0.09, -0.11]], "#6c211c", 0.012);
    // pompom
    cloud(
      ctx,
      [
        [0.8, -0.2, 0.08],
        [0.86, -0.13, 0.07],
        [0.76, -0.1, 0.07],
      ],
      "#efe6d6",
      INK,
    );
    if (pose.view === "front") {
      // stubble
      ctx.fillStyle = "rgba(90,80,110,0.55)";
      for (const [sx, sy] of [
        [-0.2, 0.3],
        [-0.12, 0.34],
        [0.12, 0.34],
        [0.2, 0.3],
        [-0.05, 0.37],
        [0.05, 0.37],
        [-0.27, 0.24],
        [0.27, 0.24],
      ]) {
        circle(ctx, sx, sy, 0.011);
        ctx.fill();
      }
    }
  },
};

export const CHARACTERS = { pell: PELL, juno: JUNO, bram: BRAM } as const;
export type CharacterId = keyof typeof CHARACTERS;
