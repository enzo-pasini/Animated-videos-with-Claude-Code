// Theme kit SNOW (scenes plan 4): snowy mountains, snowy ground, snowy pines + rocks, a mountain hut, a peak camp.
// 100 % OUR code (no pack geometry): the CC-BY "Mountain Cabin" (Alex Safayan) was only LOOKED at
// (public/reference-only/, sheet out/snow/reference_sheet.jpg). What we took from it = patterns, not shapes:
//   - a snow cap from ~60-70 % of the height, its lower edge a zig-zag with long "teeth" down the ridges
//   - detailed rock (small facets) under one simple snow shape; rocks show through on steep faces
//   - pines = stacked tiers, snow on top of each tier, green only in a band under each tier edge
// What we do differently: uneven ridges (item 13: two different slopes, shoulders, never a clean cone), snow on
// the roof + light smoke, and snow tuned for the locked dayExterior (no blown-out white, bluish shadow side).
//
// Style rules: low-poly faceted, two tones from the light + ink lines, shadows, merged copies per colour.
// Snow layers are separate shells lifted ≥ 2 cm (scaled up on big pieces) above the rock = no z-fighting.
// Far pieces (SnowRange) are ONE surface with per-face colours (snow / rock) = nothing to z-fight at 140 m.
// The hut interior = the home kit (home.tsx) under warmInterior; nothing here.
import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { OBox, OMesh } from "../../three/Outlined";
import { rng } from "../../three/textures";
import { Bunting, WoodPile, facet, mergeAt } from "./country";
import { Glow } from "./Glow";
import { noise2, type V3 } from "./land";

// ---------- colours (tuned under the locked dayExterior: lit snow ≈ 225-235, shadow side bluish) ----------
export const SNOW_TONES = {
  snow: "#cacacd", // shell + ground: near-neutral; the sun makes it ~white, the blue sky light makes the shadow side blue
  snow2: "#c0c4cd", // second ground tone (facets / drifts)
  snowLine: "#7d89a6", // ink on snow: a soft blue-grey, so white shapes do not look cut out
  rock: "#565d6e",
  rockLine: "#363a48",
  pine: ["#3d6a4c", "#4a7a52"],
  pineLine: "#203a2a",
  trunk: "#6a4a36",
};
export type SnowTones = typeof SNOW_TONES;
// for PackPiece (Rock Snow, Quaternius CC0, public/packs/snow/): its lilac "snow" → our snow
export const ROCK_SNOW_TONES: Record<string, string> = { "Rock.001": SNOW_TONES.rock, "Snow.001": SNOW_TONES.snow };

const SINK = 0.02;
const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const tmpC = new THREE.Vector3();

// ---------- snow shell: the chosen faces of a faceted geometry, lifted along the smooth normal ----------
// pick(centroid, faceNormal) = is this face under snow. Border vertices (shared with a bare face) are lifted
// `edge` m, inner ones `inner` m: a snow layer that is thin at its rim and thicker inside (like a pillow).
export const snowShell = (
  g: THREE.BufferGeometry,
  pick: (c: THREE.Vector3, n: THREE.Vector3) => boolean,
  edge: number,
  inner: number,
) => {
  const pos = g.attributes.position.array as ArrayLike<number>;
  const q = (i: number) => `${Math.round(pos[i] * 500)},${Math.round(pos[i + 1] * 500)},${Math.round(pos[i + 2] * 500)}`;
  const normals = new Map<string, THREE.Vector3>();
  const inSnow = new Map<string, number>(); // bit 1 = touches a snow face, bit 2 = touches a bare face
  const picked: number[] = [];
  for (let t = 0; t + 8 < pos.length; t += 9) {
    tmpA.set(pos[t], pos[t + 1], pos[t + 2]);
    tmpB.set(pos[t + 3], pos[t + 4], pos[t + 5]);
    tmpC.set(pos[t + 6], pos[t + 7], pos[t + 8]);
    const n = new THREE.Vector3().subVectors(tmpB, tmpA).cross(new THREE.Vector3().subVectors(tmpC, tmpA));
    const area = n.length();
    if (area < 1e-12) continue;
    n.divideScalar(area);
    const c = tmpA.clone().add(tmpB).add(tmpC).divideScalar(3);
    const s = pick(c, n);
    if (s) picked.push(t);
    for (let k = 0; k < 3; k++) {
      const key = q(t + k * 3);
      const v = normals.get(key) ?? new THREE.Vector3();
      v.addScaledVector(n, area);
      normals.set(key, v);
      inSnow.set(key, (inSnow.get(key) ?? 0) | (s ? 1 : 2));
    }
  }
  const out: number[] = [];
  for (const t of picked)
    for (let k = 0; k < 3; k++) {
      const i = t + k * 3;
      const key = q(i);
      const n = normals.get(key)!.clone().normalize();
      const d = inSnow.get(key) === 3 ? edge : inner;
      out.push(pos[i] + n.x * d, pos[i + 1] + n.y * d, pos[i + 2] + n.z * d);
    }
  const s = new THREE.BufferGeometry();
  s.setAttribute("position", new THREE.Float32BufferAttribute(out, 3));
  s.computeVertexNormals();
  return s;
};

// ---------- near snowy mountain: uneven ridges, shoulder, snow cap with teeth, rock through the snow ----------
export type PeakSpec = {
  height: number; // m above the base
  radius: number; // base radius (m)
  seed: number;
  snowLine?: number; // 0..1 of the height where the cap starts (teeth reach lower); default 0.55
  steep?: number; // faces steeper than this stay rock (normal.y below it); default 0.22
  ridges?: number; // number of spurs (3-6); default 4
};

