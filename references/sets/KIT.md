# Kit catalog

Every reusable piece in `src/world/kit/`, with the picture `kit_catalog.jpg` (same order).
**Re-run when the kit grows:** `.venv/Scripts/python -I tools/kit_catalog.py` (renders the sheet) or `--check`
(only lists pieces missing from `src/compositions/KitSheet.tsx` or from this file). A new piece = a line in `KIT`
in `KitSheet.tsx` + a row here.

Used in: the step "kit check" of `src/world/sets/BUILDING.md`. All pieces share the world look: low-poly, 2+ tones,
ink lines (`OMesh` / `OBox`), cast + receive shadows, 2 cm into the ground (FB5).

## Town / street

| Piece | File | Settings that make variations | Theme |
|---|---|---|---|
| `Building` (+ `Roof`) | `Building.tsx` | `x0 x1 zFront depth height`, `wall` (`plasterTex(key, base, repeat, brick)` = any plaster color), `wallColor`, `roofColor`, `facing` ±1; windows/doors as children | town, village |
| `Window` | `Window.tsx` | `w h`, `lit` 0–1 (warm glass), `fade` (switch on), `shutters`, `mullions`, `frameColor`, `facing`; by day inside `DayContext` (sky glass, green shutters) | town |
| `HangingLantern` | `HangingLantern.tsx` | `on` 0–1, `flicker`, `intensity`; on a wall at `wallZ` (a real warm light) | town, night |
| `StreetLamp` | `props.tsx` | position only | town |
| `Chimney` | `props.tsx` | `h` | town (roofs) |
| `Pipe` | `props.tsx` | `h` (drain pipe on a wall) | town |
| `FlowerBox` | `props.tsx` | `facing` | town (under windows) |
| `ClothesLine` | `props.tsx` | ends `a b`, `sag`, `cloths` (position, color, size) | town, country |
| `Bench` | `props.tsx` | position only | town, park |
| `Crate` | `props.tsx` | `rotY`; stack them | town, market, port |
| `Barrel` | `props.tsx` | position only | town, market, port |
| `PottedPlant` | `props.tsx` | position only | town, interior |
| `DistantRooftops` | `props.tsx` | `xs`, `z`, `day` (night = lit windows). Only far away as haze, never as the near town (FB3) | town (far) |

## Country, market, river

| Piece | File | Settings that make variations | Theme |
|---|---|---|---|
| `GrassTufts` | `country.tsx` | `areas` (rectangles), `perM2`, `seed`, `avoid(x, z)` | any grass |
| `Flowers` | `country.tsx` | `at` list, `seed` (pink / yellow / white) | country, garden |
| `VegBed` | `country.tsx` | `w d rotY` | country, garden |
| `Haystack` | `country.tsx` | `s` (size), `rotY` — tall, reads at eye level | country, farm |
| `Sacks` | `country.tsx` | `at` list `[x, z, h?]` (h = stacked) | market, farm, mill |
| `Cart` | `country.tsx` | `rotY`, `load` | market, farm |
| `WoodPile` | `country.tsx` | `rotY` | country, camp |
| `Boat` | `country.tsx` | `water` level, `color`, `rotY`, `post` (mooring post) | river, coast, port |
| `Reeds` | `country.tsx` | `x`, `z0 z1` (a line along the water), `every`, `seed` | river, lake |
| `Stall` | `country.tsx` | `stripe` color, `rotY` (awning + apples) | market, fair |
| `Bunting` | `country.tsx` | ends `a b`, `sag`, `n` flags | market, fair, party |
| `LinePosts` | `country.tsx` | `a b`, `h` (posts for a clothesline or bunting) | country |

## Far land (outdoor sets with a far view)

