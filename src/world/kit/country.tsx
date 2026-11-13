// Country props: low-poly rural set dressing (v4 VFX item 8 "background filling", references/effects/README.md §8).
// Same world style as the rest of the kit: faceted shapes, two tones, thin ink lines, cast + receive shadows.
// Many small copies (grass tufts, cabbages, reeds, logs) are MERGED into one mesh per colour, so a full
// set stays one draw call + one line object per prop type (render time).
// Every prop sits 2 cm into the ground (no face on the ground plane = no z-fighting, FB5).
import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { OBox, OMesh } from "../../three/Outlined";
import { rng, woodTex } from "../../three/textures";

export type V3 = [number, number, number];
type Item = { p: V3; s?: number | V3; r?: number };

const SINK = 0.02;

// flat normals = the low-poly facets catch the sun as two/three tones
export const facet = (g: THREE.BufferGeometry) => {
  const n = g.index ? g.toNonIndexed() : g;
  n.deleteAttribute("uv");
  n.computeVertexNormals();
  return n;
};

// many copies of one (faceted) shape as ONE geometry
export const mergeAt = (base: THREE.BufferGeometry, items: Item[]) => {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const parts = items.map(({ p, s = 1, r = 0 }) => {
    const sc = typeof s === "number" ? [s, s, s] : s;
    q.setFromEuler(e.set(0, r, 0));
    m.compose(new THREE.Vector3(...p), q, new THREE.Vector3(sc[0], sc[1], sc[2]));
    return base.clone().applyMatrix4(m);
  });
  return parts.length ? mergeGeometries(parts) : null;
};

// one tuft = three thin leaning blades
const tuftBase = (() => {
  const blade = (lean: number, rotY: number, h: number) => {
    const g = new THREE.ConeGeometry(0.045, h, 3, 1);
    g.translate(0, h / 2, 0);
    g.rotateZ(lean);
    g.rotateY(rotY);
    return facet(g);
  };
  return mergeGeometries([blade(0.25, 0, 0.34), blade(-0.3, 1.9, 0.28), blade(0.2, 4.0, 0.24)]);
})();

export type Area = [x0: number, x1: number, z0: number, z1: number];

// scattered grass tufts in rectangles on the ground (y = ground height); two greens
export const GrassTufts: React.FC<{ y: number; areas: Area[]; perM2: number; seed: number; avoid?: (x: number, z: number) => boolean }> = ({
  y,
  areas,
  perM2,
  seed,
  avoid,
}) => {
  const [a, b] = useMemo(() => {
    const r = rng(seed);
    const A: Item[] = [];
    const B: Item[] = [];
    for (const [x0, x1, z0, z1] of areas) {
      const n = Math.round(Math.abs((x1 - x0) * (z1 - z0)) * perM2);
      for (let i = 0; i < n; i++) {
        const x = x0 + r() * (x1 - x0);
        const z = z0 + r() * (z1 - z0);
        const s = 0.8 + r() * 0.7;
        const rot = r() * Math.PI * 2;
        if (avoid?.(x, z)) continue;
        (r() < 0.5 ? A : B).push({ p: [x, y - SINK, z], s, r: rot });
      }
    }
    return [mergeAt(tuftBase, A), mergeAt(tuftBase, B)];
  }, [y, areas, perM2, seed, avoid]);
  return (
    <>
      {a ? <OMesh geometry={a} color="#4f8a3a" lineColor="#2f5a2a" threshold={50} /> : null}
      {b ? <OMesh geometry={b} color="#86b452" lineColor="#3f6a2e" threshold={50} /> : null}
    </>
  );
};

