// One simple location: a clock shop on a cobbled street at night.
// Blue night + warm practicals (shop window, hanging lantern). Thin ~2 px world lines.
import { useMemo } from "react";
import * as THREE from "three";
import { OBox, OMesh, boxGeom, texturedBox } from "./Outlined";
import {
  cobbleTex,
  darkWindowTex,
  glowTex,
  moonTex,
  plasterTex,
  roofTex,
  shopInteriorTex,
  signTex,
  skyTex,
  slabTex,
  waitingWindowTex,
  warmWindowTex,
  woodTex,
} from "./textures";
import type { WarmLight } from "./CharacterCard";

// ---- layout constants (meters) ----
export const FACADE_Z = -2;
export const DOOR = { x: -1.45, w: 1.1, h: 2.25 };
export const SHOP_WIN = { x: 1.15, y: 1.65, w: 2.1, h: 1.5 };
export const LANTERN = { x: -0.45, y: 2.45, z: FACADE_Z + 0.8 };
export const ACROSS_Z = 6.5; // facade of the buildings across the street (facing -z)
export const ACROSS_WIN = { x: 0.9, y: 3.4 }; // the window that lights up

export const WARM_COLOR = "#ff9f4a";
// warm light as it falls on the character cards: yellower, so cool + warm does not turn faces magenta
export const CHAR_WARM = "#ffcf8c";
export const LIGHTS = {
  hemi: 3.6,
  skyColor: "#7a86d4",
  groundColor: "#3b3452",
  moon: 2.0,
  bounce: 2.6,
  lantern: 2.2,
  window: 1.6,
  spill: 26,
};
// Moon on the across-street side, ~40 deg to the right: visible in the reverse shots, lights the shop facade.
export const MOON: [number, number, number] = [36, 52, 46];

export const sceneWarmLights = (flicker = 1, acrossLit = 0, lanternOn = 1): WarmLight[] => [
  { pos: [LANTERN.x, LANTERN.y - 0.15, LANTERN.z], color: CHAR_WARM, strength: 0.55 * flicker * lanternOn, range: 3.0 },
  acrossLit > 0
    ? { pos: [ACROSS_WIN.x, ACROSS_WIN.y, ACROSS_Z - 0.6], color: CHAR_WARM, strength: 0.5 * acrossLit, range: 3.0 }
    : { pos: [SHOP_WIN.x, SHOP_WIN.y, FACADE_Z + 0.4], color: CHAR_WARM, strength: 0.35, range: 2.2 },
];

const Glow: React.FC<{ position: [number, number, number]; size: number; color: string; opacity?: number }> = ({
  position,
  size,
  color,
  opacity = 1,
}) => (
  <sprite position={position} scale={[size, size, 1]} renderOrder={5}>
    <spriteMaterial
      map={glowTex()}
      color={color}
      transparent
      opacity={opacity}
      depthWrite={false}
      blending={THREE.AdditiveBlending}
      fog={false}
    />
  </sprite>
);

