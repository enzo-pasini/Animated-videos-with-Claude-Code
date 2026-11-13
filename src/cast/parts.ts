// Reusable character parts (PLAN §3.1). Each part returns drawing hooks for the locked base body
// (src/character/draw.ts: units = head widths, origin between the feet; head hooks in head-local
// coords, head center at 0,0, rx 0.5, ry 0.475). makeCharacter() composes parts into a CharacterSpec.
// Parts marked "from <name>" are parameterized copies of the v3 characters (whose specs stay locked).
import { type Ctx, LW, type Pose, armPoints, circle, detailBg, ellipse, line, strokeFill, torsoY } from "../character/draw";
import { FACE, atFace, faceProj, faceTurnOf } from "../character/fx";
import { INK } from "../style/palette";

export type Hooks = {
  behindBody?: (ctx: Ctx, pose: Pose) => void;
  behindHead?: (ctx: Ctx, pose: Pose) => void;
  overHead?: (ctx: Ctx, pose: Pose) => void;
  overFace?: (ctx: Ctx, pose: Pose) => void;
  torso?: (ctx: Ctx, pose: Pose) => void;
  underArms?: (ctx: Ctx, pose: Pose) => void;
  overArms?: (ctx: Ctx, pose: Pose) => void;
};
// holds: the hand this part keeps busy (−1 screen-left, 1 screen-right); v4 effects use the other hand
// glasses: the character wears glasses (v4 3D face: shock uses dot eyes). turns: its overFace hook turns its own
// pieces with the 3D face (else the hook is turned as one piece)
export type Part = { name: string; kind: "hair" | "hat" | "face" | "outfit" | "accessory"; hooks: Hooks; holds?: -1 | 1; glasses?: boolean; turns?: boolean };

const cloud = (ctx: Ctx, blobs: [number, number, number][], fill: string, ink = INK, lw = LW.outline) => {
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

// ---------------------------------------------------------------- hair
// from Pell: white clouds of hair on both sides of a bald dome
export const sideClouds = (color = "#ecebf3"): Part => ({
  name: "side hair clouds",
  kind: "hair",
  hooks: {
    overHead: (ctx) => {
      for (const s of [-1, 1])
        cloud(ctx, [[s * 0.47, -0.13, 0.1], [s * 0.55, 0.0, 0.115], [s * 0.49, 0.13, 0.095], [s * 0.4, -0.2, 0.07]], color);
    },
  },
});

// new: hair cap with a side-swept fringe + a round bun on top
export const hairBun = (color = "#5a2e24", bunSize = 0.2): Part => ({
  name: "hair bun",
  kind: "hair",
  hooks: {
    behindHead: () => {},
    overHead: (ctx) => {
      // bun first, so the hair cap overlaps its base
      circle(ctx, 0.02, -0.5 - bunSize * 0.75, bunSize);
      strokeFill(ctx, color, INK, LW.outline);
      line(ctx, [[-bunSize * 0.55, -0.5 - bunSize * 0.7], [bunSize * 0.5, -0.5 - bunSize * 0.95]], "rgba(0,0,0,0.25)", 0.02);
      // hair cap: outer edge follows the skull, inner edge = fringe over the forehead
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.53, 0.505, 0, Math.PI * 0.96, Math.PI * 2.04);
      ctx.bezierCurveTo(0.5, -0.12, 0.3, -0.3, 0.06, -0.27);
      ctx.bezierCurveTo(-0.1, -0.25, -0.2, -0.2, -0.3, -0.26);
      ctx.bezierCurveTo(-0.42, -0.2, -0.5, -0.06, -0.52, 0.08);
      ctx.closePath();
      strokeFill(ctx, color, INK, LW.outline);
    },
  },
});

// ---------------------------------------------------------------- hats
// from Bram: long floppy knit cap with stripes, folded brim and pompom
export const beanie = (color = "#b5443a", stripe = "#3f8f88", brim = "#8f3029"): Part => {
  const capPath = (ctx: Ctx) => {
    ctx.beginPath();
    ctx.moveTo(-0.53, -0.1);
    ctx.bezierCurveTo(-0.6, -0.55, -0.35, -0.82, 0.0, -0.84);
    ctx.bezierCurveTo(0.35, -0.86, 0.62, -0.78, 0.78, -0.48);
    ctx.bezierCurveTo(0.84, -0.36, 0.8, -0.28, 0.74, -0.26);
    ctx.bezierCurveTo(0.66, -0.4, 0.58, -0.46, 0.46, -0.44);
    ctx.bezierCurveTo(0.52, -0.3, 0.54, -0.2, 0.53, -0.1);
    ctx.closePath();
  };
  return {
    name: "floppy knit cap",
    kind: "hat",
    hooks: {
      overHead: (ctx) => {
        capPath(ctx);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.save();
        capPath(ctx);
        ctx.clip();
        ctx.fillStyle = stripe;
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
        ctx.beginPath();
        ctx.roundRect(-0.56, -0.25, 1.12, 0.17, 0.08);
        strokeFill(ctx, brim, INK, LW.outline);
        cloud(ctx, [[0.8, -0.2, 0.08], [0.86, -0.13, 0.07], [0.76, -0.1, 0.07]], "#efe6d6");
      },
    },
  };
};

