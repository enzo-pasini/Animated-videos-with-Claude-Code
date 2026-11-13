import { AbsoluteFill, type CalculateMetadataFunction } from "remotion";
import { type CaptionChunk, Captions } from "../film/Captions";

// Captions only, over a plain night gradient: tests that captions.json renders on the right frames.
// Render: npx remotion render CaptionTest out.mp4 --props=<file with {"chunks": [...], "frames": N}>
export type CaptionTestProps = { chunks: CaptionChunk[]; frames: number };

export const captionTestMetadata: CalculateMetadataFunction<CaptionTestProps> = ({ props }) => ({
  durationInFrames: Math.max(1, props.frames),
});

export const CaptionTest: React.FC<CaptionTestProps> = ({ chunks }) => (
  <AbsoluteFill style={{ background: "linear-gradient(#2e1d35, #3b3d9b)" }}>
    <Captions chunks={chunks} />
  </AbsoluteFill>
);
