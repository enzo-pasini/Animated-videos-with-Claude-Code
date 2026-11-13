// v4 timed effects (VFX). A plan switches one on with a step, like an expression:
//   steps: {"fx": [["w:12", "anger"]]}  →  the effect starts on that word and plays from there.
// Each effect turns "frames since it started" into pose fields (drawn by src/character/fx.ts).
// "none" switches effects off. Recipes: references/effects/<effect>.md.
import type { Mouth, Pose } from "../character/draw";
import { ANGER, angerFillAt } from "../character/fx";

const rand = (n: number) => {
  const x = Math.sin(n * 91.7 + 17.3) * 43758.5453;
  return x - Math.floor(x);
};
const smooth = (x: number) => {
  const k = Math.min(1, Math.max(0, x));
  return k * k * (3 - 2 * k);
};

// entry of a looping [frames, value] pattern at frame t → value, frames into it, index, loop number
const loopAt = <T,>(pattern: [number, T][], t: number): { v: T; u: number; i: number; loop: number } => {
  const total = pattern.reduce((a, [n]) => a + n, 0);
  const loop = Math.floor(t / total);
  let u = t - loop * total;
  for (let i = 0; i < pattern.length; i++) {
    if (u < pattern[i][0]) return { v: pattern[i][1], u, i, loop };
    u -= pattern[i][0];
  }
  return { v: pattern[0][1], u: 0, i: 0, loop };
};

// ---------- anger: the face and body keep acting once the head is full (reference f41–90) ----------
// mouth: gritted teeth that tremble → shouting bursts (a new mouth every 2 frames) → grit again
const ANGER_MOUTH: [number, "grit" | "shout"][] = [[22, "grit"], [16, "shout"], [14, "grit"], [10, "shout"], [18, "grit"]];
const SHOUT_SHAPES: Mouth[] = ["yell", "yell_o", "yell", "flat", "yell", "yell_o", "open", "yell"];
const ANGER_LOOK: [number, number][] = [[40, 0], [18, -0.55], [30, 0], [16, 0.45]];
const BLEND = 4; // frames to blend arms/brows from one phase into the next

type Acting = { armL: number; armR: number; elbowL: number; elbowR: number; browAnger: number; browDY: number };

// what the body does in a phase, `u` frames into it. Shout bursts alternate the raised fist (burst 0 → right).
const acting = (kind: "grit" | "shout" | "start", u: number, t: number, burst: number): Acting => {
  const j = (n: number) => (rand(Math.floor(t / 2) * 3 + n) - 0.5) * 0.08; // fist tremble, every 2 frames
  const tense = { arm: 0.42, elbow: 0.3 };
  if (kind === "shout") {
    const raise = 2.35 + 0.2 * Math.sin(u * 1.6); // fist up, shaking
    const right = burst % 2 === 0;
    return {
      armR: right ? raise : tense.arm + j(1),
      armL: right ? tense.arm + j(2) : raise,
      elbowR: right ? 0.38 : tense.elbow,
      elbowL: right ? tense.elbow : 0.38,
      browAnger: 1.18,
      browDY: 0.022 + 0.008 * Math.sin(u * 0.9), // brows press down on the shout
    };
  }
  // grit (and the start): tense arms, trembling fists; brows twitch every 14 frames
  const twitch = Math.max(0, 1 - Math.abs((u % 14) - 3) / 3);
  return {
    armL: tense.arm + j(4),
    armR: tense.arm + j(5),
    elbowL: tense.elbow,
    elbowR: tense.elbow,
    browAnger: 1 + 0.12 * twitch,
    browDY: 0.01 * twitch + (rand(Math.floor(t / 2) + 9) - 0.5) * 0.008,
  };
};

const mixActing = (a: Acting, b: Acting, k: number): Acting =>
  Object.fromEntries(Object.keys(a).map((key) => {
    const f = key as keyof Acting;
    return [f, a[f] + (b[f] - a[f]) * k];
  })) as Acting;

