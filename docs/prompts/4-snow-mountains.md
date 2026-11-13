Claude-Animation: THEME KIT SNOWY MOUNTAIN (scenes plan, session 4): our own snow pieces, learned from a reference pack.
Read docs/PROJECT_MAP.md first, then your memory notes, then:
- src/world/sets/BUILDING.md (workflow), references/sets/KIT.md + kit_catalog.jpg, kit_home.jpg, kit_medieval.jpg
- src/world/kit/land.tsx (MountainRange, makeTerrain, Trees: our far land), src/world/kit/pack.tsx (pack loader)
- references/effects/README.md §13 + depth-filling.md (mountain notes: uneven ridges, faint haze; item 13 is parked in
  PLAN.md "Later", this session can finish it for snow)
- references/sets/3d-packs.txt (snow links: Mountain Cabin Pack CC-BY, Rock Snow CC0, Snowman CC-BY)
- src/three/Outlined.tsx (OMesh: our ink lines + two tones on any geometry)
Briefing first, essentials only.

## Why
My video idea #3 (channel/ideas.md: pasta on a mountain) needs a snowy peak camp and a mountain hut. Snowy mountains
are also a strong far layer for many other videos. We BUILD these pieces ourselves (like kit/country.tsx, land.tsx),
so they are 100% ours: no credit, and our look from the start.

## The reference (look, learn, do not copy)
https://poly.pizza/m/cspkBmqAq8g | Mountain Cabin Pack (mountains, trees, house, in snow) | CC-BY
- Use it ONLY as a reference: catch the PATTERN of the mountains and the STYLE of the snow. Never put its pieces or
  its exact shapes in a set (no tracing its vertices); our geometry is made by our own code.
- What to learn from it: mountain silhouettes (peak shapes, facet size, how slopes break), where the snow sits (snow
  line, caps, snow on ledges / roofs / tree branches), the snow colors (light side, shadow side, the blue in shadows),
  rocks showing through the snow, how the trees and the cabin look in snow.
- Rock Snow (CC0) may be used directly if it fits our look (same steps as the other packs). Snowman (CC-BY): ask me.

## Steps
1. ★ Briefing: what the reference has, its license, and the list of pieces we will build (below). Ask before any
   download. Reference files go to a git-ignored folder marked "reference only" (never loaded by a set).
2. ★ Reference sheet: the reference rendered in our Remotion setup (as it comes, our day light) + a short analysis of
   the patterns (shapes, snow line, colors measured with our reference scripts). One sheet. Wait.
3. Build our own pieces (theme file src/world/kit/snow.tsx, low-poly, two tones + ink lines, settings for variations):
   - snowy mountain (near peak) + a snowy MountainRange (far, in haze): uneven ridges, snow caps, rocks through snow
   - snowy ground / terrain (slopes, drifts), snow on the ground disc of OutdoorBase
   - snowy pine trees (new tree kind: pines with snow on the branches), snowy rocks
   - mountain hut (cabin with snow on the roof, chimney smoke), peak camp (tent, campfire, camp stove with a pot)
   - the hut interior reuses the home kit (warmInterior)
4. ★ Side by side: the reference vs our pieces (same cameras) + our pieces in a small test scene (peak camp, hut on a
   slope, far range). Check snow brightness under the locked dayExterior (no blown-out white). Wait.
5. ★ Kit picture (kit_snow.jpg, tools/kit_catalog.py --theme snow, with combos). After my OK: KIT.md, CREDITS.md (the
   reference is not used in sets = nothing to credit, note it as "reference only"), PROJECT_MAP, regression if shared
   code changed, commit. Never push.

## Watch out
- Licenses first: the CC-BY reference is reference only; never load it in a set or a video.
- Our style stays locked: low-poly, two tones + ink lines, no z-fighting (snow layers ≥ 2 cm above the rock), shadows;
  check render time with many trees (merge copies per color, like mergeAt).
- Wide 9:16 shots need the camera far away: cap the haze (FogMaxContext) on the near area, like the castle test.
- Do not touch references/effects/The-only-Briefing-I-need-Actual-progress.txt (my own file).
- Branch: narrator-voice. Ask me before making a new branch.
