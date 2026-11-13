// Theme kit "old house" (bedroom, basement): our own low-poly pieces, built by our code (no pack, no credit).
// Made for videos/2026-11-12-furnace-ghosts (sets lena_bedroom, old_basement); reusable in any home.
// Same look as interior.tsx: painted wood, 2+ tones, ink lines (OMesh / OBox), shadows on.
// Placement: `position` = the piece's feet center on the floor, `rotY` turns it; fronts look to +z.
// No two faces on one plane: every stacked or touching face is offset ≥ 2 cm (blanket over mattress, door on the
// furnace body, steps on the stringers).
import { useMemo } from "react";
import * as THREE from "three";
import { OBox, OMesh } from "../../three/Outlined";
import { cobwebTex, darknessTex, lightSpillTex, spiderWebTex, woodTex } from "../../three/textures";
import { WARM_COLOR } from "../lights/colors";
import { Glow } from "./Glow";

type V3 = [number, number, number];

// ---------------------------------------------------------------------------------------------------------------
// Bed: wooden frame with a headboard (at -z), mattress, a 2-tone blanket folded back at the top, a pillow.
// `w` 0.95 = single bed, 1.45 = double. Mattress top at 0.5 m; the blanket top at ~0.56 m.
// A character "sitting up in bed" = an actor placed at `bedSitAt` + `sitter` on the bed: the card's hips sit on the
// mattress, and a soft blanket mound over the lap + the legs' ridge under the blanket cover the card's lower part.
// Why: a card cut by the flat blanket top shows a straight line through the body ("she passes through the bed",
// user at S2 2026-11-13). Rule: a card must never be cut by a flat surface; a soft shape covers the cut.
export const BED_SIT = { headGap: 0.55, mound: { rx: 0.36, ry: 0.19, rz: 0.27, y: 0.5 } };
export const Bed: React.FC<{
  position: V3;
  rotY?: number;
  w?: number;
  len?: number;
  blanket?: string;
  blanketFold?: string;
  frame?: string;
  sitter?: boolean; // someone sits up in the bed (at bedSitAt): lap mound + legs under the blanket
}> = ({ position, rotY = 0, w = 0.95, len = 2.0, blanket = "#5f7fa8", blanketFold = "#e6ddcf", frame = "#8e5a40", sitter = false }) => {
  const mound = useMemo(() => new THREE.SphereGeometry(1, 9, 4, 0, Math.PI * 2, 0, Math.PI / 2), []);
  const legs = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 6, 1), []);
  const pillow = useMemo(() => {
    const g = new THREE.BoxGeometry(w - 0.3, 0.14, 0.38, 2, 1, 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      // puff the middle up a little (faceted, low-poly)
      if (Math.abs(p.getX(i)) < 0.01 && p.getY(i) > 0) p.setY(i, p.getY(i) + 0.03);
    }
    g.computeVertexNormals();
    return g;
  }, [w]);
  const z0 = -len / 2; // head end
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* frame: side rails, foot board, head board with two posts */}
      <OBox size={[w + 0.08, 0.22, len + 0.08]} position={[0, 0.2, 0]} map={woodTex([1, 2])} color={frame} />
      {[-1, 1].map((s) => (
        <OBox key={`l${s}`} size={[0.07, 0.12, 0.07]} position={[s * (w / 2 - 0.02), 0.06, len / 2 - 0.02]} color="#5a3a30" />
      ))}
      <OBox size={[w + 0.14, 0.95, 0.07]} position={[0, 0.475, z0 - 0.06]} map={woodTex([1, 1])} color={frame} />
      {[-1, 1].map((s) => (
        <OBox key={`p${s}`} size={[0.09, 1.08, 0.09]} position={[s * (w / 2 + 0.07), 0.54, z0 - 0.06]} color="#5a3a30" />
      ))}
      <OBox size={[w + 0.14, 0.5, 0.06]} position={[0, 0.36, len / 2 + 0.07]} map={woodTex([1, 1])} color={frame} />
      {/* mattress (white) — top at 0.5 */}
      <OBox size={[w, 0.2, len]} position={[0, 0.4, 0]} color="#ece4d6" />
      {/* blanket: lies 2–3 cm over the mattress, hangs a bit over the sides; folded band at the head end */}
      <OBox size={[w + 0.06, 0.06, len * 0.72]} position={[0, 0.53, len * 0.14 + 0.01]} color={blanket} />
      <OBox size={[w + 0.07, 0.25, 0.03]} position={[-0, 0.42, len / 2 + 0.03 - 0.0]} color={blanket} lines={false} />
      <OBox size={[w + 0.08, 0.08, 0.2]} position={[0, 0.545, z0 + len * 0.28 - 0.1]} color={blanketFold} />
      {/* pillow */}
      <OMesh geometry={pillow} position={[0, 0.58, z0 + 0.26]} color="#f4efe6" threshold={50} />
      {sitter && (
        <group>
          {/* lap: the blanket gathered over the hips (a faceted dome around the card, a bit toward the foot) */}
          <OMesh
            geometry={mound}
            position={[0, BED_SIT.mound.y, z0 + BED_SIT.headGap + 0.06]}
            scale={[BED_SIT.mound.rx, BED_SIT.mound.ry, BED_SIT.mound.rz]}
            color={blanket}
            threshold={40}
          />
          {/* legs under the blanket: a low faceted ridge from the lap to the foot */}
          <OMesh
            geometry={legs}
            position={[0, 0.555, (z0 + BED_SIT.headGap + 0.2 + len / 2 - 0.2) / 2]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[0.17, len / 2 - 0.2 - (z0 + BED_SIT.headGap + 0.2), 0.08]}
            color={blanket}
            threshold={40}
          />
          {/* feet bump at the end of the ridge */}
          <OMesh geometry={mound} position={[0, 0.55, len / 2 - 0.25]} scale={[0.2, 0.12, 0.12]} color={blanket} threshold={40} />
        </group>
      )}
    </group>
  );
};
// Where to put an actor "sitting up in bed" (bed not rotated): the card's hips (1.3 head widths = 0.715 m above its
// feet) land on the mattress top (0.5 m), so the feet are 0.215 m under the floor, hidden inside the bed box.
// Use it with <Bed sitter />.
export const bedSitAt = (bed: V3, len = 2.0): V3 => [bed[0], 0.5 - 0.715, bed[2] - len / 2 + BED_SIT.headGap];