// flower clumps: a tuft with three small heads (pink, yellow, white)
const headBase = facet(new THREE.IcosahedronGeometry(0.07, 0));
const FLOWER_COLORS = ["#e889a8", "#f3cf55", "#f6f1e4"];
export const Flowers: React.FC<{ y: number; at: [number, number][]; seed: number }> = ({ y, at, seed }) => {
  const geoms = useMemo(() => {
    const r = rng(seed);
    const tufts: Item[] = [];
    const heads: Item[][] = [[], [], []];
    for (const [x, z] of at) {
      tufts.push({ p: [x, y - SINK, z], s: 1.1, r: r() * 6 });
      const c = Math.floor(r() * 3);
      for (let k = 0; k < 3; k++) {
        const a = r() * Math.PI * 2;
        heads[(c + (k === 2 ? 1 : 0)) % 3].push({ p: [x + Math.cos(a) * 0.1, y + 0.24 + r() * 0.08, z + Math.sin(a) * 0.1] });
      }
    }
    return { tufts: mergeAt(tuftBase, tufts), heads: heads.map((h) => mergeAt(headBase, h)) };
  }, [y, at, seed]);
  return (
    <>
      {geoms.tufts ? <OMesh geometry={geoms.tufts} color="#5f9a48" lineColor="#2f5a2a" threshold={50} /> : null}
      {geoms.heads.map((g, i) => (g ? <OMesh key={i} geometry={g} color={FLOWER_COLORS[i]} lineColor="#6a4a5a" threshold={40} /> : null))}
    </>
  );
};

// raised vegetable bed: soil in a plank frame, rows of cabbages (two greens)
const cabbageBase = facet(new THREE.IcosahedronGeometry(0.16, 0));
export const VegBed: React.FC<{ x: number; y: number; z: number; w?: number; d?: number; rotY?: number }> = ({
  x,
  y,
  z,
  w = 3,
  d = 1.4,
  rotY = 0,
}) => {
  const [ca, cb] = useMemo(() => {
    const A: Item[] = [];
    const B: Item[] = [];
    const rows = Math.max(2, Math.round(d / 0.45));
    const cols = Math.max(3, Math.round(w / 0.42));
    for (let i = 0; i < rows; i++)
      for (let k = 0; k < cols; k++) {
        const px = -w / 2 + 0.25 + (k * (w - 0.5)) / (cols - 1);
        const pz = -d / 2 + 0.22 + (i * (d - 0.44)) / (rows - 1);
        (i % 2 ? A : B).push({ p: [px, 0.24, pz], s: [1, 0.75, 1], r: k * 1.3 });
      }
    return [mergeAt(cabbageBase, A), mergeAt(cabbageBase, B)];
  }, [w, d]);
  return (
    <group position={[x, y - SINK, z]} rotation={[0, rotY, 0]}>
      {/* soil (top 0.20) inside a plank frame (top 0.26): no shared planes */}
      <OBox size={[w - 0.1, 0.2, d - 0.1]} position={[0, 0.1, 0]} color="#6b4a34" lineColor="#3a2820" />
      {[-1, 1].map((s) => (
        <group key={s}>
          <OBox size={[w + 0.06, 0.26, 0.05]} position={[0, 0.13, s * (d / 2 - 0.0)]} color="#8b6a4c" map={woodTex([2, 0.3])} />
          <OBox size={[0.05, 0.26, d - 0.06]} position={[s * (w / 2 - 0.0), 0.13, 0]} color="#8b6a4c" map={woodTex([0.5, 0.3])} />
        </group>
      ))}
      {ca ? <OMesh geometry={ca} color="#6fa84c" lineColor="#2f5a2a" threshold={40} /> : null}
      {cb ? <OMesh geometry={cb} color="#4f8a3a" lineColor="#2f5a2a" threshold={40} /> : null}
    </group>
  );
};

// a round haystack with a pole through the top
const stackBase = facet(
  new THREE.LatheGeometry(
    [
      [0.001, 2.05],
      [0.3, 1.95],
      [0.75, 1.55],
      [1.0, 0.95],
      [1.05, 0.35],
      [0.95, 0],
    ].map(([r, h]) => new THREE.Vector2(r, h)),
    9,
  ),
);
export const Haystack: React.FC<{ x: number; y: number; z: number; s?: number; rotY?: number }> = ({ x, y, z, s = 1, rotY = 0 }) => (
  <group position={[x, y - SINK, z]} scale={[s, s, s]} rotation={[0, rotY, 0]}>
    <OMesh geometry={stackBase} color="#e0b85a" lineColor="#8a6a2a" threshold={25} />
    <OBox size={[0.07, 0.6, 0.07]} position={[0, 2.2, 0]} color="#6a4a36" />
  </group>
);