| Piece | File | Settings that make variations | Theme |
|---|---|---|---|
| `Trees` | `land.tsx` | list of `[kind, x, y, z, s]`, kinds `round` / `poplar` / `bush`, `seed`, `fogMax` (far ones) | country, park, any outdoor |
| `hedgeTrees` | `land.tsx` | polyline `pts`, `ground(x, z)`, `every`, `s` → a `Trees` list | country (field edges) |
| `makeTerrain` | `land.tsx` | grid `xs zs` (use `gridLine`, add the exact step edges), `height(x, z)`, `color(x, z, y)` (fields) | any outdoor |
| `Windmill` | `land.tsx` | `s`, `rotY`, `frame` (sails turn) | country, Netherlands |
| `Barn` | `land.tsx` | `rotY` | farm |
| `HillTown` | `land.tsx` | `houses` list `[x, y, z, w, d, h, rotY]`, `church`, `chimneys` (with smoke), `fogMax` | town on a rise (far) |
| `MountainRange` | `land.tsx` | `R` distance, arc `a0 a1`, `height`, `seed` (other peaks), `color lineColor`, `depth`, `fogMax` (further = paler) | any outdoor (far) |

## Interior

| Piece | File | Settings that make variations | Theme |
|---|---|---|---|
| `RoomShell` | `interior.tsx` | `x0 x1 zBack zFront height`, `wall` texture, `wallColor`, `floorColor` (open toward +z) | any room |
| `Table` | `interior.tsx` | `w d h rotY` | any room |
| `Chair` | `interior.tsx` | `rotY` | any room |
| `Shelf` | `interior.tsx` | `w` (jars + books, seeded by position) | workshop, kitchen, shop |
| `PendantLamp` | `interior.tsx` | `on`, `intensity`, `ceiling` (a real warm light) | any room |
| `Rug` | `interior.tsx` | `w d color border` | home |
| `Picture` | `interior.tsx` | `w h rotY` | home |

## Sky, light, camera

| Piece | File | Settings that make variations | Theme |
|---|---|---|---|
| `DaySky` | `DaySky.tsx` | `sun` direction, `radius` (90; 150 with a far land) | day exterior |
| `NightSky` | `NightSky.tsx` | `moon` position | night exterior |
| `Glow` | `Glow.tsx` | `size color opacity` (soft halo on a practical light) | night, interior |
| `Branch` | `Branch.tsx` | shot field `branch: {"corner": "tl" \| "tr"}` — close shots on land only, never wide | country (close) |

## Theme kits from free 3D packs (scenes plan 3)

Free pack pieces (CC0 / CC-BY only), downloaded per theme into `public/packs/<pack>/` (git-ignored; `LICENSE.txt` +
`sources.txt` stay in git). The loader draws any pack piece in our look: ink lines (clean, no triangle lines), our
tones, flat faces, duplicated faces dropped (no z-fighting). CC-BY pieces → a line in `CREDITS.md` (for `upload.md`).
Theme pictures: `kit_home.jpg`, `kit_medieval.jpg` (`.venv/Scripts/python -I tools/kit_catalog.py --theme home|medieval`).

| Piece | File | Settings that make variations | Theme |
|---|---|---|---|
| `PackPiece` | `pack.tsx` | any `.glb` in `public/packs/`: `node` (one piece of a many-piece file), `hide` (materials not drawn), `h` (real height, m) or `s`, `rotY`, `tones` (pack material name → our color), `threshold` (40 for round pieces), `turn` (front to -z packs), `anchor` `center` / `back` (back = `position` on the wall), `look` (`raw` / `lines` only for style tests) | any theme |
| `HomePiece` | `home.tsx` | `kind` (30 pieces below), `finish` (cabinets `oak` / `white` / `sage` / `blue`; appliances `cream` / `mint` / `butter`), `h`, `rotY`, `tones`. Wall pieces: `position` = point on the wall, usual height `HOME.<kind>.y`; counter pieces at `COUNTER_H` (0.9 m) | home: kitchen, bathroom |

