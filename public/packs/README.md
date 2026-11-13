# Free 3D packs (scenes plan 3)

One folder per pack, downloaded per theme. The `.glb` files are git-ignored (only this README, each pack's
`LICENSE.txt` and `sources.txt` are in git). Loaded by `src/world/kit/pack.tsx` (`PackPiece`), themes in
`src/world/kit/home.tsx` etc. Credits: `references/sets/CREDITS.md`.

| Folder | Theme | License | Pieces |
|---|---|---|---|
| `home-interior/` | kitchen, bathroom | CC0 (Quaternius, Kenney) | 30 `.glb` from poly.pizza (2026-11-12) |
| `medieval/` | castle, siege camp | CC0 (Kenney Castle Kit = one file, Quaternius Castle Fortress) | 2 `.glb` (+ `p_castle_02.glb`, NOT used, see `references/sets/CREDITS.md`) |
| `snow/` | snowy mountain (rocks) | CC0 (Quaternius Rock Snow) | 1 `.glb` (2026-11-12); the rest of the snow theme is our own code (`src/world/kit/snow.tsx`). The CC-BY reference "Mountain Cabin" is in `public/reference-only/`, NOT here |

**To get the files again** (new computer): `sources.txt` lists each piece's poly.pizza page; download each one as
.glb (GLTF button) and save it with the file name from `sources.txt`.