export const peakGeometry = ({ height: H, radius: R, seed, snowLine = 0.55, steep = 0.22, ridges = 4 }: PeakSpec) => {
  const r = rng(seed);
  const nz = noise2(seed);
  const N = 11; // rings
  const S = 22; // sectors
  // spurs: directions with different strength + width = the two slopes of the mountain differ
  const spurs = Array.from({ length: ridges }, (_, k) => ({ a: ((k + r() * 0.6) / ridges) * Math.PI * 2, s: 0.12 + 0.2 * r(), w: 5 + r() * 8 }));
  const stretch = 0.75 + 0.5 * r(); // base radius varies with the direction → steep side + long side
  const phase = r() * 6.28;
  const shoulder = { a: r() * 6.28, rho: 0.38 + 0.15 * r(), h: 0.12 + 0.1 * r() };
  const ridge = (a: number) => spurs.reduce((m, sp) => m + sp.s * Math.pow(Math.max(0, Math.cos(a - sp.a)), sp.w), 0);
  const radiusAt = (a: number) => R * (0.85 + 0.3 * (0.5 + 0.5 * Math.sin(a + phase)) * stretch);
  const heightAt = (a: number, rho: number) => {
    const p = 1.05 + 0.5 * (0.5 + 0.5 * Math.sin(a * 2 + phase)); // convex on one side, concave on the other
    let h = Math.pow(Math.max(0, 1 - rho), p) * (1 + ridge(a) * rho * 1.6);
    const da = Math.atan2(Math.sin(a - shoulder.a), Math.cos(a - shoulder.a));
    h += shoulder.h * Math.exp(-((rho - shoulder.rho) ** 2) / 0.012 - (da * da) / 0.25);
    return H * Math.min(1.05, h) * (0.94 + 0.12 * nz(a * 3, rho * 5));
  };
  // vertex grid (ring 0 = the summit, slightly off-centre: not a clean cone tip)
  const top: V3 = [R * 0.05 * Math.cos(phase), H, R * 0.05 * Math.sin(phase)];
  const P: V3[][] = [];
  for (let i = 1; i <= N; i++) {
    const row: V3[] = [];
    for (let j = 0; j < S; j++) {
      const a = ((j + (i % 2) * 0.5 + (r() - 0.5) * 0.35) / S) * Math.PI * 2;
      const rho = Math.min(1, (i + (i < N ? (r() - 0.5) * 0.4 : 0)) / N);
      const rr = radiusAt(a) * rho;
      const y = i === N ? -0.6 : heightAt(a, rho);
      row.push([top[0] * (1 - rho) + Math.cos(a) * rr, y, top[2] * (1 - rho) + Math.sin(a) * rr]);
    }
    P.push(row);
  }
  const pos: number[] = [];
  const tri = (a: V3, b: V3, c: V3) => pos.push(...a, ...b, ...c);
  for (let j = 0; j < S; j++) tri(top, P[0][(j + 1) % S], P[0][j]);
  for (let i = 0; i < N - 1; i++)
    for (let j = 0; j < S; j++) {
      const j1 = (j + 1) % S;
      tri(P[i][j], P[i][j1], P[i + 1][j]);
      tri(P[i][j1], P[i + 1][j1], P[i + 1][j]);
    }
  const rock = new THREE.BufferGeometry();
  rock.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  rock.computeVertexNormals();
  // snow: above a snow line that drops along the spurs (teeth) and wobbles; steep faces stay rock
  const pick = (c: THREE.Vector3, n: THREE.Vector3) => {
    const a = Math.atan2(c.z, c.x);
    const line = snowLine - 0.3 * Math.min(1, ridge(a) * 2.2) + 0.1 * (nz(a * 4 + 9, 1) - 0.5);
    const y = c.y / H;
    if (y > 0.9) return true;
    return y > line && n.y > steep;
  };
  const snow = snowShell(rock, pick, Math.max(0.03, H * 0.002), Math.max(0.06, H * 0.008));
  return { rock, snow };
};

export const SnowPeak: React.FC<
  PeakSpec & { position?: V3; rotY?: number; tones?: Partial<SnowTones>; fogMax?: number }
> = ({ position = [0, 0, 0], rotY = 0, tones, fogMax, ...spec }) => {
  const T = { ...SNOW_TONES, ...tones };
  const g = useMemo(() => peakGeometry(spec), [spec.height, spec.radius, spec.seed, spec.snowLine, spec.steep, spec.ridges]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <OMesh geometry={g.rock} color={T.rock} lineColor={T.rockLine} threshold={34} fogMax={fogMax} />
      <OMesh geometry={g.snow} color={T.snow} lineColor={T.snowLine} threshold={45} fogMax={fogMax} />
    </group>
  );
};

