import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import * as THREE from "three";

export type Cam = { pos: [number, number, number]; target: [number, number, number]; fov: number; roll?: number };

// Sets the camera synchronously before @remotion/three advances the frame.
export const CameraRig: React.FC<Cam> = ({ pos, target, fov, roll = 0 }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...pos);
    camera.up.set(0, 1, 0);
    camera.lookAt(...target);
    camera.rotateZ(THREE.MathUtils.degToRad(roll));
    camera.fov = fov;
    camera.near = 0.05;
    camera.far = 200;
    camera.updateProjectionMatrix();
  });
  return null;
};

export const SceneSetup: React.FC<{ fog?: string; density?: number }> = ({ fog = "#3d3f8e", density = 0.035 }) => (
  <>
    <fogExp2 attach="fog" args={[fog, density]} />
  </>
);

export const glProps = {
  antialias: true,
  toneMapping: THREE.NeutralToneMapping,
  toneMappingExposure: 1.0,
  outputColorSpace: THREE.SRGBColorSpace,
  preserveDrawingBuffer: true,
};
