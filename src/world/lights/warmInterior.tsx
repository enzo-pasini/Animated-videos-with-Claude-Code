// Light preset "warmInterior" (LOCKED as style v3.1 on 2026-11-07, PLAN D12; see style_lock/locks.md §11): warm hemisphere, a soft warm key from the
// room's lamp side with shadows, and a cool fill from the window (the reference keeps a cool accent in
// warm rooms). Practical lights (pendant lamps) belong to the set. Calibrated against the reference
// WARM shot range (check_render.py per light kind).
export const WARM_INTERIOR = {
  hemi: 2.5, // v1 1.9: shots measured luma 62-92 (reference warm 98-150)
  skyColor: "#f0d6b8", // v1 #f2c896: saturation 0.6 (reference 0.37-0.52)
  groundColor: "#7a5548", // v2 #5a3a35: darks too dark (p5 22-24, reference 28-61)
  key: 2.3, // v1 1.5
  keyColor: "#ffe2c2", // v1 #ffd2a0
  keyFrom: [-3, 6, 5] as [number, number, number],
  fill: 0.55,
  fillColor: "#8fa0e8",
  fillFrom: [6, 3, -2] as [number, number, number],
  fog: { color: "#3a2630", density: 0.012 },
  // set grade, order brightness -> contrast -> saturate (locks.md lesson 15); v1 had none
  grade: "brightness(1.28) saturate(0.72)", // v2 brightness(1.18) contrast(1.16) saturate(0.8): contrast 65-69 in close shots, luma 76 in the wide
  // light on the 2D character cards (CharacterCard): warm-neutral ambient, so faces stay cream (never magenta)
  character: { ambient: "#f0dcc8", ambientStrength: 0.9, topColor: "#2a1c1c" },
};

const shadowProps = {
  castShadow: true,
  "shadow-mapSize": [4096, 4096] as [number, number],
  "shadow-bias": -0.0004,
  "shadow-normalBias": 0.03,
  "shadow-radius": 4,
  "shadow-camera-left": -12,
  "shadow-camera-right": 12,
  "shadow-camera-top": 12,
  "shadow-camera-bottom": -12,
  "shadow-camera-near": 0.5,
  "shadow-camera-far": 40,
};

export const WarmInteriorLights: React.FC<{ scale?: number }> = ({ scale = 1 }) => {
  const L = WARM_INTERIOR;
  return (
    <>
      <hemisphereLight args={[L.skyColor, L.groundColor, L.hemi * scale]} />
      <directionalLight position={L.keyFrom} color={L.keyColor} intensity={L.key * scale} {...shadowProps} />
      <directionalLight position={L.fillFrom} color={L.fillColor} intensity={L.fill * scale} />
    </>
  );
};