`HomePiece` kinds (pack home-interior, CC0, Quaternius + Kenney):
kitchen `fridge`, `oven`, `kitchenSink`, `cabinet`, `cabinetDrawers`, `cabinetCorner`, `upperCabinet` (wall), `hood` (wall) ·
counter `microwave`, `toaster`, `blender`, `coffeeMachine`, `plate` · any room `roundTable`, `stool`, `dresser`, `trashcan`,
`door`, `window` (wall), `houseplant`, `ceilingLight` · bathroom `bathtub`, `toilet`, `bathroomSink`, `washingMachine`,
`shower`, `mirror` (wall), `bathroomCabinet` (wall), `towelRack` (wall), `toiletPaper`.
A new pack piece: download it into the theme's pack folder (license checked, a line in `sources.txt`), an entry in
`HOME` (or a new theme file like `home.tsx`), a tile in `src/compositions/HomeKitSheet.tsx`, re-run the theme picture.

### Medieval (castle, siege camp, battlefield)

Pack `public/packs/medieval/` (CC0): Kenney Castle Kit (ONE file, many pieces: `PackPiece` `node`) + Quaternius Castle
Fortress. Picture: `kit_medieval.jpg` (`kit_catalog.py --theme medieval`). Main castle chosen in an A/B/C test
(`castle_abc.jpg`): the fortress; "Castle 02" (a fan model of a Nintendo castle) is NOT used.

| Piece | File | Settings that make variations | Theme |
|---|---|---|---|
| `MedievalPiece` | `medieval.tsx` | `kind` (below), `stone` `sand` / `grey`, `roof` `blue` / `red`, `rotY`, `s` (Kenney scale, default `CASTLE_S` 3.5 = wall 4.6 m, tile 3.5 m), `h` (fortress), `tones` | medieval |
| `Tower` | `medieval.tsx` | `x z y`, `floors` 1–3, `top` `flat` / `roof` / `high`, `hex`, `rotY`, `stone`, `roof` | medieval |
| `CastleRing` | `medieval.tsx` | `nx nz` (wall tiles, odd = centered gate), `center`, `gate`, `floors` (corner towers), `stone`, `roof` | medieval |

`MedievalPiece` kinds: main castle `fortress` (put it inside a `CastleRing` 11×9, or far on a hill) · walls `wall`,
`wallCorner`, `wallHalf`, `wallNarrow`, `wallGate` (passage along x: `rotY` π/2 in a wall along x), `wallDoor`,
`wallPillar`, `metalGate`, `bridge`, `stairs` · tower parts (use `Tower`) · flags `flagBlue`, `flagWhite`, `bannerLong`,
`bannerShort` · siege `trebuchet`, `catapult`, `ballista`, `ram`, `siegeTower` · props `shieldRed`, `shieldBlue`,
`sword` (`s={1}` = hand size). `PackPiece` also has `hide` (pack materials not drawn).
Wide 9:16 shots of a whole castle need the camera ~90 m away: wrap the castle area in `FogMaxContext` (cap ~0.3),
like a far layer, or it turns pale in the locked haze.

### Old house (bedroom, basement)

**Our own pieces** (`house.tsx`, 2026-11-12, for `videos/2026-11-12-furnace-ghosts`): built by our code, no pack, no credit.
Used by the sets `lena_bedroom` and `old_basement`. Fronts look to +z; `position` = feet center on the floor.