// from Juno: rain hood around the face ending in a soft point
export const rainHood = (color = "#efbb2c", rim = "#c98f17", toggles = "#c2453a"): Part => ({
  name: "pointed rain hood",
  kind: "hat",
  hooks: {
    overHead: (ctx, pose) => {
      ctx.beginPath();
      ctx.moveTo(-0.6, 0.34);
      ctx.bezierCurveTo(-0.7, -0.15, -0.55, -0.6, -0.12, -0.72);
      ctx.bezierCurveTo(0.02, -0.76, 0.12, -0.86, 0.2, -0.98);
      ctx.bezierCurveTo(0.28, -0.82, 0.3, -0.72, 0.36, -0.6);
      ctx.bezierCurveTo(0.62, -0.42, 0.7, -0.1, 0.6, 0.34);
      ctx.bezierCurveTo(0.5, 0.5, 0.42, 0.52, 0.34, 0.47);
      ctx.bezierCurveTo(0.46, 0.2, 0.46, -0.28, 0.0, -0.4);
      ctx.bezierCurveTo(-0.46, -0.28, -0.46, 0.2, -0.34, 0.47);
      ctx.bezierCurveTo(-0.42, 0.52, -0.5, 0.5, -0.6, 0.34);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill("evenodd");
      ctx.strokeStyle = INK;
      ctx.lineWidth = LW.outline;
      ctx.stroke();
      if (pose.view === "front") {
        ctx.beginPath();
        ctx.moveTo(-0.34, 0.45);
        ctx.bezierCurveTo(-0.46, 0.2, -0.46, -0.28, 0.0, -0.4);
        ctx.bezierCurveTo(0.46, -0.28, 0.46, 0.2, 0.34, 0.45);
        ctx.strokeStyle = rim;
        ctx.lineWidth = 0.05;
        ctx.stroke();
        for (const s of [-1, 1]) {
          line(ctx, [[s * 0.3, 0.46], [s * 0.27, 0.7]], "#f6f0e6", 0.018);
          ellipse(ctx, s * 0.27, 0.73, 0.022, 0.035);
          strokeFill(ctx, toggles, INK, 0.012);
        }
      }
    },
  },
});

// new: flat cap with a short peak, slightly tilted
export const flatCap = (color = "#6b6f8e", band = "#4b4f6c"): Part => ({
  name: "flat cap",
  kind: "hat",
  hooks: {
    overHead: (ctx) => {
      ctx.save();
      ctx.rotate(-0.08);
      ctx.beginPath();
      ctx.moveTo(-0.56, -0.16);
      ctx.bezierCurveTo(-0.6, -0.5, -0.2, -0.62, 0.15, -0.6);
      ctx.bezierCurveTo(0.5, -0.58, 0.66, -0.42, 0.6, -0.2);
      ctx.closePath();
      strokeFill(ctx, color, INK, LW.outline);
      // peak
      ctx.beginPath();
      ctx.moveTo(-0.2, -0.2);
      ctx.bezierCurveTo(0.1, -0.24, 0.5, -0.24, 0.78, -0.12);
      ctx.bezierCurveTo(0.6, -0.06, 0.2, -0.08, -0.2, -0.12);
      ctx.closePath();
      strokeFill(ctx, band, INK, LW.outline);
      line(ctx, [[-0.3, -0.5], [0.3, -0.56]], "rgba(0,0,0,0.25)", 0.02);
      circle(ctx, 0.12, -0.6, 0.035);
      strokeFill(ctx, band, INK, 0.012);
      ctx.restore();
    },
  },
});

// new: a tall 1830s shako — a slightly flared cylinder with a black peak, a brass bugle badge and a
// round wool tuft on top (videos/2026-11-07-bridge-break-step: the riflemen)
export const shako = (body = "#2b2836", tuft = "#3f6b4f", badge = "#d6a84f"): Part => ({
  name: "tall shako",
  kind: "hat",
  hooks: {
    overHead: (ctx) => {
      // body: bottom edge on the forehead, top a little wider
      ctx.beginPath();
      ctx.moveTo(-0.5, -0.24);
      ctx.lineTo(-0.56, -1.02);
      ctx.bezierCurveTo(-0.3, -1.1, 0.3, -1.1, 0.56, -1.02);
      ctx.lineTo(0.5, -0.24);
      ctx.bezierCurveTo(0.25, -0.3, -0.25, -0.3, -0.5, -0.24);
      ctx.closePath();
      strokeFill(ctx, body, INK, LW.outline);
      // top rim + lower band
      line(ctx, [[-0.55, -0.93], [0.55, -0.93]], "rgba(255,255,255,0.18)", 0.03);
      ctx.beginPath();
      ctx.moveTo(-0.51, -0.36);
      ctx.bezierCurveTo(-0.25, -0.42, 0.25, -0.42, 0.51, -0.36);
      ctx.lineTo(0.5, -0.26);
      ctx.bezierCurveTo(0.25, -0.32, -0.25, -0.32, -0.5, -0.26);
      ctx.closePath();
      strokeFill(ctx, "#1d1a26", INK, LW.detail);
      // peak over the eyes
      ctx.beginPath();
      ctx.moveTo(-0.52, -0.26);
      ctx.bezierCurveTo(-0.3, -0.14, 0.3, -0.14, 0.52, -0.26);
      ctx.bezierCurveTo(0.3, -0.22, -0.3, -0.22, -0.52, -0.26);
      ctx.closePath();
      strokeFill(ctx, "#15131c", INK, LW.detail);
      // bugle-horn badge
      ctx.beginPath();
      ctx.arc(0, -0.62, 0.11, Math.PI * 0.1, Math.PI * 1.9);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.06;
      ctx.stroke();
      ctx.strokeStyle = badge;
      ctx.lineWidth = 0.035;
      ctx.stroke();
      circle(ctx, 0.12, -0.64, 0.03);
      strokeFill(ctx, badge, INK, 0.012);
      // wool tuft on top
      circle(ctx, 0, -1.13, 0.11);
      strokeFill(ctx, tuft, INK, LW.outline);
      line(ctx, [[-0.06, -1.18], [0.05, -1.2]], "rgba(255,255,255,0.25)", 0.02);
    },
  },
});

