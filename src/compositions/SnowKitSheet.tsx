// Theme kit picture "snow" (scenes plan 4): every piece of src/world/kit/snow.tsx alone on snow (locked dayExterior),
// then the settings that make variations and combos (hut on a slope, peak camp on a summit). One tile per frame.
// `.venv/Scripts/python -I tools/kit_catalog.py --theme snow` renders it → references/sets/kit_snow.jpg.
// When the theme grows: a piece in snow.tsx + a line in TILES below (`name / file / theme`).
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { CameraRig, SceneSetup, glProps, type Cam } from "../three/Rig";
import { DAY_EXTERIOR, DayExteriorLights } from "../world/lights/dayExterior";
import { PackPiece } from "../world/kit/pack";
import {
  Backpack,
  CampStove,
  Campfire,
  MountainHut,
  PeakCamp,
  ROCK_SNOW_TONES,
  SnowGround,
  SnowPeak,
  SnowPines,
  SnowRange,
  SnowRocks,
  Tent,
  snowSlope,
  type PineAt,
} from "../world/kit/snow";
import { rng } from "../three/textures";

export const SNOW_TILE = 720;
type V3 = [number, number, number];
type Tile = { name: string; file: string; theme: string; draw: (frame: number) => React.ReactNode; cam: Cam; shadow?: number; ground?: boolean };

const fit = (center: V3, r: number, az = 30, el = 16): Cam => {
  const fov = 34;
  const d = (r / Math.tan(THREE.MathUtils.degToRad(fov / 2))) * 1.1;
  const a = THREE.MathUtils.degToRad(az);
  const e = THREE.MathUtils.degToRad(el);
  return { pos: [center[0] + d * Math.cos(e) * Math.sin(a), center[1] + d * Math.sin(e), center[2] + d * Math.cos(e) * Math.cos(a)], target: center, fov };
};
const flat = () => 0;

// combo: a hut on a slope with pines and a peak behind
const SLOPE_AREA: [number, number, number, number] = [-40, 40, -45, 20];
const slope = snowSlope({ rise: 9, from: 4, crest: -30, area: SLOPE_AREA, seed: 2, flat: [[0, -6, 4.5]] });
const SLOPE_PINES: PineAt[] = (() => {
  const r = rng(4);
  const out: PineAt[] = [];
  while (out.length < 40) {
    const x = -28 + r() * 56;
    const z = -32 + r() * 34;
    if (Math.hypot(x, z + 6) < 7 || (Math.abs(x) < 6 && z > -6)) continue;
    out.push([x, slope(x, z), z, 0.8 + 0.6 * r()]);
  }
  return out;
})();
const hutY = Math.max(slope(-2.5, -9), slope(2.5, -9), slope(-2.5, -3), slope(2.5, -3));

