// Small props that make a place feel lived-in (locks.md §5 detail checklist).
import { useMemo } from "react";
import * as THREE from "three";
import { OBox, OMesh, boxGeom, texturedBox } from "../../three/Outlined";
import { plasterTex, woodTex } from "../../three/textures";

export const Chimney: React.FC<{ x: number; y: number; z: number; h?: number }> = ({ x, y, z, h = 1.3 }) => (
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

export const Pipe: React.FC<{ x: number; z: number; h: number }> = ({ x, z, h }) => {
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

export const FlowerBox: React.FC<{ x: number; y: number; z: number; facing?: 1 | -1 }> = ({ x, y, z, facing = 1 }) => {
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

export const StreetLamp: React.FC<{ x: number; z: number }> = ({ x, z }) => {
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

type Cloth = [number, string, number, number]; // position along the line 0..1, color, width, height

const DEFAULT_CLOTHS: Cloth[] = [
  [0.18, "#e8dccb", 0.5, 0.62],
  [0.3, "#6e7db8", 0.42, 0.5],
  [0.45, "#b5443a", 0.55, 0.7],
  [0.62, "#e8dccb", 0.35, 0.45],
  [0.76, "#d1aa7a", 0.5, 0.58],
];

// A sagging line between two walls with laundry on it.
export const ClothesLine: React.FC<{ a: [number, number, number]; b: [number, number, number]; sag?: number; cloths?: Cloth[] }> = ({
  a,
  b,
  sag = 0.7,
  cloths = DEFAULT_CLOTHS,
}) => {
  const curve = useMemo(() => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const p = A.clone().lerp(B, t);
      p.y -= sag * 4 * t * (1 - t); // sag
      pts.push(p);
    }
    return new THREE.CatmullRomCurve3(pts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.join(","), b.join(","), sag]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 40, 0.012, 5, false), [curve]);
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

export const Bench: React.FC<{ x: number; z: number }> = ({ x, z }) => (
  <>
    <OBox size={[1.1, 0.08, 0.42]} position={[x + 0.45, 0.6, z]} map={woodTex([1, 0.3])} color="#a46b55" />
    {[-0.05, 0.95].map((dx) => (
      <OBox key={dx} size={[0.08, 0.46, 0.36]} position={[x + dx, 0.37, z]} color="#4a3040" />
    ))}
  </>
);

export const Crate: React.FC<{ position: [number, number, number]; rotY?: number }> = ({ position, rotY = 0 }) => {
  const crate = useMemo(() => texturedBox(0.55, 0.5, 0.5), []);
  return <OMesh geometry={crate} map={woodTex([1.5, 1.5])} color="#b07a5a" position={position} rotation={[0, rotY, 0]} />;
};

export const Barrel: React.FC<{ position: [number, number, number] }> = ({ position }) => (
  <OMesh
    geometry={useMemo(() => new THREE.CylinderGeometry(0.32, 0.3, 0.85, 14), [])}
    position={position}
    map={woodTex([2, 0.6])}
    color="#a46b55"
    threshold={40}
  />
);

// Pot + round bush. position = center of the pot.
export const PottedPlant: React.FC<{ position: [number, number, number] }> = ({ position: [x, y, z] }) => (
  <>
    <OMesh
      geometry={useMemo(() => new THREE.CylinderGeometry(0.22, 0.17, 0.38, 12), [])}
      position={[x, y, z]}
      color="#9a5040"
      threshold={40}
    />
    <OMesh
      geometry={useMemo(() => new THREE.IcosahedronGeometry(0.32, 1), [])}
      position={[x, y + 0.36, z]}
      color="#4f7d45"
      threshold={60}
    />
  </>
);

// Hazy blocks of rooftops far behind a street, with a few lit windows.
export const DistantRooftops: React.FC<{ xs?: number[]; z?: number; day?: boolean }> = ({
  xs = [-16, -11, -6.5, -2, 3, 8, 13, 18],
  z = -13,
  day = false,
}) => (
  <>
    {xs.map((x, i) => (
      <group key={i}>
        <OBox
          size={[4.2, 7 + (i % 3) * 2.2, 3]}
          position={[x, (7 + (i % 3) * 2.2) / 2, z - (i % 2) * 3]}
          color={day ? "#a9b6cf" : "#5c62a8"}
          lineColor={day ? "#6a7290" : "#2a2a5e"}
        />
        <OBox size={[0.5, 1.4, 0.5]} position={[x + 1.1, 7 + (i % 3) * 2.2 + 0.7, z - (i % 2) * 3]} color={day ? "#9aa6c2" : "#4c5296"} lineColor={day ? "#6a7290" : "#2a2a5e"} />
        {i % 3 !== 1 && !day ? (
          <mesh position={[x - 0.8, 4 + (i % 3), z + 1.55 - (i % 2) * 3]}>
            <planeGeometry args={[0.5, 0.65]} />
            <meshBasicMaterial color={new THREE.Color("#ffb361").multiplyScalar(1.3)} />
          </mesh>
        ) : null}
      </group>
    ))}
  </>
);