// ---------- far snowy range: uneven ridges along an arc, snow caps, in the capped haze ----------
// Same idea as land.tsx MountainRange (item 8/13), one surface with per-face colours (snow above a wobbling
// line, rock on steep faces). Keep it inside the sky dome: R + depth·0.65 < sky radius (150).
export const SnowRange: React.FC<{
  R: number;
  a0: number; // arc start (radians, 0 = -z, positive toward +x)
  a1: number;
  height: number;
  y0: number;
  seed: number;
  snowLine?: number; // 0..1 of `height`; default 0.32
  steep?: number; // faces steeper than this stay rock (normal.y); default 0.12 (a far ridge is steep everywhere)
  depth?: number;
  tones?: Partial<SnowTones>;
  fogMax?: number;
}> = ({ R, a0, a1, height, y0, seed, snowLine = 0.32, steep = 0.12, depth = 24, tones, fogMax = 0.8 }) => {
  const T = { ...SNOW_TONES, ...tones };
  const g = useMemo(() => {
    const r = rng(seed);
    const bump = noise2(seed);
    // wider peaks than the green MountainRange: snowy massifs, not spires (two different slopes per peak)
    const peaks = Array.from({ length: 5 + Math.floor(r() * 3) }, () => ({ t: r(), h: 0.45 + 0.55 * r(), wl: 0.06 + 0.1 * r(), wr: 0.06 + 0.1 * r() }));
    const prof = (t: number) => {
      let h = 0.15;
      for (const p of peaks) {
        const d = t - p.t;
        const k = Math.max(0, 1 - Math.abs(d) / (d < 0 ? p.wl : p.wr));
        h = Math.max(h, p.h * (k * k * (3 - 2 * k)) * (0.85 + 0.15 * k) + 0.06 * (1 - k));
      }
      return h * (0.84 + 0.32 * bump(t * 55, 0.5));
    };
    const N = 150;
    const M = 7;
    const pts: V3[][] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = a0 + (a1 - a0) * t;
      const ph = prof(t) * height;
      const row: V3[] = [];
      for (let j = 0; j <= M; j++) {
        const s = j / M;
        const rr = R + (s - 0.35) * depth;
        const cs = s < 0.35 ? s / 0.35 : 1 - (s - 0.35) / 0.65;
        const y = y0 - 3 + (ph + 3) * Math.pow(Math.max(0, cs), 0.8) * (0.85 + 0.3 * bump(t * 25, s * 4));
        row.push([Math.sin(a) * rr, y, -Math.cos(a) * rr]);
      }
      pts.push(row);
    }
    const pos: number[] = [];
    const col: number[] = [];
    const cs = new THREE.Color(T.snow);
    const cr = new THREE.Color(T.rock);
    const nz = noise2(seed + 3);
    const push = (a: V3, b: V3, c: V3, t: number) => {
      tmpA.set(...a);
      tmpB.set(...b).sub(tmpA);
      tmpC.set(...c).sub(tmpA);
      const n = tmpB.clone().cross(tmpC).normalize();
      const y = ((a[1] + b[1] + c[1]) / 3 - y0) / height;
      const line = snowLine + 0.18 * (nz(t * 40, 0.3) - 0.5);
      const snow = (y > line && n.y > steep) || y > 0.92;
      const k = snow ? cs : cr;
      pos.push(...a, ...b, ...c);
      for (let m = 0; m < 3; m++) col.push(k.r, k.g, k.b);
    };
    for (let i = 0; i < N; i++)
      for (let j = 0; j < M; j++) {
        const [p00, p01, p10, p11] = [pts[i][j], pts[i][j + 1], pts[i + 1][j], pts[i + 1][j + 1]];
        push(p00, p10, p01, i / N);
        push(p10, p11, p01, i / N);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    geo.computeVertexNormals();
    return geo;
  }, [R, a0, a1, height, y0, seed, snowLine, steep, depth, T.snow, T.rock]);
  return <OMesh geometry={g} vertexColors lineColor="#6f7f9c" threshold={28} fogMax={fogMax} />;
};

