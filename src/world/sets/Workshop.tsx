// Set "workshop": a small warm room — table under a pendant lamp, shelves of jars and books, a night
// window (cool accent), a door, a rug, a chair, a picture. Light preset: warmInterior. Marks: workshop.json.
import type { WarmLight } from "../../three/CharacterCard";
import { OBox } from "../../three/Outlined";
import { darkWindowTex, plasterTex, woodTex } from "../../three/textures";
import { Chair, PendantLamp, Picture, RoomShell, Rug, Shelf, Table } from "../kit/interior";
import { Window } from "../kit/Window";
import { CHAR_WARM } from "../lights/colors";
import { WarmInteriorLights } from "../lights/warmInterior";

export const ROOM = { x0: -4.2, x1: 4.2, zBack: -2.2, zFront: 8, height: 3.3 };
export const LAMP = { x: -0.7, y: 2.35, z: -0.9 };
const LAMP_INTENSITY = 9; // v1 6

export const workshopWarmLights = (lampOn = 1): WarmLight[] => [
  { pos: [LAMP.x, LAMP.y - 0.2, LAMP.z], color: CHAR_WARM, strength: 0.5 * lampOn, range: 3.6 },
];

export const Workshop: React.FC<{ lampOn?: number }> = ({ lampOn = 1 }) => {
  const wall = plasterTex("ws2", "#dcc3a8", [0.33, 0.33], "#a86a52"); // v1 #d9b08a (too saturated)
  return (
    <group>
      <WarmInteriorLights />
      <RoomShell {...ROOM} wall={wall} />

      {/* back wall: night window (cool accent), shelves, picture */}
      <Window x={2.3} y={1.75} z={ROOM.zBack + 0.03} w={1.2} h={1.3} tex={darkWindowTex("ws1")} />
      <Shelf x={-2.4} y={1.45} z={ROOM.zBack} w={1.7} />
      <Picture x={0.6} y={1.95} z={ROOM.zBack + 0.03} />

      {/* left wall: door + coat hooks */}
      <group position={[ROOM.x0 + 0.02, 0, 1.6]} rotation={[0, Math.PI / 2, 0]}>
        <OBox size={[1.2, 2.3, 0.1]} position={[0, 1.15, 0]} color="#4a3040" />
        <OBox size={[1.0, 2.18, 0.06]} position={[0, 1.09, 0.05]} map={woodTex()} />
        {[-0.9, -1.25].map((dx) => (
          <OBox key={dx} size={[0.05, 0.05, 0.14]} position={[dx, 1.75, 0.07]} color="#2a2230" />
        ))}
      </group>
      <Shelf x={ROOM.x1 - 0.02} y={1.3} z={2.2} w={1.4} />

      {/* furniture */}
      <Rug x={-0.4} z={0.4} />
      <Table x={LAMP.x} z={LAMP.z} />
      <Chair x={LAMP.x + 0.95} z={LAMP.z + 0.15} rotY={-0.5} />
      <PendantLamp x={LAMP.x} y={LAMP.y} z={LAMP.z} ceiling={ROOM.height} on={lampOn} intensity={LAMP_INTENSITY} />
      {/* things on the table */}
      <OBox size={[0.36, 0.05, 0.26]} position={[LAMP.x - 0.35, 0.88, LAMP.z]} color="#f3ead8" />
      <OBox size={[0.12, 0.14, 0.12]} position={[LAMP.x + 0.35, 0.93, LAMP.z + 0.1]} color="#c9785a" />
    </group>
  );
};
