import type { Look } from "../character/look";
// Render props made by tools/build_props.py from a scene plan. Everything is already in frames;
// Episode.tsx only draws it.
import type { CaptionChunk } from "../film/Captions";
import type { EdgeLinesProps } from "../film/EdgeLines";
import type { Move } from "../film/camera";
import type { Mouth, Pose } from "../character/draw";
import type { Camera2D, InsertProps } from "../world/inserts/Diagram";

export type Keys = { frames: number[]; values: number[] }; // interpolated, linear (lights) or eased (pose)

// "css filter" or a filter that follows a light: from → to as the light goes 0 → 1
export type Grade = string | { from: [number, number, number]; to: [number, number, number]; follow: string } | null;

export type Actor = {
  who: string; // character id (src/character/specs.ts)
  head?: string; // tests only: override the head shape (round | gumdrop | chibi); missing = the cast's shape (D19)
  bg?: boolean; // v4 look L2: a background actor → its outfit draws only the big shapes (base colour + at most 2)
  pos: [number, number, number]; // feet position (m)
  path?: { frames: number[]; points: [number, number, number][] }; // v4 walk: the feet move along these points (replaces pos)
  base: Partial<Pose>;
  tracks: Record<string, Keys>; // numeric pose fields, eased in/out
  steps: Record<string, [number, Mouth | string][]>; // discrete fields (mouth): value from that frame on
  blink: number[]; // frames where a 4-frame blink starts
};

export type ExtraWarm = {
  pos: [number, number, number];
  color: string;
  strength: number;
  range: number;
  follow?: string; // strength × this light's level
};

export type ShotProps = {
  id: string;
  beat: string | null;
  from: number; // global frame where the shot starts appearing
  len: number; // frames, including the dissolve overlap into the next shot
  transition_in: "dissolve" | "cut" | null;
  set: string; // a set id, or "insert" for a flat 2D diagram shot
  camera: Move | Camera2D;
  insert?: InsertProps;
  grade: Grade;
  blur_bg: number;
  extra_warm: ExtraWarm[];
  actors: Actor[];
  lines?: EdgeLinesProps; // v4 VFX item 5: edge lines over the shot (src/film/EdgeLines.tsx); missing = none
  branch?: { corner: "tl" | "tr" }; // v4 VFX item 8: a tree branch framing a top corner (src/world/kit/Branch.tsx); missing = none
};

export type EpisodeProps = {
  fps: number;
  frames: number;
  dissolve: number;
  audio: string | null; // path inside public/
  captions: CaptionChunk[];
  lights: Record<string, Keys>;
  shots: ShotProps[];
  look?: Partial<Look> | null; // v4 look track (src/character/look.ts); missing = the locked L1, null = off (v3)
};
