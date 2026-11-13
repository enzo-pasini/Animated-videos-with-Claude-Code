// Render several stills of one composition with ONE bundle and ONE browser (much faster than calling
// `npx remotion still` per frame, which rebuilds the bundle every time).
// Usage (from the project root):
//   node tools/render_stills.mjs --composition Episode --props videos/<slug>/render_props.json \
//        --frames 12,80,150 --out videos/<slug>/storyboard [--prefix f]
// Writes <out>/<prefix><frame:05>.png. Uses the same WebGL backend as remotion.config.ts (ANGLE).
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
};
const composition = arg("composition", "Episode");
const propsFile = arg("props");
const frames = arg("frames", "0").split(",").map(Number);
const out = arg("out", "out/stills");
const prefix = arg("prefix", "f");
const inputProps = propsFile ? JSON.parse(fs.readFileSync(propsFile, "utf-8")) : {};

fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const chromiumOptions = { gl: "angle" };
const browser = await openBrowser("chrome", { chromiumOptions });
const comp = await selectComposition({ serveUrl, id: composition, inputProps, puppeteerInstance: browser, chromiumOptions });
for (const frame of frames) {
  const output = path.join(out, `${prefix}${String(frame).padStart(5, "0")}.png`);
  await renderStill({ composition: comp, serveUrl, output, frame, inputProps, puppeteerInstance: browser, chromiumOptions, imageFormat: "png" });
  console.log(output);
}
await browser.close({ silent: true });
