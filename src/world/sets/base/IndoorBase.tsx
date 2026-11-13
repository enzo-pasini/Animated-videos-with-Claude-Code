// Set template, indoor base (scenes plan session 2). The INVISIBLE base of every new room — walls, floor,
// ceiling, the locked warmInterior light, a window-view slot and four layer slots — NOT its look: the room
// size, wall paint, furniture, props and cameras stay free in each set.
// Values: warmInterior (locked v3.1) and the workshop room (RoomShell). Rules from the bridge video:
//   FB2/FB4  no two faces on one plane: windows/pictures sit ≥ ON_WALL (3 cm) in front of a wall, rugs ≥ top(1)
//   FB6  no edge of the world: the room is CLOSED (a 4th wall at zFront; the workshop was open to +z and the
//        set review's reverse views looked out into the void). Cameras stay inside camera_bounds, so it never blocks a shot
//   FB7  the room must fit the locked ±12 m key-light shadow box (new_set.py checks the room size)
// Made by tools/new_set.py from base/indoor.tsx.tpl.
import { useMemo } from "react";
import type { ReactNode } from "react";
import type * as THREE from "three";
import { OMesh, texturedBox } from "../../../three/Outlined";
import {
  plasterTex,
  darkWindowTex,
  dayWindowTex,
} from "../../../three/textures";
import { RoomShell } from "../../kit/interior";
import { Window } from "../../kit/Window";
import { WARM_INTERIOR, WarmInteriorLights } from "../../lights/warmInterior";
import type { SetDef } from "../../../episode/sets";

export type Room = {
  x0: number;
  x1: number;
  zBack: number;
  zFront: number;
  height: number;
};
export const SHADOW_HALF = 12; // the locked warmInterior shadow box (half-size, m)
export const ON_WALL = 0.03; // flat things on a wall stand this far out (≥ 2 cm, FB2)
export const TOP = { floor: 0, gap: 0.02 };
export const top = (n: number) => TOP.floor + n * TOP.gap; // rug = top(1), mat on the rug = top(2)…

// A window in one of the three walls. `at` = position along the wall (x for the back wall, z for the sides).
export type WindowSlot = {
  wall: "back" | "left" | "right";
  at: number;
  y?: number;
  w?: number;
  h?: number;
};
// What the windows show: the night (cool accent, default), day sky, or a painted texture of the set's own view.
export type WindowView = "night" | "day" | THREE.Texture;

const WallWindow: React.FC<{
  room: Room;
  slot: WindowSlot;
  view: WindowView;
  i: number;
}> = ({ room, slot, view, i }) => {
  const { wall, at, y = 1.75, w = 1.2, h = 1.3 } = slot;
  const tex =
    view === "night"
      ? darkWindowTex(`base${i}`)
      : view === "day"
        ? dayWindowTex(`base${i}`)
        : view;
  if (wall === "back")
    return (
      <Window x={at} y={y} z={room.zBack + ON_WALL} w={w} h={h} tex={tex} />
    );
  // side walls: the window turned to face into the room
  const x = wall === "left" ? room.x0 + ON_WALL : room.x1 - ON_WALL;
  return (
    <group
      position={[x, 0, at]}
      rotation={[0, wall === "left" ? Math.PI / 2 : -Math.PI / 2, 0]}
    >
      <Window x={0} y={y} z={0} w={w} h={h} tex={tex} />
    </group>
  );
};

export const IndoorBase: React.FC<{
  room: Room;
  wall?: THREE.Texture; // wall paint (the set's look); default = the workshop's warm plaster
  floorColor?: string;
  windows?: WindowSlot[];
  view?: WindowView;
  front?: ReactNode; // close to the camera (the camera side of the room, +z)
  middle?: ReactNode; // around the marks
  back?: ReactNode; // furniture against the walls
  far?: ReactNode; // on the walls: shelves, pictures, doors
  children?: ReactNode;
}> = ({
  room,
  wall,
  floorColor,
  windows = [],
  view = "night",
  front,
  middle,
  back,
  far,
  children,
}) => {
  const paint =
    wall ?? plasterTex("base_wall", "#dcc3a8", [0.33, 0.33], "#a86a52");
  const w = room.x1 - room.x0;
  const frontWall = useMemo(
    () => texturedBox(w + 0.4, room.height, 0.2),
    [w, room.height],
  );
  return (
    <group>
      <WarmInteriorLights />
      <RoomShell {...room} wall={paint} floorColor={floorColor} />
      <OMesh
        geometry={frontWall}
        map={paint}
        position={[(room.x0 + room.x1) / 2, room.height / 2, room.zFront + 0.1]}
      />
      {windows.map((s, i) => (
        <WallWindow key={i} room={room} slot={s} view={view} i={i} />
      ))}
      <group name="layer-front">{front}</group>
      <group name="layer-middle">{middle}</group>
      <group name="layer-back">{back}</group>
      <group name="layer-far">{far}</group>
      {children}
    </group>
  );
};

// The registry entry of a room (src/episode/sets.tsx): the locked warmInterior fog, character light and grade.
// A set with a lamp passes its own warmLights (see Workshop.tsx workshopWarmLights).
export const indoorSetDef = (
  Scene: SetDef["Scene"],
  extra: Partial<SetDef> = {},
): SetDef => ({
  Scene,
  warmLights: () => [],
  fog: WARM_INTERIOR.fog,
  character: WARM_INTERIOR.character,
  grade: WARM_INTERIOR.grade,
  ...extra,
});
