// Far land for open sets (v4 VFX items 8 / 7 / 13: background filling, depth, mountains).
// Reference VS1Z_Q-Klt8 0:32 + 0:46 (references/effects/README.md §8, §13): a patchwork of fields with
// hedgerows, many trees of 2–3 kinds (round crowns, tall poplars, bushes) in rows and clusters, a farm with
// a windmill, a town on a rise, and faint uneven mountain ridges in the haze. Everything low-poly + faceted.
// Big repeated things (trees, houses) are merged per colour = few draw calls.
import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { OBox, OMesh } from "../../three/Outlined";
import { plasterTex, rng } from "../../three/textures";
import { facet } from "./country";

export type V3 = [number, number, number];

// ---------- terrain: a heightfield with fields painted on its faces ----------
export type TerrainSpec = {
  xs: number[]; // grid columns (sorted); include the exact edges of steps (river, near bank box)
  zs: number[]; // grid rows (sorted)
  height: (x: number, z: number) => number; // absolute y
  color: (x: number, z: number, y: number) => string; // colour of the face around (x, z)
};

export const makeTerrain = ({ xs, zs, height, color }: TerrainSpec) => {
  const pos: number[] = [];
  const col: number[] = [];
  const c = new THREE.Color();
  const H = zs.map((z) => xs.map((x) => height(x, z)));
  for (let j = 0; j < zs.length - 1; j++)
    for (let i = 0; i < xs.length - 1; i++) {
      const p00: V3 = [xs[i], H[j][i], zs[j]];
      const p10: V3 = [xs[i + 1], H[j][i + 1], zs[j]];
      const p01: V3 = [xs[i], H[j + 1][i], zs[j + 1]];
      const p11: V3 = [xs[i + 1], H[j + 1][i + 1], zs[j + 1]];
      // two triangles, wound so the normal points up (y)
      for (const tri of [[p00, p01, p10], [p10, p01, p11]] as V3[][]) {
        const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
        const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
        const cz = (tri[0][2] + tri[1][2] + tri[2][2]) / 3;
        c.set(color(cx, cz, cy));
        for (const p of tri) {
          pos.push(...p);
          col.push(c.r, c.g, c.b);
        }
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals(); // non-indexed = flat facets
  return g;
};

// a regular grid from a to b with step, plus extra exact values (step edges), sorted, no near-duplicates
export const gridLine = (a: number, b: number, step: number, extra: number[] = []) => {
  const v: number[] = [];
  for (let x = a; x <= b + 1e-6; x += step) v.push(+x.toFixed(3));
  v.push(...extra);
  v.sort((p, q) => p - q);
  return v.filter((x, i) => i === 0 || x - v[i - 1] > 0.02);
};

// smooth value noise (deterministic) for rolling ground and ridges
export const noise2 = (seed: number) => {
  const h = (i: number, j: number) => {
    const s = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const sm = (t: number) => t * t * (3 - 2 * t);
  return (x: number, z: number) => {
    const i = Math.floor(x);
    const j = Math.floor(z);
    const fx = sm(x - i);
    const fz = sm(z - j);
    const a = h(i, j) + (h(i + 1, j) - h(i, j)) * fx;
    const b = h(i, j + 1) + (h(i + 1, j + 1) - h(i, j + 1)) * fx;
    return a + (b - a) * fz; // 0..1
  };
};

// ---------- trees: three kinds, merged per colour ----------
export type TreeKind = "round" | "poplar" | "bush";
export type TreeAt = [kind: TreeKind, x: number, y: number, z: number, s: number];
const ico = facet(new THREE.IcosahedronGeometry(1, 0));
const trunkG = facet(new THREE.CylinderGeometry(0.12, 0.18, 1, 6));
const xf = (g: THREE.BufferGeometry, p: V3, s: V3, r = 0) => {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r, 0)), new THREE.Vector3(...s));
  return g.clone().applyMatrix4(m);
};
const TREE_GREENS = ["#4f8a3e", "#6aa04c", "#3f7034"];