// ---------- snowy ground: rolling slopes + drifts (heightfield, two snow tones per facet) ----------
export type SnowGroundSpec = {
  area: [x0: number, x1: number, z0: number, z1: number];
  step?: number; // grid size (m); default 2.5
  height: (x: number, z: number) => number; // absolute y (use snowSlope() or your own)
  seed?: number;
  tones?: Partial<SnowTones>;
};
export const snowGroundGeometry = ({ area: [x0, x1, z0, z1], step = 2.5, height, seed = 1, tones }: SnowGroundSpec) => {
  const T = { ...SNOW_TONES, ...tones };
  const nz = noise2(seed + 11);
  const r = rng(seed);
  const xs: number[] = [];
  const zs: number[] = [];
  for (let x = x0; x <= x1 + 1e-6; x += step) xs.push(x);
  for (let z = z0; z <= z1 + 1e-6; z += step) zs.push(z);
  // jitter the inner grid a little: facets are not a regular grid
  const J = zs.map((_, j) => xs.map((_, i) => (i > 0 && j > 0 && i < xs.length - 1 && j < zs.length - 1 ? [(r() - 0.5) * step * 0.5, (r() - 0.5) * step * 0.5] : [0, 0])));
  const V = (i: number, j: number): V3 => {
    const x = xs[i] + J[j][i][0];
    const z = zs[j] + J[j][i][1];
    return [x, height(x, z), z];
  };
  const pos: number[] = [];
  const col: number[] = [];
  const c1 = new THREE.Color(T.snow);
  const c2 = new THREE.Color(T.snow2);
  for (let j = 0; j < zs.length - 1; j++)
    for (let i = 0; i < xs.length - 1; i++) {
      const [a, b, c, d] = [V(i, j), V(i + 1, j), V(i, j + 1), V(i + 1, j + 1)];
      for (const t of [[a, c, b], [b, c, d]] as V3[][]) {
        const k = nz((t[0][0] + t[1][0]) * 0.15, (t[0][2] + t[2][2]) * 0.15) > 0.62 ? c2 : c1;
        for (const p of t) {
          pos.push(...p);
          col.push(k.r, k.g, k.b);
        }
      }
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
};
export const SnowGround: React.FC<SnowGroundSpec & { fogMax?: number }> = ({ fogMax, ...spec }) => {
  const g = useMemo(() => snowGroundGeometry(spec), [spec.area.join(","), spec.step, spec.height, spec.seed]); // eslint-disable-line react-hooks/exhaustive-deps
  return <OMesh geometry={g} vertexColors lineColor={SNOW_TONES.snowLine} threshold={40} fogMax={fogMax} />;
};
// a height function: flat terraces at `flat` (a camp / a hut terrace), a slope rising toward -z with drifts;
// inside the area always ≥ 0.12 m above the ground disc of OutdoorBase, at the edges 0.5 m under it (a short
// ramp: the two surfaces cross in one clean line, never a patchy band)
export const snowSlope = (o: {
  rise: number; // m at the crest
  from: number; // z where the slope starts (m)
  crest: number; // z of the crest
  area: [number, number, number, number];
  seed?: number;
  drifts?: number; // m of rolling bumps; default 0.6
  flat?: [x: number, z: number, r: number][]; // flat terraces (y = slope height at their centre)
}) => {
  const nz = noise2(o.seed ?? 1);
  const sm = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const [x0, x1, z0, z1] = o.area;
  const base = (x: number, z: number) => {
    const up = sm(o.from, o.crest, z) * (1 - sm(o.crest, z0, z) * 0.85);
    const edge = sm(x0, x0 + 8, x) * (1 - sm(x1 - 8, x1, x)) * sm(z0, z0 + 6, z) * (1 - sm(z1 - 5, z1, z));
    const bumps = (o.drifts ?? 0.6) * nz(x * 0.12, z * 0.12); // drifts only UP: never below the disc inside
    return (o.rise * up * (0.85 + 0.3 * nz(x * 0.03 + 5, 2)) + bumps * (0.3 + up) + 0.12) * edge - 0.5 * (1 - edge);
  };
  return (x: number, z: number) => {
    let h = base(x, z);
    for (const [fx, fz, fr] of o.flat ?? []) {
      const k = 1 - sm(fr, fr * 1.8, Math.hypot(x - fx, z - fz));
      h = h * (1 - k) + base(fx, fz) * k;
    }
    return h;
  };
};

// snow ground texture for the OutdoorBase disc (ground={{ map: snowGroundTex(), color: "#ffffff" }})
let snowTexCache: THREE.CanvasTexture | null = null;
export const snowGroundTex = () => {
  if (snowTexCache) return snowTexCache;
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  const r = rng(77);
  g.fillStyle = SNOW_TONES.snow;
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) {
    const x = r() * 512;
    const y = r() * 512;
    const rad = 60 + r() * 90;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, r() < 0.5 ? "rgba(200,210,228,0.22)" : "rgba(226,232,240,0.25)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // wind ripples: short soft blue strokes
  g.strokeStyle = "rgba(160,174,202,0.18)";
  g.lineWidth = 3;
  for (let i = 0; i < 70; i++) {
    const x = r() * 512;
    const y = r() * 512;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + 14, y - 5, x + 30 + r() * 20, y);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(0.12, 0.12);
  t.anisotropy = 8;
  snowTexCache = t;
  return t;
};

// ---------- snowy pines: stacked tiers, snow on each tier, green band under the tier edge ----------
export type PineAt = [x: number, y: number, z: number, s: number];
const TIERS = 4;
const tierCone = facet(new THREE.ConeGeometry(1, 1, 7)); // apex at +0.5, base at -0.5
// the snow cone over a tier: same apex, `a` of the tier's height, 7 % wider (≈ 3-6 cm outside the green),
// its lower rim pulled up at every other vertex = drips/teeth
const snowCone = (a: number, seed: number) => {
  const g = new THREE.ConeGeometry(1, 1, 7, 1, true).toNonIndexed();
  const p = g.attributes.position as THREE.BufferAttribute;
  const r = rng(seed);
  const lift = Array.from({ length: 8 }, (_, k) => (k % 2 ? 0.18 + 0.15 * r() : 0.02 * r()));
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y < 0) {
      const ang = Math.atan2(p.getX(i), p.getZ(i));
      const k = Math.round(((ang + Math.PI * 2) % (Math.PI * 2)) / ((Math.PI * 2) / 7)) % 7;
      const u = lift[k]; // move this rim vertex up along the slant
      p.setXYZ(i, p.getX(i) * (1 - u), y + u, p.getZ(i) * (1 - u));
    }
  }
  // scale: height a, radius a·1.07, apex kept at +0.5
  g.translate(0, -0.5, 0);
  g.scale(a * 1.07, a, a * 1.07);
  g.translate(0, 0.5 + 0.03, 0);
  return facet(g);
};
const SNOW_CONES = [0, 1, 2].map((k) => (a: number) => snowCone(a, 31 + k));
const trunkBase = facet(new THREE.CylinderGeometry(0.11, 0.16, 1, 6));