// prev (v4 3D face) = the pose of the effect before this one, at the frame of the switch
export const FX: Record<string, (t: number, prev?: Partial<Pose>) => Partial<Pose>> = {
  none: () => ({}),
  // angry face + body → purple fills the head (7 frames) → smoke from the temples + acting loop
  anger: (t) => {
    const fillT = t - ANGER.gritLead;
    const fullT = fillT - ANGER.fillFrames; // frames since the head is full
    const smokeT = fullT - ANGER.smokeDelay;
    let mouth: Mouth = "grit";
    let tilt = (rand(Math.floor(t / 2)) - 0.5) * 0.04; // small head tremble, a new position every 2 frames
    let lookX = 0;
    // from the relaxed pose into the tense pose over the first 6 frames
    const relaxed: Acting = { armL: 0.12, armR: 0.12, elbowL: 0.06, elbowR: 0.06, browAnger: 0.7, browDY: -0.01 };
    let act = mixActing(relaxed, acting("start", t, t, 0), smooth(t / 6));
    if (fullT >= 0) {
      const ph = loopAt(ANGER_MOUTH, fullT);
      const bursts = ANGER_MOUTH.filter(([, k]) => k === "shout").length;
      const burstOf = (i: number, loop: number) => loop * bursts + ANGER_MOUTH.slice(0, i).filter(([, k]) => k === "shout").length;
      act = acting(ph.v, ph.u, t, burstOf(ph.i, ph.loop));
      if (ph.u < BLEND && (ph.loop > 0 || ph.i > 0)) {
        // blend from where the previous phase ended
        const pi = (ph.i + ANGER_MOUTH.length - 1) % ANGER_MOUTH.length;
        const pl = ph.i === 0 ? ph.loop - 1 : ph.loop;
        const prev = acting(ANGER_MOUTH[pi][1], ANGER_MOUTH[pi][0] + ph.u, t, burstOf(pi, pl));
        act = mixActing(prev, act, smooth(ph.u / BLEND));
      }
      if (ph.v === "shout") {
        mouth = SHOUT_SHAPES[Math.floor(ph.u / 2) % SHOUT_SHAPES.length];
        tilt = 0.035 * Math.sin(ph.u * 0.9); // the head bobs with the shout
      }
      lookX = loopAt(ANGER_LOOK, fullT).v;
    }
    return {
      mouth,
      browRaise: -0.9,
      ...act,
      eyeSquint: 1,
      headTilt: tilt,
      lookX,
      lookY: 0,
      breathe: 0.5 + 0.5 * Math.sin(t * 0.55), // fast, heavy angry breathing
      angerFill: angerFillAt(fillT),
      angerT: t,
      angerSmoke: smokeT >= 0 ? smokeT : -1,
    };
  },
};

// ---------- sweat + heat (references/effects/heat-sweat.md) ----------
// "sweat": only the drop, on top of the actor's expression (shock, waking up, impact…)
FX.sweat = (t) => ({ sweat: t });

// "heat": the drop + tired, hot acting. Start (8 frames) → loop: fan (cloth up beside the head) →
// wipe (the cloth dabs the temple and wipes the drop off) → slump (arm down, big exhale, long blink,
// panting; a new drop pops in). Arm fields are for the cloth arm (the free hand, see draw.ts).
const HEAT_START = 8;
const HEAT: [number, "fan" | "wipe" | "slump"][] = [[36, "fan"], [20, "wipe"], [34, "slump"]];
const WIPE_OFF = 5; // wipe frame when the cloth reaches the drop
const NEW_DROP = 14; // slump frame when a new drop appears
const FIRST_DROP = 3;
const FLICK = 1.6; // fanning speed (radians per frame): one back-and-forth every ~4 frames

type Heat = { clothArm: number; clothElbow: number; clothTilt: number; armL: number; armR: number; elbowL: number; elbowR: number;
  eyeTired: number; lookY: number; clothSwing: number; clothReach: number; clothRot: number; clothAir: number };
const STILL = { clothReach: 1, clothRot: 0, clothAir: 0 }; // cloth hangs from a straight arm

const heatAct = (kind: "fan" | "wipe" | "slump", u: number, t: number): Heat => {
  const limp = { armL: 0.05 + 0.02 * Math.sin(t * 0.09), armR: 0.05 + 0.02 * Math.sin(t * 0.09 + 1), elbowL: 0.03, elbowR: 0.03 };
  if (kind === "fan") {
    // fanning the face (test 2: the old fan, hand up beside the head, read as waving hello): the hand in front
    // of the chin with a bent elbow, the cloth pointing at the face and flicking fast (a stroke every ~2 frames),
    // air lines on the fast part of each stroke; the face enjoys the air (eyes closing, face up, "aah")
    const p = u * FLICK;
    return { ...limp, clothArm: 2.42 + 0.05 * Math.sin(p), clothElbow: 0.06, clothReach: 0.47, clothRot: 2.27 + 0.38 * Math.sin(p),
      clothTilt: 0.05, eyeTired: 0.86, lookY: -0.35, clothSwing: 0, clothAir: Math.abs(Math.cos(p)) > 0.55 ? 1 : 0 };
  }
  if (kind === "wipe") {
    const w = Math.sin(u * 0.75); // two strokes across the temple; the head leans into the hand so the short arm reaches the drop
    return { ...limp, ...STILL, clothArm: 2.67 + 0.1 * w, clothElbow: 0.28, clothTilt: 0.22 + 0.03 * w, eyeTired: 0.8, lookY: 0,
      clothSwing: -0.04 * Math.cos(u * 0.75) };
  }
  // slump: a long slow blink (eyes closed around frames 8–14), then heavy half-closed eyes
  const blink = Math.max(0, Math.min(1, (u - 5) / 3, (17 - u) / 3));
  return { ...limp, ...STILL, clothArm: 0.16, clothElbow: 0.05, clothTilt: 0, eyeTired: 0.62 + 0.38 * blink, lookY: 0.35, clothSwing: 0 };
};

const mixHeat = (a: Heat, b: Heat, k: number): Heat =>
  Object.fromEntries(Object.keys(a).map((key) => {
    const f = key as keyof Heat;
    return [f, a[f] + (b[f] - a[f]) * k];
  })) as Heat;