// ---------------------------------------------------------------- face
// from Pell: a brass loupe over the right eye (magnified eye)
export const loupe = (): Part => ({
  name: "brass loupe",
  kind: "face",
  hooks: {
    overFace: (ctx, pose) => {
      const x = 0.17 + pose.lookX * 0.045;
      const yy = 0.03 + pose.lookY * 0.035;
      line(ctx, [[x + 0.12, yy - 0.03], [0.49, -0.1]], "#4a3426", 0.035);
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
      circle(ctx, x, yy, 0.12);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 0.075;
      ctx.stroke();
      ctx.strokeStyle = "#c08a3e";
      ctx.lineWidth = 0.042;
      ctx.stroke();
    },
  },
});

// new: big round glasses (fixed to the head; the eyes move inside). fog = fogged lenses: an opaque cool
// blue-white (it must read against pale skin under warm light) with a few small droplets; it hides the eyes.
export const roundGlasses = (frame = INK, r = 0.105, fog = false): Part => {
  // one lens with its center at (cx, cy); s = side
  const lens = (ctx: Ctx, cx: number, cy: number, s: number) => {
    circle(ctx, cx, cy, r);
    ctx.fillStyle = fog ? "#f4f8fc" : "rgba(225,238,248,0.22)";
    ctx.fill();
    if (fog) {
      for (const [dx, dy, dr] of [[-0.045, -0.03, 0.016], [0.04, 0.02, 0.012], [-0.01, 0.055, 0.01], [0.05, -0.045, 0.009]]) {
        circle(ctx, cx + s * dx, cy + dy, dr);
        ctx.fillStyle = "#b4c8d8";
        ctx.fill();
      }
      circle(ctx, cx, cy, r); // droplets replaced the path: the frame is stroked on the lens again
    }
    ctx.strokeStyle = frame;
    ctx.lineWidth = 0.028;
    ctx.stroke();
    // glint
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, Math.PI * 1.15, Math.PI * 1.45);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 0.014;
    ctx.stroke();
  };
  return {
    name: "round glasses",
    kind: "face",
    glasses: true,
    turns: true,
    hooks: {
      overFace: (ctx, pose) => {
        const turn = faceTurnOf(pose);
        if (turn) {
          // v4 3D face: lenses at the turned eye places, the bridge between them, arms along the round head
          for (const s of [-1, 1]) atFace(ctx, turn, s * 0.17, 0.035, () => lens(ctx, 0, 0, s));
          const b0 = faceProj(-0.17 + r, 0.03, turn);
          const bm = faceProj(0, -0.01, turn);
          const b1 = faceProj(0.17 - r, 0.03, turn);
          ctx.beginPath();
          ctx.moveTo(b0.x, b0.y);
          ctx.quadraticCurveTo(bm.x, bm.y, b1.x, b1.y);
          ctx.strokeStyle = frame;
          ctx.lineWidth = 0.022;
          ctx.stroke();
          for (const s of [-1, 1]) {
            const pts: [number, number][] = [];
            for (let i = 0; i <= 8; i++) {
              const k = i / 8;
              const p = faceProj(s * (0.17 + r + (FACE.glassesArm - 0.17 - r) * k), 0.02 - 0.03 * k, turn);
              if (p.vis < 0.05) break;
              pts.push([p.x, p.y]);
            }
            if (pts.length > 1) line(ctx, pts, frame, 0.02);
          }
          return;
        }
        for (const s of [-1, 1]) lens(ctx, s * 0.17, 0.035, s);
        ctx.beginPath();
        ctx.moveTo(-0.17 + r, 0.03);
        ctx.quadraticCurveTo(0, -0.01, 0.17 - r, 0.03);
        ctx.strokeStyle = frame;
        ctx.lineWidth = 0.022;
        ctx.stroke();
        for (const s of [-1, 1]) line(ctx, [[s * (0.17 + r), 0.02], [s * 0.48, -0.02]], frame, 0.02);
      },
    },
  };
};

// new: a thick mustache under the nose line
export const mustache = (color = "#4a3a3a"): Part => ({
  name: "mustache",
  kind: "face",
  hooks: {
    overFace: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(0, 0.13);
      ctx.bezierCurveTo(0.08, 0.1, 0.18, 0.12, 0.2, 0.19);
      ctx.bezierCurveTo(0.12, 0.2, 0.05, 0.19, 0, 0.17);
      ctx.bezierCurveTo(-0.05, 0.19, -0.12, 0.2, -0.2, 0.19);
      ctx.bezierCurveTo(-0.18, 0.12, -0.08, 0.1, 0, 0.13);
      ctx.closePath();
      strokeFill(ctx, color, INK, LW.detail);
    },
  },
});

