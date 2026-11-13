// Set "old_basement": old house basement at night (iron furnace, wooden stairs, pipes, crates)
// Made on 2026-11-12 by tools/new_set.py from the INDOOR base (src/world/sets/base/IndoorBase.tsx), light warmInterior.
// Video: videos/2026-11-12-furnace-ghosts (set plan approved at S1, videos/<slug>/set_plan.md).
// v2 (2026-11-13, the user's S2 notes — the preferred basement look, BUILDING.md "Mood: a creepy basement"):
// pitch-black corners + a black passage (the cellar goes deeper than we see), a door ajar at the top of the stairs
// with warm light from the "normal" house, cobwebs on the ceiling and the furnace, darker cool paint, a dim bulb.
// Layout (x right, z toward the cameras): the furnace in the back middle-right with its flue into the back wall,
// 5 steps + a landing up the left wall to the door (back wall), a small high window (back), a shelf of jars (back
// right), a dark passage (right wall), crates + barrel at the front right, pipes along the ceiling, a bare bulb.
// Lights (plan keys, old_basement.json "lights"): furnace = the fire glow 0–1 (default 1), bulb = 0–1 (default 1),
// cracked = 0 / 1 (the broken furnace shows its crack), door = the light through the door crack 0–1 (default 1).
// The light preset (warmInterior) is locked: the room is darker through its paint, the practical lights and the
// Darkness pieces only.
import type { SetDef } from "../../episode/sets";
import type { WarmLight } from "../../three/CharacterCard";
import { plasterTex } from "../../three/textures";
import { AjarDoor, CeilingPipe, CornerWeb, DarkOpening, Darkness, DrapeWeb, Furnace, HangingSpider, STAIR, Stairs, WebSheet } from "../kit/house";
import { PendantLamp, Shelf } from "../kit/interior";
import { Barrel, Crate } from "../kit/props";
import { CHAR_WARM } from "../lights/colors";
import { type Room, type WindowSlot, IndoorBase, ON_WALL, indoorSetDef } from "./base/IndoorBase";
import DATA from "./old_basement.json";

const ROOM = DATA.room as Room;
const H = ROOM.height;
const WINDOWS: WindowSlot[] = [{ wall: "back", at: -0.75, y: 2.35, w: 0.9, h: 0.45 }];
export const FURNACE: [number, number, number] = [0.6, 0, -1.2];
export const BULB = { x: -0.6, y: 2.45, z: 0.1 };
// stairs: 5 steps from z 0.05 up to the landing (top 1.02 m) against the back wall, door above it
const STEPS = 5;
const STAIRS_AT: [number, number, number] = [-2.1, 0, 0.05];
const LANDING = 0.92;
const LANDING_TOP = STEPS * STAIR.rise - 0.03 + 0.05;
export const DOOR = { x: STAIRS_AT[0], y: LANDING_TOP, w: 0.8, h: 1.75 };
const PI = Math.PI;