FX.heat = (t) => {
  const relaxed: Heat = { clothArm: 0.12, clothElbow: 0.06, clothTilt: 0, armL: 0.12, armR: 0.12, elbowL: 0.06, elbowR: 0.06,
    eyeTired: 0, lookY: 0, clothSwing: 0, ...STILL };
  let act: Heat;
  let mouth: Mouth = "wavy";
  let front = 0;
  let sweat = t - FIRST_DROP;
  let breathe = 0.5 + 0.5 * Math.sin(t * 0.25);
  let droop = 0;
  if (t < HEAT_START) {
    act = mixHeat(relaxed, heatAct("fan", 0, t), smooth(t / HEAT_START));
    front = 1; // the hand rises in front of the body to the chin
  } else {
    const lt = t - HEAT_START;
    const ph = loopAt(HEAT, lt);
    act = heatAct(ph.v, ph.u, t);
    if (ph.u < BLEND) {
      const pi = (ph.i + HEAT.length - 1) % HEAT.length;
      const from = ph.loop === 0 && ph.i === 0 ? null : heatAct(HEAT[pi][1], HEAT[pi][0] + ph.u, t);
      if (from) act = mixHeat(from, act, smooth(ph.u / BLEND));
    }
    const slumpLen = HEAT[2][0];
    const fanAge = ph.loop === 0 ? HEAT_START + ph.u - FIRST_DROP : slumpLen - NEW_DROP + ph.u;
    if (ph.v === "fan") {
      sweat = fanAge;
      front = 1;
      mouth = ph.u < 3 ? "wavy" : "open"; // "aah" in the air
    }
    if (ph.v === "wipe") {
      front = 1;
      sweat = ph.u < WIPE_OFF ? (ph.loop === 0 ? HEAT_START + HEAT[0][0] - FIRST_DROP : slumpLen - NEW_DROP + HEAT[0][0]) + ph.u : -1;
    }
    if (ph.v === "slump") {
      front = ph.u < BLEND + 1 ? 1 : 0; // the arm leaves the face before it goes behind the head again
      sweat = ph.u - NEW_DROP;
      mouth = ph.u < 5 || Math.floor((ph.u - 5) / 5) % 2 === 0 ? "pant" : "wavy";
      breathe = ph.u < 10 ? 1 - smooth(ph.u / 10) : 0.5 + 0.5 * Math.sin(t * 0.6); // big exhale, then panting
      droop = 0.05 * smooth(ph.u / 8) * (1 - smooth((ph.u - 26) / 8));
    }
  }
  return {
    ...act,
    mouth,
    browRaise: 0.25,
    headTilt: 0.035 * Math.sin(t * 0.07) - droop, // slow woozy sway; the head droops on the exhale
    lookX: 0,
    breathe,
    cloth: 1,
    clothFront: front,
    clothT: t,
    sweat,
  };
};

// ---------- 3D face (references/effects/face-stretch.md) ----------
// Every expression = a quick turn of the face on the round head (4 frames, small overshoot) + new eye/mouth
// shapes on the same frame + a face-and-body acting loop. "<name>" turns to screen right, "<name>_l" mirrors it.
// prev = the pose of the effect before (at the switch), so a chain of expressions turns on from where it was.
const backOut = (x: number) => {
  const k = Math.min(1, Math.max(0, x));
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2);
};
type Turn = { yaw: number; pitch: number; tilt: number };
type Move = [at: number, to: Turn, frames: number];
// the face turn at frame t: each move starts from where the face is and eases to its target with an overshoot
const turnAt = (t: number, from: Turn, moves: Move[]): Turn => {
  let cur = from;
  for (const [at, to, d] of moves) {
    if (t < at) break;
    const k = backOut((t - at) / d);
    cur = { yaw: cur.yaw + (to.yaw - cur.yaw) * k, pitch: cur.pitch + (to.pitch - cur.pitch) * k, tilt: cur.tilt + (to.tilt - cur.tilt) * k };
  }
  return cur;
};
type Body = { armL: number; armR: number; elbowL: number; elbowR: number };
const REST: Body = { armL: 0.12, armR: 0.12, elbowL: 0.06, elbowR: 0.06 };
const bodyOf = (p?: Partial<Pose>): Body =>
  ({ armL: p?.armL ?? REST.armL, armR: p?.armR ?? REST.armR, elbowL: p?.elbowL ?? REST.elbowL, elbowR: p?.elbowR ?? REST.elbowR });
const mixBody = (a: Body, b: Body, k: number): Body =>
  ({ armL: a.armL + (b.armL - a.armL) * k, armR: a.armR + (b.armR - a.armR) * k, elbowL: a.elbowL + (b.elbowL - a.elbowL) * k, elbowR: a.elbowR + (b.elbowR - a.elbowR) * k });
