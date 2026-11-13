// Set "__ID__": __ABOUT__
// Made on __DATE__ by tools/new_set.py from the INDOOR base (src/world/sets/base/IndoorBase.tsx), light warmInterior.
// Build it step by step with src/world/sets/BUILDING.md. The base already gives: walls, floor, ceiling (room size in
// __ID__.json "room"), the locked warmInterior light and shadow box, windows with a view slot.
// Your job: the LOOK — wall paint, furniture, props, layout (front → far), and cameras (__ID___cams.json).
// Rules: build pieces in src/world/kit/ (not here) · things on a wall stand ON_WALL (3 cm) out, rugs at top(1)
// (never two faces on one plane) · a lamp? add warmLights to the def below (see Workshop.tsx).
// Something moves? use ({ frame, lights }) => … (lights = the plan's levels, listed in __ID__.json "lights").
import type { SetDef } from "../../episode/sets";
import { type Room, type WindowSlot, IndoorBase, indoorSetDef } from "./base/IndoorBase";
import DATA from "./__ID__.json";

const ROOM = DATA.room as Room;
const WINDOWS: WindowSlot[] = [{ wall: "back", at: __WIN_X__ }];

export const __NAME__: SetDef["Scene"] = () => (
  <IndoorBase
    room={ROOM}
    // wall={plasterTex("__ID__", "#dcc3a8", [0.33, 0.33], "#a86a52")}  ← the wall paint (the set's look)
    windows={WINDOWS}
    view="__VIEW__"
    front={<>{/* close to the camera (the camera side of the room, +z) */}</>}
    middle={<>{/* around the marks */}</>}
    back={<>{/* furniture against the walls */}</>}
    far={<>{/* on the walls: shelves, pictures, a door */}</>}
  />
);

export const __CAMEL__Set = indoorSetDef(__NAME__);