export const TILES: Tile[] = [
  // mountains
  { name: "SnowPeak", file: "snow.tsx", theme: "near mountain", cam: fit([0, 20, 0], 34, 25, 8), shadow: 50,
    draw: () => <SnowPeak height={40} radius={28} seed={2} /> },
  { name: "SnowPeak snowLine 0.4 / 0.55 / 0.7", file: "settings", theme: "near mountain", cam: fit([0, 14, 0], 40, 10, 6), shadow: 60,
    draw: () => (
      <>
        <SnowPeak position={[-26, 0, 0]} height={28} radius={17} seed={7} snowLine={0.4} />
        <SnowPeak position={[0, 0, -4]} height={32} radius={19} seed={11} />
        <SnowPeak position={[26, 0, 0]} height={26} radius={17} seed={5} snowLine={0.7} />
      </>
    ) },
  { name: "SnowRange (far, capped haze)", file: "snow.tsx", theme: "far layer", ground: false, cam: { pos: [0, 6, 0], target: [0, 18, -100], fov: 60 }, shadow: 20,
    draw: () => (
      <>
        <SnowGround area={[-150, 150, -150, 30]} step={10} height={flat} />
        <SnowRange R={110} a0={-0.9} a1={0.9} height={34} y0={2} seed={4} depth={34} fogMax={0.5} />
      </>
    ) },
  // ground
  { name: "SnowGround + snowSlope (terrace)", file: "snow.tsx", theme: "ground", ground: false, cam: { pos: [14, 9, 22], target: [0, 4, -10], fov: 40 }, shadow: 40,
    draw: () => (
      <>
        <SnowGround area={SLOPE_AREA} step={2.5} height={slope} seed={6} />
        <SnowPines trees={[[0, slope(0, -6), -6, 0.8], [-12, slope(-12, -18), -18, 1.2], [10, slope(10, -22), -22, 1.3]]} />
      </>
    ) },
  // trees + rocks
  { name: "SnowPines snow 0 / 0.6 / 1 / 1.3", file: "settings", theme: "trees", cam: fit([0, 2.6, 0], 6.5, 0, 6), shadow: 10,
    draw: () => (
      <>
        {[0, 0.6, 1, 1.3].map((s, i) => (
          <SnowPines key={s} trees={[[-4.5 + i * 3, 0, 0, 0.75]]} snow={s} seed={i + 1} />
        ))}
      </>
    ) },
  { name: "SnowRocks + Rock Snow pack (our tones)", file: "snow.tsx + pack", theme: "rocks", cam: fit([0, 0.6, 0], 3.2, 25, 18), shadow: 6,
    draw: () => (
      <>
        <SnowRocks rocks={[[-2, 0, 0.3, 0.9, 0.3], [-0.6, 0, -0.8, 1.3, 1.4], [0.4, 0, 0.9, 0.5, 2]]} />
        <PackPiece file="snow/q_rock_snow.glb" h={1.2} position={[2, 0, 0]} tones={ROCK_SNOW_TONES} />
      </>
    ) },
  // hut
  { name: "MountainHut + Smoke", file: "snow.tsx", theme: "mountain hut", cam: fit([0, 2.6, 0], 6.2, 30, 14), shadow: 10,
    draw: (f) => <MountainHut frame={f} /> },
  { name: "MountainHut no snow roof / small, green wall", file: "settings", theme: "mountain hut", cam: fit([0, 2.4, 0], 9, 22, 14), shadow: 14,
    draw: (f) => (
      <>
        <MountainHut position={[-4, 0, 0]} frame={f} snowRoof={false} smoke={false} />
        <MountainHut position={[4.2, 0, 0]} frame={f} w={4} d={4.4} wall="#5f7a5a" roof="#3e4a5e" />
      </>
    ) },
  // camp
  { name: "Tent orange / yellow / green", file: "snow.tsx", theme: "peak camp", cam: fit([0, 0.6, 0], 3.6, 20, 16), shadow: 6,
    draw: () => (
      <>
        <Tent position={[-2.3, 0, 0]} />
        <Tent position={[0, 0, -0.4]} color="#e8b030" />
        <Tent position={[2.3, 0, 0]} color="#4f8a5a" />
      </>
    ) },
  { name: "Campfire", file: "snow.tsx", theme: "peak camp", cam: fit([0, 0.35, 0], 1.0, 30, 22), shadow: 4, draw: (f) => <Campfire frame={f} /> },
  { name: "CampStove (pot, boil)", file: "snow.tsx", theme: "peak camp", cam: fit([0, 0.25, 0], 0.45, 30, 20), shadow: 3, draw: (f) => <CampStove frame={f} /> },
  { name: "Backpack", file: "snow.tsx", theme: "peak camp", cam: fit([0, 0.45, 0], 0.65, 30, 16), shadow: 3, draw: () => <Backpack /> },
  { name: "PeakCamp", file: "snow.tsx", theme: "peak camp", cam: fit([0.6, 0.9, -1.2], 4.4, 22, 18), shadow: 8, draw: (f) => <PeakCamp frame={f} /> },
  // combos
  { name: "hut on a slope (pines, peak)", file: "combo", theme: "mountain hut", ground: false, cam: { pos: [7, 4, 12], target: [0, 3.5, -8], fov: 40 }, shadow: 40,
    draw: (f) => (
      <>
        <SnowGround area={SLOPE_AREA} step={2.5} height={slope} seed={6} />
        <MountainHut position={[0, hutY, -6]} rotY={-0.25} frame={f} foundation={1.2} />
        <SnowPines trees={SLOPE_PINES} seed={2} />
        <SnowRocks rocks={[[5, slope(5, -2), -2, 0.8, 1], [-6, slope(-6, -1), -1, 1.1, 2]]} />
        <SnowPeak position={[-8, 0, -60]} height={34} radius={22} seed={2} />
      </>
    ) },
  { name: "peak camp on a summit (range behind)", file: "combo", theme: "peak camp", ground: false, cam: { pos: [5, 3.2, 9], target: [0, 1.5, -6], fov: 44 }, shadow: 14,
    draw: (f) => (
      <>
        <SnowGround area={[-150, 150, -150, 40]} step={10} height={(x, z) => -0.4 - 0.002 * (x * x + z * z) * 0.3} />
        <SnowGround area={[-8, 8, -8, 6]} step={1.5} height={(x, z) => 0.05 + 0.04 * Math.max(0, 1 - (x * x + z * z) / 60)} seed={3} />
        <PeakCamp frame={f} rotY={0.1} />
        <SnowRocks rocks={[[-5, 0, 1, 0.9, 0.5], [5.5, 0, -4, 1.2, 2.5]]} />
        <SnowRange R={110} a0={-0.6} a1={0.6} height={30} y0={-14} seed={9} depth={34} fogMax={0.5} />
      </>
    ) },
];

const SUN: V3 = [-30, 44, 36];

export const SnowKitSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = TILES[Math.min(frame, TILES.length - 1)];
  return (
    <AbsoluteFill style={{ backgroundColor: DAY_EXTERIOR.skyColor }}>
      <ThreeCanvas shadows="soft" width={width} height={height} gl={glProps} camera={{ fov: t.cam.fov, position: t.cam.pos }} style={{ filter: DAY_EXTERIOR.grade }}>
        <color attach="background" args={[DAY_EXTERIOR.skyColor]} />
        <SceneSetup fog={DAY_EXTERIOR.fog.color} density={0.004} />
        <CameraRig {...t.cam} />
        <DayExteriorLights sun={SUN} shadowSize={t.shadow ?? 14} />
        {t.ground === false ? null : <SnowGround area={[-90, 90, -90, 90]} step={6} height={flat} />}
        {t.draw(frame)}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