const turnOf = (p?: Partial<Pose>): Turn => ({ yaw: p?.faceYaw ?? 0, pitch: p?.facePitch ?? 0, tilt: p?.headTilt ?? 0 });
// a hand that was up (think) comes down over 6 frames instead of jumping
const releaseHand = (t: number, prev?: Partial<Pose>): Partial<Pose> => {
  if (!prev?.hand || t >= 6) return {};
  const k = smooth(t / 6);
  if (prev.handFold !== undefined) return { hand: 1, handFold: prev.handFold * (1 - k), handTap: 0, handFront: 1 };
  return {
    hand: 1,
    handArm: (prev.handArm ?? 0.12) + (0.12 - (prev.handArm ?? 0.12)) * k,
    handElbow: (prev.handElbow ?? 0.06) + (0.06 - (prev.handElbow ?? 0.06)) * k,
    handReach: (prev.handReach ?? 1) + (1 - (prev.handReach ?? 1)) * k,
    handFront: t < 4 ? 1 : 0,
  };
};
// a blink of `len` frames every `every` frames from `from` (reference: blinks last 1–2 frames)
const blinkLine = (t: number, every: number, from: number, len = 2) => t >= from && (t - from) % every < len;
// the pupils jump to a new place every `every` frames (reference 04 f46–60: every 3–4 frames)
const GLANCES: [number, number][] = [[0, 0], [-0.6, -0.3], [0.5, -0.2], [0.6, 0.2], [-0.4, 0.15], [0.1, -0.45]];
const glance = (t: number, every: number, seed: number, amp = 1) => {
  const n = Math.floor(t / every);
  const [x, y] = GLANCES[Math.floor(rand(n * 7 + seed) * GLANCES.length)];
  return { lookX: x * amp, lookY: y * amp };
};

// Timing measured frame by frame in the reference (references/effects/face-stretch.md §8): anticipation 2–3 frames,
// the change itself 1–2, blinks 1–2, a main expression held 10–30 frames, small eye moves every 3–6 frames.
export const FACE_FX = {
  // 03a f49–69: "o" mouth 3 frames → lines 2 → pop (ring eyes + drop) held 10 → blink 2 → eyes pop open again
  shock: { squeeze: 3, pop: 5, reopen: 17, twitch: 0.13, twitchTilt: 0.07, blinkEvery: 20, look: 6 },
  // 04 f42–46: the smile starts (1 frame) → lines (2) → pop on frame 3; the laugh opens and closes every 3 frames
  laugh: { lead: 3, bounce: 6, breathEvery: 36, breathLen: 5 },
  shy: { turn: 3, firstPeek: 10, peekEvery: 20, peekLen: 5, look: 5 },
  think: { turn: 4, settle: 1, rise: 4, look: 5, mouth: 8 }, // the fist is under the chin 5 frames after the start
  happy: { look: 4, blinkFrom: 12, blinkEvery: 24 },
};

// shock (test 2: the face stays to the camera, the head twitches). Order from the reference (03a f49–70,
// 03c f78–90): "o" mouth first → eyes squeeze to lines → POP: ring eyes (dot eyes for glasses, draw.ts) + sweat drop
// + the head jerks back and tilts (2 frames), settles with an overshoot → held ~10 frames → a 2-frame blink → the
// eyes pop open again with a smaller twitch → fast breathing, trembling arms, the pupils shift every 6 frames
const shock = (side: 1 | -1) => (t: number, prev?: Partial<Pose>): Partial<Pose> => {
  const F = FACE_FX.shock;
  const front: Turn = { yaw: 0, pitch: 0, tilt: 0 };
  const twitch = (amp: number): Turn => ({ yaw: 0, pitch: -F.twitch * amp, tilt: -F.twitchTilt * amp * side });
  const tr = turnAt(t, turnOf(prev), [
    [0, front, 3],
    [F.squeeze, { yaw: 0, pitch: 0.05, tilt: 0 }, 2], // a small dip while the eyes squeeze
    [F.pop, twitch(1), 2], // the twitch
    [F.pop + 2, front, 5],
    [F.reopen, twitch(0.5), 2], // a smaller twitch when the eyes pop open again after the blink
    [F.reopen + 2, front, 4],
  ]);
  const inhale: Body = { armL: 0.08, armR: 0.08, elbowL: 0.1, elbowR: 0.1 };
  const out: Body = { armL: 0.5, armR: 0.5, elbowL: -0.2, elbowR: -0.2 };
  const settle: Body = { armL: 0.38, armR: 0.38, elbowL: -0.12, elbowR: -0.12 };
  const j = (n: number) => (t >= F.pop ? (rand(Math.floor(t / 2) * 5 + n) - 0.5) * 0.05 : 0); // small tremble
  let body =
    t < F.pop ? mixBody(bodyOf(prev), inhale, smooth(t / F.pop))
    : t < F.pop + 3 ? mixBody(inhale, out, backOut((t - F.pop) / 3))
    : mixBody(out, settle, smooth((t - F.pop - 3) / 10));
  body = { ...body, armL: body.armL + j(1), armR: body.armR + j(2) };
  const eyes: Pose["eyeShape"] =
    t < F.squeeze ? undefined // the mouth opens first, the eyes are still normal
    : t < F.pop ? "line"
    : t >= F.reopen - 2 && t < F.reopen ? "line" // blink
    : blinkLine(t, F.blinkEvery, F.reopen + F.blinkEvery)
      ? "line"
      : "ring";
  const look = t >= F.reopen + 3 ? glance(t - F.reopen - 3, F.look, 3, 0.45) : { lookX: 0, lookY: 0 };
  return {
    ...body,
    ...releaseHand(t, prev),
    faceYaw: tr.yaw,
    facePitch: tr.pitch,
    headTilt: tr.tilt,
    eyeShape: eyes,
    mouth: "open",
    browRaise: t < F.squeeze ? 0.5 : t < F.pop ? 0.2 : 1,
    ...look,
    breathe: t < F.pop ? smooth(t / F.pop) : 0.5 + 0.5 * Math.sin(t * 0.7),
    sweat: t - F.pop,
  };
};

