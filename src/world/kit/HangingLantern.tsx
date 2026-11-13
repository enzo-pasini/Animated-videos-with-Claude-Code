// A lantern hanging from a wall bracket, with its warm point light and glow (a practical light).
// `on` 0..1 (story event: lighting it), `flicker` ~1 ± 0.08 (slow, never strobing).
import { useMemo } from "react";
import * as THREE from "three";
import { OBox, OMesh } from "../../three/Outlined";
import { WARM_COLOR } from "../lights/colors";
import { Glow } from "./Glow";

export const HangingLantern: React.FC<{
  x: number;
  y: number;
  z: number;
  wallZ: number; // z of the wall the bracket is fixed to
  flicker: number;
  on: number;
  intensity: number;
}> = ({ x, y, z, wallZ, flicker: fl, on, intensity }) => {
  const flicker = fl * on;
  const glass = useMemo(
    () => new THREE.Color("#3a3350").lerp(new THREE.Color("#ffb766").multiplyScalar(1.05 * fl), on),
    [fl, on],
  );
  return (
    <group>
      {/* wall bracket */}
      <OBox size={[0.06, 0.06, z - wallZ + 0.05]} position={[x, y + 0.42, (z + wallZ) / 2]} color="#2a2230" />
      <OBox size={[0.04, 0.4, 0.04]} position={[x, y + 0.25, wallZ + 0.03]} color="#2a2230" />
      <OMesh
        geometry={useMemo(() => new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6), [])}
        position={[x, y + 0.31, z]}
        color="#2a2230"
        lines={false}
      />
      {/* body */}
      <mesh position={[x, y, z]}>
        <boxGeometry args={[0.2, 0.27, 0.2]} />
        <meshBasicMaterial color={glass} />
      </mesh>
      <OMesh
        geometry={useMemo(() => new THREE.ConeGeometry(0.2, 0.16, 4, 1), [])}
        position={[x, y + 0.23, z]}
        rotation={[0, Math.PI / 4, 0]}
        color="#2a2230"
      />
      <OBox size={[0.27, 0.04, 0.27]} position={[x, y - 0.17, z]} color="#2a2230" />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <OBox key={`${sx}${sz}`} size={[0.025, 0.3, 0.025]} position={[x + sx * 0.115, y, z + sz * 0.115]} color="#2a2230" lines={false} />
        )),
      )}
      <pointLight position={[x, y - 0.05, z + 0.05]} color={WARM_COLOR} intensity={intensity * flicker} distance={0} decay={2} />
      <Glow position={[x, y, z + 0.05]} size={1.6} color="#ff9a45" opacity={0.75 * flicker} />
      <Glow position={[x, y, z + 0.05]} size={0.55} color="#ffd59a" opacity={0.9 * flicker} />
    </group>
  );
};
