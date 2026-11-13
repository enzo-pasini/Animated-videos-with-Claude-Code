// Camera moves that are never still (RULEBOOK §5): slow push-in (~10 %/s on the subject),
// slow drift, small roll; optional fast push-in at the start of a shot.
import * as THREE from "three";
import type { Cam } from "../three/Rig";
import { FPS } from "./script";

export type V3 = [number, number, number];

export type Move = {
  target: V3; // what the camera looks at (the subject)
  dir: V3; // direction from target to camera (normalized inside)
  d0: number; // start distance (m)
  fov: number;
  rate?: number; // push-in speed: subject scale grows (1+rate) per second. Negative = pull-out.
  // fast push-in (seconds, total scale factor); "at" = seconds into the shot (default 0 = the start;
  // v4 item 5: a mid-shot punch-in with the edge lines)
  fast?: { dur: number; factor: number; at?: number };
  fovStart?: number; // if set, the fast push-in is a lens zoom fovStart → fov (camera stays in the street)
  drift?: V3; // m/s, applied to camera and target
  roll?: [number, number]; // degrees, start → end of shot
  lenS?: number; // shot length in seconds (for roll interpolation)
};

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

export const subjectScale = (m: Move, t: number) => {
  const base = Math.pow(1 + (m.rate ?? 0.1), t);
  if (!m.fast || m.fovStart) return base;
  const k = Math.min(1, Math.max(0, (t - (m.fast.at ?? 0)) / m.fast.dur));
  return base * (1 + (m.fast.factor - 1) * easeOut(k));
};

export const camAt = (m: Move, frame: number): Cam => {
  const t = frame / FPS;
  const s = subjectScale(m, t);
  const d = m.d0 / s;
  const dir = new THREE.Vector3(...m.dir).normalize();
  const drift = new THREE.Vector3(...(m.drift ?? [0, 0, 0])).multiplyScalar(t);
  const target = new THREE.Vector3(...m.target).add(drift);
  const pos = target.clone().addScaledVector(dir, d);
  const r = m.roll ?? [0, 0];
  const u = m.lenS ? Math.min(1, t / m.lenS) : 0;
  const fov =
    m.fast && m.fovStart ? m.fov + (m.fovStart - m.fov) * (1 - easeOut(Math.min(1, t / m.fast.dur))) : m.fov;
  return { pos: pos.toArray() as V3, target: target.toArray() as V3, fov, roll: r[0] + (r[1] - r[0]) * u };
};
