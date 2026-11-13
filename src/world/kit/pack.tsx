// Free 3D pack pieces (scenes plan 3): load any .glb from public/packs/<pack>/ and draw it in our world look.
// Packs are git-ignored (downloaded per theme, see public/packs/README.md); every pack folder keeps LICENSE.txt
// + sources.txt. Only CC0 / CC-BY packs (CC-BY = a line in the credits list, references/sets/CREDITS.md).
//
// What the loader does (any pack, any author):
// 1. bakes every mesh into one geometry per material (fewer draw calls, works for Z-up or tiny-scale packs),
//    drops duplicated triangles (no z-fighting), flat faces, and finds clean ink lines (`findEdges`),
// 2. sits the piece on the floor, centered on x/z, scaled to a real height `h` (m),
// 3. draws each material as an OMesh: our ink lines + our light, color from `tones` (pack material name → our color).
// look="raw" = the piece as it comes (its own materials, no lines): only for the style test.
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OMesh } from "../../three/Outlined";

type Edge = { a: THREE.Vector3; b: THREE.Vector3; angle: number }; // angle between the two faces (deg), 180 = border
type Part = { mat: string; geom: THREE.BufferGeometry; color: string; raw: THREE.Material; edges: Edge[] };
export type PackModel = { parts: Part[]; size: THREE.Vector3 };

const cache = new Map<string, Promise<PackModel>>();

// Ink line candidates of one part. Like three's EdgesGeometry (crease angle between the two faces of an edge), but
// pack meshes often split a flat face into a fan whose edges do not meet vertex to vertex (T-junctions): each of
// them looks like a border. A border edge that lies along another border edge of the same part (same line,
// overlapping) gets the angle between those two faces instead, so flat faces stay clean.
const findEdges = (pos: ArrayLike<number>, eps: number): Edge[] => {
  const q = (p: THREE.Vector3) => `${Math.round(p.x / eps)},${Math.round(p.y / eps)},${Math.round(p.z / eps)}`;
  const map = new Map<string, { a: THREE.Vector3; b: THREE.Vector3; n: THREE.Vector3[] }>();
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  for (let i = 0; i + 8 < pos.length; i += 9) {
    for (let j = 0; j < 3; j++) v[j].set(pos[i + j * 3], pos[i + j * 3 + 1], pos[i + j * 3 + 2]);
    const n = new THREE.Vector3().subVectors(v[1], v[0]).cross(new THREE.Vector3().subVectors(v[2], v[0]));
    if (n.lengthSq() < 1e-20) continue;
    n.normalize();
    for (let j = 0; j < 3; j++) {
      const a = v[j];
      const b = v[(j + 1) % 3];
      const ka = q(a);
      const kb = q(b);
      if (ka === kb) continue;
      const k = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      const e = map.get(k) ?? { a: a.clone(), b: b.clone(), n: [] };
      e.n.push(n);
      map.set(k, e);
    }
  }
  const deg = (n1: THREE.Vector3, n2: THREE.Vector3) => THREE.MathUtils.radToDeg(n1.angleTo(n2));
  const out: Edge[] = [];
  type B = { a: THREE.Vector3; b: THREE.Vector3; n: THREE.Vector3 };
  const border: B[] = [];
  for (const e of map.values()) {
    if (e.n.length === 2) out.push({ a: e.a, b: e.b, angle: deg(e.n[0], e.n[1]) });
    else if (e.n.length > 2) out.push({ a: e.a, b: e.b, angle: 180 });
    else border.push({ a: e.a, b: e.b, n: e.n[0] });
  }
  const tol = eps * 4;
  const along = (e: B, f: B) => {
    const d = new THREE.Vector3().subVectors(e.b, e.a);
    const len = d.length();
    d.divideScalar(len);
    const t = (p: THREE.Vector3) => new THREE.Vector3().subVectors(p, e.a).dot(d);
    const off = (p: THREE.Vector3) => new THREE.Vector3().subVectors(p, e.a).addScaledVector(d, -t(p)).length();
    if (off(f.a) > tol || off(f.b) > tol) return false;
    const t0 = Math.min(t(f.a), t(f.b));
    const t1 = Math.max(t(f.a), t(f.b));
    return Math.min(t1, len) - Math.max(t0, 0) > tol; // the two segments overlap
  };
  for (const e of border) {
    let angle = 180;
    for (const f of border) if (f !== e && along(e, f)) angle = Math.min(angle, deg(e.n, f.n));
    out.push({ a: e.a, b: e.b, angle });
  }
  return out;
};

// Packs that ship many pieces in ONE file (Kenney Castle Kit on poly.pizza): each piece is a top node named
// "MeshN [part] <piece> Model" (three's loader turns the spaces into "_"). `node` picks one piece = every top node
// whose name ends with "_<piece>_Model" (the piece and its parts: flags, wheels...), or is exactly `node`.
const isPiece = (name: string, node: string) => name === node || name.replace(/\s/g, "_").endsWith(`_${node}_Model`);

