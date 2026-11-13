// Interior building blocks: room shell (floor, walls, beamed ceiling), table, shelf with jars and
// books, pendant lamp (a warm practical light), rug, chair, framed picture. Same world look as the
// street: painted textures + thin 2 px ink lines (OMesh / OBox).
import { useMemo } from "react";
import * as THREE from "three";
import { OBox, OMesh, texturedBox } from "../../three/Outlined";
import { woodTex } from "../../three/textures";
import { WARM_COLOR } from "../lights/colors";
import { Glow } from "./Glow";

// Floor + back wall + two side walls + ceiling with beams. The room is open towards +z (cameras sit inside it).
export const RoomShell: React.FC<{
  x0: number;
  x1: number;
  zBack: number;
  zFront: number;
  height: number;
  wall: THREE.Texture;
  wallColor?: string;
  floorColor?: string;
}> = ({ x0, x1, zBack, zFront, height, wall, wallColor = "#ffffff", floorColor = "#c08a62" }) => {
  const w = x1 - x0;
  const d = zFront - zBack;
  const cx = (x0 + x1) / 2;
  const cz = (zBack + zFront) / 2;
  const back = useMemo(() => texturedBox(w + 0.4, height, 0.2), [w, height]);
  const side = useMemo(() => texturedBox(0.2, height, d), [height, d]);
  const floor = useMemo(() => texturedBox(w + 0.4, 0.1, d + 0.4), [w, d]);
  const ceil = useMemo(() => texturedBox(w + 0.4, 0.12, d + 0.4), [w, d]);
  return (
    <group>
      <OMesh geometry={floor} map={woodTex([w / 1.2, d / 3])} color={floorColor} position={[cx, -0.05, cz]} threshold={89} />
      <OMesh geometry={back} map={wall} color={wallColor} position={[cx, height / 2, zBack - 0.1]} />
      <OMesh geometry={side} map={wall} color={wallColor} position={[x0 - 0.1, height / 2, cz]} />
      <OMesh geometry={side} map={wall} color={wallColor} position={[x1 + 0.1, height / 2, cz]} />
      <OMesh geometry={ceil} color="#6e4a3c" position={[cx, height + 0.06, cz]} threshold={89} />
      {/* skirting boards */}
      <OBox size={[w, 0.14, 0.04]} position={[cx, 0.07, zBack + 0.02]} color="#5a3c45" />
      {/* ceiling beams across the room */}
      {Array.from({ length: Math.floor(d / 1.6) + 1 }, (_, i) => (
        <OBox key={i} size={[w, 0.18, 0.2]} position={[cx, height - 0.09, zBack + 0.6 + i * 1.6]} map={woodTex([3, 0.3])} color="#8e5a40" />
      ))}
    </group>
  );
};

export const Table: React.FC<{ x: number; z: number; w?: number; d?: number; h?: number; rotY?: number }> = ({
  x,
  z,
  w = 1.6,
  d = 0.8,
  h = 0.82,
  rotY = 0,
}) => (
  <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
    <OBox size={[w, 0.07, d]} position={[0, h, 0]} map={woodTex([2, 1])} color="#b07a5a" />
    {[-1, 1].map((sx) =>
      [-1, 1].map((sz) => (
        <OBox key={`${sx}${sz}`} size={[0.07, h - 0.04, 0.07]} position={[sx * (w / 2 - 0.08), (h - 0.04) / 2, sz * (d / 2 - 0.08)]} color="#6b4433" />
      )),
    )}
  </group>
);

const JAR_COLORS = ["#7fa6c9", "#d9a45b", "#9a5b6e", "#7f9e6a", "#e0cfa8", "#6e7db8"];
const BOOK_COLORS = ["#8e3a3f", "#3f5a8a", "#d1aa7a", "#5f8f4e", "#7a4a3c", "#c9785a"];