// ---------------------------------------------------------------------------------------------------------------
// Nightstand with a bedside lamp: a real warm light (`on` 0–1), a lit shade, a glow. Lamp light for the cards:
// bedsideWarmLight().
export const BEDSIDE = { top: 0.6, lampY: 0.98 };
export const BedsideLamp: React.FC<{ position: V3; rotY?: number; on?: number; intensity?: number }> = ({
  position,
  rotY = 0,
  on = 1,
  intensity = 3.2,
}) => {
  const shade = useMemo(() => new THREE.CylinderGeometry(0.11, 0.17, 0.2, 8, 1, true), []);
  const base = useMemo(() => new THREE.CylinderGeometry(0.06, 0.09, 0.2, 8), []);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* nightstand: box, drawer front (2 cm out), knob */}
      <OBox size={[0.48, BEDSIDE.top, 0.4]} position={[0, BEDSIDE.top / 2, 0]} map={woodTex([1, 1])} color="#a46b55" />
      <OBox size={[0.4, 0.18, 0.02]} position={[0, BEDSIDE.top - 0.16, 0.21]} color="#c08a62" />
      <OBox size={[0.05, 0.03, 0.03]} position={[0, BEDSIDE.top - 0.16, 0.235]} color="#3a2c34" lines={false} />
      {/* lamp */}
      <OMesh geometry={base} position={[0.05, BEDSIDE.top + 0.1, -0.02]} color="#7a6f8a" threshold={50} />
      <OMesh
        geometry={shade}
        position={[0.05, BEDSIDE.lampY - 0.18 + 0.1, -0.02]}
        color="#f0d9a8"
        emissive="#ffb060"
        emissiveIntensity={0.55 * on}
        threshold={50}
      />
      <pointLight position={[0.05, BEDSIDE.lampY - 0.05, 0.05]} color={WARM_COLOR} intensity={intensity * on} distance={0} decay={2} castShadow={false} />
      <Glow position={[0.05, BEDSIDE.lampY - 0.08, 0.02]} size={1.1} color="#ffb060" opacity={0.55 * on} />
      {/* a book on the stand */}
      <OBox size={[0.16, 0.04, 0.22]} position={[-0.13, BEDSIDE.top + 0.02, 0.04]} rotation={[0, 0.3, 0]} color="#8e3a3f" />
    </group>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Old basement furnace ("octopus" style): round iron body on a base, a fire door whose grill glows (`glow` 0–1 =
// the fire), an ash door, a domed top, warm-air ducts going up to the ceiling, a flue pipe to the back wall.
// `cracked` draws a dark crack and a rusty patch on the body (the broken furnace). `ceiling` = room height.
// Light for the cards: the fire glow is a warm light in front of the door (see furnaceWarmLight in the set).
export const Furnace: React.FC<{
  position: V3;
  rotY?: number;
  ceiling: number;
  glow?: number;
  cracked?: boolean;
  ducts?: number;
  flueBack?: number; // distance from the furnace center back to the wall (m): the flue ends there
}> = ({ position, rotY = 0, ceiling, glow = 1, cracked = false, ducts = 4, flueBack = 0.9 }) => {
  const R = 0.55;
  const bodyH = 1.15;
  const body = useMemo(() => new THREE.CylinderGeometry(R, R + 0.03, bodyH, 10), []);
  const dome = useMemo(() => new THREE.SphereGeometry(R + 0.02, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), []);
  const plinth = useMemo(() => new THREE.CylinderGeometry(R + 0.1, R + 0.12, 0.16, 10), []);
  const band = useMemo(() => new THREE.CylinderGeometry(R + 0.035, R + 0.035, 0.06, 10), []);
  const duct = useMemo(() => new THREE.CylinderGeometry(0.11, 0.11, 1, 8), []);
  const flue = useMemo(() => new THREE.CylinderGeometry(0.09, 0.09, 1, 8), []);
  const top = 0.16 + bodyH; // top of the body
  const domeTop = top + (R + 0.02);
  // ducts leave the dome sideways-up and climb to the ceiling
  const ductList = Array.from({ length: ducts }, (_, i) => {
    const a = -Math.PI * 0.85 + (i / Math.max(1, ducts - 1)) * Math.PI * 0.7 + Math.PI / 2; // spread toward the back
    const r0 = R * 0.62;
    const x = Math.cos(a) * r0;
    const z = -Math.abs(Math.sin(a)) * r0 * 0.9;
    const y0 = top + 0.32;
    const h = Math.max(0.2, ceiling - y0);
    return { x, z, y0, h, tilt: x * 0.35 };
  });
  const fire = new THREE.Color("#ff8a3a").multiplyScalar(0.25 + 1.0 * glow);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <OMesh geometry={plinth} position={[0, 0.08, 0]} color="#3a3444" threshold={60} />
      <OMesh geometry={body} position={[0, 0.16 + bodyH / 2, 0]} color="#433d50" threshold={60} />
      {/* iron bands (2 cm proud of the body) */}
      {[0.38, 1.0].map((y) => (
        <OMesh key={y} geometry={band} position={[0, y, 0]} color="#3a3444" threshold={60} />
      ))}
      <OMesh geometry={dome} position={[0, top, 0]} color="#4f4860" threshold={60} />
      {/* fire door: frame + glowing grill slots (4 cm in front of the body) */}
      <group position={[0, 0.72, R + 0.02]}>
        <OBox size={[0.46, 0.38, 0.05]} position={[0, 0, 0.0]} color="#2f2a38" />
        {[-0.12, 0, 0.12].map((dx) => (
          <mesh key={dx} position={[dx, 0, 0.03]}>
            <boxGeometry args={[0.06, 0.26, 0.012]} />
            <meshBasicMaterial color={fire} toneMapped={false} />
          </mesh>
        ))}
        <OBox size={[0.07, 0.04, 0.05]} position={[0.2, 0, 0.05]} color="#a9b0c0" lines={false} />
      </group>
      {/* ash door below */}
      <OBox size={[0.4, 0.18, 0.05]} position={[0, 0.3, R + 0.02]} color="#2f2a38" />
      {/* the fire's light and glow (follow `glow`) */}
      <pointLight position={[0, 0.75, R + 0.9]} color="#ff8a3a" intensity={1.6 * glow} distance={0} decay={2} castShadow={false} />
      <Glow position={[0, 0.74, R + 0.12]} size={1.3} color="#ff8a3a" opacity={0.65 * glow} />
      {/* warm-air ducts up to the ceiling */}
      {ductList.map((d, i) => (
        <group key={i}>
          <OMesh geometry={duct} position={[d.x, d.y0 + d.h / 2, d.z]} scale={[1, d.h, 1]} color={i % 2 ? "#8a8090" : "#9a90a0"} threshold={60} />
          <OBox size={[0.3, 0.05, 0.3]} position={[d.x, ceiling - 0.05, d.z]} color="#3a3444" lines={false} />
        </group>
      ))}
      {/* flue pipe: up from the dome, then back to the wall */}
      <OMesh geometry={flue} position={[0, domeTop + 0.2, -0.15]} scale={[1, 0.5, 1]} color="#3a3444" threshold={60} />
      <OMesh
        geometry={flue}
        position={[0, domeTop + 0.42, -0.15 - (flueBack - 0.15) / 2]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[1, flueBack - 0.15, 1]}
        color="#3a3444"
        threshold={60}
      />
      {cracked && (
        <group>
          {/* a jagged crack (dark) and a rust patch, 2–3 cm proud of the body front */}
          {[
            [0.18, 1.05, 0.25],
            [0.24, 0.95, -0.5],
            [0.2, 0.85, 0.4],
          ].map(([x, y, r], i) => (
            <mesh key={i} position={[x, y, Math.sqrt(R * R - x * x) + 0.025]} rotation={[0, Math.atan2(x, R), r]}>
              <boxGeometry args={[0.025, 0.14, 0.01]} />
              <meshBasicMaterial color="#1c1622" />
            </mesh>
          ))}
          <mesh position={[-0.3, 1.0, Math.sqrt(R * R - 0.09) + 0.02]} rotation={[0, Math.atan2(-0.3, R), 0]}>
            <circleGeometry args={[0.07, 7]} />
            <meshStandardMaterial color="#6e4436" roughness={1} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Open wooden stairs: `steps` treads (rise 0.2, run 0.26) climbing toward -z from `position` (bottom front edge),
// two stringers, a hand rail on the +x side (`rail` -1 = on the -x side). Width `w`. `landing` (m) = a platform at the
// top (depth toward -z) on two posts: the place for a door in the wall behind it (AjarDoor).
export const STAIR = { rise: 0.2, run: 0.26 };
export const Stairs: React.FC<{ position: V3; rotY?: number; steps?: number; w?: number; rail?: 1 | -1; landing?: number }> = ({
  position,
  rotY = 0,
  steps = 11,
  w = 0.9,
  rail = 1,
  landing = 0,
}) => {
  const rise = STAIR.rise;
  const run = STAIR.run;
  const L = Math.hypot(steps * rise, steps * run);
  const ang = Math.atan2(steps * rise, steps * run);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {Array.from({ length: steps }, (_, i) => (
        <OBox
          key={i}
          size={[w - 0.1, 0.045, run + 0.04]}
          position={[0, (i + 1) * rise - 0.03, -(i + 0.5) * run]}
          map={woodTex([1, 0.3])}
          color={i % 2 ? "#b07a5a" : "#a46b55"}
        />
      ))}
      {/* stringers: tilted boards on both sides (outside the treads, 2 cm gap) */}
      {[-1, 1].map((s) => (
        <OBox
          key={s}
          size={[0.06, 0.24, L]}
          position={[s * (w / 2 - 0.02), (steps * rise) / 2 - 0.05, -(steps * run) / 2]}
          rotation={[ang, 0, 0]}
          color="#6b4433"
        />
      ))}
      {/* hand rail on posts */}
      {[0, Math.floor(steps / 2), steps - 1].map((i) => (
        <OBox key={`p${i}`} size={[0.05, 0.9, 0.05]} position={[rail * (w / 2 + 0.05), (i + 1) * rise + 0.45, -(i + 0.5) * run]} color="#5a3a30" />
      ))}
      <OBox
        size={[0.06, 0.06, L]}
        position={[rail * (w / 2 + 0.05), (steps * rise) / 2 + 0.92, -(steps * run) / 2]}
        rotation={[ang, 0, 0]}
        color="#8e5a40"
      />
      {landing > 0 && (
        <group>
          {/* platform: top 2 cm above the last tread's top, from the stairs' end to `landing` m further back */}
          <OBox size={[w + 0.1, 0.1, landing]} position={[0, steps * rise - 0.03, -steps * run - landing / 2 + 0.02]} map={woodTex([1, 1])} color="#8e5a40" />
          {[-1, 1].map((sd) => (
            <OBox key={`lp${sd}`} size={[0.09, steps * rise - 0.08, 0.09]} position={[sd * (w / 2), (steps * rise - 0.08) / 2, -steps * run - 0.05]} color="#5a3a30" />
          ))}
        </group>
      )}
    </group>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// A pipe along the ceiling (basement water / gas pipe): from `from` along +x for `len` m (turn with rotY), hanging
// on straps. Two tones (pipe + joints).
export const CeilingPipe: React.FC<{ from: V3; len: number; rotY?: number; r?: number; color?: string }> = ({
  from,
  len,
  rotY = 0,
  r = 0.045,
  color = "#7f8a9a",
}) => {
  const g = useMemo(() => new THREE.CylinderGeometry(r, r, len, 8), [r, len]);
  const joints = Math.max(2, Math.round(len / 1.2));
  return (
    <group position={from} rotation={[0, rotY, 0]}>
      <OMesh geometry={g} position={[len / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} color={color} threshold={60} />
      {Array.from({ length: joints }, (_, i) => (
        <group key={i} position={[(i + 0.5) * (len / joints), 0, 0]}>
          <OBox size={[0.08, r * 2 + 0.03, r * 2 + 0.03]} position={[0, 0, 0]} color="#4b4a66" lines={false} />
          <OBox size={[0.03, 0.2, 0.03]} position={[0, 0.12, 0]} color="#3a3850" lines={false} />
        </group>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// A door left ajar in a wall, with warm light from the next room through the crack (the "normal" house beyond the
// cold basement). `position` = the bottom middle of the door ON the wall face (+ON_WALL), front to +z (rotY turns
// it). `open` = how far the leaf swings into the room (radians, 0.35 = a crack). `light` 0–1 = the lit room behind:
// a bright warm plane inside the frame, a warm light at the crack, a glow, and a light wedge on the floor in front.
// The wall stays solid: the "room behind" is a bright plane 1 cm in front of it (the leaf covers most of it).
export const AjarDoor: React.FC<{ position: V3; rotY?: number; w?: number; h?: number; open?: number; light?: number; spill?: number }> = ({
  position,
  rotY = 0,
  w = 0.8,
  h = 1.8,
  open = 0.35,
  light = 1,
  spill = 1.6,
}) => {
  const hall = new THREE.Color("#ffb468").multiplyScalar(0.25 + 0.6 * light);
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      {/* the lit room beyond (unlit material: it IS the light) */}
      <mesh position={[0, h / 2, 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={hall} fog={false} />
      </mesh>
      {/* frame: posts + lintel, 6 cm proud */}
      {[-1, 1].map((s) => (
        <OBox key={s} size={[0.08, h + 0.08, 0.1]} position={[s * (w / 2 + 0.04), (h + 0.08) / 2, 0.05]} color="#4a3040" />
      ))}
      <OBox size={[w + 0.16, 0.08, 0.1]} position={[0, h + 0.04, 0.05]} color="#4a3040" />
      {/* leaf, hinged on the left post, swung into the room */}
      <group position={[-w / 2 + 0.01, 0, 0.06]} rotation={[0, -open, 0]}>
        <OBox size={[w - 0.03, h - 0.03, 0.04]} position={[(w - 0.03) / 2, (h - 0.03) / 2 + 0.01, 0.02]} map={woodTex([1, 2])} color="#6b4a44" />
        <OBox size={[0.05, 0.05, 0.05]} position={[w - 0.12, h * 0.5, 0.06]} color="#c9b27a" lines={false} />
      </group>
      {/* light through the crack */}
      <pointLight position={[w * 0.3, h * 0.55, 0.5]} color="#ffb070" intensity={1.8 * light} distance={0} decay={2} castShadow={false} />
      <Glow position={[w * 0.38, h * 0.5, 0.12]} size={1.2} color="#ffb060" opacity={0.6 * light} />
      {/* the wedge of light on the floor in front of the door (2 cm over it) */}
      <mesh position={[w * 0.32, 0.02, spill / 2 + 0.05]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={4}>
        <planeGeometry args={[0.9, spill]} />
        <meshBasicMaterial map={lightSpillTex()} color="#ffb870" transparent opacity={0.55 * light} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// Cobwebs (thin pale threads, no ink lines: they ARE lines). Unlit, see-through, never write depth.
const WebMat: React.FC<{ kind: "fan" | "drape"; seed: number; opacity: number }> = ({ kind, seed, opacity }) => (
  <meshBasicMaterial map={cobwebTex(kind, seed)} color="#e9e4f0" transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} />
);
// A web stretched between three anchor points (walls, ceiling, a furnace top...): the classic spider web of the
// user's reference (spiderWebTex: dense rings bowing in, hanging strands), cut to the triangle, so its spokes end on
// the anchors. The web's center sits at the triangle's centroid. Bright, see-through, both sides, no depth write.
export const WebSheet: React.FC<{ points: [V3, V3, V3]; seed?: number; opacity?: number }> = ({ points, seed = 1, opacity = 0.9 }) => {
  const key = JSON.stringify(points);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
    // uv: centroid → (0.5, 0.5) = the web's hub
    g.setAttribute("uv", new THREE.Float32BufferAttribute([0, 1, 1, 1, 0.5, -0.5], 2));
    return g;
  }, [key]); // eslint-disable-line
  return (
    <mesh geometry={geom} renderOrder={6}>
      <meshBasicMaterial map={spiderWebTex(seed)} color="#f4f0f8" transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
};
// Corner web: a WebSheet across a room's top corner, from `size` m along each ceiling edge to ~`size` m down the
// corner. `corner` = the room's top corner point; `a`, `b` = unit directions INTO the room along the two walls (e.g.
// back-left corner: a = [1, 0, 0], b = [0, 0, 1]). 2 cm off the walls and ceiling.
export const CornerWeb: React.FC<{ corner: V3; a: V3; b: V3; size?: number; seed?: number; opacity?: number }> = ({
  corner,
  a,
  b,
  size = 1.1,
  seed = 1,
  opacity = 0.9,
}) => {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const o = new THREE.Vector3(...corner).addScaledVector(A, 0.02).addScaledVector(B, 0.02).add(new THREE.Vector3(0, -0.02, 0));
  const p1 = o.clone().addScaledVector(A, size).toArray() as V3;
  const p2 = o.clone().addScaledVector(B, size).toArray() as V3;
  const p3 = o.clone().add(new THREE.Vector3(0, -size * 0.95, 0)).toArray() as V3;
  return <WebSheet points={[p1, p2, p3]} seed={seed} opacity={opacity} />;
};

// A spider hanging on its thread from `top` (a ceiling point), `len` m down; it sways a little with `frame`.
// Body bigger than life (reads at phone size): dark abdomen + head, 8 bent legs, a pale thread.
export const HangingSpider: React.FC<{ top: V3; len?: number; frame?: number; size?: number; color?: string }> = ({
  top,
  len = 0.7,
  frame = 0,
  size = 1,
  color = "#2a2230",
}) => {
  const sway = Math.sin(frame / 38) * 0.05;
  const legs = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const side = i < 4 ? -1 : 1;
        const k = i % 4; // front → back
        return { side, yaw: (-0.75 + k * 0.5) * side, k };
      }),
    [],
  );
  return (
    <group position={top} rotation={[sway, 0, sway * 0.6]}>
      <mesh position={[0, -len / 2, 0]}>
        <boxGeometry args={[0.004, len, 0.004]} />
        <meshBasicMaterial color="#e9e4f0" transparent opacity={0.8} />
      </mesh>
      <group position={[0, -len, 0]} scale={size} rotation={[0.25, frame / 90, 0]}>
        <OMesh geometry={useMemo(() => new THREE.IcosahedronGeometry(0.05, 0), [])} position={[0, -0.055, 0]} scale={[1, 1.25, 0.9]} color={color} threshold={40} />
        <OMesh geometry={useMemo(() => new THREE.IcosahedronGeometry(0.03, 0), [])} position={[0, 0.0, 0]} color={color} threshold={40} />
        {legs.map((l, i) => (
          <group key={i} position={[l.side * 0.02, -0.01, 0]} rotation={[0, l.yaw, l.side * 0.5]}>
            <mesh position={[l.side * 0.045, 0.012, 0]} rotation={[0, 0, l.side * 0.35]}>
              <boxGeometry args={[0.09, 0.008, 0.008]} />
              <meshBasicMaterial color={color} />
            </mesh>
            <mesh position={[l.side * 0.1, -0.02, 0]} rotation={[0, 0, -l.side * 0.9]}>
              <boxGeometry args={[0.07, 0.007, 0.007]} />
              <meshBasicMaterial color={color} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
// Hanging web: a sheet of sagging, torn threads hanging from a pipe, a beam or a furnace duct. `position` = the
// middle of its top edge; it faces +z (rotY turns it); `tilt` leans it (radians around x).
export const DrapeWeb: React.FC<{ position: V3; w?: number; h?: number; rotY?: number; tilt?: number; seed?: number; opacity?: number }> = ({
  position,
  w = 0.6,
  h = 0.5,
  rotY = 0,
  tilt = 0,
  seed = 1,
  opacity = 0.55,
}) => (
  <group position={position} rotation={[tilt, rotY, 0]}>
    <mesh position={[0, -h / 2, 0]} renderOrder={6}>
      <planeGeometry args={[w, h]} />
      <WebMat kind="drape" seed={seed} opacity={opacity} />
    </mesh>
  </group>
);

// ---------------------------------------------------------------------------------------------------------------
// Darkness where the light never reaches: a soft black patch (unlit, see-through) on a wall or a floor.
// `position` = its center, `rotY` faces it (on a wall: the wall's inward normal; put it 3 cm off the wall), `flat`
// = lying on the floor (2 cm up). kind "up" = black at the bottom fading up (a wall corner); "round" = a pool.
export const Darkness: React.FC<{ position: V3; w: number; h: number; rotY?: number; flat?: boolean; kind?: "round" | "up"; opacity?: number }> = ({
  position,
  w,
  h,
  rotY = 0,
  flat = false,
  kind = "up",
  opacity = 1,
}) => (
  <mesh position={position} rotation={flat ? [-Math.PI / 2, 0, rotY] : [0, rotY, 0]} renderOrder={3}>
    <planeGeometry args={[w, h]} />
    <meshBasicMaterial map={darknessTex(kind)} color="#000000" transparent opacity={opacity} depthWrite={false} fog={false} />
  </mesh>
);

// A dark opening in a wall (a passage into a deeper, unlit part of the cellar): an old beam frame, pitch black
// inside, darkness bleeding onto the wall around it. `position` = bottom middle on the wall face, front to +z.
export const DarkOpening: React.FC<{ position: V3; rotY?: number; w?: number; h?: number }> = ({ position, rotY = 0, w = 1.0, h = 1.9 }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <Darkness position={[0, h / 2 + 0.1, 0.01]} w={w + 1.1} h={h + 0.9} kind="round" opacity={0.75} />
    <mesh position={[0, h / 2, 0.03]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color="#050307" fog={false} />
    </mesh>
    {/* inner reveal (the wall's thickness, in shade) so it reads as a hole, not a black poster */}
    {[-1, 1].map((s) => (
      <OBox key={`r${s}`} size={[0.04, h, 0.24]} position={[s * (w / 2 - 0.02), h / 2, 0.15]} color="#2e2832" lines={false} />
    ))}
    {/* frame: rough posts + a heavy beam */}
    {[-1, 1].map((s) => (
      <OBox key={`p${s}`} size={[0.14, h + 0.1, 0.12]} position={[s * (w / 2 + 0.07), (h + 0.1) / 2, 0.29]} map={woodTex([0.5, 2])} color="#5a3a30" />
    ))}
    <OBox size={[w + 0.42, 0.18, 0.16]} position={[0, h + 0.19, 0.29]} map={woodTex([2, 0.4])} color="#6b4433" />
  </group>
);