| Piece | File | Settings that make variations | Theme |
|---|---|---|---|
| `Bed` | `house.tsx` | `w` (0.95 single / 1.45 double), `len`, `blanket`, `blanketFold`, `frame` colours, `rotY`. Headboard at -z. `sitter` = someone sits up in it (lap mound + legs under the blanket); **`bedSitAt`** (bed position) = where that actor stands (hips on the mattress, feet sunk 0.215 m). Never cut a card with a flat surface (BUILDING.md) | bedroom |
| `BedsideLamp` | `house.tsx` | nightstand + lamp: `on` 0–1 (a real warm light + lit shade + glow), `intensity`, `rotY`. `BEDSIDE.lampY` for the set's warmLights | bedroom |
| `Furnace` | `house.tsx` | old iron "octopus" furnace: `glow` 0–1 (fire behind the door grill + warm light), `cracked` (crack + rust patch), `ducts` (to the ceiling), `ceiling`, `flueBack` (flue pipe to the back wall), `rotY` | basement |
| `Stairs` | `house.tsx` | open wooden stairs climbing to -z: `steps` (`STAIR` rise 0.2, run 0.26), `w`, `landing` (platform at the top, for a door), `rail` 1 / -1 (side of the hand rail; put it on the wall side when actors stand on the stairs), `rotY` | basement, any house |
| `CeilingPipe` | `house.tsx` | pipe along +x on straps: `from`, `len`, `r`, `color` (grey water / copper `#b87a4e`), `rotY` | basement |
| `AjarDoor` | `house.tsx` | a door left ajar in a wall with warm light from the next room: `open` (rad, 0.35 = a crack), `light` 0–1 (lit plane behind, warm light, glow, `spill` wedge on the floor), `w h`, `rotY`. Wall stays solid (lit plane 1 cm in front of it) | basement, any room at night |
| `DarkOpening` | `house.tsx` | a pitch-black passage in a wall (beam frame, shaded reveal, darkness bleeding around it): `w h`, `rotY` — the room "goes deeper than we see" | basement, cellar, cave |
| `Darkness` | `house.tsx` | soft black patch (unlit, see-through) for corners the light never reaches: `w h`, `kind` `up` (wall corner, dark at the bottom) / `round` (a pool), `flat` (on the floor), `opacity`, `rotY` | any dark room |
| `CornerWeb` + `WebSheet` + `DrapeWeb` | `house.tsx` | cobwebs in the user's reference style (`spiderWebTex`: dense rings bowing in, hanging strands, bright white): `WebSheet` = a web between any 3 anchor points (`points`, `seed`, `opacity`; e.g. furnace top → back wall); `CornerWeb` = a WebSheet across a top corner (`corner`, `a`, `b` into the room, `size` 1–1.3 m); `DrapeWeb` = torn threads hanging from a pipe / beam. No ink lines, unlit, no depth write | basement, attic, abandoned places |
| `HangingSpider` | `house.tsx` | a spider on its thread from the ceiling: `top`, `len`, `frame` (slow sway + turn), `size`, `color` | basement, attic |

### Snow (snowy mountains, mountain hut, peak camp)

**Our own pieces** (`snow.tsx`, scenes plan 4, 2026-11-12): built by our code, no credit. The CC-BY "Mountain Cabin"
(Alex Safayan) was only LOOKED at (`public/reference-only/`, never loaded by a set; sheets `out/snow/reference_sheet.jpg`,
`out/snow/side_by_side.jpg`). Patterns taken: snow cap with zig-zag "teeth" down the ridges, detailed rock under one
simple snow shape, pines as stacked tiers with snow on top. Ours differ: uneven ridges (item 13), snow on the roof,
snow tuned for the locked dayExterior (lit ≈ 230, shadow side blue, no blown white). Picture: `kit_snow.jpg`
(`kit_catalog.py --theme snow`). Test scene: composition `SnowKitTest` (9:16) + `SnowKitSweep` (flicker check: PASS).
Snow shells sit ≥ 3 cm above the rock (scaled up on big peaks) = no z-fighting. Colours: `SNOW_TONES` (any piece takes `tones`).