const Window: React.FC<{
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  lit?: number; // 0..1
  tex?: THREE.Texture;
  facing?: 1 | -1;
  frameColor?: string;
  mullions?: boolean;
  shutters?: boolean;
  boost?: number; // extra brightness when lit (default 1.4)
  fade?: number; // 0..1: cross-fade from dark glass to lit glass (a window that switches on)
}> = ({ x, y, z, w, h, lit = 0, tex, facing = 1, frameColor = "#4a3040", mullions = true, shutters, boost, fade }) => {
  const f = 0.09;
  const glassTex = tex ?? (lit > 0 ? warmWindowTex() : darkWindowTex(`${x}${y}`));
  const litBoost = 1 + lit * (boost ?? 1.4);
  return (
    <group position={[x, y, z]} rotation={[0, facing === 1 ? 0 : Math.PI, 0]}>
      {/* glass */}
      {fade !== undefined ? (
        <>
          <OMesh geometry={boxGeom(w, h, 0.02)} map={darkWindowTex(`${x}${y}`)} basic color="#c9cdf0" basicBoost={1.0} lines={false} />
          {fade > 0 ? (
            <OMesh
              geometry={boxGeom(w, h, 0.02)}
              position={[0, 0, 0.012]}
              map={tex ?? warmWindowTex()}
              basic
              color="#ffffff"
              basicBoost={litBoost}
              transparent
              opacity={fade}
              lines={false}
            />
          ) : null}
        </>
      ) : (
        <OMesh
          geometry={boxGeom(w, h, 0.02)}
          map={glassTex}
          basic
          color={lit > 0 ? "#ffffff" : "#c9cdf0"}
          basicBoost={lit > 0 ? litBoost : 1.0}
          lines={false}
        />
      )}
      {/* frame */}
      <OBox size={[w + 2 * f, f, 0.12]} position={[0, h / 2 + f / 2, 0.03]} color={frameColor} />
      <OBox size={[w + 2 * f + 0.12, f * 1.3, 0.22]} position={[0, -h / 2 - f / 2, 0.07]} color={frameColor} />
      <OBox size={[f, h, 0.12]} position={[-w / 2 - f / 2, 0, 0.03]} color={frameColor} />
      <OBox size={[f, h, 0.12]} position={[w / 2 + f / 2, 0, 0.03]} color={frameColor} />
      {mullions ? (
        <>
          <OBox size={[0.05, h, 0.06]} position={[0, 0, 0.03]} color={frameColor} />
          <OBox size={[w, 0.05, 0.06]} position={[0, h * 0.1, 0.03]} color={frameColor} />
        </>
      ) : null}
      {shutters ? (
        <>
          <OBox size={[w * 0.5, h * 1.05, 0.05]} position={[-w * 0.78, 0, 0.06]} color="#3f5a8a" map={woodTex()} />
          <OBox size={[w * 0.5, h * 1.05, 0.05]} position={[w * 0.78, 0, 0.06]} color="#3f5a8a" map={woodTex()} />
        </>
      ) : null}
    </group>
  );
};

const Roof: React.FC<{ x0: number; x1: number; zFront: number; depth: number; y: number; rise: number; color?: string }> = ({
  x0,
  x1,
  zFront,
  depth,
  y,
  rise,
  color = "#ffffff",
}) => {
  const half = depth / 2 + 0.35;
  const slope = Math.atan2(rise, depth / 2);
  const len = Math.hypot(half, rise * (half / (depth / 2)));
  const w = x1 - x0 + 0.5;
  const g = useMemo(() => texturedBox(w, 0.14, len), [w, len]);
  const cx = (x0 + x1) / 2;
  const cz = zFront - depth / 2;
  const tex = roofTex([0.6, 0.6]);
  return (
    <group position={[cx, y, cz]}>
      <OMesh geometry={g} map={tex} color={color} position={[0, rise / 2, len / 2 - 0.2]} rotation={[slope, 0, 0]} />
      <OMesh geometry={g} map={tex} color={color} position={[0, rise / 2, -len / 2 + 0.2]} rotation={[-slope, 0, 0]} />
    </group>
  );
};

const Building: React.FC<{
  x0: number;
  x1: number;
  zFront: number;
  depth: number;
  height: number;
  wall: THREE.Texture;
  wallColor?: string;
  facing?: 1 | -1;
  children?: React.ReactNode;
}> = ({ x0, x1, zFront, depth, height, wall, wallColor = "#ffffff", facing = 1, children }) => {
  const w = x1 - x0;
  const g = useMemo(() => texturedBox(w, height, depth), [w, height, depth]);
  const cx = (x0 + x1) / 2;
  const cz = zFront - (facing * depth) / 2;
  return (
    <group>
      <OMesh geometry={g} map={wall} color={wallColor} position={[cx, height / 2, cz]} />
      <OBox size={[w + 0.06, 0.45, 0.08]} position={[cx, 0.225, zFront + facing * 0.04]} color="#6c5f73" map={slabTex([0.5, 0.5])} />
      <OBox size={[w + 0.2, 0.16, 0.28]} position={[cx, height - 0.08, zFront + facing * 0.1]} color="#5a3c45" />
      <Roof x0={x0} x1={x1} zFront={facing === 1 ? zFront : zFront + depth} depth={depth} y={height} rise={1.6} />
      {children}
    </group>
  );
};

