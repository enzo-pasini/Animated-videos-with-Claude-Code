// Scenes plan 4 (snowy mountains), step 4: OUR snow kit (src/world/kit/snow.tsx) in two tests.
// 1. SnowDiorama: our pieces placed like the reference scene (same spots and sizes), drawn by SnowRefSheet
//    with prop {"ours": true} under the same 6 cameras → side by side with the reference.
// 2. SnowKitTest (9:16): a small test scene on OutdoorBase (locked dayExterior): a peak camp on a terrace,
//    a hut on the slope, snowy pines + rocks, two near peaks and a far range in the haze. Frame = camera.
//    Render: node tools/render_stills.mjs --composition SnowKitTest --frames 0,1,2,3 --out out/snow/test
import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { FogMaxContext } from "../three/Outlined";
import { CameraRig, SceneSetup, glProps, type Cam } from "../three/Rig";
import { rng } from "../three/textures";
import { OutdoorBase } from "../world/sets/base/OutdoorBase";
import { DAY_EXTERIOR } from "../world/lights/dayExterior";
import {
  MountainHut,
  PeakCamp,
  SnowGround,
  SnowPeak,
  SnowPines,
  SnowRange,
  SnowRocks,
  snowGroundTex,
  snowSlope,
  type PineAt,
  type RockAt,
} from "../world/kit/snow";

// ---------- 1. the diorama (reference units ≈ m, our pieces at the reference's spots) ----------
const DIO_AREA: [number, number, number, number] = [-45, 30, -45, 25];
const bump = (x: number, z: number, cx: number, cz: number, r: number, h: number) => h * Math.max(0, 1 - ((x - cx) ** 2 + (z - cz) ** 2) / (r * r)) ** 2;
const dioHeight = (x: number, z: number) =>
  0.6 + bump(x, z, 4, -9, 7, 4.8) + bump(x, z, -8, -7, 6, 2.6) + bump(x, z, -3, 3, 5, 0.6) + bump(x, z, 2, -2.4, 2.2, 0.2);
const DIO_PINES: PineAt[] = (() => {
  const r = rng(21);
  const out: PineAt[] = [];
  while (out.length < 26) {
    const x = -9 + r() * 15;
    const z = -11 + r() * 17;
    if (Math.hypot(x - 2, z + 2.4) < 2.4) continue; // the cabin
    out.push([x, dioHeight(x, z), z, 0.32 + 0.16 * r()]);
  }
  return out;
})();
const DIO_ROCKS: RockAt[] = [[-3, dioHeight(-3, 1), 1, 0.35, 1], [5, dioHeight(5, 3), 3, 0.3, 2], [-6, dioHeight(-6, -3), -3, 0.45, 0.5]];
export const SnowDiorama: React.FC<{ frame: number }> = ({ frame }) => (
  <group>
    <SnowGround area={DIO_AREA} step={1.2} height={dioHeight} seed={4} />
    <SnowPeak position={[-16.5, -1.2, -9.2]} height={11.4} radius={6.2} seed={2} />
    <SnowPeak position={[-5.3, -0.6, -17]} height={8.6} radius={6} seed={5} rotY={1.2} />
    <SnowPines trees={DIO_PINES} seed={3} />
    <SnowRocks rocks={DIO_ROCKS} />
    <MountainHut position={[2, dioHeight(2, -2.4), -2.4]} rotY={-Math.PI / 2} frame={frame} w={2.4} d={2.6} />
  </group>
);

// ---------- 2. the 9:16 test scene (real metres) ----------
const AREA: [number, number, number, number] = [-70, 70, -75, 25];
const HUT: [number, number] = [16, -18];
const height = snowSlope({ rise: 14, from: -6, crest: -55, area: AREA, seed: 3, drifts: 0.7, flat: [[0, 0, 7], [HUT[0], HUT[1], 5]] });
const PINES: PineAt[] = (() => {
  const r = rng(8);
  const out: PineAt[] = [];
  let guard = 0;
  while (out.length < 140 && guard++ < 5000) {
    const x = -62 + r() * 124;
    const z = -60 + r() * 70;
    if (Math.hypot(x, z) < 11) continue; // camp
    if (Math.hypot(x - HUT[0], z - HUT[1]) < 8) continue; // hut
    if (Math.abs(x) < 14 && z > -14) continue; // open view on the camp
    // clusters: more trees on the sides
    if (r() > 0.35 + Math.min(0.6, Math.abs(x) / 60)) continue;
    out.push([x, height(x, z), z, 0.9 + 0.7 * r()]);
  }
  return out;
})();
const ROCKS: RockAt[] = (() => {
  const r = rng(13);
  const pts: [number, number, number][] = [[-4, 3, 0.7], [4.5, -4.5, 0.9], [-7, -6, 1.2], [9, 1, 0.6], [22, -12, 1.4], [10, -24, 1.8], [-20, -20, 2.2], [-12, -32, 1.6], [28, -30, 2.0]];
  return pts.map(([x, z, s]) => [x, height(x, z), z, s, r() * 6]);
})();