export const OldBasement: SetDef["Scene"] = ({ frame, lights }) => {
  const fire = lights.furnace ?? 1;
  const bulb = lights.bulb ?? 1;
  const door = lights.door ?? 1;
  return (
    <IndoorBase
      room={ROOM}
      wall={plasterTex("old_basement_v2", "#6f6977", [0.5, 0.5], "#463c4a")}
      floorColor="#5e5752"
      windows={WINDOWS}
      view="night"
      front={
        <>
          <Crate position={[2.15, 0.25, 1.35]} rotY={0.3} />
          <Crate position={[2.2, 0.75, 1.4]} rotY={-0.15} />
          <Barrel position={[1.55, 0.425, 1.85]} />
          {/* darkness: the front corners */}
          <Darkness position={[ROOM.x0 + ON_WALL, 1.1, 1.75]} rotY={PI / 2} w={1.3} h={2.4} />
          <Darkness position={[ROOM.x1 - ON_WALL, 1.1, 1.85]} rotY={-PI / 2} w={1.1} h={2.4} />
        </>
      }
      middle={
        <>
          <Furnace position={FURNACE} ceiling={H} glow={fire} cracked={(lights.cracked ?? 0) > 0.5} flueBack={FURNACE[2] - ROOM.zBack - 0.03} />
          <PendantLamp x={BULB.x} y={BULB.y} z={BULB.z} ceiling={H} on={bulb} intensity={2.2} />
          {/* a big web from the furnace top up to the back wall (the user's wish at S2) */}
          <WebSheet
            points={[
              [FURNACE[0] - 1.0, H - 0.05, ROOM.zBack + 0.03],
              [FURNACE[0] + 1.05, H - 0.05, ROOM.zBack + 0.03],
              [FURNACE[0] + 0.05, 1.75, FURNACE[2] - 0.42],
            ]}
            seed={3}
          />
        </>
      }
      back={
        <>
          <Stairs position={STAIRS_AT} steps={STEPS} rail={-1} landing={LANDING} />
          <AjarDoor position={[DOOR.x, DOOR.y, ROOM.zBack + ON_WALL]} w={DOOR.w} h={DOOR.h} open={0.3} light={door} spill={0.85} />
          <Crate position={[2.2, 0.25, -1.55]} rotY={0.1} />
          <Barrel position={[-1.0, 0.425, -1.75]} />
          {/* darkness: under the stairs, behind the barrel, the back right corner */}
          <Darkness position={[ROOM.x0 + ON_WALL, 0.65, -0.55]} rotY={PI / 2} w={2.2} h={1.4} />
          <Darkness position={[-2.15, 0.02, -0.55]} flat kind="round" w={1.3} h={1.9} opacity={0.85} />
          <Darkness position={[-1.05, 0.7, ROOM.zBack + ON_WALL]} w={1.1} h={1.4} />
          <Darkness position={[2.45, 1.2, ROOM.zBack + ON_WALL]} w={1.0} h={2.6} />
        </>
      }
      far={
        <>
          <Shelf x={2.0} y={1.1} z={ROOM.zBack} w={1.2} />
          <DarkOpening position={[ROOM.x1 - ON_WALL, 0, -0.1]} rotY={-PI / 2} w={1.0} h={1.9} />
          <CeilingPipe from={[ROOM.x0, H - 0.16, -1.95]} len={ROOM.x1 - ROOM.x0} />
          <CeilingPipe from={[ROOM.x0, H - 0.24, 0.9]} len={ROOM.x1 - ROOM.x0} r={0.035} color="#b87a4e" />
          {/* cobwebs like the user's reference: big classic webs in the four top corners + a spider on its thread */}
          <CornerWeb corner={[ROOM.x1, H, ROOM.zBack]} a={[-1, 0, 0]} b={[0, 0, 1]} size={1.3} seed={1} />
          <CornerWeb corner={[ROOM.x0, H, ROOM.zBack]} a={[1, 0, 0]} b={[0, 0, 1]} size={1.0} seed={2} />
          <CornerWeb corner={[ROOM.x1, H, ROOM.zFront]} a={[-1, 0, 0]} b={[0, 0, -1]} size={1.2} seed={5} />
          <CornerWeb corner={[ROOM.x0, H, ROOM.zFront]} a={[1, 0, 0]} b={[0, 0, -1]} size={1.2} seed={6} />
          <HangingSpider top={[1.75, H, -1.45]} len={0.75} frame={frame} />
          <DrapeWeb position={[ROOM.x1 - 0.33, 2.02, -0.55]} rotY={-PI / 2} w={0.4} h={0.38} seed={7} />
        </>
      }
    />
  );
};

// Warm lights on the cards: the furnace fire (front of its door) + the bare bulb.
export const basementWarmLights = (fire: number, bulb: number): WarmLight[] => [
  { pos: [FURNACE[0], 0.75, FURNACE[2] + 1.0], color: "#ffb070", strength: 0.55 * fire, range: 3.0 },
  { pos: [BULB.x, BULB.y - 0.2, BULB.z], color: CHAR_WARM, strength: 0.25 * bulb, range: 3.0 },
];

export const oldBasementSet = indoorSetDef(OldBasement, {
  warmLights: (_frame, lights) => basementWarmLights(lights.furnace ?? 1, lights.bulb ?? 1),
});