// ---------------------------------------------------------------- outfits (torso, clipped to the body)
// from Pell: leather apron with a pocket and stitches
export const apron = (color = "#7a4a34", pocket = "#6a3e2b"): Part => ({
  name: "apron",
  kind: "outfit",
  hooks: {
    torso: (ctx, pose) => {
      const y = (v: number) => torsoY(v, pose.breathe);
      ctx.beginPath();
      ctx.moveTo(-0.22, y(-1.98));
      ctx.lineTo(0.22, y(-1.98));
      ctx.lineTo(0.3, y(-1.05));
      ctx.lineTo(-0.3, y(-1.05));
      ctx.closePath();
      strokeFill(ctx, color, INK, LW.detail);
      ctx.beginPath();
      ctx.rect(-0.13, y(-1.66), 0.27, 0.17);
      strokeFill(ctx, pocket, INK, LW.detail);
      if (detailBg()) return; // background actor (look L2): apron + pocket only
      ctx.setLineDash([0.025, 0.02]);
      line(ctx, [[-0.19, y(-1.93)], [0.19, y(-1.93)]], "#c99a72", 0.01);
      ctx.setLineDash([]);
    },
  },
});

// new: cardigan with a V-neck, buttons and two pockets
export const cardigan = (collar = "#efe6d6", buttons = "#e8c87a"): Part => ({
  name: "cardigan",
  kind: "outfit",
  hooks: {
    torso: (ctx, pose) => {
      const y = (v: number) => torsoY(v, pose.breathe);
      ctx.beginPath();
      ctx.moveTo(-0.17, y(-2.2));
      ctx.lineTo(0, y(-1.78));
      ctx.lineTo(0.17, y(-2.2));
      ctx.closePath();
      strokeFill(ctx, collar, INK, LW.detail);
      line(ctx, [[0, y(-1.78)], [0.0, y(-1.04)]], INK, LW.detail * 0.8);
      if (detailBg()) return; // background actor (look L2): collar + opening line only
      for (const by of [-1.66, -1.46, -1.26]) {
        circle(ctx, 0.055, y(by), 0.026);
        strokeFill(ctx, buttons, INK, 0.011);
      }
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.rect(s * 0.2 - 0.08, y(-1.42), 0.16, 0.12);
        ctx.strokeStyle = INK;
        ctx.lineWidth = LW.detail * 0.7;
        ctx.stroke();
      }
    },
  },
});

// new: 1830s rifleman's jacket — red collar, three rows of dark buttons, a black cross belt
export const riflemanJacket = (collar = "#b0413a", buttons = "#1d1a26", belt = "#1d1a26"): Part => ({
  name: "rifleman jacket",
  kind: "outfit",
  hooks: {
    torso: (ctx, pose) => {
      const y = (v: number) => torsoY(v, pose.breathe);
      // high red collar
      ctx.beginPath();
      ctx.roundRect(-0.27, y(-2.24), 0.54, 0.14, 0.05);
      strokeFill(ctx, collar, INK, LW.detail);
      // cross belt (screen-left shoulder to screen-right hip)
      ctx.beginPath();
      ctx.moveTo(-0.3, y(-2.02));
      ctx.lineTo(-0.2, y(-2.1));
      ctx.lineTo(0.4, y(-1.2));
      ctx.lineTo(0.3, y(-1.12));
      ctx.closePath();
      strokeFill(ctx, belt, INK, LW.detail * 0.8);
      if (detailBg()) return; // background actor (look L2): collar + cross belt only
      // three rows of buttons
      for (const bx of [-0.16, 0, 0.16])
        for (const by of [-1.9, -1.7, -1.5, -1.3]) {
          if (bx > 0 && by < -1.55) continue; // hidden under the belt
          circle(ctx, bx, y(by), 0.022);
          strokeFill(ctx, buttons, INK, 0.008);
        }
      // waist band
      line(ctx, [[-0.33, y(-1.12)], [0.33, y(-1.12)]], INK, LW.detail * 0.9);
    },
  },
});

// ---------------------------------------------------------------- accessories
// new: a rifle held upright in the screen-left hand (follows armL), barrel up past the shoulder
export const rifle = (wood = "#8b5634", metal = "#4b4a66"): Part => ({
  name: "rifle",
  kind: "accessory",
  holds: -1,
  hooks: {
    overArms: (ctx, pose) => {
      const h = armPoints(-1, pose.armL, pose.elbowL ?? 0.06);
      ctx.save();
      ctx.translate(h.hx - 0.02, h.hy);
      ctx.rotate(0.05);
      // stock (below the hand)
      ctx.beginPath();
      ctx.moveTo(-0.05, -0.05);
      ctx.lineTo(0.05, -0.05);
      ctx.lineTo(0.08, 0.32);
      ctx.lineTo(-0.06, 0.34);
      ctx.closePath();
      strokeFill(ctx, wood, INK, LW.detail);
      // fore-stock + barrel (above the hand)
      ctx.beginPath();
      ctx.rect(-0.035, -0.95, 0.07, 0.92);
      strokeFill(ctx, wood, INK, LW.detail);
      ctx.beginPath();
      ctx.rect(-0.018, -1.25, 0.036, 0.4);
      strokeFill(ctx, metal, INK, LW.detail * 0.8);
      ctx.restore();
      circle(ctx, h.hx, h.hy, 0.058);
      ctx.fillStyle = INK;
      ctx.fill();
    },
  },
});