// sacks: squashed faceted balls
const sackBase = facet(new THREE.IcosahedronGeometry(1, 1));
export const Sacks: React.FC<{ y: number; at: [number, number, number?][] }> = ({ y, at }) => {
  const g = useMemo(
    () => mergeAt(sackBase, at.map(([x, z, h = 0]) => ({ p: [x, y + 0.2 + h, z] as V3, s: [0.3, 0.24, 0.24] as V3, r: x * 3 + z }))),
    [y, at],
  );
  return g ? <OMesh geometry={g} color="#d8c49a" lineColor="#7a6440" threshold={35} /> : null;
};

// NOTE: array props (areas, at) must be module constants: a new array each frame would rebuild the merged mesh.
const CART_LOAD: [number, number, number?][] = [[-0.4, -0.15], [0.25, 0.18], [-0.1, 0.2, 0.18]];
// a two-wheeled hand cart, shafts down on the ground in front
const wheelBase = (() => {
  const g = new THREE.CylinderGeometry(0.42, 0.42, 0.07, 10);
  g.rotateX(Math.PI / 2);
  return facet(g);
})();
export const Cart: React.FC<{ x: number; y: number; z: number; rotY?: number; load?: boolean }> = ({ x, y, z, rotY = 0, load = true }) => (
  <group position={[x, y, z]} rotation={[0, rotY, 0]}>
    <OBox size={[1.7, 0.1, 1.0]} position={[0, 0.62, 0]} color="#a46b55" map={woodTex([1.5, 0.5])} />
    {[-1, 1].map((s) => (
      <OBox key={s} size={[1.7, 0.3, 0.05]} position={[0, 0.82, s * 0.5]} color="#8b5a44" map={woodTex([1.5, 0.3])} />
    ))}
    <OBox size={[0.05, 0.3, 0.95]} position={[-0.84, 0.82, 0]} color="#8b5a44" />
    {[-1, 1].map((s) => (
      <group key={`w${s}`}>
        <OMesh geometry={wheelBase} position={[0.1, 0.42, s * 0.58]} color="#6a4a36" threshold={40} />
        {/* the shafts run from the bed down to the ground */}
        <OBox size={[1.35, 0.06, 0.06]} position={[1.42, 0.33, s * 0.38]} rotation={[0, 0, -0.42]} color="#6a4a36" />
      </group>
    ))}
    {load ? <Sacks y={0.6} at={CART_LOAD} /> : null}
  </group>
);

// stacked logs (3-2-1), ends showing
const logBase = (() => {
  const g = new THREE.CylinderGeometry(0.13, 0.13, 1.3, 7);
  g.rotateX(Math.PI / 2);
  return facet(g);
})();
export const WoodPile: React.FC<{ x: number; y: number; z: number; rotY?: number }> = ({ x, y, z, rotY = 0 }) => {
  const g = useMemo(() => {
    const it: Item[] = [];
    [3, 2, 1].forEach((n, row) => {
      for (let i = 0; i < n; i++) it.push({ p: [(i - (n - 1) / 2) * 0.27, 0.12 + row * 0.23, 0] });
    });
    return mergeAt(logBase, it);
  }, []);
  return (
    <group position={[x, y - SINK, z]} rotation={[0, rotY, 0]}>
      {g ? <OMesh geometry={g} color="#9a6444" lineColor="#4a3020" threshold={35} /> : null}
    </group>
  );
};