// laugh: the smile starts (1 frame) → the eyes squint to lines, the face dips, shoulders up (2 frames) → pop on
// frame 3 (face turns up and to the side, ^ ^ eyes, open laugh) → "ha-ha-ha": the mouth opens and closes and the
// face bounces every 3 frames; a short breath (smaller smile) now and then
const laugh = (side: 1 | -1) => (t: number, prev?: Partial<Pose>): Partial<Pose> => {
  const F = FACE_FX.laugh;
  const half = F.bounce / 2;
  const up: Turn = { yaw: 0.3 * side, pitch: -0.2, tilt: 0.1 * side };
  const low: Turn = { yaw: 0.25 * side, pitch: -0.13, tilt: 0.07 * side };
  const moves: Move[] = [[1, { yaw: 0.05 * side, pitch: 0.14, tilt: -0.03 * side }, 2], [F.lead, up, 3]];
  let mouth: Mouth = "smirk";
  let eyeShape: Pose["eyeShape"] = t < 1 ? undefined : "line"; // the smile starts while the eyes are still normal
  let body: Body = mixBody(bodyOf(prev), { armL: 0.04, armR: 0.04, elbowL: 0.12, elbowR: 0.12 }, smooth(t / F.lead)); // shoulders up
  let breathe = smooth(t / F.lead); // a quick intake before the laugh
  if (t >= F.lead) {
    const lt = t - F.lead;
    const inBreath = lt >= F.breathEvery && lt % F.breathEvery < F.breathLen;
    const open = Math.floor(lt / half) % 2 === 0; // "ha" (open) / "-" (smaller) every 3 frames
    eyeShape = "happy";
    mouth = inBreath || !open ? "openSmile" : "laugh";
    if (lt >= half) {
      const n = Math.floor(lt / half);
      moves.push([F.lead + n * half, inBreath ? { yaw: 0.27 * side, pitch: -0.15, tilt: 0.08 * side } : n % 2 ? low : up, 2]);
    }
    const b = Math.sin(lt * ((2 * Math.PI) / F.bounce));
    const loose: Body = { armL: 0.26 + 0.07 * b, armR: 0.26 - 0.07 * b, elbowL: 0.16, elbowR: 0.16 };
    body = lt < 3 ? mixBody(body, loose, smooth(lt / 3)) : inBreath ? { armL: 0.24, armR: 0.24, elbowL: 0.14, elbowR: 0.14 } : loose;
    breathe = inBreath ? 1 : 0.5 + 0.5 * b; // the chest shakes with each "ha"
  }
  const tr = turnAt(t, turnOf(prev), moves);
  return { ...body, ...releaseHand(t, prev), faceYaw: tr.yaw, facePitch: tr.pitch, headTilt: tr.tilt, eyeShape, mouth,
    browRaise: t < F.lead ? -0.3 : 0.8, lookX: 0, lookY: 0, breathe };
};

// shy: the face turns down and away (3 frames), eyes down and shifting nervously, small smile, hands together in
// front, a small sway; the eyes peek up at the camera for 5 frames every 20 frames
const shy = (side: 1 | -1) => (t: number, prev?: Partial<Pose>): Partial<Pose> => {
  const F = FACE_FX.shy;
  const peek = t >= F.firstPeek && (t - F.firstPeek) % F.peekEvery < F.peekLen;
  const down: Turn = { yaw: 0.3 * side, pitch: 0.33, tilt: -0.08 * side };
  const moves: Move[] = [[0, down, F.turn]];
  if (t >= F.firstPeek) {
    const at = F.firstPeek + Math.floor((t - F.firstPeek) / F.peekEvery) * F.peekEvery;
    moves.push([at, { yaw: 0.22 * side, pitch: 0.22, tilt: -0.06 * side }, 2], [at + F.peekLen, down, 3]);
  }
  const tr = turnAt(t, turnOf(prev), moves);
  const hands: Body = { armL: -0.45, armR: -0.45, elbowL: 0.12, elbowR: 0.12 };
  const nervous = Math.floor(t / F.look) % 2 ? 0.3 : -0.3; // the eyes shift left/right
  return {
    ...mixBody(bodyOf(prev), hands, smooth(t / 4)),
    ...releaseHand(t, prev),
    faceYaw: tr.yaw,
    facePitch: tr.pitch,
    headTilt: tr.tilt + 0.03 * Math.sin(t * 0.2),
    eyeShape: peek ? undefined : "down",
    mouth: "smile",
    browRaise: 0.4,
    lookX: peek ? -0.5 * side : nervous,
    lookY: peek ? -0.7 : 0.6,
    breathe: 0.5 + 0.5 * Math.sin(t * 0.25),
  };
};