export const Trees: React.FC<{ trees: TreeAt[]; seed?: number; fogMax?: number }> = ({ trees, seed = 1, fogMax }) => {
  const g = useMemo(() => {
    const r = rng(seed);
    const crowns: THREE.BufferGeometry[][] = [[], [], []];
    const trunks: THREE.BufferGeometry[] = [];
    for (const [kind, x, y, z, s] of trees) {
      const tone = Math.floor(r() * 3);
      const rot = r() * 6;
      if (kind === "round") {
        // a puffy crown of 4 blobs on a thin trunk (like the reference's round trees)
        trunks.push(xf(trunkG, [x, y + 1.0 * s, z], [s, 2.0 * s, s]));
        const blobs: [number, number, number, number][] = [[0, 2.9, 0, 1.25], [0.85, 2.5, 0.2, 0.9], [-0.8, 2.45, -0.1, 0.95], [0.1, 3.55, -0.2, 0.8]];
        blobs.forEach(([bx, by, bz, bs], k) =>
          crowns[(tone + (k === 3 ? 1 : 0)) % 3].push(xf(ico, [x + bx * s, y + by * s, z + bz * s], [bs * s, bs * s * 0.9, bs * s], rot + k)),
        );
      } else if (kind === "poplar") {
        // tall and narrow: a stretched crown of 3 blobs
        trunks.push(xf(trunkG, [x, y + 0.6 * s, z], [0.8 * s, 1.2 * s, 0.8 * s]));
        [[0, 2.2, 0.75], [0, 3.6, 0.7], [0, 4.8, 0.5]].forEach(([, by, bs], k) =>
          crowns[2].push(xf(ico, [x, y + by * s, z], [bs * s, bs * s * 1.9, bs * s], rot + k)),
        );
      } else {
        crowns[(tone + 1) % 3].push(xf(ico, [x, y + 0.45 * s, z], [0.9 * s, 0.6 * s, 0.8 * s], rot));
        crowns[tone].push(xf(ico, [x + 0.6 * s, y + 0.35 * s, z + 0.2 * s], [0.6 * s, 0.45 * s, 0.6 * s], rot + 1));
      }
    }
    return { crowns: crowns.map((c) => (c.length ? mergeGeometries(c) : null)), trunk: trunks.length ? mergeGeometries(trunks) : null };
  }, [trees, seed]);
  return (
    <>
      {g.trunk ? <OMesh geometry={g.trunk} color="#6a4a36" lineColor="#3a2820" threshold={50} fogMax={fogMax} /> : null}
      {g.crowns.map((c, i) => (c ? <OMesh key={i} geometry={c} color={TREE_GREENS[i]} lineColor="#2a4a24" threshold={70} fogMax={fogMax} /> : null))}
    </>
  );
};

// a hedgerow: small bushes along a polyline (y from ground())
export const hedgeTrees = (pts: [number, number][], ground: (x: number, z: number) => number, every = 1.6, s = 0.8): TreeAt[] => {
  const out: TreeAt[] = [];
  for (let k = 0; k < pts.length - 1; k++) {
    const [ax, az] = pts[k];
    const [bx, bz] = pts[k + 1];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / every));
    for (let i = 0; i < n; i++) {
      const x = ax + ((bx - ax) * i) / n;
      const z = az + ((bz - az) * i) / n;
      out.push(["bush", x, ground(x, z), z, s * (0.85 + 0.3 * ((i * 7) % 3) / 2)]);
    }
  }
  return out;
};

// ---------- farm: windmill (sails turn slowly) and barn ----------
export const Windmill: React.FC<{ x: number; y: number; z: number; rotY?: number; frame: number; s?: number }> = ({ x, y, z, rotY = 0, frame, s = 1 }) => {
  const g = useMemo(
    () => ({
      tower: facet(new THREE.CylinderGeometry(1.4, 2.1, 8, 8)),
      cap: facet(new THREE.ConeGeometry(1.75, 2.2, 8)),
    }),
    [],
  );
  const a = (frame / 30) * 0.5; // rad/s
  return (
    <group position={[x, y - 0.02, z]} rotation={[0, rotY, 0]} scale={[s, s, s]}>
      <OMesh geometry={g.tower} position={[0, 4, 0]} map={plasterTex("mill_w", "#efe6d4", [0.33, 0.33], "#b8a58a")} threshold={40} />
      <OMesh geometry={g.cap} position={[0, 9.1, 0]} color="#7a4a3c" threshold={30} />
      <OBox size={[0.7, 1.4, 0.1]} position={[0, 0.7, 2.12]} color="#5a3c30" />
      <group position={[0, 7.6, 1.85]} rotation={[0, 0, a]}>
        <OBox size={[0.35, 0.35, 0.4]} color="#4a3442" />
        {[0, 1, 2, 3].map((k) => (
          <group key={k} rotation={[0, 0, (k * Math.PI) / 2]}>
            <OBox size={[0.12, 5.2, 0.08]} position={[0, 2.7, 0.05]} color="#6a4a36" />
            <OBox size={[1.0, 4.0, 0.04]} position={[0.55, 3.1, 0.1]} color="#e8dccb" lineColor="#6a5a4a" />
          </group>
        ))}
      </group>
    </group>
  );
};

