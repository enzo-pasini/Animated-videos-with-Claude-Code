// Captions (STYLE_SHEET §5): pure white, ~6 px black outline, drop shadow down-right,
// x-height ≈ 40 px, centered at 70.3 % of the height, 1–2 words, always on screen.
import { loadFont } from "@remotion/google-fonts/Montserrat";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { CHUNKS, CHUNK_START } from "./script";

const { fontFamily } = loadFont("normal", { weights: ["900"], subsets: ["latin"] });

export const CAPTION = {
  fontSize: 72, // measured: 76 px gave x-height 42.4 px → 72 px ≈ 40 px
  tracking: -0.02, // em
  outline: 5, // px outside the glyph (measures ≈ 6 px with anti-aliasing)
  centerY: 0.703, // of frame height
  baselineOffset: 0.35, // em: baseline sits this far below the text-box center (cap height ≈ 0.7 em)
};

// One caption chunk: text as written in the script, start = frame its first word is spoken.
// Made by tools/make_captions.py (captions.json); the same file is used by the sync check.
export type CaptionChunk = { text: string; start: number };

const STYLE_TEST_CHUNKS: CaptionChunk[] = CHUNKS.map((text, i) => ({ text, start: CHUNK_START[i] }));

export const Captions: React.FC<{ override?: string; chunks?: CaptionChunk[] }> = ({ override, chunks }) => {
  const f = useCurrentFrame();
  const list = chunks ?? STYLE_TEST_CHUNKS; // no chunks given = the locked StyleTest captions
  let i = 0;
  while (i + 1 < list.length && list[i + 1].start <= f) i++;
  const text = override ?? list[i]?.text ?? "";
  const y = 1920 * CAPTION.centerY + CAPTION.fontSize * CAPTION.baselineOffset;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <filter id="capShadow" x="-20%" y="-50%" width="140%" height="200%">
            <feDropShadow dx={4} dy={3} stdDeviation={2} floodColor="#000" floodOpacity={0.85} />
          </filter>
        </defs>
        <text
          x={540}
          y={y}
          textAnchor="middle"
          fontFamily={fontFamily}
          fontWeight={900}
          fontSize={CAPTION.fontSize}
          letterSpacing={`${CAPTION.tracking}em`}
          fill="#ffffff"
          stroke="#000000"
          strokeWidth={CAPTION.outline * 2}
          strokeLinejoin="round"
          paintOrder="stroke"
          filter="url(#capShadow)"
        >
          {text}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