export const SnowPines: React.FC<{
  trees: PineAt[];
  snow?: number; // 0 = bare pines, 1 = default cover, 1.3 = heavy
  seed?: number;
  tones?: Partial<SnowTones>;
  fogMax?: number;
}> = ({ trees, snow = 1, seed = 1, tones, fogMax }) => {
  const T = { ...SNOW_TONES, ...tones };
  const g = useMemo(() => {
    const r = rng(seed);
    const greens: THREE.BufferGeometry[][] = [[], []];
    const snows: THREE.BufferGeometry[] = [];
    const trunks: THREE.BufferGeometry[] = [];
    const a = Math.min(0.9, 0.5 + 0.28 * snow);
    const cones = [0, 1, 2].map((k) => SNOW_CONES[k](a));
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (const [x, y, z, s] of trees) {
      const tone = r() < 0.5 ? 0 : 1;
      const rot = r() * 6.28;
      const tall = 0.9 + 0.25 * r();
      trunks.push(trunkBase.clone().applyMatrix4(m.compose(new THREE.Vector3(x, y + 0.45 * s - SINK, z), q.identity(), new THREE.Vector3(s, 0.9 * s, s))));
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
      for (let k = 0; k < TIERS; k++) {
        const rad = (1.35 - k * 0.27) * s;
        const h = (1.5 - k * 0.14) * s * tall;
        const yb = y + (0.55 + k * 0.82 * tall) * s;
        m.compose(new THREE.Vector3(x, yb + h / 2, z), q, new THREE.Vector3(rad, h, rad));
        greens[tone].push(tierCone.clone().applyMatrix4(m));
        if (snow > 0) snows.push(cones[(k + tone) % 3].clone().applyMatrix4(m));
      }
    }
    const merge = (a: THREE.BufferGeometry[]) => (a.length ? mergeGeometries(a) : null);
    return { greens: greens.map(merge), snow: merge(snows), trunk: merge(trunks) };
  }, [trees, snow, seed]);
  return (
    <>
      {g.trunk ? <OMesh geometry={g.trunk} color={T.trunk} lineColor="#3a2820" threshold={50} fogMax={fogMax} /> : null}
      {g.greens.map((c, i) => (c ? <OMesh key={i} geometry={c} color={T.pine[i]} lineColor={T.pineLine} threshold={40} fogMax={fogMax} /> : null))}
      {g.snow ? <OMesh geometry={g.snow} color={T.snow} lineColor={T.snowLine} threshold={40} fogMax={fogMax} /> : null}
    </>
  );
};

// ---------- snowy rocks: faceted boulders, snow on the faces that look up ----------
export type RockAt = [x: number, y: number, z: number, s: number, rotY?: number];
const rockShapes = [3, 7, 12].map((seed) => {
  const g = new THREE.IcosahedronGeometry(1, 0);
  const p = g.attributes.position as THREE.BufferAttribute;
  const r = rng(seed);
  const moved = new Map<string, V3>();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    let v = moved.get(key);
    if (!v) {
      const k = 0.8 + 0.4 * r();
      v = [p.getX(i) * k * 1.15, Math.max(-0.35, p.getY(i)) * k * 0.7 + 0.3, p.getZ(i) * k];
      moved.set(key, v);
    }
    p.setXYZ(i, ...v);
  }
  const rock = facet(g);
  return { rock, snow: snowShell(rock, (_c, n) => n.y > 0.4, 0.025, 0.06) };
});
export const SnowRocks: React.FC<{ rocks: RockAt[]; snow?: boolean; tones?: Partial<SnowTones>; fogMax?: number }> = ({ rocks, snow = true, tones, fogMax }) => {
  const T = { ...SNOW_TONES, ...tones };
  const g = useMemo(() => {
    const rs: THREE.BufferGeometry[] = [];
    const ss: THREE.BufferGeometry[] = [];
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    rocks.forEach(([x, y, z, s, rot = 0], i) => {
      const shape = rockShapes[i % 3];
      m.compose(new THREE.Vector3(x, y - 0.1 * s, z), q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot), new THREE.Vector3(s, s, s));
      rs.push(shape.rock.clone().applyMatrix4(m));
      ss.push(shape.snow.clone().applyMatrix4(m));
    });
    return { rock: rs.length ? mergeGeometries(rs) : null, snow: ss.length ? mergeGeometries(ss) : null };
  }, [rocks]);
  return (
    <>
      {g.rock ? <OMesh geometry={g.rock} color={T.rock} lineColor={T.rockLine} threshold={30} fogMax={fogMax} /> : null}
      {snow && g.snow ? <OMesh geometry={g.snow} color={T.snow} lineColor={T.snowLine} threshold={40} fogMax={fogMax} /> : null}
    </>
  );
};

// ---------- smoke: light puffs rising and drifting, fading out (chimney, campfire) ----------
const puffG = facet(new THREE.IcosahedronGeometry(1, 1)); // rounder than a rock: reads as a soft puff
export const Smoke: React.FC<{ at: V3; frame: number; size?: number; rise?: number; drift?: V3; color?: string; n?: number; seed?: number }> = ({
  at,
  frame,
  size = 0.35,
  rise = 3.2,
  drift = [1.4, 0, -0.4],
  color = "#e8eaee",
  n = 5,
  seed = 0,
}) => {
  const t = frame / 30;
  return (
    <>
      {Array.from({ length: n }, (_, k) => {
        const u = (t * 0.22 + k / n + seed * 0.37) % 1;
        const sc = size * (0.7 + 2.0 * u);
        return (
          <OMesh
            key={k}
            geometry={puffG}
            position={[at[0] + drift[0] * u, at[1] + rise * u, at[2] + drift[2] * u]}
            rotation={[u * 2, k, 0]}
            scale={[sc, sc * 0.85, sc]}
            color={color}
            lines={false}
            transparent
            opacity={0.6 * (1 - u) * Math.min(1, u * 6)}
          />
        );
      })}
    </>
  );
};