// think: the face turns up to the side (4 frames), the free hand folds up to the chin (under it on frame 5) and
// taps it; the eyes dart between up-left and up-right every 5 frames, "hmm" mouth (wavy/flat) every 8 frames
const think = (side: 1 | -1) => (t: number, prev?: Partial<Pose>): Partial<Pose> => {
  const F = FACE_FX.think;
  const tr = turnAt(t, turnOf(prev), [[0, { yaw: 0.45 * side, pitch: -0.12, tilt: 0.06 * side }, F.turn]]);
  const fold = smooth((t - F.settle) / F.rise);
  const tap = t > F.settle + F.rise ? Math.max(0, Math.sin(t * 0.63)) : 0; // a tap every ~10 frames
  const dart = Math.floor(t / F.look) % 2 ? 0.75 : 0.25;
  return {
    ...mixBody(bodyOf(prev), REST, smooth(t / Math.max(1, F.settle))),
    faceYaw: tr.yaw,
    facePitch: tr.pitch,
    headTilt: tr.tilt + 0.025 * Math.sin(t * 0.15),
    mouth: Math.floor(t / F.mouth) % 2 ? "flat" : "wavy",
    browRaise: -0.2,
    lookX: dart * side,
    lookY: -0.8,
    // the free arm follows the body until it starts to fold
    ...(t >= F.settle ? { hand: 1, handFold: fold, handTap: tap, handFront: 1 } : {}),
    breathe: 0.5 + 0.5 * Math.sin(t * 0.2),
  };
};

// happy: a small pop back to the camera (1 + 3 frames), shiny dot eyes that look around every 4 frames (like 04
// f46–60), open smile, arms open a little, a bounce, a 2-frame blink every 24 frames
const happy = (side: 1 | -1) => (t: number, prev?: Partial<Pose>): Partial<Pose> => {
  const F = FACE_FX.happy;
  const tr = turnAt(t, turnOf(prev), [[0, { yaw: 0, pitch: 0.06, tilt: 0 }, 1], [1, { yaw: 0, pitch: 0, tilt: 0.04 * side }, 3]]);
  const b = Math.sin(t * 0.4);
  return {
    ...mixBody(bodyOf(prev), { armL: 0.35 + 0.03 * b, armR: 0.35 + 0.03 * b, elbowL: 0.1, elbowR: 0.1 }, smooth(t / 3)),
    ...releaseHand(t, prev),
    faceYaw: tr.yaw,
    facePitch: tr.pitch + 0.02 * b,
    headTilt: tr.tilt + 0.03 * Math.sin(t * 0.15),
    eyeShape: blinkLine(t, F.blinkEvery, F.blinkFrom) ? "line" : "bigDot",
    mouth: "openSmile",
    browRaise: 0.5,
    ...(t >= 4 ? glance(t - 4, F.look, 11, 0.6) : { lookX: 0, lookY: 0 }),
    breathe: 0.5 + 0.5 * b,
  };
};

for (const [name, fx] of Object.entries({ shock, laugh, shy, think, happy })) {
  FX[name] = fx(1);
  FX[`${name}_l`] = fx(-1);
}

// ---------- jump combo (references/effects/jump.md): items 11 (hop) + 9 (big wake-up jump) ----------
// The JUMP is only the body, on its own step channel: "steps": {"jump": [["w:5", "big"]]}. The FACE is free: any
// expression or face effect on the "fx" / "expr" channels (the user's rule, test 2: the big jump is not tied to one
// face). `scared` below = the face of reference 9; start it on the same frame as "big" to get the terrified jump.
// Frame tables measured in the references (30 fps). t = 0 is the first anticipation frame.
// Shared style: short anticipation → the take-off snaps (≈ half the height in frame 1) → rise slows, apex 2 frames,
// fall speeds up → the landing stops in 1 frame, no bounce → a held pose. Only the body stretches, never the head.
export const JUMP = {
  hop: {
    knee: [0.25, 0.6, 1, 1], // crouch (11 f53–56): legs 9 % shorter
    air: [0.29, 0.61, 0.84, 0.91, 1, 0.9, 0.67, 0.36], // feet height per frame (11 f57–64); touch-down on the next frame
    height: 0.42, // head widths (11: feet 0.43 head heights up)
    landKnee: [0.5, 0.75, 0.75, 0.75], // touch-down + squash held (11 f65–68)
    settle: 7, // the knees straighten (11 f69–75)
  },
  big: {
    knee: [0.3, 0.35], // 9 f90–91 (he sits in the reference; standing = a small crouch)
    air: [0.4, 0.8, 1, 0.99, 0.79, 0.42], // head height per frame (9 f92–97); lands on the next frame (f98)
    height: 1.35, // head widths (9: 1.4 head heights above standing)
    stretch: [1.08, 1.12, 1.15, 1.15, 1.15, 1.05], // 9: the body narrows to 0.88× at the apex (f94–96)
    // landed: the arms pop out a little (stiff) and settle in 4 frames, then hold still. Item 9 throws them wide open
    // with a tremble: in our test that read as a strange side-to-side arm movement (user, test 1)
    landArms: { pop: 0.75, hold: 0.5, settle: 4, elbow: -0.08 },
  },
  // the scared face of reference 9 (fx "scared"): eyes squeezed shut through the take-off, then ring eyes + gritted
  // teeth + sweat drop; one blink later on
  scared: { squeeze: 3, blinkAt: 16 },
};