// from Bram: knitted scarf band with a hanging, fringed end
export const scarf = (color = "#3f8f88", stripe = "#2f6e69"): Part => ({
  name: "scarf",
  kind: "accessory",
  hooks: {
    overArms: (ctx, pose) => {
      const y = (v: number) => torsoY(v, pose.breathe);
      ctx.beginPath();
      ctx.roundRect(-0.36, y(-2.22), 0.72, 0.19, 0.09);
      strokeFill(ctx, color, INK, LW.outline);
      ctx.beginPath();
      ctx.moveTo(0.08, y(-2.06));
      ctx.lineTo(0.22, y(-2.06));
      ctx.lineTo(0.26, y(-1.58));
      ctx.lineTo(0.11, y(-1.6));
      ctx.closePath();
      strokeFill(ctx, color, INK, LW.outline * 0.9);
      line(ctx, [[0.115, y(-1.75)], [0.245, y(-1.74)]], stripe, 0.03);
      for (const fx of [0.13, 0.17, 0.21, 0.245]) line(ctx, [[fx, y(-1.6)], [fx + 0.005, y(-1.53)]], INK, 0.014);
    },
  },
});

// from Juno: satchel at the hip with a diagonal strap
export const satchel = (color = "#8b5634", strap = "#7c4a2c"): Part => ({
  name: "satchel",
  kind: "accessory",
  hooks: {
    torso: (ctx, pose) => {
      const y = (v: number) => torsoY(v, pose.breathe);
      ctx.beginPath();
      ctx.moveTo(-0.34, y(-2.06));
      ctx.lineTo(-0.25, y(-2.12));
      ctx.lineTo(0.4, y(-1.3));
      ctx.lineTo(0.31, y(-1.22));
      ctx.closePath();
      strokeFill(ctx, strap, INK, LW.detail * 0.8);
    },
    underArms: (ctx, pose) => {
      const y = (v: number) => torsoY(v, pose.breathe);
      ctx.beginPath();
      ctx.roundRect(0.2, y(-1.42), 0.38, 0.33, 0.06);
      strokeFill(ctx, color, INK, LW.outline);
      ctx.beginPath();
      ctx.moveTo(0.2, y(-1.36));
      ctx.lineTo(0.58, y(-1.36));
      ctx.lineTo(0.56, y(-1.22));
      ctx.quadraticCurveTo(0.39, y(-1.18), 0.22, y(-1.22));
      ctx.closePath();
      strokeFill(ctx, "#6d4127", INK, LW.detail);
    },
  },
});

// new: a clipboard held in the screen-right hand (follows armR)
export const clipboard = (paper = "#f3ead8"): Part => ({
  name: "clipboard",
  kind: "accessory",
  holds: 1,
  hooks: {
    overArms: (ctx, pose) => {
      const h = armPoints(1, pose.armR, pose.elbowR ?? 0.06);
      ctx.save();
      ctx.translate(h.hx - 0.05, h.hy - 0.1);
      ctx.rotate(-0.12);
      ctx.beginPath();
      ctx.roundRect(-0.16, -0.22, 0.32, 0.42, 0.03);
      strokeFill(ctx, "#a0784f", INK, LW.detail);
      ctx.beginPath();
      ctx.rect(-0.12, -0.17, 0.24, 0.33);
      strokeFill(ctx, paper, INK, 0.01);
      for (const ly of [-0.1, -0.04, 0.02, 0.08]) line(ctx, [[-0.08, ly], [0.08, ly]], "#9a96a8", 0.012);
      ctx.beginPath();
      ctx.roundRect(-0.06, -0.25, 0.12, 0.06, 0.02);
      strokeFill(ctx, "#8a8aa0", INK, 0.01);
      ctx.restore();
      circle(ctx, h.hx, h.hy, 0.058);
      ctx.fillStyle = INK;
      ctx.fill();
    },
  },
});

// ================================================================ videos/2026-11-12-furnace-ghosts (2026-11-13)
// Lena's family in the old house, the priest, the furnace repairman and the man in the dark coat (the "ghost").