// ---------- mountain hut: log walls, gable roof with snow, chimney smoke, warm windows ----------
const logTexCache = new Map<string, THREE.CanvasTexture>();
const logTex = (base: string) => {
  let t = logTexCache.get(base);
  if (!t) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 256;
    const g = c.getContext("2d")!;
    const r = rng(5);
    const col = new THREE.Color(base);
    for (let i = 0; i < 8; i++) {
      const k = 0.92 + 0.14 * r();
      g.fillStyle = `rgb(${Math.round(col.r * 255 * k)},${Math.round(col.g * 255 * k)},${Math.round(col.b * 255 * k)})`;
      g.fillRect(0, i * 32, 256, 32);
      g.fillStyle = "rgba(40,24,20,0.55)"; // gap between two logs
      g.fillRect(0, i * 32 + 29, 256, 3);
      g.fillStyle = "rgba(255,230,200,0.12)"; // light on the round top of the log
      g.fillRect(0, i * 32 + 2, 256, 6);
    }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    logTexCache.set(base, t);
  }
  return t;
};
// a box whose UVs are in metres (texture repeats per 2 m = 8 logs of 25 cm)
const meterBox = (w: number, h: number, d: number) => {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const p = g.attributes.position as THREE.BufferAttribute;
  const n = g.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    const side = Math.abs(n.getX(i)) > 0.5 ? p.getZ(i) : p.getX(i);
    uv.setXY(i, side / 2, p.getY(i) / 2);
  }
  return g;
};
const gableG = (w: number, h: number, d: number) => {
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2, 0);
  sh.lineTo(0, h);
  sh.lineTo(w / 2, 0);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  // uv in metres like the walls (front/back faces: x, y)
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / 2, p.getY(i) / 2);
  return g;
};

export const MountainHut: React.FC<{
  position?: V3;
  rotY?: number;
  frame: number;
  w?: number; // width (x, gable side) m
  d?: number; // depth (z) m
  wall?: string; // log colour
  roof?: string;
  snowRoof?: boolean;
  smoke?: boolean;
  foundation?: number; // stone base height below y (for a hut on a slope); default 0.5
  tones?: Partial<SnowTones>;
}> = ({ position = [0, 0, 0], rotY = 0, frame, w = 5, d = 6, wall = "#9a6444", roof = "#5a4450", snowRoof = true, smoke = true, foundation = 0.5, tones }) => {
  const T = { ...SNOW_TONES, ...tones };
  const H = 2.6; // wall height above the foundation top
  const RH = w * 0.42; // roof ridge height above the walls
  const ov = 0.45; // roof overhang
  const ang = Math.atan2(RH, w / 2);
  const slant = Math.hypot(w / 2 + ov, (w / 2 + ov) * Math.tan(ang));
  const g = useMemo(() => ({ walls: meterBox(w, H, d), gable: gableG(w, RH, d), tex: logTex(wall) }), [w, d, wall, RH]);
  const roofT = 0.16;
  const snowT = 0.2;
  const y0 = 0.25; // walls start on top of the stone base
  const chim: V3 = [w * 0.22, 0, -d * 0.18];
  const chimTop = y0 + H + RH * (1 - Math.abs(chim[0]) / (w / 2)) + 1.0;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* stone base (goes down into a slope) */}
      <OBox size={[w + 0.3, foundation + 0.25, d + 0.3]} position={[0, y0 - (foundation + 0.25) / 2, 0]} color="#8a8e98" lineColor={T.rockLine} />
      <OMesh geometry={g.walls} position={[0, y0 + H / 2, 0]} map={g.tex} color="#ffffff" lineColor="#3a2418" threshold={30} />
      <OMesh geometry={g.gable} position={[0, y0 + H - 0.02, 0]} map={g.tex} color="#ffffff" lineColor="#3a2418" threshold={30} />
      {/* roof: two slabs + snow slabs on top (snow 2 cm above the roof, a bit shorter at the eaves) */}
      {[-1, 1].map((sd) => {
        const cx = sd * ((w / 2 + ov) / 2 - 0.02);
        const cy = y0 + H + RH - ((w / 2 + ov) / 2) * Math.tan(ang);
        const nx = sd * Math.sin(ang);
        const ny = Math.cos(ang);
        const off = roofT / 2 + 0.01;
        return (
          <group key={sd}>
            <OBox size={[slant, roofT, d + ov * 2]} position={[cx + nx * off, cy + ny * off, 0]} rotation={[0, 0, -sd * ang]} color={roof} lineColor="#2a1e26" />
            {snowRoof ? (
              <OBox
                size={[slant - 0.12, snowT, d + ov * 2 - 0.05]}
                position={[cx + nx * (roofT + 0.02 + snowT / 2 + 0.01) - sd * 0.04, cy + ny * (roofT + 0.02 + snowT / 2 + 0.01), 0]}
                rotation={[0, 0, -sd * ang]}
                color={T.snow}
                lineColor={T.snowLine}
              />
            ) : null}
          </group>
        );
      })}
      {/* chimney (warm: no snow on it) + smoke */}
      <OBox size={[0.6, chimTop - (y0 + H), 0.6]} position={[chim[0], (chimTop + y0 + H) / 2, chim[2]]} color="#8a7a70" lineColor="#3a2e2a" />
      <OBox size={[0.74, 0.14, 0.74]} position={[chim[0], chimTop + 0.07, chim[2]]} color="#6a5c56" lineColor="#3a2e2a" />
      {smoke ? <Smoke at={[chim[0], chimTop + 0.35, chim[2]]} frame={frame} /> : null}
      {/* front (+z): door, two warm windows, a step; side window */}
      <OBox size={[1.0, 1.95, 0.08]} position={[-w * 0.18, y0 + 0.98, d / 2 + 0.04]} color="#5a3a2c" lineColor="#2a1a14" />
      {[w * 0.22].map((x) => (
        <group key={x}>
          <OBox size={[1.0, 0.9, 0.06]} position={[x, y0 + 1.55, d / 2 + 0.03]} color="#f2c46a" emissive="#f0a040" emissiveIntensity={0.55} lineColor="#3a2418" />
          <OBox size={[1.16, 0.1, 0.16]} position={[x, y0 + 1.06, d / 2 + 0.08]} color="#7a5038" lineColor="#3a2418" />
          <OBox size={[1.12, 0.1, 0.18]} position={[x, y0 + 1.03 + 0.09, d / 2 + 0.1]} color={T.snow} lineColor={T.snowLine} />
        </group>
      ))}
      <OBox size={[0.06, 0.9, 1.0]} position={[w / 2 + 0.03, y0 + 1.55, d * 0.1]} color="#f2c46a" emissive="#f0a040" emissiveIntensity={0.55} lineColor="#3a2418" />
      <Glow position={[w * 0.22, y0 + 1.55, d / 2 + 0.3]} size={1.6} color="#ffb860" opacity={0.35} />
      <OBox size={[1.6, 0.22, 0.7]} position={[-w * 0.18, y0 - 0.1, d / 2 + 0.35]} color="#7a7e88" lineColor={T.rockLine} />
      <WoodPile x={-w / 2 - 0.45} y={0} z={-d * 0.15} rotY={Math.PI / 2} />
      {/* snow drifts against the walls */}
      <SnowRocks
        snow={false}
        rocks={[[w / 2 + 0.3, -0.1, d * 0.35, 0.55, 1], [-w / 2 - 0.2, -0.15, d * 0.3, 0.5, 2], [w * 0.4, -0.15, -d / 2 - 0.25, 0.6, 0.4]]}
        tones={{ rock: T.snow, rockLine: T.snowLine }}
      />
    </group>
  );
};