export const Barn: React.FC<{ x: number; y: number; z: number; rotY?: number }> = ({ x, y, z, rotY = 0 }) => {
  const roof = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-3.3, 0);
    sh.lineTo(0, 2.4);
    sh.lineTo(3.3, 0);
    sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 9, bevelEnabled: false });
    g.translate(0, 0, -4.5);
    return facet(g);
  }, []);
  return (
    <group position={[x, y - 0.02, z]} rotation={[0, rotY, 0]}>
      <OBox size={[6, 3.6, 8.4]} position={[0, 1.8, 0]} map={plasterTex("barn", "#a8553c", [0.33, 0.33], "#7a3a2c")} />
      <OMesh geometry={roof} position={[0, 3.6, 0]} color="#5a4a52" threshold={30} />
      <OBox size={[2.2, 2.6, 0.1]} position={[0, 1.3, 4.24]} color="#6a4a36" />
    </group>
  );
};

// ---------- a town on a rise: many small houses, a church with a spire, mill chimneys with faint smoke ----------
export type TownHouse = [x: number, y: number, z: number, w: number, d: number, h: number, rotY: number];
const WALLS = ["#f0c070", "#e07a50", "#f2a890", "#e8d4b0"]; // a bit stronger than the near houses: 60 % haze on top
// a far house wall: plaster colour with 2 x 2 small windows (each box face shows the whole pattern)
const wallTexCache = new Map<string, THREE.CanvasTexture>();
const townWallTex = (base: string) => {
  let t = wallTexCache.get(base);
  if (!t) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = base;
    g.fillRect(0, 0, 64, 64);
    for (const [x, y] of [[12, 12], [38, 12], [12, 38], [38, 38]]) {
      g.fillStyle = "#f4efe4";
      g.fillRect(x - 1, y - 1, 16, 18);
      g.fillStyle = "#3d4a6a";
      g.fillRect(x + 1, y + 1, 12, 14);
    }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    wallTexCache.set(base, t);
  }
  return t;
};
const ROOFS = ["#a0503c", "#8a4a44"];
const boxG = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(); // keeps its UVs (window texture); box normals are flat already
const prismG = (() => {
  const sh = new THREE.Shape();
  sh.moveTo(-0.5, 0);
  sh.lineTo(0, 0.55);
  sh.lineTo(0.5, 0);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  return facet(g);
})();
export const HillTown: React.FC<{ houses: TownHouse[]; church: V3; chimneys: V3[]; frame: number; fogMax?: number }> = ({
  houses,
  church,
  chimneys,
  frame,
  fogMax,
}) => {
  const g = useMemo(() => {
    const walls: THREE.BufferGeometry[][] = WALLS.map(() => []);
    const roofs: THREE.BufferGeometry[][] = ROOFS.map(() => []);
    houses.forEach(([x, y, z, w, d, h, r], i) => {
      walls[i % WALLS.length].push(xf(boxG, [x, y + h / 2 - 0.3, z], [w, h + 0.6, d], r));
      roofs[i % ROOFS.length].push(xf(prismG, [x, y + h - 0.02, z], [w + 0.3, h * 0.55, d + 0.3], r));
    });
    return { walls: walls.map((a) => (a.length ? mergeGeometries(a) : null)), roofs: roofs.map((a) => (a.length ? mergeGeometries(a) : null)) };
  }, [houses]);
  const spire = useMemo(() => facet(new THREE.ConeGeometry(1.1, 5, 6)), []);
  const stack = useMemo(() => facet(new THREE.CylinderGeometry(0.5, 0.8, 13, 8)), []);
  const puff = useMemo(() => facet(new THREE.IcosahedronGeometry(1, 0)), []);
  const t = frame / 30;
  return (
    <>
      {g.walls.map((w, i) => (w ? <OMesh key={i} geometry={w} map={townWallTex(WALLS[i])} lineColor="#6a5060" threshold={30} fogMax={fogMax} /> : null))}
      {g.roofs.map((w, i) => (w ? <OMesh key={`r${i}`} geometry={w} color={ROOFS[i]} lineColor="#4a2a2a" threshold={30} fogMax={fogMax} /> : null))}
      {/* church: nave + tower + spire */}
      <group position={church}>
        <OBox size={[4, 4.5, 9]} position={[0, 2.0, 0]} color="#d8c8b0" lineColor="#6a5060" />
        <OMesh geometry={prismG} position={[0, 4.24, 0]} scale={[4.4, 2.6, 9.3]} color="#7a6a72" lineColor="#4a3a42" />
        <OBox size={[2.4, 7, 2.4]} position={[0, 3.2, 5.4]} color="#cfbfa8" lineColor="#6a5060" />
        <OMesh geometry={spire} position={[0, 9.2, 5.4]} rotation={[0, Math.PI / 6, 0]} color="#6a6a7a" lineColor="#3a3a4a" />
      </group>
      {chimneys.map(([x, y, z], i) => (
        <group key={i}>
          <OMesh geometry={stack} position={[x, y + 6.2, z]} map={plasterTex("mill", "#a0563c", [0.33, 0.33], "#7a3a2c")} threshold={60} />
          {/* faint smoke: puffs drifting up and right, fading out */}
          {[0, 1, 2, 3].map((k) => {
            const u = (t * 0.25 + k / 4 + i * 0.37) % 1;
            return (
              <OMesh
                key={k}
                geometry={puff}
                position={[x + 4 * u, y + 13.2 + 6 * u, z - u]}
                scale={[0.9 + 1.6 * u, 0.7 + 1.2 * u, 0.9 + 1.6 * u]}
                color="#d6d2d8"
                lines={false}
                transparent
                opacity={0.55 * (1 - u)}
              />
            );
          })}
        </group>
      ))}
    </>
  );
};

