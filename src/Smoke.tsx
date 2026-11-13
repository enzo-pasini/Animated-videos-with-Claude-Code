import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export const Smoke: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#2e1d35" }}>
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0, 5], fov: 40 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[2, 3, 4]} intensity={40} color="#ffb070" />
        <mesh rotation={[frame * 0.03, frame * 0.05, 0]}>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color="#6e7db8" />
        </mesh>
      </ThreeCanvas>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", top: "35%" }}>
        <div style={{ color: "white", fontSize: 80, fontFamily: "sans-serif", fontWeight: 900 }}>
          smoke {frame}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
