// A window with frame, optional mullions and shutters. Dark glass, lit glass, or a cross-fade
// between them (`fade`) for a window that switches on without a hard cut (locks.md §7).
import { createContext, useContext } from "react";
import type * as THREE from "three";
import { OBox, OMesh, boxGeom } from "../../three/Outlined";
import { darkWindowTex, dayWindowTex, warmWindowTex, woodTex } from "../../three/textures";

// true inside a set drawn by day (dayExterior): unlit glass shows the sky, shutters are painted green
export const DayContext = createContext(false);

export const Window: React.FC<{
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
  const day = useContext(DayContext);
  const glassTex = tex ?? (lit > 0 ? warmWindowTex() : day ? dayWindowTex(`${x}${y}`) : darkWindowTex(`${x}${y}`));
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
          color={lit > 0 || day ? "#ffffff" : "#c9cdf0"}
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
          <OBox size={[w * 0.5, h * 1.05, 0.05]} position={[-w * 0.78, 0, 0.06]} color={day ? "#2f8f6a" : "#3f5a8a"} map={woodTex()} />
          <OBox size={[w * 0.5, h * 1.05, 0.05]} position={[w * 0.78, 0, 0.06]} color={day ? "#2f8f6a" : "#3f5a8a"} map={woodTex()} />
        </>
      ) : null}
    </group>
  );
};