const Lantern: React.FC<{ flicker: number; on: number }> = ({ flicker: fl, on }) => {
  const { x, y, z } = LANTERN;
  const flicker = fl * on;
  const glass = useMemo(
    () => new THREE.Color("#3a3350").lerp(new THREE.Color("#ffb766").multiplyScalar(1.05 * fl), on),
    [fl, on],
  );
  return (
    <group>
      {/* wall bracket */}
      <OBox size={[0.06, 0.06, z - FACADE_Z + 0.05]} position={[x, y + 0.42, (z + FACADE_Z) / 2]} color="#2a2230" />
      <OBox size={[0.04, 0.4, 0.04]} position={[x, y + 0.25, FACADE_Z + 0.03]} color="#2a2230" />
      <OMesh
        geometry={useMemo(() => new THREE.CylinderGeometry(0.008, 0.008, 0.18, 6), [])}
        position={[x, y + 0.31, z]}
        color="#2a2230"
        lines={false}
      />
      {/* body */}
      <mesh position={[x, y, z]}>
        <boxGeometry args={[0.2, 0.27, 0.2]} />
        <meshBasicMaterial color={glass} />
      </mesh>
      <OMesh
        geometry={useMemo(() => new THREE.ConeGeometry(0.2, 0.16, 4, 1), [])}
        position={[x, y + 0.23, z]}
        rotation={[0, Math.PI / 4, 0]}
        color="#2a2230"
      />
      <OBox size={[0.27, 0.04, 0.27]} position={[x, y - 0.17, z]} color="#2a2230" />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <OBox key={`${sx}${sz}`} size={[0.025, 0.3, 0.025]} position={[x + sx * 0.115, y, z + sz * 0.115]} color="#2a2230" lines={false} />
        )),
      )}
      <pointLight position={[x, y - 0.05, z + 0.05]} color={WARM_COLOR} intensity={LIGHTS.lantern * flicker} distance={0} decay={2} />
      <Glow position={[x, y, z + 0.05]} size={1.6} color="#ff9a45" opacity={0.75 * flicker} />
      <Glow position={[x, y, z + 0.05]} size={0.55} color="#ffd59a" opacity={0.9 * flicker} />
    </group>
  );
};

