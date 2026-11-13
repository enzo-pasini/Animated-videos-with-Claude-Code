// Night sky dome (gradient + stars), moon sprite, a big soft halo and moonlit cloud streaks (locks.md §5).
import * as THREE from "three";
import { glowTex, moonTex, skyTex } from "../../three/textures";

// radius: 90 m (night_street, unchanged); a bigger set passes a bigger dome, max 150 m (camera far plane 200 m)
export const NightSky: React.FC<{ moon: [number, number, number]; radius?: number }> = ({ moon, radius = 90 }) => (
  <>
    <mesh>
      <sphereGeometry args={[radius, 32, 16]} />
      <meshBasicMaterial map={skyTex()} side={THREE.BackSide} fog={false} />
    </mesh>
    <sprite position={moon} scale={[13, 13, 1]}>
      <spriteMaterial map={moonTex()} fog={false} transparent depthWrite={false} />
    </sprite>
    {/* big soft halo: brightens the sky around the moon */}
    <sprite position={moon.map((v) => v * 1.01) as [number, number, number]} scale={[70, 70, 1]}>
      <spriteMaterial
        map={glowTex()}
        color="#7f8fe0"
        fog={false}
        transparent
        opacity={0.5}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
    {/* moonlit cloud streaks */}
    {[
      [-14, -6, 26, 4.5, 0.32],
      [10, -14, 34, 5, 0.26],
      [-4, 9, 22, 3.5, 0.22],
    ].map(([dx, dy, sx, sy, o], i) => (
      <sprite key={i} position={[moon[0] + dx, moon[1] + dy, moon[2] - dx * 0.6]} scale={[sx, sy, 1]}>
        <spriteMaterial
          map={glowTex()}
          color="#b3bcf2"
          fog={false}
          transparent
          opacity={o}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    ))}
  </>
);
