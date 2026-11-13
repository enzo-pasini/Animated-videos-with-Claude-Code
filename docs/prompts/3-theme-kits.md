Claude-Animation: THEME KITS + FREE 3D PACKS (scenes plan, session 3 of 3): more pieces = more diverse scenes.
Read docs/PROJECT_MAP.md first, then your memory notes, then:
- src/world/sets/BUILDING.md (workflow), references/sets/KIT.md + the kit catalog picture (session 1)
- references/sets/3d-packs.txt (the pack links I collected) and references/effects/references-vfx.txt
  (video references marked "background")
- src/three/Outlined.tsx (OMesh: our ink lines + two tones on any geometry)
Briefing first, essentials only.

## Why
Each video gets a new scene. Pieces built (or taken from free packs) as reusable kit can be used again in later
videos, so every theme we add makes future scenes faster and more varied. Free 3D packs are also a reference
source beyond Shorts, so our scenes don't copy one channel.

## Themes still missing (from channel/ideas.md and my references)
 · Medical (operating room, doctor's office) · Snowy mountain (peak camp,
mountain hut) · Medieval (castle, army camp, battlefield) · Market / orchard (partly done).

## Steps (pilot on ONE theme, the one of my next video; ask me which)
1. ★ Briefing: the links I collected for that theme, their licenses (CC0 = free; CC-BY = credit in the description;
   non-commercial / personal use = do NOT use), formats (.glb best), and which pieces we need. Ask before any download.
2. Download into its own folder (git-ignored, like assets/music/), load ONE piece in our Remotion three.js setup.
3. ★ Style test: the piece as it comes vs with our look (ink lines + two tones + our light). One still sheet. Wait.
4. If it fits: a loader in the kit (load + restyle any pack piece), the theme's pieces with settings for variations,
   added to the catalog. If it doesn't fit: build the pieces ourselves (low-poly, like kit/country.tsx).
5. ★ Kit picture for that theme (all pieces at once). After my OK: KIT.md, a credits list for CC-BY pieces (for
   upload.md), PROJECT_MAP, commit. Never push.

## Watch out
- Licenses first: never use a piece without a checked license; keep the license text with each pack.
- Our style stays locked: low-poly, two tones + ink lines, no z-fighting; check render time with many pieces.
- Do not touch references/effects/The-only-Briefing-I-need-Actual-progress.txt (my own file).
- Branch: narrator-voice. Ask me before making a new branch.