// new: hair cap with a middle part + two braids hanging in front of the shoulders, with ribbons (Lena)
export const braids = (color = "#6b3a2a", ribbon = "#e8c87a"): Part => ({
  name: "two braids",
  kind: "hair",
  hooks: {
    overHead: (ctx) => {
      for (const s of [-1, 1]) {
        // braid: a chain of fat ellipses from the side of the head down past the chin
        const pts: [number, number][] = [[s * 0.47, 0.12], [s * 0.5, 0.3], [s * 0.51, 0.48], [s * 0.5, 0.65], [s * 0.48, 0.8]];
        for (const [x, y] of pts) {
          ellipse(ctx, x, y, 0.085, 0.1, s * 0.15);
          strokeFill(ctx, color, INK, LW.outline * 0.9);
        }
        // ribbon bow + a small tuft under it
        ctx.beginPath();
        ctx.moveTo(s * 0.48, 0.9);
        ctx.lineTo(s * 0.36, 0.83);
        ctx.lineTo(s * 0.37, 0.97);
        ctx.closePath();
        strokeFill(ctx, ribbon, INK, LW.detail);
        ctx.beginPath();
        ctx.moveTo(s * 0.48, 0.9);
        ctx.lineTo(s * 0.6, 0.83);
        ctx.lineTo(s * 0.59, 0.97);
        ctx.closePath();
        strokeFill(ctx, ribbon, INK, LW.detail);
        ctx.beginPath();
        ctx.moveTo(s * 0.44, 0.94);
        ctx.lineTo(s * 0.48, 1.06);
        ctx.lineTo(s * 0.52, 0.94);
        ctx.closePath();
        strokeFill(ctx, color, INK, LW.detail);
      }
      // hair cap with a middle part
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.53, 0.505, 0, Math.PI * 0.94, Math.PI * 2.06);
      ctx.bezierCurveTo(0.48, -0.05, 0.28, -0.24, 0.02, -0.3);
      ctx.bezierCurveTo(-0.26, -0.24, -0.46, -0.06, -0.52, 0.1);
      ctx.closePath();
      strokeFill(ctx, color, INK, LW.outline);
      line(ctx, [[0.0, -0.5], [0.02, -0.3]], "rgba(0,0,0,0.3)", 0.02);
    },
  },
});

// new: pajama top with a round collar, three buttons and little stars (Lena)
export const pajamas = (collar = "#f1e3ec", stars = "#f3d27a"): Part => ({
  name: "pajamas",
  kind: "outfit",
  hooks: {
    torso: (ctx, pose) => {
      const y = (v: number) => torsoY(v, pose.breathe);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, y(-2.18));
        ctx.quadraticCurveTo(s * 0.22, y(-2.16), s * 0.24, y(-1.98));
        ctx.quadraticCurveTo(s * 0.1, y(-1.94), 0, y(-2.05));
        ctx.closePath();
        strokeFill(ctx, collar, INK, LW.detail);
      }
      if (detailBg()) return;
      for (const by of [-1.8, -1.55, -1.3]) {
        circle(ctx, 0, y(by), 0.025);
        strokeFill(ctx, collar, INK, 0.01);
      }
      for (const [sx, sy] of [[-0.18, -1.7], [0.2, -1.45], [-0.15, -1.25], [0.17, -1.85]] as [number, number][]) {
        ctx.beginPath();
        for (let k = 0; k < 5; k++) {
          const a = -Math.PI / 2 + (k * 4 * Math.PI) / 5;
          const px = sx + Math.cos(a) * 0.04, py = y(sy) + Math.sin(a) * 0.04;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = stars;
        ctx.fill();
      }
    },
  },
});

// new: long wavy hair: two locks falling on the shoulders at the sides (the torso stays visible), side part
// (Lena's mother)
export const longHair = (color = "#3a2a2a"): Part => ({
  name: "long wavy hair",
  kind: "hair",
  hooks: {
    behindHead: (ctx) => {
      ctx.beginPath();
      ctx.moveTo(-0.5, -0.1);
      ctx.bezierCurveTo(-0.64, 0.25, -0.56, 0.5, -0.64, 0.74);
      ctx.quadraticCurveTo(-0.52, 0.8, -0.44, 0.72);
      ctx.quadraticCurveTo(-0.38, 0.8, -0.3, 0.7);
      ctx.lineTo(-0.28, 0.3);
      ctx.lineTo(0.28, 0.3);
      ctx.lineTo(0.3, 0.7);
      ctx.quadraticCurveTo(0.38, 0.8, 0.44, 0.72);
      ctx.quadraticCurveTo(0.52, 0.8, 0.64, 0.74);
      ctx.bezierCurveTo(0.56, 0.5, 0.64, 0.25, 0.5, -0.1);
      ctx.closePath();
      strokeFill(ctx, color, INK, LW.outline);
    },
    overHead: (ctx) => {
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.535, 0.51, 0, Math.PI * 0.92, Math.PI * 2.08);
      ctx.bezierCurveTo(0.5, 0.0, 0.42, -0.2, 0.16, -0.3);
      ctx.bezierCurveTo(-0.1, -0.2, -0.38, -0.16, -0.53, 0.14);
      ctx.closePath();
      strokeFill(ctx, color, INK, LW.outline);
      line(ctx, [[0.16, -0.3], [0.1, -0.5]], "rgba(0,0,0,0.3)", 0.02);
    },
  },
});

