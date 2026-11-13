# Credits for 3D pack pieces

Free 3D pieces used in our sets (scenes plan 3, `src/world/kit/pack.tsx`). Each pack folder `public/packs/<pack>/` keeps
`LICENSE.txt` and `sources.txt` (file, author, license, link per piece).

- **CC0** = public domain: no credit needed (listed here only so we know where pieces come from).
- **CC-BY** = free, but the author **must** be credited: copy its line into the video's `upload.md` description
  whenever a video uses one of its pieces.
- Non-commercial / personal-use only: **never** used.

## CC-BY (credit in the description)

_None yet._ Format of a line, ready to paste:
`3D model "<title>" by <author> (<link>), CC BY <version>`

## CC0 (no credit needed)

| Pack folder | Author | Pieces | Source |
|---|---|---|---|
| `home-interior` (q_*) | Quaternius | 18 (kitchen, bathroom, furniture) | Ultimate House Interior Pack, https://quaternius.com/packs/ultimatehomeinterior.html |
| `home-interior` (k_*) | Kenney | 12 (kitchen cabinets, small appliances, bathroom) | Furniture Kit, https://kenney.nl/assets/furniture-kit |
| `medieval` (k_*) | Kenney | Castle Kit (one file: walls, towers, gates, flags, siege machines) | https://kenney.nl/assets/castle-kit |
| `medieval` (q_*) | Quaternius | Castle Fortress (main castle) | https://poly.pizza/m/3r6gq3ow6O |
| `snow` (q_*) | Quaternius | Rock Snow (one rock, used with our tones) | https://poly.pizza/m/eZRzCg5BcR |

## Not used

| Pack folder | File | Why |
|---|---|---|
| `medieval` | `p_castle_02.glb` ("Bowsers Castle 1st Draft", Spadez86, CC-BY 3.0) | A fan model of a Nintendo castle: the CC-BY covers only the uploader's work, not Nintendo's design. A/B/C test 2026-11-12 (`castle_abc.jpg`): the Quaternius fortress was chosen. Never use it in a video. |

## Reference only (looked at, never in a set or a video = nothing to credit)

Kept in `public/reference-only/` (git-ignored, README "never load in a set"); only the reference sheet composition
`SnowRefSheet` loads it. Our pieces are made by our own code (no vertices copied).

| Folder | Model | Author | License | Learned for |
|---|---|---|---|---|
| `reference-only/snow-cabin` | Mountain Cabin | Alex Safayan | CC-BY 3.0 | Snow theme kit `snow.tsx` (2026-11-12): snow cap pattern, snowy pines, snow colours |

The snow kit itself (`src/world/kit/snow.tsx`) is 100 % ours: no credit line needed.