// Wall shelf: two planks with jars and leaning books (seeded by x so every shelf differs).
export const Shelf: React.FC<{ x: number; y: number; z: number; w?: number }> = ({ x, y, z, w = 1.6 }) => {
  const jar = useMemo(() => new THREE.CylinderGeometry(0.07, 0.07, 0.2, 10), []);
  const seed = Math.abs(Math.round(x * 7 + y * 3));
  return (
    <group position={[x, y, z]}>
      {[0, 0.55].map((dy, row) => (
        <group key={row} position={[0, dy, 0]}>
          <OBox size={[w, 0.05, 0.3]} position={[0, 0, 0.15]} map={woodTex([2, 0.3])} color="#a46b55" />
          {Array.from({ length: 5 }, (_, i) => {
            const k = (seed + i * 3 + row * 5) % 6;
            const px = -w / 2 + 0.18 + i * ((w - 0.3) / 4);
            return (i + row) % 2 ? (
              <OMesh key={i} geometry={jar} position={[px, 0.125, 0.15]} color={JAR_COLORS[k]} threshold={60} />
            ) : (
              <OBox key={i} size={[0.07, 0.26 + (k % 3) * 0.03, 0.2]} position={[px, 0.155, 0.15]} rotation={[0, 0, (k % 2 ? 1 : -1) * 0.12]} color={BOOK_COLORS[k]} />
            );
          })}
        </group>
      ))}
      {/* brackets */}
      {[-1, 1].map((s) => (
        <OBox key={s} size={[0.04, 0.2, 0.25]} position={[s * (w / 2 - 0.15), -0.1, 0.13]} color="#4a3040" />
      ))}
    </group>
  );
};

// Pendant lamp: cord, cone shade, bright bulb, warm point light and glow.
export const PendantLamp: React.FC<{ x: number; y: number; z: number; ceiling: number; on?: number; intensity: number }> = ({
  x,
  y,
  z,
  ceiling,
  on = 1,
  intensity,
}) => {
  const shade = useMemo(() => new THREE.ConeGeometry(0.28, 0.24, 16, 1, true), []);
  return (
    <group>
      <OBox size={[0.015, ceiling - y - 0.1, 0.015]} position={[x, (ceiling + y + 0.1) / 2, z]} color="#2a2230" lines={false} />
      <OMesh geometry={shade} position={[x, y, z]} color="#3f6e5a" threshold={70} />
      <mesh position={[x, y - 0.1, z]}>
        <sphereGeometry args={[0.07, 12, 8]} />
        <meshBasicMaterial color={new THREE.Color("#ffd9a0").multiplyScalar(0.4 + 1.1 * on)} />
      </mesh>
      <pointLight position={[x, y - 0.18, z]} color={WARM_COLOR} intensity={intensity * on} distance={0} decay={2} castShadow={false} />
      <Glow position={[x, y - 0.12, z]} size={1.4} color="#ffb060" opacity={0.6 * on} />
    </group>
  );
};

export const Rug: React.FC<{ x: number; z: number; w?: number; d?: number; color?: string; border?: string }> = ({
  x,
  z,
  w = 2.4,
  d = 1.6,
  color = "#8e3a3f",
  border = "#d1aa7a",
}) => (
  <group position={[x, 0.006, z]}>
    <OBox size={[w, 0.012, d]} position={[0, 0, 0]} color={border} lines={false} />
    <OBox size={[w - 0.22, 0.014, d - 0.22]} position={[0, 0.002, 0]} color={color} />
  </group>
);

export const Chair: React.FC<{ x: number; z: number; rotY?: number }> = ({ x, z, rotY = 0 }) => (
  <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
    <OBox size={[0.46, 0.05, 0.44]} position={[0, 0.46, 0]} map={woodTex([1, 1])} color="#a46b55" />
    <OBox size={[0.46, 0.5, 0.05]} position={[0, 0.74, -0.2]} map={woodTex([1, 1])} color="#a46b55" />
    {[-1, 1].map((sx) =>
      [-1, 1].map((sz) => (
        <OBox key={`${sx}${sz}`} size={[0.045, 0.45, 0.045]} position={[sx * 0.19, 0.225, sz * 0.18]} color="#6b4433" />
      )),
    )}
  </group>
);

// A framed picture: simple painted hills inside a frame (no text, original).
export const Picture: React.FC<{ x: number; y: number; z: number; w?: number; h?: number; rotY?: number }> = ({
  x,
  y,
  z,
  w = 0.7,
  h = 0.5,
  rotY = 0,
}) => (
  <group position={[x, y, z]} rotation={[0, rotY, 0]}>
    <OBox size={[w + 0.1, h + 0.1, 0.04]} position={[0, 0, 0]} color="#6b4433" />
    <OBox size={[w, h, 0.045]} position={[0, 0, 0.005]} color="#9daac1" lines={false} />
    <OBox size={[w, h * 0.4, 0.05]} position={[0, -h * 0.3, 0.008]} color="#71a64f" lines={false} />
    <mesh position={[w * 0.25, h * 0.2, 0.04]}>
      <circleGeometry args={[0.06, 16]} />
      <meshBasicMaterial color="#f3d27a" />
    </mesh>
  </group>
);
