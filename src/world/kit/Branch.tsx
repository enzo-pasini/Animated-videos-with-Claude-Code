// v4 VFX item 8: a tree branch framing a top corner of the frame (reference VS1Z_Q-Klt8 0:32, top right).
// Shot field "branch": {"corner": "tl" | "tr"}. The branch is a real 3D object close to the camera (1.6 m):
// it follows the camera, lags a little behind its sideways moves (near-object parallax) and sways in the wind.
// Built in "frame units" (1 = half the frame height at its distance), corner at the origin, reaching in and down.
import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { OMesh } from "../../three/Outlined";
import type { Cam } from "../../three/Rig";
import { facet } from "./country";

const DIST = 1.6; // m in front of the camera
const LAG = 0.15; // share of the camera's sideways move the branch does not follow (parallax)

const tube = (pts: [number, number, number][], r: number) =>
  facet(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 16, r, 6, false));

// leaf clusters along the bough: [x, y, z, size]; each cluster = 4 small faceted blobs, merged per tone
const CLUSTERS: [number, number, number, number][] = [
  [-0.12, 0.16, 0.03, 0.11], [0.02, 0.07, 0.04, 0.12], [0.16, 0.08, -0.02, 0.1], [0.27, -0.05, 0.03, 0.1],
  [0.4, -0.12, -0.02, 0.09], [0.52, -0.2, 0.0, 0.08], [0.14, -0.15, 0.04, 0.09], [0.2, -0.27, 0.02, 0.08],
  [0.33, 0.06, 0.05, 0.07], [-0.02, -0.06, 0.06, 0.08],
];
const BLOBS: [number, number, number, number][] = [[0, 0, 0, 1], [0.7, -0.25, 0.2, 0.75], [-0.65, -0.3, -0.1, 0.7], [0.1, 0.55, -0.15, 0.65]];
export const Branch: React.FC<{ cam: Cam; cam0: Cam; corner: "tl" | "tr"; t: number }> = ({ cam, cam0, corner, t }) => {
  const geoms = useMemo(() => {
    const bough = tube([[-0.45, 0.36, 0.0], [-0.15, 0.12, 0.02], [0.12, 0.0, -0.01], [0.36, -0.1, -0.03], [0.56, -0.21, -0.03]], 0.022);
    const twig = mergeGeometries([
      tube([[0.06, 0.01, 0.0], [0.12, -0.13, 0.02], [0.2, -0.27, 0.02]], 0.011),
      tube([[0.2, -0.04, 0.0], [0.28, 0.03, 0.03], [0.34, 0.06, 0.05]], 0.009),
    ]);
    const blob = facet(new THREE.IcosahedronGeometry(1, 0));
    const tones: THREE.BufferGeometry[][] = [[], []];
    CLUSTERS.forEach(([cx, cy, cz, s], i) =>
      BLOBS.forEach(([bx, by, bz, bs], k) => {
        const g = blob.clone();
        g.rotateX(i + k);
        g.rotateY(i * 0.7 + k);
        g.scale(s * bs * 1.15, s * bs * 0.9, s * bs);
        g.translate(cx + bx * s, cy + by * s, cz + bz * s);
        tones[(i + k) % 2].push(g);
      }),
    );
    return { bough, twig, leaves: tones.map((t) => mergeGeometries(t)) };
  }, []);
  // camera basis (roll is ignored: it is a degree or two)
  const pos = new THREE.Vector3(...cam.pos);
  const f = new THREE.Vector3(...cam.target).sub(pos).normalize();
  const r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize();
  const u = new THREE.Vector3().crossVectors(r, f);
  // sideways lag: part of the camera's sideways move since the shot start is not followed
  const moved = pos.clone().sub(new THREE.Vector3(...cam0.pos));
  const side = moved.clone().sub(f.clone().multiplyScalar(moved.dot(f)));
  const halfH = DIST * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  const halfW = (halfH * 9) / 16;
  const sx = corner === "tl" ? -1 : 1;
  const at = pos
    .clone()
    .addScaledVector(f, DIST)
    .addScaledVector(u, halfH)
    .addScaledVector(r, sx * halfW)
    .addScaledVector(side, -LAG);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(r, u, f.clone().negate()));
  const sway = 0.025 * Math.sin((2 * Math.PI * t) / 2.6) + 0.01 * Math.sin((2 * Math.PI * t) / 1.1 + 1);
  return (
    <group position={at} quaternion={q}>
      {/* mirror for the top-right corner; sway = a small turn around the corner */}
      <group scale={[-sx * halfH, halfH, halfH]} rotation={[0, 0, sway]}>
        <OMesh geometry={geoms.bough} color="#5a3c2c" lineColor="#2a1c18" threshold={35} />
        <OMesh geometry={geoms.twig} color="#5a3c2c" lineColor="#2a1c18" threshold={35} />
        {geoms.leaves.map((g, i) => (
          <OMesh key={i} geometry={g} color={i ? "#5a9446" : "#3f7034"} lineColor="#1f3a1c" threshold={30} />
        ))}
      </group>
    </group>
  );
};
