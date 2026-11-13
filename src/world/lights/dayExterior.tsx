// Light preset "dayExterior" (LOCKED as style v3.1 on 2026-11-07, PLAN D12; see style_lock/locks.md §12): blue sky hemisphere over warm ground,
// a warm sun key with shadows, and a cool sky fill on the shadow side (reference day shots: warm
// sunlit ground + blue sky = two colour families). Calibrated against the DAY reference range
// (references/analysis/day_shots.json, check_render.py "day" kind).
export const DAY_EXTERIOR = {
  hemi: 4.2, // v1 2.2, it1-2 3.2: luma 71-85 -> 93-103 (day reference 119-153)
  skyColor: "#bcd8f5",
  groundColor: "#b09070",
  sun: 4.6, // v1 2.6, it1-2 4.0
  sunColor: "#fff0d8",
  fill: 0.9, // sky light into the shadows; v1 0.8 #9fc2f0 pulled them toward night, it1-2 0.5 #b8cfe8 left them purple
  fillColor: "#e2e4ea", // it3: near-neutral, lifts the shadows without adding blue
  fog: { color: "#b8d4ee", density: 0.012 }, // light blue air haze
  grade: "saturate(1.2)" as string | undefined, // v1/it1 none: sat 0.26-0.43 (day 0.38-0.51), the user found it pale
  // light on the 2D character cards: warm-neutral daylight, so faces stay cream
  character: { ambient: "#fff4e6", ambientStrength: 1.0, topColor: "#3a4a6a" },
};

// Sun on the camera's side of the street, high and to the left: lights the shop facade (faces +z),
// shadows fall toward the shop and to the right.
export const SUN: [number, number, number] = [-30, 48, 42];

// Shadow box: an orthographic box of half-size `size` m around the light's axis through the origin.
// Only objects inside it cast/receive shadows. 20 m / 4096 = the locked v3.1 values (day_street);
// a bigger set may pass a bigger box (FB7, bridge video) — same light, softer edges unless the map grows.
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

export const DayExteriorLights: React.FC<{ sun: [number, number, number]; shadowSize?: number; shadowMapSize?: number }> = ({
  sun,
  shadowSize,
  shadowMapSize,
}) => {
  const L = DAY_EXTERIOR;
  return (
    <>
      <hemisphereLight args={[L.skyColor, L.groundColor, L.hemi]} />
      <directionalLight position={[sun[0] * 0.6, sun[1] * 0.6, sun[2] * 0.6]} color={L.sunColor} intensity={L.sun} {...shadowProps(shadowSize, shadowMapSize)} />
      {/* sky fill from the opposite side, no shadows */}
      <directionalLight position={[-sun[0] * 0.6, sun[1] * 0.4, -sun[2] * 0.6]} color={L.fillColor} intensity={L.fill} />
    </>
  );
};