export const SNOW_TEST_CAMS: { label: string; cam: Cam }[] = [
  { label: "S1 wide: camp, slope, hut, peaks, far range", cam: { pos: [5, 6.5, 24], target: [3, 7.5, -40], fov: 50 } },
  { label: "S2 hut on the slope", cam: { pos: [27, 4.2, -3], target: [15, 3.6, -19], fov: 42 } },
  { label: "S3 camp close (tent, fire, stove + pot)", cam: { pos: [4.2, 1.7, 6.2], target: [0.6, 0.8, -1.2], fov: 42 } },
  { label: "S4 very wide, camera far (haze cap)", cam: { pos: [-12, 24, 62], target: [4, 8, -40], fov: 42 } },
];
const REVIEW = { sun: [-46, 60, 52] as [number, number, number], shadow_size: 55, sky_radius: 150 };
const NEAR_HAZE = 0.35; // cap on the near area: wide 9:16 shots from far away stay crisp (castle lesson)

export const SnowTestScene: React.FC<{ frame: number }> = ({ frame }) => {
  const hutY = useMemo(() => Math.max(...[-2.5, 2.5].flatMap((dx) => [-3, 3].map((dz) => height(HUT[0] + dx, HUT[1] + dz)))), []);
  return (
    <OutdoorBase
      light="day"
      review={REVIEW}
      ground={{ map: snowGroundTex(), color: "#ffffff" }}
      middle={
        <FogMaxContext.Provider value={NEAR_HAZE}>
          <SnowGround area={AREA} step={2.5} height={height} seed={6} />
          <PeakCamp position={[0, height(0, 0), 0]} rotY={0.15} frame={frame} />
          <MountainHut position={[HUT[0], hutY, HUT[1]]} rotY={-0.35} frame={frame} foundation={1.4} />
          <SnowPines trees={PINES} seed={9} />
          <SnowRocks rocks={ROCKS} />
          <SnowPeak position={[-32, 0, -92]} height={58} radius={40} seed={2} fogMax={0.45} />
          <SnowPeak position={[38, 0, -100]} height={46} radius={34} seed={5} rotY={0.8} fogMax={0.5} />
        </FogMaxContext.Provider>
      }
      far={<SnowRange R={134} a0={-1.25} a1={1.25} height={40} y0={4} seed={4} depth={16} />}
    />
  );
};

// sweep = a slow 3 s camera move past the camp toward the hut (flicker / z-fighting check: tools/flicker.py)
const SWEEP: [Cam, Cam] = [
  { pos: [9, 2.6, 13], target: [1, 2.2, -12], fov: 46 },
  { pos: [25, 5, -1], target: [13, 4, -22], fov: 46 },
];
const lerp = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t) as [number, number, number];

export const SnowKitTest: React.FC<{ sweep?: boolean }> = ({ sweep = false }) => {
  const frame = useCurrentFrame();
  const { width, height: h, durationInFrames } = useVideoConfig();
  const u = frame / Math.max(1, durationInFrames - 1);
  const e = u * u * (3 - 2 * u);
  const cam: Cam = sweep
    ? { pos: lerp(SWEEP[0].pos, SWEEP[1].pos, e), target: lerp(SWEEP[0].target, SWEEP[1].target, e), fov: 46 }
    : SNOW_TEST_CAMS[frame % SNOW_TEST_CAMS.length].cam;
  return (
    <AbsoluteFill style={{ backgroundColor: DAY_EXTERIOR.skyColor }}>
      <ThreeCanvas shadows="soft" width={width} height={h} gl={glProps} camera={{ fov: cam.fov, position: cam.pos }} style={{ filter: DAY_EXTERIOR.grade }}>
        <SceneSetup fog={DAY_EXTERIOR.fog.color} density={DAY_EXTERIOR.fog.density} />
        <CameraRig {...cam} />
        <SnowTestScene frame={frame} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
