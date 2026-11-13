// Set "night_street": a clock shop on a cobbled street at night (the locked v3 location).
// Built from the kit (src/world/kit) + the nightExterior light preset. Marks: night_street.json.
// Blue night + warm practicals (shop window, hanging lantern, the window across). Thin ~2 px world lines.
import { useMemo } from "react";
import * as THREE from "three";
import { OBox, OMesh, texturedBox } from "../../three/Outlined";
import type { WarmLight } from "../../three/CharacterCard";
import { cobbleTex, plasterTex, shopInteriorTex, signTex, slabTex, waitingWindowTex, woodTex } from "../../three/textures";
import { Building } from "../kit/Building";
import { Glow } from "../kit/Glow";
import { HangingLantern } from "../kit/HangingLantern";
import { DaySky } from "../kit/DaySky";
import { NightSky } from "../kit/NightSky";
import { Barrel, Bench, Chimney, ClothesLine, Crate, DistantRooftops, FlowerBox, Pipe, PottedPlant, StreetLamp } from "../kit/props";
import { DayContext, Window } from "../kit/Window";
import { CHAR_WARM, WARM_COLOR } from "../lights/colors";
import { DayExteriorLights, SUN } from "../lights/dayExterior";
import { NIGHT_EXTERIOR, NightExteriorLights } from "../lights/nightExterior";

export { CHAR_WARM, WARM_COLOR };

// wall paint: night = the locked v3 colours; day = warm, saturated paint (D12: the night paint read grey by day)
const plasters = (day: boolean) =>
  day
    ? {
        a: plasterTex("a_day", "#efd39a", [0.33, 0.33], "#b8613f"),
        b: plasterTex("b_day", "#e28a5c", [0.33, 0.33], "#9c4430"),
        c: plasterTex("c_day", "#8fc4d6", [0.33, 0.33], "#a0563c"),
        d: plasterTex("d_day", "#f2b6a0", [0.33, 0.33], "#a85848"),
      }
    : {
        a: plasterTex("a", "#b9a493", [0.33, 0.33]),
        b: plasterTex("b", "#a8a7b8", [0.33, 0.33], "#7d5a63"),
        c: plasterTex("c", "#9a6b5e", [0.33, 0.33], "#7a4438"),
        d: plasterTex("d", "#c4b7c2", [0.33, 0.33], "#8a5a5e"),
      };

// ---- layout constants (meters) ----
export const FACADE_Z = -2;
export const DOOR = { x: -1.45, w: 1.1, h: 2.25 };
export const SHOP_WIN = { x: 1.15, y: 1.65, w: 2.1, h: 1.5 };
export const LANTERN = { x: -0.45, y: 2.45, z: FACADE_Z + 0.8 };
export const ACROSS_Z = 6.5; // facade of the buildings across the street (facing -z)
export const ACROSS_WIN = { x: 0.9, y: 3.4 }; // the window that lights up

export const LIGHTS = {
  ...NIGHT_EXTERIOR,
  lantern: 2.2, // practicals of this set
  window: 1.6,
  spill: 26,
};
// Moon on the across-street side, ~40 deg to the right: visible in the reverse shots, lights the shop facade.
export const MOON: [number, number, number] = [36, 52, 46];

export const sceneWarmLights = (flicker = 1, acrossLit = 0, lanternOn = 1): WarmLight[] => [
  { pos: [LANTERN.x, LANTERN.y - 0.15, LANTERN.z], color: CHAR_WARM, strength: 0.55 * flicker * lanternOn, range: 3.0 },
  acrossLit > 0
    ? { pos: [ACROSS_WIN.x, ACROSS_WIN.y, ACROSS_Z - 0.6], color: CHAR_WARM, strength: 0.5 * acrossLit, range: 3.0 }
    : { pos: [SHOP_WIN.x, SHOP_WIN.y, FACADE_Z + 0.4], color: CHAR_WARM, strength: 0.35, range: 2.2 },
];

