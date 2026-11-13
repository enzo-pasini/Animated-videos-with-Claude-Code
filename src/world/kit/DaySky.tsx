// Day sky dome (blue gradient + puffy clouds) and a soft sun glow (dayExterior, D12).
import * as THREE from "three";
import { daySkyTex, glowTex } from "../../three/textures";

// radius: 90 m (day_street, unchanged); a set with a far view (mountains, v4 item 13) passes a bigger dome, max ~150 m
// so the far side stays inside the camera's far plane (200 m, src/three/Rig.tsx) from anywhere in camera_bounds.
export const DaySky: React.FC<{ sun: [number, number, number]; radius?: number }> = ({ sun, radius = 90 }) => (
  <>
    <mesh>
      <sphereGeometry args={[radius, 32, 16]} />
      <meshBasicMaterial map={daySkyTex()} side={THREE.BackSide} fog={false} />
    </mesh>
    {/* soft warm glow around the sun (the sun disc itself stays off-frame in most shots) */}
    <sprite position={sun} scale={[60, 60, 1]}>
      <spriteMaterial
        map={glowTex()}
        color="#fff2d6"
        fog={false}
        transparent
        opacity={0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
  </>
);