// new: a dressing robe with crossed lapels and a tied belt (Lena's mother)
export const robe = (lapel = "#e6ddcf", belt = "#355a72"): Part => ({
  name: "robe",
  kind: "outfit",
  hooks: {
    torso: (ctx, pose) => {
      const y = (v: number) => torsoY(v, pose.breathe);
      ctx.beginPath();
      ctx.moveTo(-0.16, y(-2.2));
      ctx.lineTo(0.12, y(-1.5));
      ctx.lineTo(0.02, y(-1.5));
      ctx.lineTo(-0.24, y(-2.14));
      ctx.closePath();
      strokeFill(ctx, lapel, INK, LW.detail);
      ctx.beginPath();
      ctx.moveTo(0.16, y(-2.2));
      ctx.lineTo(-0.02, y(-1.62));
      ctx.lineTo(0.06, y(-1.58));
      ctx.lineTo(0.24, y(-2.14));
      ctx.closePath();
      strokeFill(ctx, lapel, INK, LW.detail);
      ctx.beginPath();
      ctx.rect(-0.31, y(-1.5), 0.62, 0.09);
      strokeFill(ctx, belt, INK, LW.detail);
      if (detailBg()) return;
      line(ctx, [[0.06, y(-1.42)], [0.0, y(-1.18)]], belt, 0.045);
      line(ctx, [[0.1, y(-1.42)], [0.15, y(-1.2)]], belt, 0.045);
    },
  },
});

// new: short neat hair with a side part (men: Lena's father, the priest)
export const shortHair = (color = "#5a3a2a"): Part => ({
  name: "short side-part hair",
  kind: "hair",
  hooks: {
    overHead: (ctx) => {
      ctx.beginPath();
      ctx.ellipse(0, 0, 0.525, 0.5, 0, Math.PI * 1.02, Math.PI * 1.98);
      ctx.bezierCurveTo(0.52, -0.2, 0.36, -0.32, 0.12, -0.33);
      ctx.bezierCurveTo(-0.14, -0.36, -0.4, -0.28, -0.52, -0.1);
      ctx.closePath();
      strokeFill(ctx, color, INK, LW.outline);
      line(ctx, [[-0.22, -0.48], [-0.16, -0.34]], "rgba(0,0,0,0.3)", 0.02);
    },
  },
});

// new: a knitted vest with a diamond (argyle) pattern over a white shirt collar (Lena's father)
export const sweaterVest = (diamond = "#8e5a40", collar = "#efe6d6"): Part => ({
  name: "argyle sweater vest",
  kind: "outfit",
  hooks: {
    torso: (ctx, pose) => {
      const y = (v: number) => torsoY(v, pose.breathe);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(0, y(-2.12));
        ctx.lineTo(s * 0.18, y(-2.2));
        ctx.lineTo(s * 0.12, y(-2.02));
        ctx.closePath();
        strokeFill(ctx, collar, INK, LW.detail);
      }
      ctx.beginPath();
      ctx.moveTo(-0.13, y(-2.08));
      ctx.lineTo(0, y(-1.82));
      ctx.lineTo(0.13, y(-2.08));
      ctx.strokeStyle = INK;
      ctx.lineWidth = LW.detail;
      ctx.stroke();
      if (detailBg()) return;
      for (const [dx, dy] of [[-0.16, -1.55], [0.16, -1.55], [0, -1.32], [-0.16, -1.12], [0.16, -1.12]] as [number, number][]) {
        ctx.beginPath();
        ctx.moveTo(dx, y(dy - 0.11));
        ctx.lineTo(dx + 0.08, y(dy));
        ctx.lineTo(dx, y(dy + 0.11));
        ctx.lineTo(dx - 0.08, y(dy));
        ctx.closePath();
        strokeFill(ctx, diamond, INK, 0.012);
      }
    },
  },
});

// new: a priest's white collar tab and a row of small cassock buttons (the priest)
export const clericalCollar = (tab = "#f4efe6", buttons = "#4a4458"): Part => ({
  name: "clerical collar",
  kind: "outfit",
  hooks: {
    torso: (ctx, pose) => {
      const y = (v: number) => torsoY(v, pose.breathe);
      ctx.beginPath();
      ctx.roundRect(-0.2, y(-2.22), 0.4, 0.09, 0.04);
      strokeFill(ctx, "#1d1a26", INK, LW.detail);
      ctx.beginPath();
      ctx.rect(-0.05, y(-2.21), 0.1, 0.075);
      strokeFill(ctx, tab, INK, 0.01);
      if (detailBg()) return;
      for (let by = -2.0; by <= -1.1; by += 0.15) {
        circle(ctx, 0, y(by), 0.02);
        strokeFill(ctx, buttons, INK, 0.008);
      }
    },
  },
});

// new: a small black book with a gold cross held in the screen-right hand (the priest)
export const prayerBook = (cover = "#26222e", mark = "#d6a84f"): Part => ({
  name: "prayer book",
  kind: "accessory",
  holds: 1,
  hooks: {
    overArms: (ctx, pose) => {
      const h = armPoints(1, pose.armR, pose.elbowR ?? 0.06);
      ctx.save();
      ctx.translate(h.hx - 0.04, h.hy - 0.08);
      ctx.rotate(-0.1);
      ctx.beginPath();
      ctx.roundRect(-0.13, -0.17, 0.26, 0.32, 0.03);
      strokeFill(ctx, cover, INK, LW.detail);
      line(ctx, [[-0.12, 0.12], [0.12, 0.12]], "#e6ddcf", 0.03);
      line(ctx, [[0, -0.11], [0, 0.03]], mark, 0.03);
      line(ctx, [[-0.05, -0.06], [0.05, -0.06]], mark, 0.03);
      ctx.restore();
    },
  },
});

