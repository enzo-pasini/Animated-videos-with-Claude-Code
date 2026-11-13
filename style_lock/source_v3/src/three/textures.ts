// Procedural "painted" textures (Canvas2D → THREE.CanvasTexture). Deterministic (seeded).
import * as THREE from "three";

export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const cache = new Map<string, THREE.Texture>();

const make = (
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, r: () => number) => void,
  opts: { repeat?: [number, number]; srgb?: boolean } = {},
) => {
  const k = key + JSON.stringify(opts);
  const hit = cache.get(k);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  draw(ctx, rng(key.split("").reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7)));
  const t = new THREE.CanvasTexture(c);
  if (opts.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (opts.repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(opts.repeat[0], opts.repeat[1]);
  }
  t.needsUpdate = true;
  cache.set(k, t);
  return t;
};

const jitter = (hex: string, r: () => number, amt = 12) => {
  const c = new THREE.Color(hex);
  const d = () => (r() - 0.5) * (amt / 255) * 2;
  return `rgb(${Math.round(THREE.MathUtils.clamp(c.r + d(), 0, 1) * 255)},${Math.round(
    THREE.MathUtils.clamp(c.g + d(), 0, 1) * 255,
  )},${Math.round(THREE.MathUtils.clamp(c.b + d(), 0, 1) * 255)})`;
};

// soft painterly noise blotches
const blotches = (ctx: CanvasRenderingContext2D, r: () => number, n: number, colors: string[], size: number, alpha: number) => {
  const { width: w, height: h } = ctx.canvas;
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = size * (0.4 + r());
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const col = colors[Math.floor(r() * colors.length)];
    g.addColorStop(0, col);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = alpha * (0.5 + r() * 0.5);
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  ctx.globalAlpha = 1;
};

const INK_T = "rgba(32,22,40,0.85)";

export const cobbleTex = (repeat: [number, number]) =>
  make(
    "cobble",
    1024,
    1024,
    (ctx, r) => {
      ctx.fillStyle = "#4a4052";
      ctx.fillRect(0, 0, 1024, 1024);
      const rows = 9;
      const rh = 1024 / rows;
      for (let row = 0; row < rows; row++) {
        let x = -r() * 60;
        while (x < 1024) {
          const w = 85 + r() * 55;
          const y = row * rh;
          for (const ox of [0, x + w > 1024 ? -1024 : 9999]) {
            if (ox === 9999) continue;
            ctx.beginPath();
            ctx.roundRect(x + ox + 5, y + 6, w - 10, rh - 12, 22);
            ctx.fillStyle = jitter("#7f7c92", r, 7);
            ctx.fill();
            // top-left light
            ctx.save();
            ctx.clip();
            ctx.fillStyle = "rgba(255,240,230,0.10)";
            ctx.beginPath();
            ctx.ellipse(x + ox + w * 0.35, y + rh * 0.3, w * 0.4, rh * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.beginPath();
            ctx.roundRect(x + ox + 5, y + 6, w - 10, rh - 12, 22);
            ctx.strokeStyle = INK_T;
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          x += w;
        }
      }
      blotches(ctx, r, 60, ["#2c2236", "#a9a6bc"], 120, 0.12);
    },
    { repeat },
  );

export const slabTex = (repeat: [number, number]) =>
  make(
    "slab",
    1024,
    512,
    (ctx, r) => {
      ctx.fillStyle = "#9b919c";
      ctx.fillRect(0, 0, 1024, 512);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = jitter("#a39aa6", r, 10);
        ctx.fillRect(i * 256 + 3, 3, 250, 506);
        ctx.strokeStyle = INK_T;
        ctx.lineWidth = 3;
        ctx.strokeRect(i * 256 + 3, 3, 250, 506);
      }
      blotches(ctx, r, 40, ["#5e5466", "#c8c0ca"], 90, 0.12);
    },
    { repeat },
  );

export const plasterTex = (key: string, base: string, repeat: [number, number], brick = "#9a5b4c") =>
  make(
    "plaster-" + key,
    1024,
    1024,
    (ctx, r) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, 1024, 1024);
      blotches(ctx, r, 140, ["rgba(255,250,240,1)", "rgba(60,40,60,1)"], 110, 0.07);
      // exposed brick patches
      for (let p = 0; p < 3; p++) {
        const px = r() * 800 + 50;
        const py = r() * 800 + 50;
        const cols = 2 + Math.floor(r() * 3);
        const rowsN = 2 + Math.floor(r() * 3);
        for (let j = 0; j < rowsN; j++)
          for (let i = 0; i < cols - (j % 2 ? 1 : 0); i++) {
            const bx = px + i * 52 + (j % 2 ? 26 : 0);
            const by = py + j * 24;
            ctx.fillStyle = jitter(brick, r, 14);
            ctx.fillRect(bx, by, 48, 20);
            ctx.strokeStyle = INK_T;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(bx, by, 48, 20);
          }
      }
      // cracks
      for (let i = 0; i < 4; i++) {
        let x = r() * 1024;
        let y = r() * 1024;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 4; k++) {
          x += (r() - 0.5) * 50;
          y += 15 + r() * 25;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(32,22,40,0.55)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    },
    { repeat },
  );

