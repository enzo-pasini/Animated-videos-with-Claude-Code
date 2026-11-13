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

// day = sand-grey stones for the day street (dayExterior, D12); night colours unchanged
export const cobbleTex = (repeat: [number, number], day = false) =>
  make(
    day ? "cobble_day" : "cobble",
    1024,
    1024,
    (ctx, r) => {
      ctx.fillStyle = day ? "#9a8a72" : "#4a4052"; // day it3: lighter (was #6e604f)
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
            ctx.fillStyle = jitter(day ? "#d6c8ad" : "#7f7c92", r, 7);
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
      blotches(ctx, r, 60, day ? ["#6e604f", "#ece2cc"] : ["#2c2236", "#a9a6bc"], 120, 0.12);
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

// Day glass (dayExterior, D12): sky-blue with a white reflection streak; some windows have a warm curtain.
export const dayWindowTex = (key = "day") =>
  make("winday-" + key, 256, 384, (ctx, r) => {
    const g = ctx.createLinearGradient(0, 0, 256, 384);
    g.addColorStop(0, "#b4dcf6");
    g.addColorStop(1, "#4f86c4");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 384);
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.beginPath();
    ctx.moveTo(40, 384);
    ctx.lineTo(150, 0);
    ctx.lineTo(190, 0);
    ctx.lineTo(80, 384);
    ctx.fill();
    if (r() > 0.4) {
      ctx.fillStyle = r() > 0.5 ? "rgba(214,84,64,0.85)" : "rgba(236,190,70,0.85)";
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

// Day sky (dayExterior, D12): blue gradient, pale horizon haze, white puffy clouds with a soft blue-grey
// underside (reference day shots: blue sky + white clouds behind warm ground).
export const daySkyTex = () =>
  make(
    "daysky",
    4096,
    2048,
    (ctx, r) => {
      ctx.scale(4, 2); // same 1024x1024 design space as skyTex
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0.0, "#2f6fc8");
      g.addColorStop(0.28, "#4f93e0");
      g.addColorStop(0.44, "#93c4ef");
      g.addColorStop(0.5, "#d9edf7"); // horizon haze
      g.addColorStop(0.53, "#c8b89c");
      g.addColorStop(1.0, "#8c7a63");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 1024);
      // puffy clouds: overlapping round puffs (pre-squashed x:y = 1:2, the 4:2 stretch makes them round)
      for (let i = 0; i < 26; i++) {
        const cx = r() * 1024;
        const cy = 150 + r() * 330;
        const size = 6 + r() * 10 * (cy / 400);
        const n = 4 + Math.floor(r() * 5);
        const puffs = Array.from({ length: n }, (_, k) => [cx + (k - n / 2) * size * 0.9 + r() * size * 0.4, cy - r() * size * 1.2, size * (0.7 + r() * 0.6)]);
        ctx.fillStyle = "rgba(170,190,225,0.95)"; // underside
        for (const [x, y, s] of puffs) { ctx.beginPath(); ctx.ellipse(x, y + s * 0.5, s, s * 2, 0, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = "rgba(255,255,255,0.97)";
        for (const [x, y, s] of puffs) { ctx.beginPath(); ctx.ellipse(x, y, s * 0.92, s * 1.84, 0, 0, Math.PI * 2); ctx.fill(); }
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

// ---- bridge set (videos/2026-11-07-bridge-break-step) ----

// River water by day: blue-green with lighter painted ripple strokes (repeats per meter).
export const riverTex = (repeat: [number, number]) =>
  make(
    "river",
    1024,
    1024,
    (ctx, r) => {
      ctx.fillStyle = "#4f86a8";
      ctx.fillRect(0, 0, 1024, 1024);
      blotches(ctx, r, 50, ["#3d7090", "#6aa2bf"], 160, 0.25);
      ctx.lineCap = "round";
      for (let i = 0; i < 70; i++) {
        const x = r() * 1024;
        const y = r() * 1024;
        const w = 40 + r() * 110;
        ctx.strokeStyle = r() < 0.7 ? "rgba(200,232,242,0.55)" : "rgba(40,80,110,0.45)";
        ctx.lineWidth = 4 + r() * 4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + w / 2, y - 8, x + w, y);
        ctx.stroke();
      }
    },
    { repeat },
  );

// Grass bank: painted green with darker tufts.
export const grassTex = (repeat: [number, number]) =>
  make(
    "grass",
    1024,
    1024,
    (ctx, r) => {
      ctx.fillStyle = "#78a84c"; // FB3: more saturated, two clear tones (was #7fa45a, blotches 0.3)
      ctx.fillRect(0, 0, 1024, 1024);
      blotches(ctx, r, 90, ["#4f8a3a", "#a6cc68"], 150, 0.45);
      // small flowers: yellow and white dots
      for (let i = 0; i < 90; i++) {
        ctx.fillStyle = r() < 0.6 ? "rgba(246,214,92,0.9)" : "rgba(250,246,236,0.9)";
        ctx.beginPath();
        ctx.arc(r() * 1024, r() * 1024, 4 + r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 260; i++) {
        const x = r() * 1024;
        const y = r() * 1024;
        ctx.strokeStyle = r() < 0.5 ? "rgba(60,100,50,0.6)" : "rgba(190,214,130,0.6)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 4, y - 14);
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + 7, y - 12);
        ctx.stroke();
      }
    },
    { repeat },
  );

// Dressed sandstone blocks (piers, embankment walls).
export const stoneTex = (repeat: [number, number]) =>
  make(
    "stone",
    1024,
    1024,
    (ctx, r) => {
      ctx.fillStyle = "#8f7a68";
      ctx.fillRect(0, 0, 1024, 1024);
      const rows = 6;
      const rh = 1024 / rows;
      for (let row = 0; row < rows; row++) {
        let x = row % 2 ? -90 : 0;
        while (x < 1024) {
          const w = 150 + r() * 90;
          ctx.fillStyle = jitter("#c2ab94", r, 3);
          ctx.fillRect(x + 4, row * rh + 4, w - 8, rh - 8);
          ctx.strokeStyle = INK_T;
          ctx.lineWidth = 3;
          ctx.strokeRect(x + 4, row * rh + 4, w - 8, rh - 8);
          x += w;
        }
      }
      blotches(ctx, r, 50, ["#7a6656", "#e0cdb8"], 120, 0.05);
    },
    { repeat },
  );

// Painted wooden plank deck (planks run across the bridge).
export const deckTex = (repeat: [number, number]) =>
  make(
    "deck",
    512,
    512,
    (ctx, r) => {
      ctx.fillStyle = "#6a4a36";
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = jitter("#a77c58", r, 14);
        ctx.fillRect(i * 64 + 3, 0, 58, 512);
        ctx.strokeStyle = INK_T;
        ctx.lineWidth = 3;
        ctx.strokeRect(i * 64 + 3, -4, 58, 520);
      }
      blotches(ctx, r, 30, ["#5a3c2a", "#c79c74"], 80, 0.15);
    },
    { repeat },
  );

// Cast-iron notice at the bridge entrance. Big plain capitals so it reads at phone size.
export const breakStepSignTex = () =>
  make("sign-breakstep", 1024, 640, (ctx) => {
    ctx.fillStyle = "#2f3a52";
    ctx.beginPath();
    ctx.roundRect(8, 8, 1008, 624, 46);
    ctx.fill();
    ctx.strokeStyle = "#e9dfc6";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.roundRect(36, 36, 952, 568, 30);
    ctx.stroke();
    ctx.fillStyle = "#f3ead8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 92px Georgia, 'Times New Roman', serif";
    ctx.fillText("ALL TROOPS", 512, 150);
    ctx.fillText("MUST", 512, 268);
    ctx.font = "bold 128px Georgia, 'Times New Roman', serif";
    ctx.fillText("BREAK STEP", 512, 410);
    ctx.font = "bold 50px Georgia, 'Times New Roman', serif";
    ctx.fillText("ON THIS BRIDGE", 512, 530);
  });

// ---- old house kit (house.tsx, 2026-11-13): cobwebs, darkness, light spill ----

// Cobweb threads (white on transparent). "fan" = a round web (spokes + sagging rings) centered in the square, for a
// corner web; "drape" = threads hanging from the top edge, sagging and torn, for webs under pipes / on a furnace.
export const cobwebTex = (kind: "fan" | "drape", seed = 1) =>
  make(`cobweb_${kind}_${seed}`, 512, 512, (ctx, r) => {
    ctx.clearRect(0, 0, 512, 512);
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineCap = "round";
    if (kind === "fan") {
      const cx = 256, cy = 256, n = 11;
      const ang = Array.from({ length: n }, (_, i) => (i / n) * Math.PI * 2 + (r() - 0.5) * 0.25);
      ctx.lineWidth = 2.2;
      for (const a of ang) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * 262, cy + Math.sin(a) * 262);
        ctx.stroke();
      }
      ctx.lineWidth = 1.6;
      for (let ring = 1; ring <= 7; ring++) {
        const rad = ring * 33 + (r() - 0.5) * 8;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const a0 = ang[i % n], a1 = ang[(i + 1) % n] + (i + 1 === n ? Math.PI * 2 : 0);
          const x0 = cx + Math.cos(a0) * rad, y0 = cy + Math.sin(a0) * rad;
          const x1 = cx + Math.cos(a1) * rad, y1 = cy + Math.sin(a1) * rad;
          // threads between two spokes sag toward the center
          const am = (a0 + a1) / 2, sag = rad * 0.82;
          if (i === 0) ctx.moveTo(x0, y0);
          if (r() < 0.08) { ctx.moveTo(x1, y1); continue; } // a broken thread
          ctx.quadraticCurveTo(cx + Math.cos(am) * sag, cy + Math.sin(am) * sag, x1, y1);
        }
        ctx.stroke();
      }
    } else {
      ctx.lineWidth = 2;
      const k = 9;
      const xs = Array.from({ length: k }, (_, i) => 20 + (i / (k - 1)) * 472 + (r() - 0.5) * 30);
      // long threads from the top that sag down between anchor points
      for (let i = 0; i < k - 1; i++) {
        for (let layer = 0; layer < 4; layer++) {
          const depth = 60 + layer * 85 + r() * 50;
          ctx.beginPath();
          ctx.moveTo(xs[i], 4 + layer * 6);
          ctx.quadraticCurveTo((xs[i] + xs[i + 1]) / 2, depth, xs[i + 1], 4 + layer * 6);
          ctx.stroke();
        }
      }
      // torn strands hanging down
      for (let i = 0; i < 14; i++) {
        const x = 30 + r() * 452;
        const len = 120 + r() * 360;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.quadraticCurveTo(x + (r() - 0.5) * 60, len * 0.6, x + (r() - 0.5) * 40, len);
        ctx.stroke();
      }
    }
  });

// Soft darkness (black, alpha 1 in the middle → 0 at the edge): `edge` = "round" (a pool of dark) or "up" (dark at
// the bottom, fading toward the top) for corners where the light never reaches.
export const darknessTex = (kind: "round" | "up" = "round") =>
  make(`darkness_${kind}`, 256, 256, (ctx) => {
    ctx.clearRect(0, 0, 256, 256);
    if (kind === "round") {
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, "rgba(0,0,0,0.97)");
      g.addColorStop(0.45, "rgba(0,0,0,0.85)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
    } else {
      const g = ctx.createLinearGradient(0, 256, 0, 0);
      g.addColorStop(0, "rgba(0,0,0,0.95)");
      g.addColorStop(0.55, "rgba(0,0,0,0.7)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
    }
    ctx.fillRect(0, 0, 256, 256);
    if (kind === "up") {
      // soften the two sides too
      const s = ctx.createLinearGradient(0, 0, 256, 0);
      s.addColorStop(0, "rgba(0,0,0,1)");
      s.addColorStop(0.15, "rgba(0,0,0,0)");
      s.addColorStop(0.85, "rgba(0,0,0,0)");
      s.addColorStop(1, "rgba(0,0,0,1)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = s;
      ctx.fillRect(0, 0, 256, 256);
      ctx.globalCompositeOperation = "source-over";
    }
  });

// A wedge of light on a floor (white, bright at the narrow end = the door crack → fading out as it widens).
export const lightSpillTex = () =>
  make("light_spill", 256, 512, (ctx) => {
    ctx.clearRect(0, 0, 256, 512);
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.5, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(110, 0);
    ctx.lineTo(146, 0);
    ctx.lineTo(240, 512);
    ctx.lineTo(16, 512);
    ctx.closePath();
    ctx.fill();
  });

// Classic spider web (the user's reference, S2 2026-11-13): white on transparent, center at (cx, cy) of the square,
// ~16 irregular spokes running past the edges (they anchor where the web's shape is cut), ~16 rings whose threads
// bow in toward the center, a few broken rings, and loose strands hanging from the lower spokes.
export const spiderWebTex = (seed = 1, cx = 0.5, cy = 0.5) =>
  make(`spider_web_${seed}_${cx}_${cy}`, 1024, 1024, (ctx, r) => {
    const S = 1024;
    ctx.clearRect(0, 0, S, S);
    ctx.strokeStyle = "rgba(255,255,255,1)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const X = cx * S, Y = cy * S;
    const n = 15 + Math.floor(r() * 3);
    const ang = Array.from({ length: n }, (_, i) => (i / n) * Math.PI * 2 + (r() - 0.5) * 0.3).sort((p, q) => p - q);
    const reach = 1500;
    // spokes (thicker)
    ctx.lineWidth = 3.4;
    for (const a of ang) {
      ctx.beginPath();
      ctx.moveTo(X, Y);
      ctx.lineTo(X + Math.cos(a) * reach, Y + Math.sin(a) * reach);
      ctx.stroke();
    }
    // a small solid hub
    ctx.lineWidth = 2.4;
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath();
      ctx.arc(X, Y, 6 * k, 0, Math.PI * 2);
      ctx.stroke();
    }
    // rings: each segment between two spokes bows toward the center; spacing grows outward
    let rad = 26;
    for (let ring = 0; ring < 18; ring++) {
      rad += 18 + ring * 3.2 + r() * 10;
      ctx.lineWidth = 2.2 + r() * 0.8;
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i < n; i++) {
        const a0 = ang[i];
        const a1 = i + 1 < n ? ang[i + 1] : ang[0] + Math.PI * 2;
        const r0 = rad * (0.94 + r() * 0.12);
        const r1 = rad * (0.94 + r() * 0.12);
        const x0 = X + Math.cos(a0) * r0, y0 = Y + Math.sin(a0) * r0;
        const x1 = X + Math.cos(a1) * r1, y1 = Y + Math.sin(a1) * r1;
        if (r() < 0.06) { pen = false; continue; } // a broken thread
        const am = (a0 + a1) / 2;
        const sag = ((r0 + r1) / 2) * (0.8 + r() * 0.06);
        if (!pen) { ctx.moveTo(x0, y0); pen = true; }
        ctx.quadraticCurveTo(X + Math.cos(am) * sag, Y + Math.sin(am) * sag, x1, y1);
      }
      ctx.stroke();
    }
    // loose strands hanging down from the lower half (the reference's drips)
    ctx.lineWidth = 2.2;
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.15 + r() * 0.7); // lower half (canvas y down)
      const d = 160 + r() * 340;
      const x = X + Math.cos(a) * d, y = Y + Math.sin(a) * d;
      const len = 60 + r() * 200;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + (r() - 0.5) * 30, y + len * 0.6, x + (r() - 0.5) * 20, y + len);
      ctx.stroke();
    }
  });
