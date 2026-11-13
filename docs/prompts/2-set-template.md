Claude-Animation: SET TEMPLATE (scenes plan, session 2 of 3): a starting code file for every new scene.
Read docs/PROJECT_MAP.md first, then your memory notes, then:
- src/world/sets/BUILDING.md (the workflow from session 1; its "start from the template" step is "coming")
- src/world/sets/Bridge.tsx + bridge_land.tsx + bridge.json (outdoor base), Workshop.tsx + workshop.json (indoor base)
- src/episode/sets.tsx (how a set is registered), tools/set_review.py, references/effects/depth-filling.md
- videos/2026-11-07-bridge-break-step/feedback.md FB2, FB5, FB6, FB7, FB8 (the base bugs the template must prevent)
Briefing first, essentials only.

## Why
The bridge's worst bugs (flicker = two faces on one plane, the world ending at the horizon, missing shadows) were
fixed in CODE. A template puts those fixes into every new scene from the start, so we can't repeat them.
The template is only the invisible base (like a theater's floor, lights and safety rules), NOT the look: the place,
props, colors, layout and cameras stay free in each scene, so videos don't look alike.

## What to make
1. Two bases, taken from our own locked code (no outside references needed):
   - outdoor (dayExterior / nightExterior): ground and sky big enough (sky radius ≤ 150, camera far 200), sun
     direction from one side of the main camera, shadow box sized to the set, the capped haze (fogMax) for far
     things, top faces at their own heights, 4 empty layer slots (front, middle, back, far);
   - indoor (warmInterior): walls, floor, ceiling, a window view slot, the 4 layer slots.
   Every value comes from the locked presets and our fixes. Settings, not fixed positions or props.
2. tools/new_set.py <id> --light day|night|interior: copies the base, renames it, writes <id>.json (marks, camera
   bounds, review block) and registers the set in src/episode/sets.tsx.
3. Test: create an empty outdoor and an empty indoor set; set_review.py must PASS on both (no edges, shadows, no
   flicker). ★ Show me the 8-view sheets. Then delete the test sets (or keep one as an example, ask me).
4. Update BUILDING.md (the template step), SKILL.md, src/world/sets/README.md, PROJECT_MAP; commit. Never push.

## Watch out
- Existing sets (day street, night street, workshop, bridge) stay untouched: regress_frames must PASS.
- Keep the room to grow later: more bases (street canyon, big landscape, small room), palettes per theme, a
  "too similar to past scenes" check. Don't build those now, just don't block them.
- Do not touch references/effects/The-only-Briefing-I-need-Actual-progress.txt (my own file).
- Branch: narrator-voice. Ask me before making a new branch.