export const woodTex = (repeat: [number, number] = [1, 1]) =>
  make(
    "wood",
    512,
    1024,
    (ctx, r) => {
      const planks = 4;
      for (let i = 0; i < planks; i++) {
        ctx.fillStyle = jitter("#8e5547", r, 12);
        ctx.fillRect(i * 128, 0, 128, 1024);
        for (let g = 0; g < 6; g++) {
          const gx = i * 128 + 15 + r() * 98;
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.bezierCurveTo(gx + 8, 300, gx - 8, 700, gx + 4, 1024);
          ctx.strokeStyle = "rgba(60,25,25,0.25)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        ctx.strokeStyle = INK_T;
        ctx.lineWidth = 4;
        ctx.strokeRect(i * 128 + 2, 2, 124, 1020);
      }
      // cross brace
      ctx.fillStyle = "#7a463a";
      ctx.fillRect(0, 470, 512, 80);
      ctx.strokeStyle = INK_T;
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 470, 508, 80);
    },
    { repeat },
  );

export const roofTex = (repeat: [number, number]) =>
  make(
    "roof",
    512,
    512,
    (ctx, r) => {
      ctx.fillStyle = "#3e2a36";
      ctx.fillRect(0, 0, 512, 512);
      const rows = 8;
      const rh = 512 / rows;
      for (let j = 0; j < rows; j++)
        for (let i = -1; i < 9; i++) {
          const x = i * 64 + (j % 2 ? 32 : 0);
          const y = j * rh;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + rh * 0.6);
          ctx.quadraticCurveTo(x + 32, y + rh * 1.15, x + 64, y + rh * 0.6);
          ctx.lineTo(x + 64, y);
          ctx.fillStyle = jitter("#5d3d48", r, 12);
          ctx.fill();
          ctx.strokeStyle = INK_T;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
    },
    { repeat },
  );

// Warm shop interior seen through the window: shelves of clocks (original).
export const shopInteriorTex = () =>
  make("shop", 1024, 768, (ctx, r) => {
    const g = ctx.createRadialGradient(512, 420, 40, 512, 420, 700);
    g.addColorStop(0, "#ffe3a8");
    g.addColorStop(0.5, "#f6b45e");
    g.addColorStop(1, "#b8602e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 768);
    // shelves
    for (const sy of [250, 470]) {
      ctx.fillStyle = "rgba(110,52,30,0.85)";
      ctx.fillRect(0, sy, 1024, 22);
      for (let i = 0; i < 7; i++) {
        const cx = 70 + i * 140 + r() * 30;
        const rad = 34 + r() * 22;
        const cy = sy - rad - 4;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fillStyle = "#fff1d2";
        ctx.fill();
        ctx.strokeStyle = "rgba(90,40,25,0.9)";
        ctx.lineWidth = 7;
        ctx.stroke();
        const a1 = r() * Math.PI * 2;
        const a2 = r() * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a1) * rad * 0.6, cy + Math.sin(a1) * rad * 0.6);
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a2) * rad * 0.85, cy + Math.sin(a2) * rad * 0.85);
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }
    // counter
    ctx.fillStyle = "rgba(95,42,26,0.92)";
    ctx.fillRect(0, 640, 1024, 128);
    // pendulum clock silhouette
    ctx.fillStyle = "rgba(95,42,26,0.9)";
    ctx.fillRect(860, 60, 110, 580);
  });

export const darkWindowTex = (key = "dark") =>
  make("win-" + key, 256, 384, (ctx, r) => {
    const g = ctx.createLinearGradient(0, 0, 256, 384);
    g.addColorStop(0, "#5763b8");
    g.addColorStop(1, "#22245e");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = "rgba(200,212,255,0.42)"; // moon reflection streak
    ctx.beginPath();
    ctx.moveTo(40, 384);
    ctx.lineTo(150, 0);
    ctx.lineTo(190, 0);
    ctx.lineTo(80, 384);
    ctx.fill();
    if (r() > 0.4) {
      // curtain
      ctx.fillStyle = "rgba(90,60,110,0.75)";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(90, 0);
      ctx.quadraticCurveTo(60, 200, 20, 384);
      ctx.lineTo(0, 384);
      ctx.fill();
    }
  });

