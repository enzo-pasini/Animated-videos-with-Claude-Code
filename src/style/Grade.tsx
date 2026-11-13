import { AbsoluteFill } from "remotion";

// Painterly finish (RULEBOOK §6): lifted blacks + soft vignette. Goes UNDER the captions.
export const Grade: React.FC<{ lift?: number; vignette?: number }> = ({ lift = 0.55, vignette = 0.35 }) => (
  <>
    <AbsoluteFill style={{ backgroundColor: "#2b2350", mixBlendMode: "screen", opacity: lift }} />
    <AbsoluteFill
      style={{
        background: "radial-gradient(ellipse 75% 60% at 50% 45%, rgba(0,0,0,0) 55%, rgba(25,15,45,1) 100%)",
        opacity: vignette,
      }}
    />
  </>
);
