# Depth + background filling (VFX item 8) — LOCKED v4 (2026-11-11) on the bridge

A set feels deep when **every layer is full**: props in front, life in the middle, a real landscape behind and
faint uneven mountains at the back, all lighter and bluer with distance. Built on the bridge set; the same recipe
fills the next sets (day street, workshop, night street).

Reference: VS1Z_Q-Klt8 0:32–0:34 (`frames/08-depth-filling`), analysis in `README.md` § 8.
**Caution (user, 2026-11-11):** that farm shot is the ONLY scene of the channel with such a deep view. It shows
what a full background looks like, not the depth every shot must have. Most shots are closer.

## 1. User's choices

| Test | Choice |
|---|---|
| Test 1 (4 cameras, before / A few / B many) | **B, the most props**; the cameras and depth are fine as they are |
| Test 1, wide view C3 | "nothing in the background": add a real landscape behind the house; mountains must not be round; diversity; many trees |
| C3 picture + video test 2 | approved → **locked**: B + the far land are the bridge's fixed default (no switch) |
| Corner branch (`Branch.tsx`, shot field `branch`) | **only for close shots on land**; never in a wide shot (in C3 it floated in the sky) |

## 2. Layers (what to put where)

| Layer | Distance | Bridge example | Kit |
|---|---|---|---|
| Foreground | 0–6 m from the camera | bench, barrel, crates, veg bed, haystack, cart, flowers, grass tufts | `kit/props.tsx`, `kit/country.tsx` |
| Middle (the action) | the marks | stalls, laundry lines, bunting, lamps, sacks, wood piles, boats, reeds | `country.tsx` |
| Back (near land) | ~10–42 m | fields in 4 colors, hedgerows, haystacks, windmill (sails turn), barn | `kit/land.tsx` |
| Far land | 42–130 m | rolling faceted terrain, a town on a rise (windowed houses, church spire, 2 chimneys with smoke), ~200 trees in 3 kinds (round, poplar, bush) in clusters, rows and hedges | `land.tsx`: `makeTerrain`, `Trees`, `HillTown`, `Windmill`, `Barn` |
| Mountains | 118–128 m | 2 ranges of uneven moorland ridges (item 13): peaks with different left/right slopes, shoulders, bumps | `land.tsx`: `MountainRange` |

The set's own layout: `src/world/sets/bridge_land.tsx` (`landY`, `landColor`, the tree/town lists).

## 3. Rules learned

1. **Eye-level cameras see the ground as a thin band.** At eye height the banks project to a strip a few % high:
   flat props (beds, tufts) only show at the frame bottom. Props that should read must be **tall** (stalls,
   laundry, stacks, haystacks, lamps) and stand **in the camera's view cone** behind the marks (measure where the
   cameras look; on the bridge: the near banks x ±10.6…17, z −2.3…−9). Move big props that block a cone (the
   tree at −14, −4 moved to −16.6, −8.6).
2. **A wide shot that looks down shows the far land only in the top ~25 %.** Size the town and mountains to fit
   there (C3 looks down ~10°, the frame top is ~10° above eye level); too tall = cut by the frame top.
3. **The locked haze hides everything past ~100 m** (fog exp2 0.012 → 0.87–0.96): far land turns sky-colored and
   trees seem to float. Fix = **capped haze** `fogMax` on far meshes only (`OMesh fogMax`, `Outlined.tsx`): the
   same locked fog formula, then `min(fogFactor, cap)`. Identical to the locked fog up to ~80 m. Caps used: far
   land + trees + town 0.6, front ridge 0.74, back ridge 0.84 (further = paler). The locked fog itself is unchanged.
4. **Shadows stop at the shadow box (76 m on the bridge).** The far land lies outside it on purpose: in the capped
   haze the missing shadows do not show. Everything up to the near box edge (42 m) is inside (`review.points`).
5. **Sky dome bigger than the far land:** `DaySky radius` (default 90) = 150 on the bridge; max ~150 because the
   camera far plane is 200 m.
6. **Many props, few draw calls:** merge geometries per color (`mergeGeometries`; `facet` = non-indexed + flat
   normals for the low-poly look). Array props must be **module constants** (a new array every frame rebuilds the
   merged mesh). Render time: +8 % on the wide shot (25 → 27 s per 2 s), +7 % on the close shots.
7. **No faces on one plane:** props sunk 2 cm into the ground; terrain grid lines placed exactly at its steps
   (river edge, near box edge) so no face lies on another; tree crowns `threshold 70` (no facet lines inside).
8. **No world edges:** the near box edge is hidden by a hedgerow; the river bends away behind a tree clump;
   the terrain rises to a rim at 100–140 m in front of the mountains.

## 4. Checks (done 2026-11-11)

- `tools/flicker.py` on the C3 test: 0 regions, PASS. `tools/set_review.py bridge`: 0 fail, 0 warn, sweep flicker PASS.
- `tools/regress_frames.py` (StyleTest, shared code: `Outlined.tsx` fog options, `DaySky` radius): PASS vs `v4cloth`
  (StyleTest does not use the bridge, so no new baseline; the bridge change is shown by the before/after below).
- Before/after of the real bridge video: `out/vfx/depth-fill/lock_before_after.jpg`.

## 5. Files

| File | What |
|---|---|
| `src/world/kit/country.tsx` | rural props: `GrassTufts`, `Flowers`, `VegBed`, `Haystack`, `Sacks`, `Cart`, `WoodPile`, `Boat`, `Reeds`, `Stall`, `Bunting`, `LinePosts`; helpers `facet`, `mergeAt` |
| `src/world/kit/land.tsx` | far land kit: `makeTerrain`, `Trees`, `hedgeTrees`, `Windmill`, `Barn`, `HillTown`, `MountainRange` |
| `src/world/kit/Branch.tsx` | corner branch near the camera (shot field `branch: {"corner": "tl" \| "tr"}`), close shots only |
| `src/world/sets/bridge_land.tsx` | the bridge's far land (layout) |
| `src/world/sets/Bridge.tsx` | `Filling` (the props) + the far land, always on |
| `tools/vfx_tests/depth_fill_props.py` | the test props (history: the `fill` levels it sets no longer exist) |