// ---------- peak camp: tent, campfire, camp stove with a pot, backpack, prayer-flag line ----------
const tentG = (() => {
  const sh = new THREE.Shape();
  sh.moveTo(-0.85, 0);
  sh.lineTo(-0.55, 0.75);
  sh.lineTo(0, 1.2);
  sh.lineTo(0.55, 0.75);
  sh.lineTo(0.85, 0);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 2.2, bevelEnabled: false });
  g.translate(0, 0, -1.1);
  return facet(g);
})();
const doorG = (() => {
  const sh = new THREE.Shape();
  sh.moveTo(-0.45, 0);
  sh.lineTo(-0.3, 0.6);
  sh.lineTo(0, 0.95);
  sh.lineTo(0.3, 0.6);
  sh.lineTo(0.45, 0);
  sh.closePath();
  return new THREE.ShapeGeometry(sh);
})();
export const Tent: React.FC<{ position?: V3; rotY?: number; color?: string; open?: boolean }> = ({ position = [0, 0, 0], rotY = 0, color = "#e0603a", open = true }) => (
  <group position={[position[0], position[1] - SINK, position[2]]} rotation={[0, rotY, 0]}>
    <OMesh geometry={tentG} color={color} lineColor="#5a2418" threshold={20} />
    {open ? <OMesh geometry={doorG} position={[0, 0.02, 1.12]} color="#3a2430" lineColor="#2a1820" /> : null}
    {/* poles sticking out at the ridge + a snow lip along the bottom */}
    {[-1.17, 1.17].map((z) => (
      <OBox key={z} size={[0.05, 0.25, 0.05]} position={[0, 1.27, z]} color="#3a3a44" />
    ))}
    <SnowRocks snow={false} rocks={[[0.95, 0, -0.5, 0.3, 0], [-0.95, 0, 0.4, 0.3, 1.2], [0.92, 0, 0.7, 0.25, 2]]} tones={{ rock: SNOW_TONES.snow, rockLine: SNOW_TONES.snowLine }} />
  </group>
);

const stoneRing = Array.from({ length: 8 }, (_, k) => ({ p: [Math.cos((k / 8) * 6.283) * 0.55, 0, Math.sin((k / 8) * 6.283) * 0.55] as V3, s: [0.17, 0.13, 0.15] as V3, r: k }));
const fireStoneG = mergeAt(facet(new THREE.IcosahedronGeometry(1, 0)), stoneRing);
const logG = facet(new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6));
const flameG = facet(new THREE.ConeGeometry(1, 1, 5));
export const Campfire: React.FC<{ position?: V3; frame: number; lit?: boolean; smoke?: boolean }> = ({ position = [0, 0, 0], frame, lit = true, smoke = true }) => {
  const t = frame / 30;
  return (
    <group position={[position[0], position[1] - SINK, position[2]]}>
      {fireStoneG ? <OMesh geometry={fireStoneG} color="#7a7e8a" lineColor={SNOW_TONES.rockLine} threshold={30} /> : null}
      {[0, 2.1, 4.2].map((a) => (
        <OMesh key={a} geometry={logG} position={[Math.cos(a) * 0.12, 0.12, Math.sin(a) * 0.12]} rotation={[0, a, Math.PI / 2 - 0.35]} color="#6a4430" lineColor="#2a1a12" />
      ))}
      {lit ? (
        <>
          {[
            [0, 0.46, 0, 0.11, "#ff9a30"],
            [0.11, 0.34, 0.05, 0.09, "#ff7a2a"],
            [-0.1, 0.36, -0.04, 0.09, "#ff8a30"],
            [0.03, 0.3, -0.11, 0.08, "#ff6a24"],
            [-0.03, 0.26, 0.1, 0.08, "#ffb84a"],
            [0.01, 0.2, 0.01, 0.07, "#ffe08a"],
          ].map(([x, h, z, r, c], k) => {
            const f = 1 + 0.18 * Math.sin(t * 13 + k * 2.1) + 0.1 * Math.sin(t * 23 + k);
            return (
              <OMesh
                key={k}
                geometry={flameG}
                position={[x as number, 0.18 + ((h as number) * f) / 2, z as number]}
                rotation={[0, t * 2 + k, 0.08 * Math.sin(t * 9 + k)]}
                scale={[r as number, (h as number) * f, r as number]}
                color={c as string}
                basic
                lineColor="#a03a1a"
              />
            );
          })}
          <Glow position={[0, 0.5, 0]} size={2.2} color="#ffa040" opacity={0.45} />
          {smoke ? <Smoke at={[0, 1.0, 0]} frame={frame} size={0.18} rise={2.4} drift={[0.8, 0, -0.3]} n={4} seed={2} color="#d8dade" /> : null}
        </>
      ) : null}
    </group>
  );
};

