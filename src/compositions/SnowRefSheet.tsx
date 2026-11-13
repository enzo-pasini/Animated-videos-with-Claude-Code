// Scenes plan 4 (snowy mountains), REFERENCE SHEET: the CC-BY "Mountain Cabin" (Alex Safayan) as it comes (its own
// materials, no ink lines) under our locked dayExterior, one camera per frame. REFERENCE ONLY: this composition
// is the only place that loads public/reference-only/; no set, kit or video ever does (public/reference-only/README.md).
// Frame = camera (SNOW_REF_CAMS). Prop `ours` (step 4) = our own snow pieces under the same cameras instead.
// Render: node tools/render_stills.mjs --composition SnowRefSheet --frames 0,1,2,3,4,5 --out out/snow/ref
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { useEffect, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CameraRig, SceneSetup, glProps, type Cam } from "../three/Rig";
import { DAY_EXTERIOR, DayExteriorLights } from "../world/lights/dayExterior";
import { SnowDiorama } from "./SnowKitTest";

export const SNOW_REF_TILE = 720;
const REF_FILE = "reference-only/snow-cabin/mountain_cabin.glb";

// Cameras in the reference's own units (≈ m: the cabin is 2 m tall, the big mountain 11 m).
export const SNOW_REF_CAMS: { label: string; cam: Cam }[] = [
  { label: "A wide: the whole scene", cam: { pos: [16, 10, 18], target: [-6, 3, -9], fov: 42 } },
  { label: "B mountains from the front", cam: { pos: [-1, 8.5, 9], target: [-11, 4, -12], fov: 42 } },
  { label: "C big peak close (facets, snow line)", cam: { pos: [-8, 7, -1], target: [-16.5, 6, -9], fov: 36 } },
  { label: "D cabin + trees", cam: { pos: [-2.5, 3.4, 3], target: [2, 2, -2.4], fov: 36 } },
  { label: "E pines (medium)", cam: { pos: [2.5, 3.2, 7], target: [-3, 1.5, -2], fov: 34 } },
  { label: "F from the left side (ridge profile)", cam: { pos: [-30, 9, 8], target: [-10, 4, -10], fov: 42 } },
];

const SUN: [number, number, number] = [30, 46, 36];

const RefModel: React.FC = () => {
  const [scene, setScene] = useState<THREE.Object3D | null>(null);
  const [handle] = useState(() => delayRender("snow reference"));
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    new GLTFLoader()
      .loadAsync(staticFile(REF_FILE))
      .then((g) => {
        g.scene.traverse((o) => {
          if ((o as THREE.Mesh).isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
          }
        });
        setScene(g.scene);
      })
      .catch((e) => cancelRender(e));
  }, []);
  useEffect(() => {
    if (!scene) return;
    advance(performance.now());
    continueRender(handle);
  }, [scene, advance, handle]);
  return scene ? <primitive object={scene} /> : null;
};

export const SnowRefSheet: React.FC<{ ours?: boolean }> = ({ ours = false }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { cam } = SNOW_REF_CAMS[frame % SNOW_REF_CAMS.length];
  const bg = DAY_EXTERIOR.skyColor;
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <ThreeCanvas shadows="soft" width={width} height={height} gl={glProps} camera={{ fov: cam.fov, position: cam.pos }} style={{ filter: DAY_EXTERIOR.grade }}>
        <color attach="background" args={[bg]} />
        <SceneSetup fog={DAY_EXTERIOR.fog.color} density={0.004} />
        <DayExteriorLights sun={SUN} shadowSize={32} />
        <CameraRig {...cam} />
        {ours ? <SnowDiorama frame={frame} /> : <RefModel />}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