// day = the same street by day (set "day_street", light preset dayExterior, D12): day sky + sun,
// practical lights off. day = false is the locked v3 night street, unchanged.
export const NightStreet: React.FC<{ frame: number; acrossLit?: number; lanternOn?: number; day?: boolean }> = ({
  frame,
  acrossLit: acrossLitIn = 0,
  lanternOn: lanternIn = 1,
  day = false,
}) => {
  const acrossLit = day ? 0 : acrossLitIn;
  const lanternOn = day ? 0 : lanternIn;
  const nl = day ? 0 : 1; // night-only lights and glows
  // slow, subtle flame flicker (no strobing)
  const flicker = 1 + 0.05 * Math.sin(frame * 0.37) + 0.03 * Math.sin(frame * 1.13 + 1.7);
  const ground = useMemo(() => {
    const g = new THREE.PlaneGeometry(60, 60);
    g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
    return g;
  }, []);
  const sidewalk = useMemo(() => texturedBox(14, 0.14, 1.1), []);
  const { a: plasterA, b: plasterB, c: plasterC, d: plasterD } = plasters(day);

  return (
    <DayContext.Provider value={day}>
    <group>
      {/* sky + moon */}
      {day ? <DaySky sun={SUN} /> : <NightSky moon={MOON} />}

      {/* lights */}
      {day ? <DayExteriorLights sun={SUN} /> : <NightExteriorLights moon={MOON} />}
      <pointLight position={[SHOP_WIN.x, SHOP_WIN.y - 0.2, FACADE_Z + 0.7]} color="#ffa955" intensity={LIGHTS.window * nl} distance={0} decay={2} />
      {/* always mounted (intensity 0 until lit) so the light count never changes mid-shot */}
      <pointLight position={[ACROSS_WIN.x, ACROSS_WIN.y, ACROSS_Z - 0.5]} color={WARM_COLOR} intensity={4.5 * acrossLit} decay={2} />
      {/* warm spill from the lit window across the street onto Bram's side (makes the ending read warm) */}
      <pointLight position={[0.5, 2.3, 1.5]} color="#ffa95a" intensity={LIGHTS.spill * acrossLit} distance={0} decay={2} />

      {/* ground */}
      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial map={cobbleTex([0.5, 0.5], day)} roughness={1} />
      </mesh>
      <OMesh geometry={sidewalk} map={slabTex([0.8, 0.8])} position={[-0.5, 0.07, FACADE_Z + 0.55]} />

      {/* ---- the clock shop (center) ---- */}
      <Building x0={-3.6} x1={3.0} zFront={FACADE_Z} depth={5} height={5.4} wall={plasterA}>
        {/* floor band */}
        <OBox size={[6.8, 0.16, 0.22]} position={[-0.3, 3.0, FACADE_Z + 0.08]} color="#5a3c45" />
        {/* door */}
        <OBox size={[DOOR.w + 0.24, DOOR.h + 0.14, 0.1]} position={[DOOR.x, (DOOR.h + 0.14) / 2, FACADE_Z + 0.03]} color="#4a3040" />
        <OBox size={[DOOR.w, DOOR.h, 0.06]} position={[DOOR.x, DOOR.h / 2, FACADE_Z + 0.09]} map={woodTex()} />
        <mesh position={[DOOR.x + 0.38, 1.05, FACADE_Z + 0.15]}>
          <sphereGeometry args={[0.045, 12, 8]} />
          <meshStandardMaterial color="#d6a84f" roughness={0.4} metalness={0.6} />
        </mesh>
        <OBox size={[DOOR.w + 0.5, 0.12, 0.45]} position={[DOOR.x, 0.2, FACADE_Z + 0.3]} map={slabTex([1, 1])} color="#b0a5b0" />
        {/* shop window + awning */}
        <Window x={SHOP_WIN.x} y={SHOP_WIN.y} z={FACADE_Z + 0.03} w={SHOP_WIN.w} h={SHOP_WIN.h} lit={nl} tex={shopInteriorTex()} />
        {day ? null : <Glow position={[SHOP_WIN.x, SHOP_WIN.y, FACADE_Z + 0.35]} size={3.2} color="#ff9440" opacity={0.35} />}
        <group position={[SHOP_WIN.x, SHOP_WIN.y + SHOP_WIN.h / 2 + 0.32, FACADE_Z + 0.35]} rotation={[0.55, 0, 0]}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <OBox
              key={i}
              size={[0.4, 0.04, 0.75]}
              position={[-1.0 + i * 0.4, 0, 0]}
              color={i % 2 ? "#e8dccb" : "#8e3a3f"}
            />
          ))}
        </group>
        {/* hanging sign */}
        <OBox size={[0.04, 0.04, 0.7]} position={[2.6, 3.55, FACADE_Z + 0.35]} color="#2a2230" />
        <OBox size={[0.04, 0.55, 0.72]} position={[2.6, 3.2, FACADE_Z + 0.4]} map={signTex()} color="#ffffff" />
        {/* upper windows */}
        <Window x={-1.45} y={4.05} z={FACADE_Z + 0.03} w={0.9} h={1.15} shutters />
        <Window x={1.15} y={4.05} z={FACADE_Z + 0.03} w={0.9} h={1.15} shutters />
        <HangingLantern x={LANTERN.x} y={LANTERN.y} z={LANTERN.z} wallZ={FACADE_Z} flicker={flicker} on={lanternOn} intensity={LIGHTS.lantern} />
        {/* props: barrel + potted plant */}
        <Barrel position={[-2.55, 0.425, FACADE_Z + 0.45]} />
        <PottedPlant position={[2.55, 0.19, FACADE_Z + 0.5]} />
      </Building>

      {/* ---- neighbours ---- */}
      <Building x0={3.15} x1={8.5} zFront={FACADE_Z - 1.0} depth={5} height={6.6} wall={plasterB}>
        <Window x={4.6} y={1.6} z={FACADE_Z - 0.97} w={1.0} h={1.3} />
        <Window x={6.9} y={1.6} z={FACADE_Z - 0.97} w={1.0} h={1.3} />
        <Window x={4.6} y={4.2} z={FACADE_Z - 0.97} w={0.9} h={1.2} lit={0.8 * nl} />
        {day ? null : <Glow position={[4.6, 4.2, FACADE_Z - 0.6]} size={1.8} color="#ff9440" opacity={0.3} />}
        <Window x={6.9} y={4.2} z={FACADE_Z - 0.97} w={0.9} h={1.2} shutters />
      </Building>
      <Building x0={-9.5} x1={-3.75} zFront={FACADE_Z - 0.4} depth={5} height={6.0} wall={plasterC}>
        <Window x={-5.2} y={1.7} z={FACADE_Z - 0.37} w={1.0} h={1.3} />
        <Window x={-7.6} y={1.7} z={FACADE_Z - 0.37} w={1.0} h={1.3} />
        <Window x={-5.2} y={4.1} z={FACADE_Z - 0.37} w={0.9} h={1.2} shutters />
      </Building>

      {/* ---- across the street (behind the default camera) ---- */}
      <Building x0={-7} x1={-0.4} zFront={ACROSS_Z} depth={5} height={6.2} wall={plasterB} facing={-1}>
        <Window x={-2} y={1.7} z={ACROSS_Z - 0.03} w={1.0} h={1.3} facing={-1} />
        <Window x={-4.5} y={1.7} z={ACROSS_Z - 0.03} w={1.0} h={1.3} facing={-1} />
        <Window x={-2} y={4.1} z={ACROSS_Z - 0.03} w={0.9} h={1.2} facing={-1} shutters />
        <Window x={-4.5} y={4.1} z={ACROSS_Z - 0.03} w={0.9} h={1.2} facing={-1} shutters />
      </Building>
      <Building x0={-0.2} x1={6} zFront={ACROSS_Z} depth={5} height={5.6} wall={plasterD} facing={-1}>
        <OBox size={[1.1, 2.2, 0.08]} position={[3.6, 1.1, ACROSS_Z - 0.04]} map={woodTex()} color="#7e7f9f" />
        <Window x={ACROSS_WIN.x} y={1.7} z={ACROSS_Z - 0.03} w={1.0} h={1.3} facing={-1} />
        <Window
          x={ACROSS_WIN.x}
          y={ACROSS_WIN.y}
          z={ACROSS_Z - 0.03}
          w={0.9}
          h={1.2}
          facing={-1}
          lit={nl}
          fade={day ? undefined : acrossLit}
          tex={waitingWindowTex()}
          boost={0.3}
        />
        {acrossLit > 0 ? (
          <Glow position={[ACROSS_WIN.x, ACROSS_WIN.y, ACROSS_Z - 0.5]} size={3.4} color="#ff8a3a" opacity={0.6 * acrossLit} />
        ) : null}
        <Window x={3.6} y={ACROSS_WIN.y} z={ACROSS_Z - 0.03} w={0.9} h={1.2} facing={-1} shutters />
      </Building>

      <Details day={day} />

      {/* ---- distant rooftops (haze) ---- */}
      <DistantRooftops day={day} />
      {/* by day the camera also looks along the street: close both ends with hazy houses (no world edge) */}
      {day ? (
        <>
          <group position={[-22, 0, 2.2]} rotation={[0, Math.PI / 2, 0]}>
            <DistantRooftops day xs={[-10, -5.5, -1, 3.5, 8]} z={0} />
          </group>
          <group position={[22, 0, 2.2]} rotation={[0, -Math.PI / 2, 0]}>
            <DistantRooftops day xs={[-10, -5.5, -1, 3.5, 8]} z={0} />
          </group>
        </>
      ) : null}
    </group>
    </DayContext.Provider>
  );
};