const potG = facet(new THREE.CylinderGeometry(0.15, 0.14, 0.17, 10));
const lidG = facet(new THREE.CylinderGeometry(0.155, 0.155, 0.025, 10));
const burnerG = facet(new THREE.CylinderGeometry(0.11, 0.13, 0.1, 8));
// a small gas camp stove with a pot (for idea #3: pasta on a mountain). `boil` = steam puffs + a jumping lid
export const CampStove: React.FC<{ position?: V3; rotY?: number; frame: number; boil?: boolean; lid?: boolean }> = ({ position = [0, 0, 0], rotY = 0, frame, boil = true, lid = true }) => {
  const t = frame / 30;
  const jump = boil && lid ? Math.max(0, Math.sin(t * 9)) * 0.012 : 0;
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <OMesh geometry={burnerG} position={[0, 0.05, 0]} color="#3e4450" lineColor="#1e2028" />
      {[0, 2.09, 4.19].map((a) => (
        <OBox key={a} size={[0.03, 0.03, 0.17]} position={[Math.cos(a) * 0.09, 0.11, Math.sin(a) * 0.09]} rotation={[0, -a + Math.PI / 2, 0]} color="#2a2e36" />
      ))}
      <OMesh geometry={flameG} position={[0, 0.115, 0]} scale={[0.09, 0.03, 0.09]} color="#6fa8ff" basic lines={false} />
      <OMesh geometry={potG} position={[0, 0.21, 0]} color="#b8bec8" lineColor="#3a3e48" threshold={40} />
      <OBox size={[0.36, 0.02, 0.03]} position={[0, 0.27, 0]} color="#3a3e48" />
      {lid ? <OMesh geometry={lidG} position={[0, 0.31 + jump, 0]} color="#a0a6b2" lineColor="#3a3e48" threshold={40} /> : null}
      {boil ? <Smoke at={[0.02, 0.38, 0]} frame={frame} size={0.06} rise={0.7} drift={[0.15, 0, -0.05]} n={4} seed={5} color="#f4f5f8" /> : null}
    </group>
  );
};

export const Backpack: React.FC<{ position?: V3; rotY?: number; color?: string }> = ({ position = [0, 0, 0], rotY = 0, color = "#3f6fb0" }) => (
  <group position={[position[0], position[1] - SINK, position[2]]} rotation={[0, rotY, 0.12]}>
    <OBox size={[0.42, 0.62, 0.28]} position={[0, 0.31, 0]} color={color} lineColor="#1e2a44" />
    <OBox size={[0.36, 0.22, 0.1]} position={[0, 0.24, 0.18]} color={color} lineColor="#1e2a44" />
    <OBox size={[0.44, 0.1, 0.3]} position={[0, 0.66, 0]} color="#2c4f86" lineColor="#1e2a44" />
    <OBox size={[0.5, 0.14, 0.14]} position={[0, 0.78, -0.02]} rotation={[Math.PI / 2, 0, Math.PI / 2]} color="#d8a03a" lineColor="#5a3e14" />
  </group>
);

// the whole camp on flat ground at `position`: tent behind, fire in the middle, stove on a crate, backpack,
// a prayer-flag line from the tent pole to a post (colour in a white world). Every part can be switched off.
export const PeakCamp: React.FC<{
  position?: V3;
  rotY?: number;
  frame: number;
  tent?: string | false; // tent colour, false = no tent
  fire?: boolean;
  stove?: boolean;
  flags?: boolean;
}> = ({ position = [0, 0, 0], rotY = 0, frame, tent = "#e0603a", fire = true, stove = true, flags = true }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    {tent ? <Tent position={[-1.6, 0, -2.2]} rotY={0.35} color={tent} /> : null}
    {fire ? <Campfire position={[0.6, 0, 0]} frame={frame} /> : null}
    {stove ? (
      <>
        <OBox size={[0.6, 0.38, 0.45]} position={[2.1, 0.17, -0.6]} rotation={[0, -0.3, 0]} color="#9a6444" lineColor="#4a3020" />
        <CampStove position={[2.1, 0.36, -0.6]} frame={frame} />
      </>
    ) : null}
    <Backpack position={[-0.4, 0, -0.6]} rotY={0.8} />
    {flags ? (
      <>
        <OBox size={[0.07, 2.4, 0.07]} position={[3.2, 1.18, -2.8]} color="#7a5a40" />
        <Bunting a={[-1.6 + 0.4, 1.4, -2.2 - 1.1]} b={[3.2, 2.3, -2.8]} sag={0.35} n={10} />
      </>
    ) : null}
  </group>
);
