// All characters by id. The three v3 characters stay as they were locked (src/character/specs.ts);
// new ones are composed from parts (D9: a new main character every video).
import type { CharacterSpec } from "../character/draw";
import { HEAD_FOR_GENDER, type HeadShape } from "../character/head";
import { CHARACTERS } from "../character/specs";
import { makeCharacter, type CastMember } from "./makeCharacter";
import { braids, cardigan, clericalCollar, clipboard, flatCap, hairBun, longCoat, longHair, mustache, overalls, pajamas, prayerBook, rifle, riflemanJacket, robe, roundGlasses, shako, shortHair, sweaterVest, wideHat, wrench } from "./parts";
import META from "./cast_meta.json";

type Meta = { name: string; role: string; silhouette: string; mainColor: string; locked: boolean; gender: "male" | "female"; head?: HeadShape };
const meta = (id: string) => (META as unknown as Record<string, Meta>)[id];
// character identity (PLAN D19): male = gumdrop, female = chibi, unless cast_meta.json sets "head" (Juno → chibi)
const headOf = (id: string): HeadShape => meta(id).head ?? HEAD_FOR_GENDER[meta(id).gender];

// Mira — harbor clerk. Silhouette: a tall dark-auburn hair bun + big round glasses. Main color: leaf green
// (a rare accent in the channel palette, so she reads apart from Bram's navy and Juno's yellow).
const miraBase = {
  id: "mira",
  name: "Mira",
  role: "harbor clerk",
  skin: "#f4eee4",
  shirt: "#5f8f4e",
  pants: "#2a2638",
  eyes: "dot",
  brows: "thin",
  blush: "rgba(235,150,140,0.5)",
  silhouette: meta("mira").silhouette,
  mainColor: meta("mira").mainColor,
} as const;
export const MIRA: CastMember = makeCharacter(
  { ...miraBase, id: "mira" },
  [hairBun("#5a2e24"), roundGlasses(), cardigan("#efe6d6", "#e8c87a"), clipboard()],
);
// Story variant (first used in videos/2026-11-04-foggy-glasses): the same Mira with fogged glasses.
export const MIRA_FOGGED: CastMember = makeCharacter(
  { ...miraBase, id: "mira_fogged" },
  [hairBun("#5a2e24"), roundGlasses(undefined, undefined, true), cardigan("#efe6d6", "#e8c87a"), clipboard()],
);

// Riflemen of 1831 (first used in videos/2026-11-07-bridge-break-step). Silhouette: the tall shako with its
// wool tuft + an upright rifle. Main color: rifle green (the 60th Rifles wore green, not red coats).
// "rifleman" is the main character ("you" in the script); _b and _c fill the ranks (four abreast).
const riflemanBase = {
  role: "rifleman, 1831",
  shirt: "#3f6b4f",
  pants: "#263a30",
  boots: { color: "#1d1a26", len: 0.22 },
  eyes: "dot",
  brows: "thin",
  silhouette: meta("rifleman").silhouette,
  mainColor: meta("rifleman").mainColor,
} as const;
const riflemanParts = () => [shako(), riflemanJacket(), rifle()];
export const RIFLEMAN: CastMember = makeCharacter(
  { ...riflemanBase, id: "rifleman", name: "Rifleman", skin: "#f4e6d4", blush: "rgba(235,150,140,0.5)", freckles: true },
  riflemanParts(),
);
export const RIFLEMAN_B: CastMember = makeCharacter(
  { ...riflemanBase, id: "rifleman_b", name: "Rifleman B", skin: "#d9b08c", brows: "flat" },
  [...riflemanParts(), mustache("#3a2a2a")],
);
export const RIFLEMAN_C: CastMember = makeCharacter(
  { ...riflemanBase, id: "rifleman_c", name: "Rifleman C", skin: "#b07e5a", blush: "rgba(200,110,100,0.35)" },
  riflemanParts(),
);