const bake = (root: THREE.Object3D, node?: string): PackModel => {
  root.updateMatrixWorld(true);
  const scene = node ? new THREE.Group() : root;
  if (node) {
    for (const c of root.children.filter((c) => isPiece(c.name, node))) scene.add(c.clone());
    if (!scene.children.length) throw new Error(`pack piece "${node}" not found`);
    scene.updateMatrixWorld(true);
  }
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const eps = size.length() * 2e-4;
  const q = (p: THREE.Vector3) => `${Math.round(p.x / eps)},${Math.round(p.y / eps)},${Math.round(p.z / eps)}`;
  const seen = new Set<string>(); // the same triangle twice (duplicated meshes) = z-fighting: keep the first
  const byMat = new Map<string, { tris: number[]; raw: THREE.Material }>();
  const v = new THREE.Vector3();
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial;
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
    const p = g.attributes.position;
    const key = mat.name || mat.uuid;
    const e = byMat.get(key) ?? { tris: [], raw: mat };
    for (let i = 0; i + 2 < p.count; i += 3) {
      const tri: number[] = [];
      const ks: string[] = [];
      for (let j = 0; j < 3; j++) {
        v.fromBufferAttribute(p, i + j).applyMatrix4(m.matrixWorld);
        tri.push(v.x, v.y, v.z);
        ks.push(q(v));
      }
      const tk = ks.sort().join("|");
      if (seen.has(tk)) continue;
      seen.add(tk);
      e.tris.push(...tri);
    }
    byMat.set(key, e);
  });
  const c = box.getCenter(new THREE.Vector3());
  const parts: Part[] = [...byMat]
    .filter(([, e]) => e.tris.length > 0)
    .map(([mat, e]) => {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.Float32BufferAttribute(e.tris, 3));
      geom.translate(-c.x, -box.min.y, -c.z);
      geom.computeVertexNormals(); // non-indexed = flat faces (our low-poly look)
      return {
        mat,
        geom,
        color: `#${(e.raw as THREE.MeshStandardMaterial).color?.getHexString() ?? "ffffff"}`,
        raw: e.raw,
        edges: findEdges(geom.attributes.position.array as Float32Array, eps),
      };
    });
  return { parts, size };
};

const edgeGeom = (edges: Edge[], threshold: number) => {
  const pts: number[] = [];
  for (const e of edges) if (e.angle >= threshold) pts.push(e.a.x, e.a.y, e.a.z, e.b.x, e.b.y, e.b.z);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
};

const gltfs = new Map<string, Promise<THREE.Object3D>>();
export const loadPack = (file: string, node?: string) => {
  const key = node ? `${file}#${node}` : file;
  let p = cache.get(key);
  if (!p) {
    let g = gltfs.get(file);
    if (!g) {
      g = new GLTFLoader().loadAsync(staticFile(`packs/${file}`)).then((r) => r.scene);
      gltfs.set(file, g);
    }
    p = g.then((s) => bake(s, node));
    cache.set(key, p);
  }
  return p;
};

// Holds the frame until the .glb is loaded (Remotion delayRender). While rendering, ThreeCanvas only draws on a
// frame change (frameloop "never"), so once the piece is mounted we draw once more, then release the frame.
export const usePack = (file: string, node?: string) => {
  const [model, setModel] = useState<PackModel | null>(null);
  const [handle] = useState(() => delayRender(`pack ${file} ${node ?? ""}`));
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    loadPack(file, node)
      .then(setModel)
      .catch((e) => cancelRender(e));
  }, [file, node]);
  useEffect(() => {
    if (!model) return;
    advance(performance.now());
    continueRender(handle);
  }, [model, advance, handle]);
  return model;
};

export const PackPiece: React.FC<{
  file: string; // path inside public/packs/, e.g. "home-interior/q_oven.glb"
  node?: string; // one piece of a many-piece file, e.g. "towerSquareRoof" (see pieceOf)
  h?: number; // real height in m (else `s` = plain scale)
  s?: number;
  position?: [number, number, number];
  rotY?: number;
  look?: "ours" | "lines" | "raw"; // ours = lines + tones; lines = lines + pack colors; raw = as it comes
  tones?: Record<string, string>; // pack material name → our color (theme kits: HOME_TONES in home.tsx)
  threshold?: number; // ink line crease angle in degrees (raise for round pieces)
  sink?: number; // m into the floor (FB5: 2 cm)
  turn?: boolean; // the pack's front looks to -z (Kenney): turn it to +z like ours
  anchor?: "center" | "back"; // back = `position` is where the piece's back touches the wall (it stands in front of it)
  hide?: string[]; // pack material names not drawn (remove details: spikes, rings...)
}> = ({ file, node, hide, h, s = 1, position = [0, 0, 0], rotY = 0, turn = false, look = "ours", tones = {}, threshold = 30, sink = 0.02, anchor = "center" }) => {
  const model = usePack(file, node);
  const k = model ? (h ? h / model.size.y : s) : 1;
  const raws = useMemo(() => model?.parts.map((p) => p.raw.clone()), [model]);
  const lines = useMemo(() => model?.parts.map((p) => edgeGeom(p.edges, threshold)), [model, threshold]);
  if (!model) return null;
  return (
    <group position={[position[0], position[1] - sink, position[2]]} rotation={[0, rotY, 0]} scale={[k, k, k]}>
      <group position={[0, 0, anchor === "back" ? model.size.z / 2 : 0]} rotation={[0, turn ? Math.PI : 0, 0]}>
        {model.parts.map((p, i) =>
          hide?.includes(p.mat) ? null : look === "raw" ? (
            <mesh key={p.mat} geometry={p.geom} material={raws![i]} castShadow receiveShadow />
          ) : (
            <OMesh key={p.mat} geometry={p.geom} edgeGeom={lines![i]} color={look === "ours" ? (tones[p.mat] ?? p.color) : p.color} />
          ),
        )}
      </group>
    </group>
  );
};

// Real size (m) of a pack piece at height h, once loaded (to frame a camera or line pieces up).
export const usePackSize = (file: string, h: number, node?: string) => {
  const model = usePack(file, node);
  return model ? model.size.clone().multiplyScalar(h / model.size.y) : null;
};
