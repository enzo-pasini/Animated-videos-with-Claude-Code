// Meshes with THIN screen-space ink lines on their hard edges (world look "thin line art", ~2 px).
import { createContext, useContext, useMemo } from "react";
import * as THREE from "three";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { WORLD_INK } from "../style/palette";

export const WORLD_LINE_PX = 2;

// Set template (scenes plan 2): every OMesh inside <FogMaxContext.Provider value={cap}> gets the capped haze
// (the far layer of a set base, src/world/sets/base/). An OMesh's own `fogMax` prop wins. Default: no cap.
export const FogMaxContext = createContext<number | undefined>(undefined);

const lineMats = new Map<string, LineMaterial>();
const lineMat = (color: string, width: number) => {
  const k = color + width;
  let m = lineMats.get(k);
  if (!m) {
    m = new LineMaterial({ color: new THREE.Color(color).getHex(), linewidth: width, worldUnits: false });
    m.resolution.set(1080, 1920);
    lineMats.set(k, m);
  }
  return m;
};

// `edgeGeom` = line pairs computed elsewhere (pack pieces, src/world/kit/pack.tsx); default: three's EdgesGeometry.
export const makeEdges = (
  geom: THREE.BufferGeometry,
  color = WORLD_INK,
  width = WORLD_LINE_PX,
  threshold = 30,
  edgeGeom?: THREE.BufferGeometry,
) => {
  const edges = edgeGeom ?? new THREE.EdgesGeometry(geom, threshold);
  const g = new LineSegmentsGeometry().setPositions(edges.attributes.position.array as Float32Array);
  const l = new LineSegments2(g, lineMat(color, width));
  l.computeLineDistances();
  return l;
};

type MatProps = {
  color?: string;
  map?: THREE.Texture | null;
  emissive?: string;
  emissiveIntensity?: number;
  basic?: boolean; // unlit (for glowing glass)
  basicBoost?: number;
  roughness?: number;
  transparent?: boolean;
  opacity?: number;
  fog?: boolean; // false = not fogged (far layers with their haze colour baked in, v4 item 7/13); default true
  vertexColors?: boolean; // per-face colours from the geometry's "color" attribute (fields on terrain); default false
  // far land only (v4 item 8/7/13): the locked exp2 fog, but its haze stops growing at this share (0..1).
  // Up to ~80 m (cap 0.6) the result is identical to the locked fog; beyond, far fields/trees stay visible.
  fogMax?: number;
};

// fog_fragment with a cap on the fog factor (same formula as three's FogExp2 otherwise)
const cappedFog = (cap: number) => (shader: { fragmentShader: string }) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <fog_fragment>",
    `#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, min( fogFactor, ${cap.toFixed(3)} ) );
#endif`,
  );
};

type Props = MatProps & {
  geometry: THREE.BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  lines?: boolean;
  lineColor?: string;
  lineWidth?: number;
  threshold?: number;
  edgeGeom?: THREE.BufferGeometry; // precomputed ink line pairs (pack pieces)
};

export const OMesh: React.FC<Props> = ({
  geometry,
  position,
  rotation,
  scale,
  lines = true,
  lineColor = WORLD_INK,
  lineWidth = WORLD_LINE_PX,
  threshold = 30,
  edgeGeom,
  color = "#ffffff",
  map = null,
  emissive,
  emissiveIntensity = 1,
  basic,
  basicBoost = 1,
  roughness = 0.95,
  transparent,
  opacity = 1,
  fog = true,
  vertexColors = false,
  fogMax: fogMaxProp,
}) => {
  const fogMaxCtx = useContext(FogMaxContext);
  const fogMax = fogMaxProp ?? fogMaxCtx;
  const capFog = useMemo(() => (fogMax === undefined ? undefined : cappedFog(fogMax)), [fogMax]);
  const edges = useMemo(
    () => (lines ? makeEdges(geometry, lineColor, lineWidth, threshold, edgeGeom) : null),
    [geometry, lines, lineColor, lineWidth, threshold, edgeGeom],
  );
  const basicColor = useMemo(() => new THREE.Color(color).multiplyScalar(basicBoost), [color, basicBoost]);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geometry} castShadow={!basic} receiveShadow={!basic}>
        {basic ? (
          <meshBasicMaterial color={basicColor} map={map} transparent={transparent} opacity={opacity} />
        ) : (
          <meshStandardMaterial
            color={color}
            map={map}
            roughness={roughness}
            metalness={0}
            emissive={emissive ?? "#000000"}
            emissiveIntensity={emissiveIntensity}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
            transparent={transparent}
            opacity={opacity}
            fog={fog}
            vertexColors={vertexColors}
            onBeforeCompile={capFog}
            customProgramCacheKey={capFog ? () => `fogMax${fogMax}` : undefined}
          />
        )}
      </mesh>
      {edges ? <primitive object={edges} /> : null}
    </group>
  );
};

const boxCache = new Map<string, THREE.BoxGeometry>();
export const boxGeom = (w: number, h: number, d: number) => {
  const k = `${w},${h},${d}`;
  let g = boxCache.get(k);
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d);
    boxCache.set(k, g);
  }
  return g;
};

export const OBox: React.FC<Omit<Props, "geometry"> & { size: [number, number, number] }> = ({ size, ...rest }) => (
  <OMesh geometry={boxGeom(size[0], size[1], size[2])} {...rest} />
);

// Box whose texture repeats per meter (so walls of different sizes match).
export const texturedBox = (w: number, h: number, d: number) => {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const pos = g.attributes.position as THREE.BufferAttribute;
  const nrm = g.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(nrm.getX(i));
    const ny = Math.abs(nrm.getY(i));
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (ny > 0.5) uv.setXY(i, x, z);
    else if (nx > 0.5) uv.setXY(i, z, y);
    else uv.setXY(i, x, y);
  }
  uv.needsUpdate = true;
  return g;
};