| Piece | File | Settings that make variations | Theme |
|---|---|---|---|
| `SnowPeak` | `snow.tsx` | `height`, `radius`, `seed` (a different mountain), `snowLine` 0–1 (0.55; teeth reach lower), `steep` (faces steeper stay rock, 0.22), `ridges` 3–6, `position`, `rotY`, `fogMax` (near peaks 80–100 m away: 0.45) | snow: near mountain |
| `SnowRange` | `snow.tsx` | like `MountainRange`: `R a0 a1 height y0 seed depth`, + `snowLine` (0.32), `steep` (0.12), `tones`, `fogMax` (0.8). One surface with per-face colours = safe at 140 m. Keep `R + 0.65·depth` < sky radius | snow: far layer |
| `SnowGround` | `snow.tsx` | heightfield in two snow tones: `area`, `step`, `height(x, z)`, `seed`. Height helper **`snowSlope`** (`rise`, `from`, `crest`, `drifts`, `flat` terraces for a camp/hut; ≥ 0.12 m above the OutdoorBase disc inside, 0.5 m under it at the edges). Disc texture **`snowGroundTex()`** (`ground={{ map: snowGroundTex(), color: "#ffffff" }}`) | snow: ground |
| `SnowPines` | `snow.tsx` | `trees` `[x, y, z, s]` (merged per colour: 140 pines render fast), `snow` 0 / 0.6 / 1 / 1.3, `seed`, `tones` | snow: trees |
| `SnowRocks` | `snow.tsx` | `rocks` `[x, y, z, s, rotY]` (3 shapes), `snow` on/off (off + `tones.rock` = snow = drift mounds). The CC0 pack Rock Snow: `PackPiece file="snow/q_rock_snow.glb" tones={ROCK_SNOW_TONES}` | snow: rocks |
| `MountainHut` | `snow.tsx` | `w d` (5 × 6 m), `wall` (log colour), `roof`, `snowRoof`, `smoke`, `foundation` (stone base into a slope), `rotY`, `frame` (smoke). Door + warm window at the front (+z). Interior = the home kit under warmInterior | snow: mountain hut |
| `Smoke` | `snow.tsx` | `at`, `frame`, `size`, `rise`, `drift`, `n`, `color`: soft puffs rising and fading (chimney, campfire, steam) | any |
| `PeakCamp` | `snow.tsx` | `frame`, `tent` colour or `false`, `fire`, `stove`, `flags` (prayer-flag line = colour), `rotY`; needs flat ground (a `snowSlope` terrace) | snow: peak camp |
| `Tent` | `snow.tsx` | `color` (orange / yellow `#e8b030` / green `#4f8a5a`…), `open` (dark door), `rotY` | camp |
| `Campfire` | `snow.tsx` | `frame` (flicker), `lit`, `smoke` | camp |
| `CampStove` | `snow.tsx` | `frame`, `boil` (steam + jumping lid), `lid`: gas stove with a pot (idea #3, pasta on a mountain) | camp, kitchen |
| `Backpack` | `snow.tsx` | `color`, `rotY` | camp |

Helpers (not tiles): `snowShell` (lift chosen faces of any faceted geometry = a snow layer), `peakGeometry`,
`snowGroundGeometry`. Wide 9:16 shots from far away: wrap the near area in `FogMaxContext` 0.35 (as in `SnowKitTest`).
A white world is brighter and paler than the day target (frame luma 170–206, sat 0.17–0.32, like the reference):
put colour in with the tent, flags, hut, fire, pines and the characters; the locked light stays.

## Not in the kit yet (set-only pieces)

Built inside one set file. If a new scene needs one, **move it to the kit first** (BUILDING.md step 3), then reuse.

| Piece | Where | Could become |
|---|---|---|
| `Tree`, `Bushes`, `Fence` | `sets/Bridge.tsx` | `Fence` → `country.tsx` (any field, road); `Tree` is older than `land.tsx` `Trees` |
| `Town` (near houses with doors) | `sets/Bridge.tsx` | a `NearTown` kit piece (a row of `Building`s with doors, chimneys, colors) |
| `Chain`, `Column` | `sets/Bridge.tsx` | bridge-only |
| `Filling`, `LineAlongX` | `sets/Bridge.tsx` | layout (the item 8 props of the bridge), not a piece |
| `NearFields` | `sets/bridge_land.tsx` | layout |
| shop front, `Details` | `sets/NightStreet.tsx` | a `ShopFront` kit piece |