export const warmWindowTex = () =>
  make("win-warm", 256, 384, (ctx) => {
    const g = ctx.createRadialGradient(128, 230, 10, 128, 230, 300);
    g.addColorStop(0, "#ffe1a0");
    g.addColorStop(1, "#d77a35");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = "rgba(120,50,30,0.6)";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(70, 0);
    ctx.quadraticCurveTo(45, 200, 15, 384);
    ctx.lineTo(0, 384);
    ctx.fill();
  });

export const skyTex = () =>
  make(
    "sky",
    4096,
    2048,
    (ctx, r) => {
      // v=0 bottom (south pole) .. v=1 top. Canvas y=0 is the TOP of the texture.
      ctx.scale(4, 2); // drawn in a 1024x1024 design space, stretched to 4096x2048 (equirect 2:1)
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0.0, "#1a1a58");
      g.addColorStop(0.25, "#2a2f88");
      g.addColorStop(0.42, "#4250b8");
      g.addColorStop(0.5, "#8a95d6"); // horizon haze
      g.addColorStop(0.56, "#3b3570");
      g.addColorStop(1.0, "#241a3a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 1024);
      // stars
      for (let i = 0; i < 260; i++) {
        const x = r() * 1024;
        const y = r() * 430;
        const s = r() < 0.08 ? 0.9 : 0.45;
        ctx.fillStyle = `rgba(235,235,255,${0.35 + r() * 0.6})`;
        ctx.beginPath();
        ctx.ellipse(x, y, s, s * 2, 0, 0, Math.PI * 2); // pre-squashed: the 4:2 stretch makes it round
        ctx.fill();
      }
      // soft wispy clouds
      for (let i = 0; i < 8; i++) {
        const y = 250 + r() * 220;
        const x = r() * 1024;
        ctx.fillStyle = "rgba(140,150,220,0.10)";
        ctx.beginPath();
        ctx.ellipse(x, y, 120 + r() * 160, 8 + r() * 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    {},
  );

export const glowTex = () =>
  make("glow", 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.45)");
    g.addColorStop(0.6, "rgba(255,255,255,0.10)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });

export const blobShadowTex = () =>
  make("blob", 256, 128, (ctx) => {
    ctx.save();
    ctx.scale(1, 0.5);
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(20,10,30,0.75)");
    g.addColorStop(0.6, "rgba(20,10,30,0.35)");
    g.addColorStop(1, "rgba(20,10,30,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    ctx.restore();
  });

export const moonTex = () =>
  make("moon", 256, 256, (ctx, r) => {
    const g = ctx.createRadialGradient(128, 128, 40, 128, 128, 128);
    g.addColorStop(0, "rgba(220,225,255,0.9)");
    g.addColorStop(0.45, "rgba(170,180,255,0.25)");
    g.addColorStop(1, "rgba(150,160,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    ctx.beginPath();
    ctx.arc(128, 128, 46, 0, Math.PI * 2);
    ctx.fillStyle = "#f1efff";
    ctx.fill();
    ctx.strokeStyle = "rgba(60,50,110,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(110 + r() * 40, 110 + r() * 40, 4 + r() * 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(170,170,215,0.6)";
      ctx.fill();
    }
  });

// Painted clock sign (icon only, no text).
export const signTex = () =>
  make("sign", 512, 384, (ctx) => {
    ctx.fillStyle = "#6b3a2c";
    ctx.beginPath();
    ctx.roundRect(8, 8, 496, 368, 40);
    ctx.fill();
    ctx.strokeStyle = "#e3b765";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.roundRect(28, 28, 456, 328, 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(256, 192, 110, 0, Math.PI * 2);
    ctx.fillStyle = "#f2e2bc";
    ctx.fill();
    ctx.strokeStyle = "#2a1a1a";
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(256, 192);
    ctx.lineTo(256, 112);
    ctx.moveTo(256, 192);
    ctx.lineTo(316, 222);
    ctx.lineWidth = 14;
    ctx.stroke();
  });

// Lit window with a small waiting figure (round head, bean body) and a candle.
export const waitingWindowTex = () =>
  make("win-waiting", 256, 384, (ctx) => {
    const g = ctx.createRadialGradient(128, 200, 10, 128, 200, 300);
    g.addColorStop(0, "#ffd08a");
    g.addColorStop(1, "#d7692c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = "rgba(70,30,30,0.88)";
    ctx.beginPath();
    ctx.ellipse(150, 200, 52, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(150, 330, 50, 85, 0, 0, Math.PI * 2);
    ctx.fill();
    // candle on the sill
    ctx.fillStyle = "#fff4dc";
    ctx.fillRect(52, 320, 16, 64);
    ctx.fillStyle = "#fff8c8";
    ctx.beginPath();
    ctx.ellipse(60, 306, 7, 13, 0, 0, Math.PI * 2);
    ctx.fill();
  });
