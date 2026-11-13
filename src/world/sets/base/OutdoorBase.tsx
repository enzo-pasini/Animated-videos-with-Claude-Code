// Set template, outdoor base (scenes plan session 2). The INVISIBLE base of every new outdoor set — like a
// theater's floor, lights and safety rules — NOT its look: place, props, colours, layout and cameras stay free.
// Every value comes from the locked presets (dayExterior v3.1, nightExterior v3) and the bridge video fixes:
//   FB6  the world must not end: the ground is a disc that reaches the sky dome (sky radius ≤ 150, camera far 200)
//   FB7  every visible object inside the sun's shadow box: the box size comes from the set's <id>.json review block
//   FB2/FB4  no two faces on one plane: the base itself has only the ground top at y = TOP.ground; anything flat a
//        set adds (path, road, rug, water) sits at its own height ≥ TOP.gap above/below (helper `top(n)`)
//   item 8  four layer slots (front, middle, back, far); everything in `far` gets the capped haze (fogMax)
// Made by tools/new_set.py from base/outdoor.tsx.tpl; a set file passes its settings, the base draws the rest.
import { useMemo } from "react";
import type { ReactNode } from "react";
import * as THREE from "three";
import { FogMaxContext, OMesh } from "../../../three/Outlined";
import { grassTex } from "../../../three/textures";
import { DaySky } from "../../kit/DaySky";
import { NightSky } from "../../kit/NightSky";
import { DayContext } from "../../kit/Window";
import { DAY_EXTERIOR, DayExteriorLights } from "../../lights/dayExterior";
import { NightExteriorLights } from "../../lights/nightExterior";
import type { SetDef } from "../../../episode/sets";

export type OutdoorLight = "day" | "night";
export type V3 = [number, number, number];

export const SKY_MAX = 150; // largest sky dome: its far side stays inside the camera far plane (200 m, Rig.tsx)
export const FAR_HAZE = 0.6; // fog cap of the far layer (= the locked fog up to ~80 m; bridge item 8)
export const BIG_SHADOW = 40; // shadow boxes bigger than this get an 8192 map (sharp edges in close shots)

// Flat things on the ground: each top face at its own height, ≥ 2 cm apart (FB2). top(1) = path, top(2) = curb…
export const TOP = { ground: 0, gap: 0.02 };
export const top = (n: number) => TOP.ground + n * TOP.gap;

// The set's settings, read from <id>.json "review" (one place, so the tools and the renderer agree).
export type OutdoorReview = { sun: V3; shadow_size: number; sky_radius?: number };

// a flat disc whose texture repeats per metre (uv = world x, z)
const groundDisc = (r: number) => {
  const g = new THREE.CircleGeometry(r, 96);
  g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
  return g;
};

export const OutdoorBase: React.FC<{
  light: OutdoorLight;
  review: OutdoorReview; // sun (= the moon by night) + shadow box half-size (+ optional sky radius) from <id>.json
  ground?: { map?: THREE.Texture; color?: string }; // default: grass. The LOOK is the set's choice.
  front?: ReactNode; // close to the main camera (frame-bottom props, branches, a corner of a stall)
  middle?: ReactNode; // around the marks (where the characters act)
  back?: ReactNode; // behind the marks, inside the cameras' view cones (tall props, buildings)
  far?: ReactNode; // far land, ridges, skyline: drawn with the capped haze (FAR_HAZE)
  children?: ReactNode; // anything else (animated parts)
}> = ({ light, review, ground, front, middle, back, far, children }) => {
  const skyR = Math.min(SKY_MAX, review.sky_radius ?? SKY_MAX);
  const shadowSize = review.shadow_size;
  const mapSize = shadowSize > BIG_SHADOW ? 8192 : 4096;
  // the ground reaches just inside the sky dome: no edge of the world in any direction (FB6)
  const disc = useMemo(() => groundDisc(skyR * 0.99), [skyR]);
  const day = light === "day";
  return (
    <DayContext.Provider value={day}>
      <group>
        {day ? <DaySky sun={review.sun} radius={skyR} /> : <NightSky moon={review.sun} radius={skyR} />}
        {day ? (
          <DayExteriorLights sun={review.sun} shadowSize={shadowSize} shadowMapSize={mapSize} />
        ) : (
          <NightExteriorLights moon={review.sun} shadowSize={shadowSize} shadowMapSize={mapSize} />
        )}
        <OMesh geometry={disc} position={[0, TOP.ground, 0]} map={ground?.map ?? grassTex([0.25, 0.25])} color={ground?.color} lines={false} />
        <group name="layer-front">{front}</group>
        <group name="layer-middle">{middle}</group>
        <group name="layer-back">{back}</group>
        <FogMaxContext.Provider value={FAR_HAZE}>
          <group name="layer-far">{far}</group>
        </FogMaxContext.Provider>
        {children}
      </group>
    </DayContext.Provider>
  );
};

// The registry entry of an outdoor set (src/episode/sets.tsx): the locked light preset's fog, character light and grade.
// No practical lights by default; a set with lanterns/windows passes its own warmLights.
export const outdoorSetDef = (light: OutdoorLight, Scene: SetDef["Scene"], extra: Partial<SetDef> = {}): SetDef =>
  light === "day"
    ? { Scene, warmLights: () => [], fog: DAY_EXTERIOR.fog, character: DAY_EXTERIOR.character, grade: DAY_EXTERIOR.grade, ...extra }
    : { Scene, warmLights: () => [], ...extra }; // night: the defaults ARE the locked v3 night (fog #3d3f8e 0.035, card light)
