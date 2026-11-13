// Test caption text (original), timed like the reference voice (RULEBOOK §3):
// first 3 s at 4.0 words/s, then ~3.6 w/s, slightly slower at the end. 44 words in 12 s = 3.67 w/s.
export const FPS = 30;
export const TOTAL_FRAMES = 360;

// Caption chunks: 1 word ≈ 2/3, 2 words ≈ 1/3 (STYLE_SHEET §5).
export const CHUNKS: string[] = [
  "Every", "night", "at 3", "a.m.,", "Bram", "lit one", "lantern", "on a", "street", "where", "nobody", "lived.",
  "So the", "whole", "town", "laughed", "at him.",
  "But", "one night,", "a window", "across", "the empty", "street", "lit up", "too.",
  "You see,", "someone", "had been", "waiting", "for him", "for", "years.",
];

export const WORDS: string[] = CHUNKS.flatMap((c) => c.split(" "));

// pauses (frames) added AFTER these words: sentence ends = the "long gaps" of the voice
const PAUSE_AFTER: Record<string, number> = { "lived.": 3, "him.": 4, "too.": 3 };

const weight = (w: string) => 0.55 + 0.1 * w.replace(/[^a-z0-9]/gi, "").length;

// Two segments: words [0,12) in frames [0,90); words [12,44) in [90,360), last 5 words a bit slower.
const timeSegment = (words: string[], f0: number, f1: number, slowTail = 0) => {
  const pauses = words.map((w) => PAUSE_AFTER[w] ?? 0);
  const ws = words.map((w, i) => weight(w) * (i >= words.length - slowTail ? 1.18 : 1));
  const free = f1 - f0 - pauses.reduce((a, b) => a + b, 0);
  const sum = ws.reduce((a, b) => a + b, 0);
  const starts: number[] = [];
  let t = f0;
  ws.forEach((w, i) => {
    starts.push(t);
    t += (w / sum) * free + pauses[i];
  });
  return starts;
};

export const WORD_START: number[] = [
  ...timeSegment(WORDS.slice(0, 12), 0, 90),
  ...timeSegment(WORDS.slice(12), 90, TOTAL_FRAMES, 5),
].map((f) => Math.round(f));

export const CHUNK_START: number[] = (() => {
  const out: number[] = [];
  let wi = 0;
  for (const c of CHUNKS) {
    out.push(WORD_START[wi]);
    wi += c.split(" ").length;
  }
  return out;
})();

// index of the k-th occurrence of a word (for story events)
export const wordFrame = (word: string, nth = 0) => {
  let n = 0;
  for (let i = 0; i < WORDS.length; i++) if (WORDS[i] === word && n++ === nth) return WORD_START[i];
  throw new Error(`word ${word} #${nth} not found`);
};

// ---- shots: 5 shots, 8-frame dissolves (RULEBOOK §4) ----
export const DISSOLVE = 8;
export const SHOT_LEN = [68, 76, 80, 84, 84]; // sum 392 - 4*8 = 360
export const SHOT_START = SHOT_LEN.reduce<number[]>((acc, _l, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + SHOT_LEN[i - 1] - DISSOLVE);
  return acc;
}, []);
