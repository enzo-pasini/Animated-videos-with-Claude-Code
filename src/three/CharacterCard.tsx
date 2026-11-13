// A 2D character as a camera-facing card in the 3D world. Drawn on a canvas every time the pose changes.
// The card takes the scene light: cool ambient tint + warm falloff from nearby practical lights (STYLE_SHEET §1.2 rule 3).
import { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { type CharacterSpec, DEFAULT_POSE, type Pose, PX_PER_UNIT, UNITS, UNITS_H, UNITS_W, drawCharacter } from "../character/draw";
import { blobShadowTex } from "./textures";

export const HEAD_WORLD = 0.55; // head width in meters → body ≈ 1.69 m

export type WarmLight = { pos: [number, number, number]; color: string; strength: number; range: number };

const vert = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const frag = /* glsl */ `
uniform sampler2D map;
uniform vec3 uAmbient;
uniform vec3 uWarmPos[2];
uniform vec3 uWarmCol[2];
uniform float uWarmRange[2];
uniform float uExposure;
uniform float uTop;      // world y of the top of the head → a soft top-light gradient
uniform vec3 uTopCol;
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vec4 t = texture2D(map, vUv);
  if (t.a < 0.02) discard;
  vec3 light = uAmbient;
  for (int i = 0; i < 2; i++) {
    float d = distance(vWorld, uWarmPos[i]);
    float f = clamp(1.0 - d / uWarmRange[i], 0.0, 1.0);
    light += uWarmCol[i] * f * f;
  }
  float topF = smoothstep(uTop - 1.4, uTop, vWorld.y);
  light += uTopCol * topF;
  vec3 c = t.rgb * light * uExposure;
  gl_FragColor = vec4(c, t.a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

type Props = {
  spec: CharacterSpec;
  pose?: Partial<Pose>;
  position: [number, number, number];
  camPos: THREE.Vector3; // for billboarding
  ambient?: string;
  ambientStrength?: number;
  topColor?: string;
  warm?: WarmLight[];
  exposure?: number;
  shadow?: boolean;
};

export const CharacterCard: React.FC<Props> = ({
  spec,
  pose,
  position,
  camPos,
  ambient = "#aab6f2", // neutral night blue (more green than before → no magenta faces)
  ambientStrength = 0.9,
  topColor = "#1c2652",
  warm = [],
  exposure = 1,
  shadow = true,
}) => {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = Math.round(UNITS_W * PX_PER_UNIT);
    c.height = Math.round(UNITS_H * PX_PER_UNIT);
    return c;
  }, []);
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  }, [canvas]);

  const fullPose = useMemo(() => ({ ...DEFAULT_POSE, ...spec.poseDefaults, ...pose }), [spec, JSON.stringify(pose)]); // eslint-disable-line
  // draw synchronously, before R3F renders this frame
  useLayoutEffect(() => {
    drawCharacter(canvas.getContext("2d")!, spec, fullPose);
    tex.needsUpdate = true;
  }, [canvas, tex, spec, fullPose]);

  const w = UNITS_W * HEAD_WORLD;
  const h = UNITS_H * HEAD_WORLD;
  // plane center relative to the feet
  const cx = ((UNITS.left + UNITS.right) / 2) * HEAD_WORLD;
  const cy = -((UNITS.top + UNITS.bottom) / 2) * HEAD_WORLD;

  const geom = useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h);
    g.translate(cx, cy, 0);
    return g;
  }, [w, h, cx, cy]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: true,
        uniforms: {
          map: { value: tex },
          uAmbient: { value: new THREE.Color() },
          uWarmPos: { value: [new THREE.Vector3(), new THREE.Vector3()] },
          uWarmCol: { value: [new THREE.Color(0, 0, 0), new THREE.Color(0, 0, 0)] },
          uWarmRange: { value: [1, 1] },
          uExposure: { value: 1 },
          uTop: { value: 0 },
          uTopCol: { value: new THREE.Color() },
        },
      }),
    [tex],
  );

  // light uniforms (in linear space)
  const u = mat.uniforms;
  u.uAmbient.value.set(ambient).multiplyScalar(ambientStrength);
  for (let i = 0; i < 2; i++) {
    const l = warm[i];
    if (l) {
      u.uWarmPos.value[i].set(...l.pos);
      u.uWarmCol.value[i].set(l.color).multiplyScalar(l.strength);
      u.uWarmRange.value[i] = l.range;
    } else {
      u.uWarmCol.value[i].setRGB(0, 0, 0);
    }
  }
  // v4 jump (pose.lift, head widths): the card goes up, the shadow stays on the ground and gets smaller and lighter.
  // Always pass position/scale/opacity: R3F keeps the last value when a prop is removed (the card would stay up).
  const lift = (pose?.lift ?? 0) * HEAD_WORLD;
  u.uExposure.value = exposure;
  u.uTop.value = position[1] + lift + 3.1 * HEAD_WORLD;
  u.uTopCol.value.set(topColor);

  const yaw = Math.atan2(camPos.x - position[0], camPos.z - position[2]);
  const sh = 1 / (1 + 1.1 * lift);

  return (
    <group position={position}>
      {shadow ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} renderOrder={1} scale={[sh, sh, 1]}>
          <planeGeometry args={[HEAD_WORLD * 1.5, HEAD_WORLD * 0.55]} />
          <meshBasicMaterial map={blobShadowTex()} transparent depthWrite={false} opacity={sh} />
        </mesh>
      ) : null}
      <mesh geometry={geom} material={mat} rotation={[0, yaw, 0]} renderOrder={2} position={[0, lift, 0]} />
    </group>
  );
};