// a flat-bottomed rowing boat on the water (y = water level) + its mooring post
const boatShape = (k: number) => {
  const s = new THREE.Shape();
  s.moveTo(-1.5 * k, 0);
  s.lineTo(-1.0 * k, 0.5 * k);
  s.lineTo(1.0 * k, 0.5 * k);
  s.lineTo(1.6 * k, 0);
  s.lineTo(1.0 * k, -0.5 * k);
  s.lineTo(-1.0 * k, -0.5 * k);
  s.closePath();
  return s;
};
const hullBase = (() => {
  const g = new THREE.ExtrudeGeometry(boatShape(1), { depth: 0.42, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return facet(g);
})();
const insideBase = (() => {
  const g = new THREE.ShapeGeometry(boatShape(0.84));
  g.rotateX(-Math.PI / 2);
  return g;
})();
const postBase = facet(new THREE.CylinderGeometry(0.09, 0.1, 1.5, 7));
export const Boat: React.FC<{ x: number; z: number; rotY?: number; water?: number; color?: string; post?: V3 }> = ({
  x,
  z,
  rotY = 0,
  water = 0,
  color = "#7a8fb0",
  post,
}) => (
  <>
    <group position={[x, water - 0.12, z]} rotation={[0, rotY, 0]}>
      <OMesh geometry={hullBase} color={color} lineColor="#2a2a40" threshold={30} />
      {/* the dark inside, 2 cm above the rim (reads as the hollow from above; no shared plane) */}
      <OMesh geometry={insideBase} position={[0, 0.44, 0]} color="#5a3c30" lines={false} />
      {[-0.45, 0.5].map((bx) => (
        <OBox key={bx} size={[0.14, 0.05, 0.86]} position={[bx, 0.49, 0]} color="#a46b55" />
      ))}
    </group>
    {post ? <OMesh geometry={postBase} position={[post[0], water + 0.5, post[2]]} color="#6a4a36" threshold={40} /> : null}
  </>
);

// reeds at the water's edge: tall thin blades in clumps, a few brown bulrush heads
const reedBase = (() => {
  const blade = (lean: number, rotY: number, h: number) => {
    const g = new THREE.ConeGeometry(0.035, h, 3, 1);
    g.translate(0, h / 2, 0);
    g.rotateZ(lean);
    g.rotateY(rotY);
    return facet(g);
  };
  return mergeGeometries([blade(0.12, 0, 1.25), blade(-0.16, 2.1, 1.0), blade(0.2, 4.2, 0.85), blade(-0.05, 5.3, 1.1)]);
})();
const rushBase = facet(new THREE.CylinderGeometry(0.045, 0.045, 0.26, 6));
export const Reeds: React.FC<{ y: number; x: number; z0: number; z1: number; seed: number; every?: number }> = ({
  y,
  x,
  z0,
  z1,
  seed,
  every = 0.7,
}) => {
  const [a, b, heads] = useMemo(() => {
    const r = rng(seed);
    const A: Item[] = [];
    const B: Item[] = [];
    const H: Item[] = [];
    for (let z = z0; z < z1; z += every * (0.6 + r() * 0.8)) {
      if (r() < 0.25) continue; // gaps between the clumps
      const s = 0.75 + r() * 0.5;
      const px = x + (r() - 0.5) * 0.5;
      (r() < 0.5 ? A : B).push({ p: [px, y - 0.1, z], s, r: r() * 6 });
      if (r() < 0.35) H.push({ p: [px, y - 0.1 + 1.15 * s, z] });
    }
    return [mergeAt(reedBase, A), mergeAt(reedBase, B), mergeAt(rushBase, H)];
  }, [y, x, z0, z1, seed, every]);
  return (
    <>
      {a ? <OMesh geometry={a} color="#6f9444" lineColor="#3a5228" threshold={50} /> : null}
      {b ? <OMesh geometry={b} color="#9aae58" lineColor="#4a5a2c" threshold={50} /> : null}
      {heads ? <OMesh geometry={heads} color="#6a4a30" lineColor="#3a2820" threshold={40} /> : null}
    </>
  );
};

// a market stall: four posts, a plank counter with goods, a striped awning (front = +z before rotY)
const appleBase = facet(new THREE.IcosahedronGeometry(0.075, 0));
const STALL_GOODS: Item[] = Array.from({ length: 14 }, (_, i) => ({ p: [-0.7 + (i % 7) * 0.23, 1.0, 0.12 + Math.floor(i / 7) * 0.2] as V3 }));
export const Stall: React.FC<{ x: number; y: number; z: number; rotY?: number; stripe?: string }> = ({ x, y, z, rotY = 0, stripe = "#8e3a3f" }) => {
  const goods = useMemo(() => [mergeAt(appleBase, STALL_GOODS.slice(0, 7)), mergeAt(appleBase, STALL_GOODS.slice(7))], []);
  return (
    <group position={[x, y - SINK, z]} rotation={[0, rotY, 0]}>
      {[[-0.95, 0.4], [0.95, 0.4], [-0.95, -0.45], [0.95, -0.45]].map(([px, pz], i) => (
        <OBox key={i} size={[0.09, pz > 0 ? 2.05 : 2.35, 0.09]} position={[px, (pz > 0 ? 2.05 : 2.35) / 2, pz]} color="#7a5a40" />
      ))}
      <OBox size={[2.0, 0.85, 0.75]} position={[0, 0.425, 0]} color="#a46b55" map={woodTex([1.5, 0.6])} />
      <OBox size={[2.1, 0.06, 0.85]} position={[0, 0.88, 0.02]} color="#8b5a44" />
      {goods[0] ? <OMesh geometry={goods[0]} color="#d9473a" lineColor="#6a2020" threshold={40} /> : null}
      {goods[1] ? <OMesh geometry={goods[1]} color="#e8b33a" lineColor="#6a4a20" threshold={40} /> : null}
      {/* awning: sloping stripes from the back posts (2.35) down over the front (2.05) */}
      <group position={[0, 2.22, 0.05]} rotation={[0.32, 0, 0]}>
        {Array.from({ length: 6 }, (_, i) => (
          <OBox key={i} size={[0.38, 0.04, 1.25]} position={[-0.95 + i * 0.38, 0, 0]} color={i % 2 ? "#e8dccb" : stripe} />
        ))}
      </group>
    </group>
  );
};

// bunting: a sagging cord between two points with small triangle flags (merged per colour)
const flagBase = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.14, 0);
  s.lineTo(0.14, 0);
  s.lineTo(0, -0.3);
  s.closePath();
  return facet(new THREE.ExtrudeGeometry(s, { depth: 0.012, bevelEnabled: false }));
})();
const BUNT_COLORS = ["#d9473a", "#e8b33a", "#4f7db8", "#f6f1e4"];
export const Bunting: React.FC<{ a: V3; b: V3; sag?: number; n?: number }> = ({ a, b, sag = 0.5, n = 12 }) => {
  const { cord, flags } = useMemo(() => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const at = (t: number) => A.clone().lerp(B, t).add(new THREE.Vector3(0, -sag * 4 * t * (1 - t), 0));
    const curve = new THREE.CatmullRomCurve3(Array.from({ length: 17 }, (_, i) => at(i / 16)));
    const rotY = -Math.atan2(B.z - A.z, B.x - A.x);
    const per: Item[][] = [[], [], [], []];
    for (let i = 1; i < n; i++) {
      const p = at(i / n);
      per[i % 4].push({ p: [p.x, p.y, p.z], r: rotY });
    }
    return { cord: new THREE.TubeGeometry(curve, 32, 0.012, 4, false), flags: per.map((it) => mergeAt(flagBase, it)) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.join(","), b.join(","), sag, n]);
  return (
    <>
      <mesh geometry={cord}>
        <meshBasicMaterial color="#1e1a2c" />
      </mesh>
      {flags.map((g, i) => (g ? <OMesh key={i} geometry={g} color={BUNT_COLORS[i]} lineColor="#2a2230" threshold={30} /> : null))}
    </>
  );
};

// two posts for a clothesline (the line itself = kit ClothesLine between their tops)
export const LinePosts: React.FC<{ y: number; a: [number, number]; b: [number, number]; h?: number }> = ({ y, a, b, h = 2.1 }) => (
  <>
    {[a, b].map(([x, z], i) => (
      <OBox key={i} size={[0.1, h, 0.1]} position={[x, y + h / 2 - SINK, z]} color="#7a5a40" />
    ))}
  </>
);
