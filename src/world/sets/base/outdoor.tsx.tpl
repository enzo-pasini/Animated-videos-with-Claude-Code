// Set "__ID__": __ABOUT__
// Made on __DATE__ by tools/new_set.py from the OUTDOOR base (src/world/sets/base/OutdoorBase.tsx), light __PRESET__.
// Build it step by step with src/world/sets/BUILDING.md. The base already gives: the sky (radius ≤ 150), a ground
// that reaches the sky, the locked light with the sun/moon on one side of the main camera, a shadow box sized to
// the set, the capped haze in the far layer. Settings live in __ID__.json "review" (sun, shadow_size, sky_radius).
// Your job: the LOOK — place, props, colours, layout (front → far), and cameras (__ID___cams.json).
// Rules: build pieces in src/world/kit/ (not here) · flat things at their own height: top(1), top(2)… (≥ 2 cm,
// never two faces on one plane) · every big object = a "review.points" entry (shadow-box check).
// Something moves? use ({ frame, lights }) => … (lights = the plan's levels, listed in __ID__.json "lights").
import type { SetDef } from "../../episode/sets";
import { type OutdoorReview, OutdoorBase, outdoorSetDef } from "./base/OutdoorBase";
import DATA from "./__ID__.json";

const REVIEW = DATA.review as unknown as OutdoorReview;

export const __NAME__: SetDef["Scene"] = () => (
  <OutdoorBase
    light="__LIGHT__"
    review={REVIEW}
    // ground={{ map: cobbleTex([0.5, 0.5]) }}  ← the ground's look (default grass)
    front={<>{/* close to the main camera: frame-bottom props */}</>}
    middle={<>{/* around the marks */}</>}
    back={<>{/* behind the marks, tall props inside the cameras' view cones */}</>}
    far={<>{/* far land, ridges, skyline (capped haze) */}</>}
  />
);

export const __CAMEL__Set = outdoorSetDef("__LIGHT__", __NAME__);