// new: denim overalls (bib, straps, a chest pocket) over a work shirt (the repairman)
export const overalls = (denim = "#4f6fa8", stitch = "#e8c87a"): Part => ({
  name: "overalls",
  kind: "outfit",
  hooks: {
    torso: (ctx, pose) => {
      const y = (v: number) => torsoY(v, pose.breathe);
      for (const s of [-1, 1]) line(ctx, [[s * 0.2, y(-2.18)], [s * 0.15, y(-1.8)]], denim, 0.06);
      ctx.beginPath();
      ctx.moveTo(-0.2, y(-1.82));
      ctx.lineTo(0.2, y(-1.82));
      ctx.lineTo(0.32, y(-1.04));
      ctx.lineTo(-0.32, y(-1.04));
      ctx.closePath();
      strokeFill(ctx, denim, INK, LW.detail);
      ctx.beginPath();
      ctx.rect(-0.1, y(-1.72), 0.2, 0.15);
      strokeFill(ctx, denim, INK, LW.detail * 0.8);
      if (detailBg()) return;
      for (const s of [-1, 1]) {
        circle(ctx, s * 0.15, y(-1.8), 0.025);
        strokeFill(ctx, stitch, INK, 0.01);
      }
      ctx.setLineDash([0.02, 0.018]);
      line(ctx, [[-0.08, y(-1.62)], [0.08, y(-1.62)]], stitch, 0.01);
      ctx.setLineDash([]);
    },
  },
});

// new: a big adjustable wrench held in the screen-right hand (the repairman)
export const wrench = (metal = "#a9b0c0", dark = "#5c5566"): Part => ({
  name: "wrench",
  kind: "accessory",
  holds: 1,
  hooks: {
    overArms: (ctx, pose) => {
      const h = armPoints(1, pose.armR, pose.elbowR ?? 0.06);
      ctx.save();
      ctx.translate(h.hx, h.hy);
      ctx.rotate(0.35);
      ctx.beginPath();
      ctx.roundRect(-0.04, -0.12, 0.08, 0.5, 0.03);
      strokeFill(ctx, metal, INK, LW.detail);
      // the jaw (open C) at the top
      ctx.beginPath();
      ctx.moveTo(-0.1, -0.12);
      ctx.lineTo(-0.1, -0.28);
      ctx.lineTo(-0.02, -0.28);
      ctx.lineTo(-0.02, -0.2);
      ctx.lineTo(0.04, -0.2);
      ctx.lineTo(0.04, -0.3);
      ctx.lineTo(0.11, -0.3);
      ctx.lineTo(0.1, -0.12);
      ctx.closePath();
      strokeFill(ctx, metal, INK, LW.detail);
      line(ctx, [[-0.03, -0.02], [0.03, -0.02]], dark, 0.02);
      ctx.restore();
    },
  },
});

// new: a wide-brimmed dark hat pulled low, its shadow over the eyes (the man in the dark coat)
export const wideHat = (color = "#1f1c28", band = "#3a3444"): Part => ({
  name: "wide-brim hat",
  kind: "hat",
  hooks: {
    overHead: (ctx) => {
      // crown
      ctx.beginPath();
      ctx.moveTo(-0.36, -0.22);
      ctx.bezierCurveTo(-0.38, -0.6, -0.2, -0.7, 0, -0.7);
      ctx.bezierCurveTo(0.2, -0.7, 0.38, -0.6, 0.36, -0.22);
      ctx.closePath();
      strokeFill(ctx, color, INK, LW.outline);
      ctx.beginPath();
      ctx.rect(-0.36, -0.32, 0.72, 0.09);
      strokeFill(ctx, band, INK, LW.detail);
      // brim, low over the brow
      ellipse(ctx, 0, -0.2, 0.78, 0.1);
      strokeFill(ctx, color, INK, LW.outline);
    },
    overFace: (ctx) => {
      // the brim's shadow over the eyes
      ctx.beginPath();
      ctx.ellipse(0, -0.08, 0.46, 0.13, 0, 0, Math.PI);
      ctx.fillStyle = "rgba(20,16,30,0.45)";
      ctx.fill();
    },
  },
});

// new: a long dark coat with lapels and flaps falling to the knees (the man in the dark coat)
export const longCoat = (lapel = "#3a3444", buttons = "#6b6378", tail = "#2a2836"): Part => ({
  name: "long coat",
  kind: "outfit",
  hooks: {
    behindBody: (ctx) => {
      // the coat's tails: from under the torso (hidden behind it) flaring down to the knees, split in the middle
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 0.02, -1.5);
        ctx.lineTo(s * 0.3, -1.5);
        ctx.lineTo(s * 0.4, -0.55);
        ctx.lineTo(s * 0.05, -0.6);
        ctx.closePath();
        strokeFill(ctx, tail, INK, LW.outline);
      }
    },
    torso: (ctx, pose) => {
      const y = (v: number) => torsoY(v, pose.breathe);
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(s * 0.06, y(-2.2));
        ctx.lineTo(s * 0.26, y(-2.12));
        ctx.lineTo(s * 0.06, y(-1.62));
        ctx.closePath();
        strokeFill(ctx, lapel, INK, LW.detail);
      }
      line(ctx, [[0, y(-1.62)], [0, y(-1.04)]], INK, LW.detail);
      if (detailBg()) return;
      for (const by of [-1.5, -1.25]) {
        circle(ctx, 0.07, y(by), 0.026);
        strokeFill(ctx, buttons, INK, 0.01);
      }
    },
  },
});