// The old house (first used in videos/2026-11-12-furnace-ghosts). Lena (main, girl), her mother and father, the
// priest, the furnace repairman, and the man in the dark coat (the "ghost" = a carbon-monoxide hallucination).
const fg = (id: string) => ({ id, name: meta(id).name, role: meta(id).role, silhouette: meta(id).silhouette, mainColor: meta(id).mainColor });
export const LENA: CastMember = makeCharacter(
  { ...fg("lena"), skin: "#f6e9dc", shirt: "#b06a8e", pants: "#9a5a7c", eyes: "dot", brows: "thin", blush: "rgba(235,150,140,0.55)" },
  [braids("#6b3a2a", "#e8c87a"), pajamas()],
);
export const LENA_MOM: CastMember = makeCharacter(
  { ...fg("lena_mom"), skin: "#f1dfcf", shirt: "#4f7f9a", pants: "#3a3a4e", eyes: "dot", brows: "thin", blush: "rgba(235,150,140,0.45)" },
  [longHair("#3a2a2a"), robe("#e6ddcf", "#355a72")],
);
export const LENA_DAD: CastMember = makeCharacter(
  { ...fg("lena_dad"), skin: "#efd8c0", shirt: "#c79a3e", pants: "#4a4458", eyes: "dot", brows: "bushy" },
  [shortHair("#5a3a2a"), mustache("#4a3030"), sweaterVest("#8e5a40", "#efe6d6")],
);
export const PRIEST: CastMember = makeCharacter(
  { ...fg("priest"), skin: "#e9d2bc", shirt: "#26222e", pants: "#26222e", boots: { color: "#15121c", len: 0.2 }, eyes: "dot", brows: "flat" },
  [shortHair("#4a4458"), clericalCollar(), prayerBook()],
);
export const REPAIRMAN: CastMember = makeCharacter(
  { ...fg("repairman"), skin: "#d9a882", shirt: "#b5503d", pants: "#4f6fa8", boots: { color: "#3a2a22", len: 0.2 }, eyes: "dot", brows: "bushy" },
  [flatCap("#6b5a4a", "#4a3c30"), overalls("#4f6fa8"), wrench()],
);
export const COAT_MAN: CastMember = makeCharacter(
  { ...fg("coat_man"), skin: "#d8d6e6", shirt: "#2a2836", pants: "#2a2836", boots: { color: "#15121c", len: 0.2 }, eyes: "dot", brows: "flat" },
  [longCoat(), wideHat()],
);

// silhouette, main color and head shape of every character come from cast_meta.json (shared with variety_check.py).
// A story variant (mira_fogged) uses the meta of its base character (mira).
type CastSpec = CharacterSpec & { silhouette?: string; mainColor?: string };
const withHead = (spec: CastSpec, metaId: string): CastSpec => ({ ...spec, headShape: headOf(metaId) });

export const CAST: Record<string, CastSpec> = {
  ...Object.fromEntries(Object.entries(CHARACTERS).map(([id, spec]) => [id, withHead({ ...spec, silhouette: meta(id).silhouette, mainColor: meta(id).mainColor }, id)])),
  mira: withHead(MIRA, "mira"),
  mira_fogged: withHead(MIRA_FOGGED, "mira"),
  rifleman: withHead(RIFLEMAN, "rifleman"),
  rifleman_b: withHead(RIFLEMAN_B, "rifleman_b"),
  rifleman_c: withHead(RIFLEMAN_C, "rifleman_c"),
  lena: withHead(LENA, "lena"),
  lena_mom: withHead(LENA_MOM, "lena_mom"),
  lena_dad: withHead(LENA_DAD, "lena_dad"),
  priest: withHead(PRIEST, "priest"),
  repairman: withHead(REPAIRMAN, "repairman"),
  coat_man: withHead(COAT_MAN, "coat_man"),
};

export const castMember = (id: string) => {
  const c = CAST[id];
  if (!c) throw new Error(`unknown character "${id}" (cast: ${Object.keys(CAST).join(", ")})`);
  return c;
};