type Arms = { armL: number; armR: number; elbowL: number; elbowR: number };
const mixArms = (a: Arms, b: Arms, k: number): Arms => ({
  armL: a.armL + (b.armL - a.armL) * k,
  armR: a.armR + (b.armR - a.armR) * k,
  elbowL: a.elbowL + (b.elbowL - a.elbowL) * k,
  elbowR: a.elbowR + (b.elbowR - a.elbowR) * k,
});
const easeOut2 = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 2);
// landing dust (approved by the user in test 1; the camera shake was tested too and dropped: the v3 "No shake" stays)
const dustAt = (land: number, dust: boolean): Partial<Pose> => (land >= 0 && dust ? { dust: land } : {});

// small hop (item 11): crouch 4 → air 8 → touch-down + squash 4 → knees straighten 7. Arms: a little back on the
// crouch, one hand up in the air (11 f57–64), out for balance on the landing, then rest
const hop = (dust: boolean) => (t: number): Partial<Pose> => {
  const H = JUMP.hop;
  const up = t - H.knee.length; // frames since the take-off
  const land = up - H.air.length; // frames since the touch-down
  let knee = 0;
  let lift = 0;
  let toes = 0;
  if (up < 0) knee = H.knee[t];
  else if (land < 0) {
    lift = H.air[up] * H.height;
    toes = up === 0 ? 0.6 : land === -1 ? 0.5 : 1;
  } else if (land < H.landKnee.length) knee = H.landKnee[land];
  else knee = H.landKnee[H.landKnee.length - 1] * (1 - easeOut2((land - H.landKnee.length + 1) / H.settle));
  const rest = { armL: 0.12, armR: 0.12, elbowL: 0.06, elbowR: 0.06 };
  const back = { armL: 0.4, armR: 0.4, elbowL: -0.1, elbowR: -0.1 };
  const air = { armL: 2.3, armR: 0.55, elbowL: 0.3, elbowR: 0.1 }; // hand up beside the head (not behind it)
  const landA = { armL: 1.5, armR: 0.6, elbowL: 0.1, elbowR: 0.05 };
  const arms =
    up < 0 ? mixArms(rest, back, smooth((t + 1) / H.knee.length))
    : land < 0 ? mixArms(back, air, up === 0 ? 0.7 : 1)
    : land < 2 ? mixArms(air, landA, (land + 1) / 2)
    : mixArms(landA, rest, smooth((land - 2) / (H.settle + 3)));
  return { ...arms, knee, toes, lift, ...dustAt(land, dust) };
};

// big jump (item 9): crouch 2 → take-off + stretch → air 6 → lands with the arms a little out → hold
const bigJump = (dust: boolean) => (t: number): Partial<Pose> => {
  const B = JUMP.big;
  const up = t - B.knee.length;
  const land = up - B.air.length;
  if (up < 0) return { knee: B.knee[t], armL: 0.2, armR: 0.2, elbowL: 0, elbowR: 0 };
  if (land < 0) {
    const out = land >= -1 ? 0.95 : up >= 2 ? 0.22 : 0; // arms: down along the body → a little out at the apex → swing out
    const elbow = land >= -1 ? -0.2 : 0;
    return {
      lift: B.air[up] * B.height,
      stretch: B.stretch[up],
      toes: up === 0 ? 0.5 : 1,
      armL: -0.05 + out,
      armR: -0.05 + out,
      elbowL: elbow,
      elbowR: elbow,
    };
  }
  const A = B.landArms;
  const a = A.pop + (A.hold - A.pop) * smooth(land / A.settle);
  return { armL: a, armR: a, elbowL: A.elbow, elbowR: A.elbow, ...dustAt(land, dust) };
};

// step channel "jump": body only. hop / big = with the landing dust; _nodust = a quiet landing; none = standing
export const JUMPS: Record<string, (t: number) => Partial<Pose>> = { none: () => ({}) };
for (const [suffix, dust] of [["", true], ["_nodust", false]] as [string, boolean][]) {
  JUMPS[`hop${suffix}`] = hop(dust);
  JUMPS[`big${suffix}`] = bigJump(dust);
}

// face fx "scared" (reference 9): put it on the fx channel on the same frame as the jump for the terrified jump
FX.scared = (t: number): Partial<Pose> => {
  const S = JUMP.scared;
  const eyes: Pose["eyeShape"] = t < S.squeeze || (t >= S.blinkAt && t < S.blinkAt + 2) ? "line" : "ring";
  return {
    faceYaw: 0,
    facePitch: 0,
    headTilt: 0,
    eyeShape: eyes,
    mouth: t < 2 ? "wavy" : "grit",
    browRaise: t < 2 ? -0.3 : 1,
    lookX: 0,
    lookY: 0,
    sweat: t,
  };
};

