// Channel palette from RULEBOOK §6 (k-means over all shots) + our working colors.
export const PALETTE = {
  plum: "#2e1d35", // night shadows
  offWhite: "#ded7cb", // heads, highlights
  mauve: "#5a3c45", // interior shadows
  brick: "#8e5547", // wood, warm surfaces
  tan: "#b47d5f", // lamp-lit surfaces
  sand: "#d1aa7a", // warm light
  indigo: "#3b3d9b", // night sky
  periwinkle: "#6e7db8", // cool fill
  greyBlue: "#9daac1", // haze
  leaf: "#71a64f", // accent
} as const;

// Ink colors. Characters: near-black plum (cool scene). World: same hue, thinner lines.
export const INK = "#1b1322";
export const WORLD_INK = "#20182c";

// Warm practical light.
export const WARM = "#ffab57";
export const WARM_GLASS = "#ffc879";

// Spec numbers we must hit (STYLE_SHEET §0), used by the frame critic.
export const SPEC = {
  heightInHeads: 3.1,
  headWidthMediumPct: 27,
  standingHeightPct: 47,
  headOutlinePctOfHead: 3.4,
  limbPctOfHead: 5,
  worldLinePx: 2,
  captionXHeightPx: 40,
  captionCenterPctH: 70.3,
  captionOutlinePx: 6,
};