// World detail and depth: chimneys, pipes, flower boxes, a clothesline across the street,
// unlit street lamps, a bench, a crate, and more houses so the street keeps going.
const Details: React.FC<{ day?: boolean }> = ({ day = false }) => {
  const nl = day ? 0 : 1;
  const { a: plasterA, b: plasterB, c: plasterC } = plasters(day);
  return (
    <group>
      {/* chimneys on the roofs */}
      <Chimney x={-2.4} y={6.1} z={FACADE_Z - 1.6} />
      <Chimney x={2.0} y={6.3} z={FACADE_Z - 2.2} h={1.1} />
      <Chimney x={5.6} y={7.3} z={FACADE_Z - 3.4} />
      <Chimney x={-6.8} y={6.8} z={FACADE_Z - 2.2} />
      <Chimney x={-4.8} y={7.0} z={ACROSS_Z + 1.8} />
      <Chimney x={2.4} y={6.4} z={ACROSS_Z + 1.6} h={1.0} />
      <Chimney x={4.9} y={6.3} z={ACROSS_Z + 1.4} />

      {/* drainpipes at the building corners */}
      <Pipe x={-3.5} z={FACADE_Z + 0.1} h={5.3} />
      <Pipe x={2.9} z={FACADE_Z + 0.1} h={5.3} />
      <Pipe x={-0.32} z={ACROSS_Z - 0.1} h={5.6} />
      <Pipe x={5.9} z={ACROSS_Z - 0.1} h={5.5} />

      {/* flower boxes under the upper windows */}
      <FlowerBox x={-1.45} y={3.32} z={FACADE_Z + 0.05} />
      <FlowerBox x={1.15} y={3.32} z={FACADE_Z + 0.05} />
      <FlowerBox x={-2} y={3.32} z={ACROSS_Z - 0.05} facing={-1} />

      {/* clothesline over the street */}
      <ClothesLine a={[-2.7, 4.75, FACADE_Z + 0.05]} b={[-2.3, 4.95, ACROSS_Z - 0.05]} />

      {/* unlit street lamps down the street (Bram's lantern is the one he lights) */}
      <StreetLamp x={-6.4} z={0.9} />
      <StreetLamp x={6.2} z={5.3} />
      <StreetLamp x={-12.5} z={0.9} />

      {/* bench under the shop window + crate by the barrel */}
      <Bench x={SHOP_WIN.x} z={FACADE_Z + 0.45} />
      <Crate position={[-3.25, 0.39, FACADE_Z + 0.75]} rotY={0.3} />

      {/* the street keeps going: more houses on both sides */}
      <Building x0={-16} x1={-9.7} zFront={FACADE_Z - 0.6} depth={5} height={7.0} wall={plasterA}>
        <Window x={-11.4} y={1.7} z={FACADE_Z - 0.57} w={1.0} h={1.3} />
        <Window x={-14.2} y={1.7} z={FACADE_Z - 0.57} w={1.0} h={1.3} lit={0.8 * nl} />
        <Window x={-11.4} y={4.4} z={FACADE_Z - 0.57} w={0.9} h={1.2} shutters />
        <Window x={-14.2} y={4.4} z={FACADE_Z - 0.57} w={0.9} h={1.2} />
      </Building>
      <Building x0={8.7} x1={14.5} zFront={FACADE_Z - 0.4} depth={5} height={5.8} wall={plasterC}>
        <Window x={10.2} y={1.7} z={FACADE_Z - 0.37} w={1.0} h={1.3} />
        <Window x={12.9} y={4.0} z={FACADE_Z - 0.37} w={0.9} h={1.2} lit={0.8 * nl} />
      </Building>
      <Building x0={-13.5} x1={-7.2} zFront={ACROSS_Z + 0.3} depth={5} height={7.4} wall={plasterA} facing={-1}>
        <Window x={-8.8} y={1.8} z={ACROSS_Z + 0.27} w={1.0} h={1.3} facing={-1} />
        <Window x={-11.6} y={1.8} z={ACROSS_Z + 0.27} w={1.0} h={1.3} facing={-1} />
        <Window x={-8.8} y={4.6} z={ACROSS_Z + 0.27} w={0.9} h={1.2} facing={-1} shutters />
        <Window x={-11.6} y={4.6} z={ACROSS_Z + 0.27} w={0.9} h={1.2} facing={-1} />
      </Building>
      <Building x0={6.2} x1={12.5} zFront={ACROSS_Z - 0.2} depth={5} height={6.6} wall={plasterB} facing={-1}>
        <Window x={7.8} y={1.7} z={ACROSS_Z - 0.23} w={1.0} h={1.3} facing={-1} />
        <Window x={10.6} y={1.7} z={ACROSS_Z - 0.23} w={1.0} h={1.3} facing={-1} />
        <Window x={7.8} y={4.3} z={ACROSS_Z - 0.23} w={0.9} h={1.2} facing={-1} shutters />
        <Window x={10.6} y={4.3} z={ACROSS_Z - 0.23} w={0.9} h={1.2} facing={-1} lit={0.7 * nl} />
      </Building>
    </group>
  );
};
