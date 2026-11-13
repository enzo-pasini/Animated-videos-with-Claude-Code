// Set registry: how each set draws itself and lights the characters, given the light levels of the plan.
// Set data (marks, front) lives in src/world/sets/<id>.json, shared with tools/build_props.py.
import type { WarmLight } from "../three/CharacterCard";
import { NightStreet, sceneWarmLights } from "../world/sets/NightStreet";
import { Workshop, workshopWarmLights } from "../world/sets/Workshop";
import { Bridge, bridgeActorOffset } from "../world/sets/Bridge";
import { lenaBedroomSet } from "../world/sets/LenaBedroom";
import { oldBasementSet } from "../world/sets/OldBasement";
// new_set.py: set imports above this line
import { WARM_INTERIOR } from "../world/lights/warmInterior";
import { DAY_EXTERIOR } from "../world/lights/dayExterior";
import { flickerAt } from "../film/Shots";

export type LightLevels = Record<string, number>;

export type SetDef = {
  Scene: React.FC<{ frame: number; lights: LightLevels }>;
  // warm practical lights that fall on the character cards (max 2 are used)
  warmLights: (frame: number, lights: LightLevels) => WarmLight[];
  fog?: { color: string; density: number }; // default: the locked night fog (#3d3f8e, 0.035)
  character?: { ambient: string; ambientStrength: number; topColor: string }; // default: CharacterCard night values
  grade?: string; // CSS filter on the 3D layer of every shot in this set (brightness → contrast → saturate)
  // optional: move an actor's feet this frame (e.g. riding a bouncing bridge deck); default = no move
  actorOffset?: (frame: number, lights: LightLevels, pos: [number, number, number]) => [number, number, number];
};

export const SETS: Record<string, SetDef> = {
  night_street: {
    Scene: ({ frame, lights }) => (
      <NightStreet frame={frame} lanternOn={lights.lantern ?? 1} acrossLit={lights.window_across ?? 0} />
    ),
    warmLights: (frame, lights) => sceneWarmLights(flickerAt(frame), lights.window_across ?? 0, lights.lantern ?? 1),
  },
  // the same street by day (D12): no practical lights, so nothing warm falls on the cards
  day_street: {
    Scene: ({ frame }) => <NightStreet frame={frame} day />,
    warmLights: () => [],
    fog: DAY_EXTERIOR.fog,
    character: DAY_EXTERIOR.character,
    grade: DAY_EXTERIOR.grade,
  },
  // chain bridge over a river by day (videos/2026-11-07-bridge-break-step); lights: bounce, drop, march
  bridge: {
    Scene: ({ frame, lights }) => <Bridge frame={frame} lights={lights} />,
    warmLights: () => [],
    fog: DAY_EXTERIOR.fog,
    character: DAY_EXTERIOR.character,
    grade: DAY_EXTERIOR.grade,
    actorOffset: bridgeActorOffset,
  },
  workshop: {
    Scene: ({ lights }) => <Workshop lampOn={lights.lamp ?? 1} />,
    warmLights: (_frame, lights) => workshopWarmLights(lights.lamp ?? 1),
    fog: WARM_INTERIOR.fog,
    character: WARM_INTERIOR.character,
    grade: WARM_INTERIOR.grade,
  },
  lena_bedroom: lenaBedroomSet, // new_set.py 2026-11-12
  old_basement: oldBasementSet, // new_set.py 2026-11-12
  // new_set.py: new sets above this line (made from src/world/sets/base/)
};
