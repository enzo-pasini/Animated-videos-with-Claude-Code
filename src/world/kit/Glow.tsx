// Soft additive glow sprite around a practical light (lantern, lit window).
import * as THREE from "three";
import { glowTex } from "../../three/textures";

export const Glow: React.FC<{ position: [number, number, number]; size: number; color: string; opacity?: number }> = ({
  position,
  size,
  color,
  opacity = 1,
}) => (
  <sprite position={position} scale={[size, size, 1]} renderOrder={5}>
    <spriteMaterial
      map={glowTex()}
      color={color}
      transparent
      opacity={opacity}
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      fog={false}
    />
  </sprite>
);