export const NightStreet: React.FC<{ frame: number; acrossLit?: number; lanternOn?: number }> = ({
  frame,
  acrossLit = 0,
  lanternOn = 1,
}) => {
  // slow, subtle flame flicker (no strobing)
  const flicker = 1 + 0.05 * Math.sin(frame * 0.37) + 0.03 * Math.sin(frame * 1.13 + 1.7);
  const ground = useMemo(() => {
    const g = new THREE.PlaneGeometry(60, 60);
    g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
    return g;
  }, []);
  const sidewalk = useMemo(() => texturedBox(14, 0.14, 1.1), []);
  const plasterA = plasterTex("a", "#b9a493", [0.33, 0.33]);
  const plasterB = plasterTex("b", "#a8a7b8", [0.33, 0.33], "#7d5a63");
  const plasterC = plasterTex("c", "#9a6b5e", [0.33, 0.33], "#7a4438");
  const plasterD = plasterTex("d", "#c4b7c2", [0.33, 0.33], "#8a5a5e");

  return (
    <group>
      {/* sky + moon */}
      <mesh>
        <sphereGeometry args={[90, 32, 16]} />
        <meshBasicMaterial map={skyTex()} side={THREE.BackSide} fog={false} />
      </mesh>
      <sprite position={MOON} scale={[13, 13, 1]}>
        <spriteMaterial map={moonTex()} fog={false} transparent depthWrite={false} />
      </sprite>
      {/* big soft halo: brightens the sky around the moon */}
      <sprite position={MOON.map((v) => v * 1.01) as [number, number, number]} scale={[70, 70, 1]}>
        <spriteMaterial
          map={glowTex()}
          color="#7f8fe0"
          fog={false}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      {/* moonlit cloud streaks */}
      {[
        [-14, -6, 26, 4.5, 0.32],
        [10, -14, 34, 5, 0.26],
        [-4, 9, 22, 3.5, 0.22],
      ].map(([dx, dy, sx, sy, o], i) => (
        <sprite key={i} position={[MOON[0] + dx, MOON[1] + dy, MOON[2] - dx * 0.6]} scale={[sx, sy, 1]}>
          <spriteMaterial
            map={glowTex()}
            color="#b3bcf2"
            fog={false}
            transparent
            opacity={o}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}

      {/* lights */}
      <hemisphereLight args={[LIGHTS.skyColor, LIGHTS.groundColor, LIGHTS.hemi]} />
      <directionalLight
        position={[MOON[0] * 0.6, MOON[1] * 0.6, MOON[2] * 0.6]}
        color="#a3b0f5"
        intensity={LIGHTS.moon}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={120}
      />
      {/* sky bounce on the walls that face away from the moon */}
      <directionalLight
        position={[-15, 18, -36]}
        color="#9ea4ea"
        intensity={LIGHTS.bounce}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={1}
        shadow-camera-far={120}
      />
      <pointLight position={[SHOP_WIN.x, SHOP_WIN.y - 0.2, FACADE_Z + 0.7]} color="#ffa955" intensity={LIGHTS.window} distance={0} decay={2} />
      {/* always mounted (intensity 0 until lit) so the light count never changes mid-shot */}
      <pointLight position={[ACROSS_WIN.x, ACROSS_WIN.y, ACROSS_Z - 0.5]} color={WARM_COLOR} intensity={4.5 * acrossLit} decay={2} />
      {/* warm spill from the lit window across the street onto Bram's side (makes the ending read warm) */}
      <pointLight position={[0.5, 2.3, 1.5]} color="#ffa95a" intensity={LIGHTS.spill * acrossLit} distance={0} decay={2} />

      {/* ground */}
      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial map={cobbleTex([0.5, 0.5])} roughness={1} />
      </mesh>
      <OMesh geometry={sidewalk} map={slabTex([0.8, 0.8])} position={[-0.5, 0.07, FACADE_Z + 0.55]} />

      {/* ---- the clock shop (center) ---- */}
      <Building x0={-3.6} x1={3.0} zFront={FACADE_Z} depth={5} height={5.4} wall={plasterA}>
        {/* floor band */}
        <OBox size={[6.8, 0.16, 0.22]} position={[-0.3, 3.0, FACADE_Z + 0.08]} color="#5a3c45" />
        {/* door */}
        <OBox size={[DOOR.w + 0.24, DOOR.h + 0.14, 0.1]} position={[DOOR.x, (DOOR.h + 0.14) / 2, FACADE_Z + 0.03]} color="#4a3040" />
        <OBox size={[DOOR.w, DOOR.h, 0.06]} position={[DOOR.x, DOOR.h / 2, FACADE_Z + 0.09]} map={woodTex()} />
        <mesh position={[DOOR.x + 0.38, 1.05, FACADE_Z + 0.15]}>
          <sphereGeometry args={[0.045, 12, 8]} />
          <meshStandardMaterial color="#d6a84f" roughness={0.4} metalness={0.6} />
        </mesh>
        <OBox size={[DOOR.w + 0.5, 0.12, 0.45]} position={[DOOR.x, 0.2, FACADE_Z + 0.3]} map={slabTex([1, 1])} color="#b0a5b0" />
        {/* shop window + awning */}
        <Window x={SHOP_WIN.x} y={SHOP_WIN.y} z={FACADE_Z + 0.03} w={SHOP_WIN.w} h={SHOP_WIN.h} lit={1} tex={shopInteriorTex()} />
        <Glow position={[SHOP_WIN.x, SHOP_WIN.y, FACADE_Z + 0.35]} size={3.2} color="#ff9440" opacity={0.35} />
        <group position={[SHOP_WIN.x, SHOP_WIN.y + SHOP_WIN.h / 2 + 0.32, FACADE_Z + 0.35]} rotation={[0.55, 0, 0]}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <OBox
              key={i}
              size={[0.4, 0.04, 0.75]}
              position={[-1.0 + i * 0.4, 0, 0]}
              color={i % 2 ? "#e8dccb" : "#8e3a3f"}
            />
          ))}
        </group>
        {/* hanging sign */}
        <OBox size={[0.04, 0.04, 0.7]} position={[2.6, 3.55, FACADE_Z + 0.35]} color="#2a2230" />
        <OBox size={[0.04, 0.55, 0.72]} position={[2.6, 3.2, FACADE_Z + 0.4]} map={signTex()} color="#ffffff" />
        {/* upper windows */}
        <Window x={-1.45} y={4.05} z={FACADE_Z + 0.03} w={0.9} h={1.15} shutters />
        <Window x={1.15} y={4.05} z={FACADE_Z + 0.03} w={0.9} h={1.15} shutters />
        <Lantern flicker={flicker} on={lanternOn} />
        {/* props: barrel + potted plant */}
        <OMesh
          geometry={useMemo(() => new THREE.CylinderGeometry(0.32, 0.3, 0.85, 14), [])}
          position={[-2.55, 0.425, FACADE_Z + 0.45]}
          map={woodTex([2, 0.6])}
          color="#a46b55"
          threshold={40}
        />
        <OMesh
          geometry={useMemo(() => new THREE.CylinderGeometry(0.22, 0.17, 0.38, 12), [])}
          position={[2.55, 0.19, FACADE_Z + 0.5]}
          color="#9a5040"
          threshold={40}
        />
        <OMesh
          geometry={useMemo(() => new THREE.IcosahedronGeometry(0.32, 1), [])}
          position={[2.55, 0.55, FACADE_Z + 0.5]}
          color="#4f7d45"
          threshold={60}
        />
      </Building>

      {/* ---- neighbours ---- */}
      <Building x0={3.15} x1={8.5} zFront={FACADE_Z - 1.0} depth={5} height={6.6} wall={plasterB}>
        <Window x={4.6} y={1.6} z={FACADE_Z - 0.97} w={1.0} h={1.3} />
        <Window x={6.9} y={1.6} z={FACADE_Z - 0.97} w={1.0} h={1.3} />
        <Window x={4.6} y={4.2} z={FACADE_Z - 0.97} w={0.9} h={1.2} lit={0.8} />
        <Glow position={[4.6, 4.2, FACADE_Z - 0.6]} size={1.8} color="#ff9440" opacity={0.3} />
        <Window x={6.9} y={4.2} z={FACADE_Z - 0.97} w={0.9} h={1.2} shutters />
      </Building>
      <Building x0={-9.5} x1={-3.75} zFront={FACADE_Z - 0.4} depth={5} height={6.0} wall={plasterC}>
        <Window x={-5.2} y={1.7} z={FACADE_Z - 0.37} w={1.0} h={1.3} />
        <Window x={-7.6} y={1.7} z={FACADE_Z - 0.37} w={1.0} h={1.3} />
        <Window x={-5.2} y={4.1} z={FACADE_Z - 0.37} w={0.9} h={1.2} shutters />
      </Building>

      {/* ---- across the street (behind the default camera) ---- */}
      <Building x0={-7} x1={-0.4} zFront={ACROSS_Z} depth={5} height={6.2} wall={plasterB} facing={-1}>
        <Window x={-2} y={1.7} z={ACROSS_Z - 0.03} w={1.0} h={1.3} facing={-1} />
        <Window x={-4.5} y={1.7} z={ACROSS_Z - 0.03} w={1.0} h={1.3} facing={-1} />
        <Window x={-2} y={4.1} z={ACROSS_Z - 0.03} w={0.9} h={1.2} facing={-1} shutters />
        <Window x={-4.5} y={4.1} z={ACROSS_Z - 0.03} w={0.9} h={1.2} facing={-1} shutters />
      </Building>
      <Building x0={-0.2} x1={6} zFront={ACROSS_Z} depth={5} height={5.6} wall={plasterD} facing={-1}>
        <OBox size={[1.1, 2.2, 0.08]} position={[3.6, 1.1, ACROSS_Z - 0.04]} map={woodTex()} color="#7e7f9f" />
        <Window x={ACROSS_WIN.x} y={1.7} z={ACROSS_Z - 0.03} w={1.0} h={1.3} facing={-1} />
        <Window
          x={ACROSS_WIN.x}
          y={ACROSS_WIN.y}
          z={ACROSS_Z - 0.03}
          w={0.9}
          h={1.2}
          facing={-1}
          lit={1}
          fade={acrossLit}
          tex={waitingWindowTex()}
          boost={0.3}
        />
        {acrossLit > 0 ? (
          <Glow position={[ACROSS_WIN.x, ACROSS_WIN.y, ACROSS_Z - 0.5]} size={3.4} color="#ff8a3a" opacity={0.6 * acrossLit} />
        ) : null}
        <Window x={3.6} y={ACROSS_WIN.y} z={ACROSS_Z - 0.03} w={0.9} h={1.2} facing={-1} shutters />
      </Building>

      <Details />

      {/* ---- distant rooftops (haze) ---- */}
      {[-16, -11, -6.5, -2, 3, 8, 13, 18].map((x, i) => (
        <group key={i}>
          <OBox
            size={[4.2, 7 + (i % 3) * 2.2, 3]}
            position={[x, (7 + (i % 3) * 2.2) / 2, -13 - (i % 2) * 3]}
            color="#5c62a8"
            lineColor="#2a2a5e"
          />
          <OBox size={[0.5, 1.4, 0.5]} position={[x + 1.1, 7 + (i % 3) * 2.2 + 0.7, -13 - (i % 2) * 3]} color="#4c5296" lineColor="#2a2a5e" />
          {i % 3 !== 1 ? (
            <mesh position={[x - 0.8, 4 + (i % 3), -11.45 - (i % 2) * 3]}>
              <planeGeometry args={[0.5, 0.65]} />
              <meshBasicMaterial color={new THREE.Color("#ffb361").multiplyScalar(1.3)} />
            </mesh>
          ) : null}
        </group>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------------
// World detail and depth: chimneys, pipes, flower boxes, a clothesline across the street,
// unlit street lamps, a bench, a crate, and more houses so the street keeps going.
// ---------------------------------------------------------------------------
const Chimney: React.FC<{ x: number; y: number; z: number; h?: number }> = ({ x, y, z, h = 1.3 }) => (
  <group>
    <OBox
      size={[0.55, h, 0.55]}
      position={[x, y + h / 2, z]}
      color="#8c5a4e"
      map={plasterTex("c", "#9a6b5e", [0.33, 0.33], "#7a4438")}
    />
    <OBox size={[0.7, 0.12, 0.7]} position={[x, y + h + 0.06, z]} color="#4a3442" />
    <OBox size={[0.14, 0.3, 0.14]} position={[x - 0.12, y + h + 0.27, z]} color="#4a3442" />
    <OBox size={[0.14, 0.24, 0.14]} position={[x + 0.13, y + h + 0.24, z]} color="#4a3442" />
  </group>
);

const Pipe: React.FC<{ x: number; z: number; h: number }> = ({ x, z, h }) => {
  const g = useMemo(() => new THREE.CylinderGeometry(0.055, 0.055, h, 10), [h]);
  return (
    <group>
      <OMesh geometry={g} position={[x, h / 2, z]} color="#4b4a66" threshold={60} />
      {[0.25, 0.5, 0.75].map((f) => (
        <OBox key={f} size={[0.16, 0.05, 0.16]} position={[x, h * f, z]} color="#3a3850" lines={false} />
      ))}
    </group>
  );
};

const FlowerBox: React.FC<{ x: number; y: number; z: number; facing?: 1 | -1 }> = ({ x, y, z, facing = 1 }) => {
  const bush = useMemo(() => new THREE.IcosahedronGeometry(0.16, 0), []);
  return (
    <group position={[x, y, z]} rotation={[0, facing === 1 ? 0 : Math.PI, 0]}>
      <OBox size={[1.0, 0.2, 0.26]} position={[0, 0, 0.13]} color="#7a4a3c" map={woodTex([2, 0.3])} />
      {[-0.32, 0, 0.32].map((bx, i) => (
        <OMesh key={i} geometry={bush} position={[bx, 0.17, 0.13]} color={i === 1 ? "#5b8a4a" : "#4f7d45"} threshold={70} />
      ))}
      {[-0.2, 0.12, 0.4].map((fx, i) => (
        <mesh key={"f" + i} position={[fx, 0.3, 0.24]}>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshStandardMaterial color={i % 2 ? "#e3a6b8" : "#f0d27a"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

const StreetLamp: React.FC<{ x: number; z: number }> = ({ x, z }) => {
  const post = useMemo(() => new THREE.CylinderGeometry(0.06, 0.09, 3.3, 10), []);
  const top = useMemo(() => new THREE.ConeGeometry(0.24, 0.2, 4, 1), []);
  return (
    <group position={[x, 0, z]}>
      <OMesh geometry={post} position={[0, 1.65, 0]} color="#2c2a3c" threshold={60} />
      <OBox size={[0.3, 0.12, 0.3]} position={[0, 0.06, 0]} color="#2c2a3c" />
      <OBox size={[0.26, 0.34, 0.26]} position={[0, 3.45, 0]} color="#3d4378" />
      <OMesh geometry={top} position={[0, 3.72, 0]} rotation={[0, Math.PI / 4, 0]} color="#2c2a3c" />
    </group>
  );
};

const LINE_A = new THREE.Vector3(-2.7, 4.75, FACADE_Z + 0.05);
const LINE_B = new THREE.Vector3(-2.3, 4.95, ACROSS_Z - 0.05);
const ClothesLine: React.FC = () => {
  const curve = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const p = LINE_A.clone().lerp(LINE_B, t);
      p.y -= 0.7 * 4 * t * (1 - t); // sag
      pts.push(p);
    }
    return new THREE.CatmullRomCurve3(pts);
  }, []);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 40, 0.012, 5, false), [curve]);
  const cloths: [number, string, number, number][] = [
    [0.18, "#e8dccb", 0.5, 0.62],
    [0.3, "#6e7db8", 0.42, 0.5],
    [0.45, "#b5443a", 0.55, 0.7],
    [0.62, "#e8dccb", 0.35, 0.45],
    [0.76, "#d1aa7a", 0.5, 0.58],
  ];
  return (
    <group>
      <mesh geometry={tube}>
        <meshBasicMaterial color="#1e1a2c" />
      </mesh>
      {cloths.map(([t, color, w, h], i) => {
        const p = curve.getPoint(t);
        return (
          <OMesh
            key={i}
            geometry={boxGeom(0.02, h, w)}
            position={[p.x, p.y - h / 2 + 0.02, p.z]}
            rotation={[0, 0, (i % 2 ? 1 : -1) * 0.04]}
            color={color}
          />
        );
      })}
    </group>
  );
};

const Details: React.FC = () => {
  const plasterA = plasterTex("a", "#b9a493", [0.33, 0.33]);
  const plasterB = plasterTex("b", "#a8a7b8", [0.33, 0.33], "#7d5a63");
  const plasterC = plasterTex("c", "#9a6b5e", [0.33, 0.33], "#7a4438");
  const crate = useMemo(() => texturedBox(0.55, 0.5, 0.5), []);
  return (
    <group>
      {/* chimneys on the roofs */}
      <Chimney x={-2.4} y={6.1} z={FACADE_Z - 1.6} />
      <Chimney x={2.0} y={6.3} z={FACADE_Z - 2.2} h={1.1} />
      <Chimney x={5.6} y={7.3} z={FACADE_Z - 3.4} />
      <Chimney x={-6.8} y={6.8} z={FACADE_Z - 2.2} />
      <Chimney x={-4.8} y={7.0} z={ACROSS_Z + 1.8} />
      <Chimney x={2.4} y={6.4} z={ACROSS_Z + 1.6} h={1.0} />
      <Chimney x={4.9} y={6.3} z={ACROSS_Z + 1.4} />

      {/* drainpipes at the building corners */}
      <Pipe x={-3.5} z={FACADE_Z + 0.1} h={5.3} />
      <Pipe x={2.9} z={FACADE_Z + 0.1} h={5.3} />
      <Pipe x={-0.32} z={ACROSS_Z - 0.1} h={5.6} />
      <Pipe x={5.9} z={ACROSS_Z - 0.1} h={5.5} />

      {/* flower boxes under the upper windows */}
      <FlowerBox x={-1.45} y={3.32} z={FACADE_Z + 0.05} />
      <FlowerBox x={1.15} y={3.32} z={FACADE_Z + 0.05} />
      <FlowerBox x={-2} y={3.32} z={ACROSS_Z - 0.05} facing={-1} />

      {/* clothesline over the street */}
      <ClothesLine />

      {/* unlit street lamps down the street (Bram's lantern is the one he lights) */}
      <StreetLamp x={-6.4} z={0.9} />
      <StreetLamp x={6.2} z={5.3} />
      <StreetLamp x={-12.5} z={0.9} />

      {/* bench under the shop window + crate by the barrel */}
      <OBox size={[1.1, 0.08, 0.42]} position={[SHOP_WIN.x + 0.45, 0.6, FACADE_Z + 0.45]} map={woodTex([1, 0.3])} color="#a46b55" />
      {[-0.05, 0.95].map((dx) => (
        <OBox key={dx} size={[0.08, 0.46, 0.36]} position={[SHOP_WIN.x + dx, 0.37, FACADE_Z + 0.45]} color="#4a3040" />
      ))}
      <OMesh
        geometry={crate}
        map={woodTex([1.5, 1.5])}
        color="#b07a5a"
        position={[-3.25, 0.39, FACADE_Z + 0.75]}
        rotation={[0, 0.3, 0]}
      />

      {/* the street keeps going: more houses on both sides */}
      <Building x0={-16} x1={-9.7} zFront={FACADE_Z - 0.6} depth={5} height={7.0} wall={plasterA}>
        <Window x={-11.4} y={1.7} z={FACADE_Z - 0.57} w={1.0} h={1.3} />
        <Window x={-14.2} y={1.7} z={FACADE_Z - 0.57} w={1.0} h={1.3} lit={0.8} />
        <Window x={-11.4} y={4.4} z={FACADE_Z - 0.57} w={0.9} h={1.2} shutters />
        <Window x={-14.2} y={4.4} z={FACADE_Z - 0.57} w={0.9} h={1.2} />
      </Building>
      <Building x0={8.7} x1={14.5} zFront={FACADE_Z - 0.4} depth={5} height={5.8} wall={plasterC}>
        <Window x={10.2} y={1.7} z={FACADE_Z - 0.37} w={1.0} h={1.3} />
        <Window x={12.9} y={4.0} z={FACADE_Z - 0.37} w={0.9} h={1.2} lit={0.8} />
      </Building>
      <Building x0={-13.5} x1={-7.2} zFront={ACROSS_Z + 0.3} depth={5} height={7.4} wall={plasterA} facing={-1}>
        <Window x={-8.8} y={1.8} z={ACROSS_Z + 0.27} w={1.0} h={1.3} facing={-1} />
        <Window x={-11.6} y={1.8} z={ACROSS_Z + 0.27} w={1.0} h={1.3} facing={-1} />
        <Window x={-8.8} y={4.6} z={ACROSS_Z + 0.27} w={0.9} h={1.2} facing={-1} shutters />
        <Window x={-11.6} y={4.6} z={ACROSS_Z + 0.27} w={0.9} h={1.2} facing={-1} />
      </Building>
      <Building x0={6.2} x1={12.5} zFront={ACROSS_Z - 0.2} depth={5} height={6.6} wall={plasterB} facing={-1}>
        <Window x={7.8} y={1.7} z={ACROSS_Z - 0.23} w={1.0} h={1.3} facing={-1} />
        <Window x={10.6} y={1.7} z={ACROSS_Z - 0.23} w={1.0} h={1.3} facing={-1} />
        <Window x={7.8} y={4.3} z={ACROSS_Z - 0.23} w={0.9} h={1.2} facing={-1} shutters />
        <Window x={10.6} y={4.3} z={ACROSS_Z - 0.23} w={0.9} h={1.2} facing={-1} lit={0.7} />
      </Building>
    </group>
  );
};