// ---------- mountains: uneven ridges along an arc around the set, very faint in the haze ----------
// Haze: the locked fog with a high cap (fogMax ~0.8) = pale, sky-tinted, but never gone.
export const MountainRange: React.FC<{
  R: number; // distance from the set centre (m)
  a0: number; // arc start (radians, 0 = -z, positive toward +x)
  a1: number;
  height: number; // tallest peak (m above y0)
  y0: number;
  seed: number;
  color: string;
  lineColor: string;
  depth?: number; // ridge thickness (m)
  fogMax?: number;
}> = ({ R, a0, a1, height, y0, seed, color, lineColor, depth = 26, fogMax = 0.82 }) => {
  const g = useMemo(() => {
    const r = rng(seed);
    // a ridge profile = a few peaks with DIFFERENT left/right slopes + shoulders + small bumps (never a clean cone)
    const peaks = Array.from({ length: 7 + Math.floor(r() * 4) }, () => ({
      t: r(),
      h: 0.35 + 0.65 * r(),
      wl: 0.03 + 0.08 * r(),
      wr: 0.03 + 0.08 * r(),
    }));
    const bump = noise2(seed);
    const prof = (t: number) => {
      let h = 0.12;
      for (const p of peaks) {
        const d = t - p.t;
        const w = d < 0 ? p.wl : p.wr;
        const k = Math.max(0, 1 - Math.abs(d) / w);
        h = Math.max(h, p.h * (k * k * (3 - 2 * k)) * (0.85 + 0.15 * k) + 0.06 * (1 - k)); // shoulder at the foot
      }
      return h * (0.82 + 0.36 * bump(t * 60, 0.5)); // small bumps on the ridge line
    };
    const N = 160;
    const M = 6;
    const pos: number[] = [];
    const pts: V3[][] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = a0 + (a1 - a0) * t;
      const ph = prof(t) * height;
      const row: V3[] = [];
      for (let j = 0; j <= M; j++) {
        const s = j / M; // 0 = front foot, 1 = back foot
        const rr = R + (s - 0.35) * depth;
        // cross-section: steeper front, longer back slope, ridge at s = 0.35
        const cs = s < 0.35 ? s / 0.35 : 1 - (s - 0.35) / 0.65;
        const y = y0 - 3 + (ph + 3) * Math.pow(Math.max(0, cs), 0.8) * (0.85 + 0.3 * bump(t * 25, s * 4));
        row.push([Math.sin(a) * rr, y, -Math.cos(a) * rr]);
      }
      pts.push(row);
    }
    for (let i = 0; i < N; i++)
      for (let j = 0; j < M; j++) {
        const [p00, p01, p10, p11] = [pts[i][j], pts[i][j + 1], pts[i + 1][j], pts[i + 1][j + 1]];
        pos.push(...p00, ...p10, ...p01, ...p10, ...p11, ...p01);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    return geo;
  }, [R, a0, a1, height, y0, seed, depth]);
  return <OMesh geometry={g} color={color} lineColor={lineColor} threshold={28} fogMax={fogMax} />;
};
