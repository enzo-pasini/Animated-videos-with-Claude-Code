// Set "lena_bedroom": Lena's bedroom in an old house at night (bed, bedside lamp, window with a dying plant, door)
// Made on 2026-11-12 by tools/new_set.py from the INDOOR base (src/world/sets/base/IndoorBase.tsx), light warmInterior.
// Video: videos/2026-11-12-furnace-ghosts (set plan approved at S1, videos/<slug>/set_plan.md).
// Layout (x right, z toward the cameras): bed against the back wall on the left, nightstand + bedside lamp at its
// right, window with a plant on the sill (back wall, right), dresser on the left wall, door on the right wall,
// rug in the middle, a chair with a sweater (front left) and a toy chest (front right) close to the cameras.
// Lights (plan keys, lena_bedroom.json "lights"): lamp = bedside lamp 0–1 (default 1), plant = 0 healthy → 1 dying,
// sitter = 1 someone sits up in bed at mark "bed" (lap mound + legs under the blanket; 0 = flat empty bed).
// Rules: kit pieces in src/world/kit/house.tsx · on a wall ≥ ON_WALL (3 cm) · rug at top(1).
import type { SetDef } from "../../episode/sets";
import type { WarmLight } from "../../three/CharacterCard";
import { OBox } from "../../three/Outlined";
import { plasterTex, woodTex } from "../../three/textures";
import { HomePiece } from "../kit/home";
import { BEDSIDE, Bed, BedsideLamp } from "../kit/house";
import { Chair, Picture, Rug, Shelf } from "../kit/interior";
import { CHAR_WARM } from "../lights/colors";
import { type Room, type WindowSlot, IndoorBase, ON_WALL, indoorSetDef } from "./base/IndoorBase";
import DATA from "./lena_bedroom.json";

const ROOM = DATA.room as Room;
const WIN = { x: 1.25, y: 1.75, w: 1.2, h: 1.3 };
const WINDOWS: WindowSlot[] = [{ wall: "back", at: WIN.x, y: WIN.y, w: WIN.w, h: WIN.h }];
export const BED: [number, number, number] = [-1.2, 0, -1.05];
export const LAMP: [number, number, number] = [-0.38, 0, -1.9];
const SILL_Y = WIN.y - WIN.h / 2 - 0.03; // the plant shelf just under the window

export const LenaBedroom: SetDef["Scene"] = ({ lights }) => {
  const lampOn = lights.lamp ?? 1;
  const dying = (lights.plant ?? 0) > 0.5;
  return (
    <IndoorBase
      room={ROOM}
      wall={plasterTex("lena_bedroom", "#b9b2c6", [0.33, 0.33], "#8e7f9c")}
      floorColor="#a87a5a"
      windows={WINDOWS}
      view="night"
      front={
        <>
          {/* a chair with a sweater thrown over it (front left), a toy chest (front right) */}
          <Chair x={-1.85} z={1.45} rotY={0.6} />
          <OBox size={[0.5, 0.08, 0.36]} position={[-1.85, 0.53, 1.45]} rotation={[0, 0.6, 0.05]} color="#c9785a" />
          <OBox size={[0.42, 0.3, 0.06]} position={[-1.98, 0.66, 1.29]} rotation={[0.1, 0.6, 0]} color="#c9785a" />
          <group position={[1.85, 0, 1.6]} rotation={[0, -0.4, 0]}>
            <OBox size={[0.8, 0.45, 0.45]} position={[0, 0.225, 0]} map={woodTex([1.5, 1])} color="#7f9cc0" />
            <OBox size={[0.84, 0.06, 0.49]} position={[0, 0.48, 0]} color="#53698f" />
            <OBox size={[0.2, 0.2, 0.2]} position={[0.18, 0.61, 0.02]} rotation={[0, 0.5, 0]} color="#efbb2c" />
          </group>
        </>
      }
      middle={
        <>
          <Bed position={BED} blanket="#5f7fa8" blanketFold="#e6ddcf" sitter={(lights.sitter ?? 1) > 0.5} />
          <BedsideLamp position={LAMP} on={lampOn} />
          <Rug x={0.35} z={0.15} w={2.2} d={1.5} color="#6e7db8" border="#d1aa7a" />
        </>
      }
      back={
        <>
          {/* dresser against the left wall (front to +x) */}
          <HomePiece kind="dresser" position={[ROOM.x0 + ON_WALL, 0, 0.55]} rotY={Math.PI / 2} />
          {/* door in the right wall (front to -x) */}
          <HomePiece kind="door" position={[ROOM.x1 - ON_WALL, 0, 0.75]} rotY={-Math.PI / 2} />
          {/* plant shelf under the window + the plant (dying = brown leaves) */}
          <OBox size={[1.0, 0.05, 0.22]} position={[WIN.x, SILL_Y - 0.06, ROOM.zBack + 0.14]} map={woodTex([1, 0.3])} color="#a46b55" />
          <HomePiece
            kind="houseplant"
            position={[WIN.x + 0.15, SILL_Y - 0.035, ROOM.zBack + 0.15]}
            h={0.55}
            tones={dying ? { DarkGreen: "#a8955a" } : undefined}
          />
        </>
      }
      far={
        <>
          <Picture x={BED[0]} y={1.75} z={ROOM.zBack + ON_WALL} w={0.6} h={0.45} />
          <Picture x={ROOM.x0 + ON_WALL} y={1.7} z={-0.6} w={0.5} h={0.6} rotY={Math.PI / 2} />
          {/* right wall: a shelf of books and jars above the toy chest, a picture between the door and the back */}
          <group position={[ROOM.x1, 0, 1.65]} rotation={[0, -Math.PI / 2, 0]}>
            <Shelf x={0} y={1.25} z={0} w={1.2} />
          </group>
          <Picture x={ROOM.x1 - ON_WALL} y={1.65} z={-1.1} w={0.55} h={0.7} rotY={-Math.PI / 2} />
          <HomePiece kind="ceilingLight" position={[0.2, ROOM.height - 0.5, -0.2]} />
        </>
      }
    />
  );
};

// Warm light of the bedside lamp on the characters' cards (bed side).
export const bedroomWarmLights = (lampOn: number): WarmLight[] => [
  { pos: [LAMP[0] + 0.05, BEDSIDE.lampY, LAMP[2] + 0.2], color: CHAR_WARM, strength: 0.5 * lampOn, range: 3.0 },
];

export const lenaBedroomSet = indoorSetDef(LenaBedroom, {
  warmLights: (_frame, lights) => bedroomWarmLights(lights.lamp ?? 1),
});
