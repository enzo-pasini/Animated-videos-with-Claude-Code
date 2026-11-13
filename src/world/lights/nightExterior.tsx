// Light preset "nightExterior" (locked v3, locks.md §4.1): blue hemisphere + moon key light +
// sky bounce, both with soft shadows. Practical lights (lanterns, windows) belong to the set.
export const NIGHT_EXTERIOR = {
  hemi: 3.6,
  skyColor: "#7a86d4",
  groundColor: "#3b3452",
  moon: 2.0,
  moonColor: "#a3b0f5",
  bounce: 2.6,
  bounceColor: "#9ea4ea",
  bounceFrom: [-15, 18, -36] as [number, number, number],
};

// Shadow box: half-size `size` m around the light's axis through the origin. 20 m = the locked v3 value
// (night_street); a bigger set passes a bigger box (set template, like dayExterior FB7). Same light otherwise.
const shadowProps = (size = 20, mapSize = 4096) => ({
  castShadow: true,
  "shadow-mapSize": [mapSize, mapSize] as [number, number],
  "shadow-bias": -0.0004,
  "shadow-normalBias": 0.03,
  "shadow-radius": 4,
  "shadow-camera-left": -size,
  "shadow-camera-right": size,
  "shadow-camera-top": size,
  "shadow-camera-bottom": -size,
  "shadow-camera-near": 1,
  "shadow-camera-far": Math.max(120, size * 4),
});

// moon = the moon sprite position in the sky; the key light comes from the same direction
export const NightExteriorLights: React.FC<{ moon: [number, number, number]; shadowSize?: number; shadowMapSize?: number }> = ({
  moon,
  shadowSize,
  shadowMapSize,
}) => {
  const L = NIGHT_EXTERIOR;
  return (
    <>
      <hemisphereLight args={[L.skyColor, L.groundColor, L.hemi]} />
      <directionalLight position={[moon[0] * 0.6, moon[1] * 0.6, moon[2] * 0.6]} color={L.moonColor} intensity={L.moon} {...shadowProps(shadowSize, shadowMapSize)} />
      {/* sky bounce on the walls that face away from the moon */}
      <directionalLight position={L.bounceFrom} color={L.bounceColor} intensity={L.bounce} {...shadowProps(shadowSize, shadowMapSize)} />
    </>
  );
};
