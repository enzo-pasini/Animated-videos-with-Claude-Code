// Compose a CharacterSpec from base colors + parts (PLAN §3.1). The base body (proportions, line
// widths, face) is the locked one in src/character/draw.ts; parts only add hooks on top.
import type { CharacterSpec, Ctx, Pose } from "../character/draw";
import { faceTurnOf, turnWhole } from "../character/fx";
import { INK } from "../style/palette";
import type { Hooks, Part } from "./parts";

export type CastMember = CharacterSpec & {
  silhouette: string; // the ONE strong silhouette item (STYLE_SHEET §1.3); used by the variety check
  mainColor: string; // the color that reads first (shirt or hat); used by the variety check
  parts: string[];
};

type Base = Omit<CharacterSpec, keyof Hooks | "ink"> & { ink?: string; silhouette: string; mainColor?: string };

const SLOTS: (keyof Hooks)[] = ["behindBody", "behindHead", "overHead", "overFace", "torso", "underArms", "overArms"];

export const makeCharacter = (base: Base, parts: Part[]): CastMember => {
  const hooks: Hooks = {};
  for (const slot of SLOTS) {
    const fns = parts.map((p) => p.hooks[slot]).filter((f): f is (ctx: Ctx, pose: Pose) => void => !!f);
    if (fns.length) hooks[slot] = (ctx, pose) => fns.forEach((f) => f(ctx, pose));
  }
  // v4 3D face: parts that turn their own pieces draw as they are; the others are turned as one piece
  const faceParts = parts.filter((p) => p.hooks.overFace);
  if (faceParts.length)
    hooks.overFace = (ctx, pose) => {
      const turn = faceTurnOf(pose);
      for (const p of faceParts) {
        if (!turn || p.turns) p.hooks.overFace!(ctx, pose);
        else turnWhole(ctx, turn, () => p.hooks.overFace!(ctx, pose));
      }
    };
  const busyHand = parts.find((p) => p.holds)?.holds;
  const glasses = parts.some((p) => p.glasses);
  return {
    ink: INK,
    ...base,
    ...hooks,
    ...(busyHand ? { busyHand } : {}),
    ...(glasses ? { glasses } : {}),
    ...(faceParts.length ? { overFaceTurns: true } : {}),
    mainColor: base.mainColor ?? base.shirt,
    parts: parts.map((p) => p.name),
  };
};
