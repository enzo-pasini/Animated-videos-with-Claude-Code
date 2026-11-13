// Named expressions = partial poses (src/character/draw.ts Pose). A plan can set one as the actor's
// base ("expr": "worried") or switch them on words (steps: {"expr": [["start","worried"],["w:20","happy"]]}).
// Keep them subtle: RULEBOOK §5 says the camera gives the energy, characters move a little.
import type { Pose } from "../character/draw";

export const EXPRESSIONS: Record<string, Partial<Pose>> = {
  neutral: { mouth: "line", browRaise: 0, headTilt: 0 },
  happy: { mouth: "smile", browRaise: 0.25, headTilt: 0.03 },
  surprised: { mouth: "open", browRaise: 1, headTilt: -0.02 },
  worried: { mouth: "frown", browRaise: 0.55, headTilt: -0.05, lookY: 0.3 },
  angry: { mouth: "frown", browRaise: -0.8, headTilt: 0.02 },
  thinking: { mouth: "flat", browRaise: -0.2, lookX: -0.6, lookY: -0.6, headTilt: 0.06 },
  laughing: { mouth: "open", browRaise: 0.4, headTilt: 0.08, blink: 1 },
  proud: { mouth: "smile", browRaise: -0.1, headTilt: -0.06, lookY: -0.3 },
  sad: { mouth: "frown", browRaise: 0.35, lookY: 0.6, headTilt: 0.05 },
  // gestures (arms in radians up from hanging)
  pointing: { armR: 1.35, elbowR: 0.02, lookX: 0.7 },
  shrug: { armL: 0.85, armR: 0.85, elbowL: -0.2, elbowR: -0.2, browRaise: 0.6, mouth: "flat" },
  wave: { armR: 2.4, elbowR: 0.15, mouth: "smile" },
};
