// A plastered house: wall box, stone base, cornice and a pitched tiled roof. Facades face +z
// (facing 1) or -z (facing -1). Children (windows, doors, signs) are placed in world coordinates.
import { useMemo } from "react";
import type * as THREE from "three";
import { OBox, OMesh, texturedBox } from "../../three/Outlined";
import { roofTex, slabTex } from "../../three/textures";

export const Roof: React.FC<{ x0: number; x1: number; zFront: number; depth: number; y: number; rise: number; color?: string }> = ({
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

export const Building: React.FC<{
  x0: number;
  x1: number;
  zFront: number;
  depth: number;
  height: number;
  wall: THREE.Texture;
  wallColor?: string;
  facing?: 1 | -1;
  roofColor?: string; // tint of the roof tiles (default: untinted, as in the v3 street)
  children?: React.ReactNode;
}> = ({ x0, x1, zFront, depth, height, wall, wallColor = "#ffffff", facing = 1, roofColor, children }) => {
  const w = x1 - x0;
  const g = useMemo(() => texturedBox(w, height, depth), [w, height, depth]);
  const cx = (x0 + x1) / 2;
  const cz = zFront - (facing * depth) / 2;
  return (
    <group>
      <OMesh geometry={g} map={wall} color={wallColor} position={[cx, height / 2, cz]} />
      <OBox size={[w + 0.06, 0.45, 0.08]} position={[cx, 0.225, zFront + facing * 0.04]} color="#6c5f73" map={slabTex([0.5, 0.5])} />
      <OBox size={[w + 0.2, 0.16, 0.28]} position={[cx, height - 0.08, zFront + facing * 0.1]} color="#5a3c45" />
      <Roof x0={x0} x1={x1} zFront={facing === 1 ? zFront : zFront + depth} depth={depth} y={height} rise={1.6} color={roofColor} />
      {children}
    </group>
  );
};