// v4 walk (references/effects/walk.md, VFX item 12). Step channel "walk": body only, the face stays free.
// One step = WALK.step frames. Each step: the front foot lands (u = 0, body at the top) → the body dips fast
// (3 frames) → pushes up slower (6 frames) while the back foot swings forward (lifts, knee forward, lands in front).
// The standing foot slides from front to back under the body (the scissor). Screen-left foot swings first.
// subtle = the head travels 0.04 head widths (12b mom: ≈0.03); bouncy = 0.15 (12e cops / lantern walk: ≈0.2):
// a deeper dip + a small hop at the top (both feet leave the ground for a moment).
// _sway: the body shifts and leans over the standing leg (12c, seen from behind: ±0.04 head widths).
// First step starts from standing (feet together). Stop with a "stop" step on a step boundary (walk start + n × step):
// one last, smaller step that brings the feet together; after it the actor stands.
export const WALK = {
  step: 10, // frames (12b: a dip every 9–10 frames; 12e: 9; 12c: 6–7)
  down: 0.3, // part of the step where the body drops (3 frames)
  up: 0.6, // then it rises (6 frames), 1 frame at the top
  footFrom: 0.2, // the back foot leaves the ground here and swings to the front until the next landing
  // fast walk (12e, the front cop hurrying out: a step every ~8 frames, the dip snaps down in 2 frames, up over ~5)
  fast: { step: 8, down: 0.25, up: 0.625, footFrom: 0.15 },
  // rush = a really fast walk (user, 2026-11-11: "more bounces per second"): 5 steps/s
  rush: { step: 6, down: 0.25, up: 0.625, footFrom: 0.15 },
  subtle: { drop: 0.04, hop: 0 },
  bouncy: { drop: 0.1, hop: 0.05 },
  hopFrom: 0.5,
  hopTo: 0.95,
  sway: { x: 0.04, lean: 0.035 },
  stop: 0.5, // the stop step: dip and foot lift × this
};
type WalkStyle = "subtle" | "bouncy";
type WalkTiming = { step: number; down: number; up: number; footFrom: number };
const timing = (name: string): WalkTiming => (name.endsWith("_fast") ? WALK.fast : name.endsWith("_rush") ? WALK.rush : WALK);
// frames per step of a walk name (subtle, bouncy_sway_fast…)
export const walkStepFrames = (name: string) => timing(name).step;
// step n of a walk, at u = 0..1 of the step. first: the feet start together; last: they end together (the stop step)
const walkStep = (style: WalkStyle, sway: boolean, T: WalkTiming, n: number, u: number, first: boolean, last: boolean): Partial<Pose> => {
  const W = WALK;
  const S = W[style];
  const k = last ? W.stop : 1;
  const dip = u < T.down ? smooth(u / T.down) : 1 - smooth(Math.min(1, (u - T.down) / T.up));
  const swing = n % 2 === 0 ? -1 : 1;
  const [from, to] = [first ? 0 : -1, last ? 0 : 1];
  const swingStride = u < T.footFrom ? from : from + (to - from) * smooth((u - T.footFrom) / (1 - T.footFrom));
  const standStride = (first ? 0 : 1) + ((last ? 0 : -1) - (first ? 0 : 1)) * u;
  const foot = k * (u >= T.footFrom ? Math.sin((Math.PI * (u - T.footFrom)) / (1 - T.footFrom)) : 0);
  const lift = !last && S.hop && u >= W.hopFrom && u <= W.hopTo ? S.hop * Math.sin((Math.PI * (u - W.hopFrom)) / (W.hopTo - W.hopFrom)) : 0;
  const L = swing === -1;
  const p: Partial<Pose> = {
    walkDrop: S.drop * k * dip,
    footL: L ? foot : 0,
    footR: L ? 0 : foot,
    strideL: L ? swingStride : standStride,
    strideR: L ? standStride : swingStride,
    lift,
  };
  if (sway) {
    const s = -swing * Math.sin(Math.PI * u); // over the standing leg
    p.sway = W.sway.x * s;
    p.lean = W.sway.lean * s;
  }
  return p;
};
const walk = (style: WalkStyle, sway: boolean, T: WalkTiming) => (t: number): Partial<Pose> => {
  const n = Math.floor(t / T.step);
  return walkStep(style, sway, T, n, (t - n * T.step) / T.step, n === 0, false);
};
// names: subtle | bouncy, + _sway, + _fast | _rush (e.g. subtle_sway, bouncy_sway_rush)
export const WALKS: Record<string, (t: number) => Partial<Pose>> = { none: () => ({}) };
for (const style of ["subtle", "bouncy"] as WalkStyle[])
  for (const sway of [false, true])
    for (const [pace, T] of [["", WALK], ["_fast", WALK.fast], ["_rush", WALK.rush]] as [string, WalkTiming][])
      WALKS[style + (sway ? "_sway" : "") + pace] = walk(style, sway, T);
// the "stop" step: `prev` = the walk before it, `steps` = how many steps that walk made (→ which foot swings now)
export const walkStop = (prev: string, steps: number, t: number): Partial<Pose> => {
  const T = timing(prev);
  if (t >= T.step || !WALKS[prev] || prev === "none") return {};
  const style = prev.startsWith("bouncy") ? "bouncy" : "subtle";
  return walkStep(style, prev.includes("_sway"), T, steps, t / T.step, steps === 0, true);
};
