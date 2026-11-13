# Character identity — head shapes (decided and BUILT 2026-11-10, look L3)

Goal (user): a recognizable **channel style**. Every video can still have a new main character (PLAN D9), but every
character must clearly belong to the channel. The user's rule for the head shapes:
**women look cute and petite; men look "chad", imposing.**

## Decisions (the user, 2026-11-10)

| Who | Head shape | What it is (code: `src/character/head.ts`) |
|---|---|---|
| **Men** | **Gumdrop** (`gumdrop`) | round top (the v3 ellipse, hats fit), flat wide jaw: bottom half = superellipse n 5, height 0.9 × ry, jaw 7 % wider |
| **Women** | **Chibi** (`chibi`) | round top, short soft-U chin (bottom half = superellipse n 2.3, 1.08 × ry) **+ chibi face layout**: eyes lower and bigger (y 0.15 instead of 0.03, ×1.22, spread with the size), mouth low and small (y 0.37, ×0.8), blush lower (y 0.27); glasses and anger brows follow the eyes |

The cute look comes mostly from the **face layout** (big low eyes, tiny mouth near the chin), not from the jaw line
(analysis of the user's chibi reference: eyes ≈ 0.4 R below the skull centre, chin ≈ 5 % below the skull circle).

## How we got there (5 rounds)

1. Gumdrop, Loaf, Bell, Acorn, Bean → none liked; Gumdrop the closest. Finding: hats and hoods hide the top of the
   head (Juno's hood hides it fully), so the signature must live in the **jaw / lower face**.
2. Toy-brick-inspired Block, Dome block, Tall block → not chosen (note: only *inspired by*, never a copy — trademark).
3. Gumdrop looked odd on women → female gumdrops Soft, Tapered, **Petite** (liked).
4. User references: anime **V face** (women) → rejected, too stretched, not cute; **Gigachad** jaw (men): Gigachad,
   Gigachad lite.
5. Animation tests: men **A Gumdrop vs O Gigachad lite** → **Gumdrop**; women: chibi faces from the user's reference
   (Chibi K, Chibi, Chibi max), then **K Petite vs Q Chibi** → **Chibi**.

Test files (git-ignored, `out/identity/`; the old head-shape tools were trimmed to the 3 kept shapes in the build): `head_shapes_v2.png` (round 1), `head_shapes_v3_block.png`,
`head_shapes_v4_female.png`, `head_shapes_v5_female_v.png`, `head_shapes_v5_male_chad.png`,
`head_shapes_v6_female_chibi.png`, `male_left-O_right-A.mp4` (the labels in that video are swapped: A Gumdrop is on
the RIGHT), `female_K_vs_Q.mp4` (left K, right Q; last shot Q Mira + A rifleman).
Tools: sheet `src/compositions/HeadShapes.tsx` (Remotion id `HeadShapes`, props `shapes`, `female`, `male`);
animation props `tools/vfx_tests/head_shape_anim_props.py <out.json> male|female` (first actor = LEFT).

## State of the code (built 2026-11-10, locked as look L3 in `style_lock/locks_v4.md`)

- `head.ts`: only `round` (v3), `gumdrop`, `chibi` + the chibi face layout; `headPath()` is used by the head
  outline, L1 shading, anger fill and the face clip. The rejected shapes are in git history (commit `63f41f7`).
- `src/cast/cast_meta.json`: `"gender"` per character (male → gumdrop, female → chibi), optional `"head"` override
  (Juno → chibi). `registry.ts` (`headOf`) sets `spec.headShape`; story variants use their base (`mira_fogged` → mira).
- `draw.ts` `drawCharacter`: look on → the cast's shape; `"look": null` → round (v3 regression PASS).
- `StyleTest` Bram now comes from the cast (Gumdrop) → regression baseline `v4id`.
- Episode props: an actor can have `"head": "<shape>"` (tests only).
- Cast test: `tools/vfx_tests/head_shape_anim_props.py` → `out/identity/cast_test_v4.mp4` (4 sets, approved).
- A new character: add `"gender"` (and `"head"` only for an exception) to `cast_meta.json`.

## Build (done 2026-11-10, approved by the user)

1. Commit the exploration as it is (one commit), so nothing is lost.
2. Cast: a `gender` field per character in `src/cast/cast_meta.json` (+ registry); default head male → Gumdrop,
   female → Chibi; an optional per-character override. Cast: Mira = female; Pell, Bram, riflemen = male;
   **Juno = male but uses the Chibi head** (the user's choice, 2026-11-10) → the first use of the override.
3. Clean `head.ts`: keep `round`, `gumdrop`, `chibi` (+ the face layout); remove the rejected shapes and `chad`'s chin
   cleft; trim `HeadShapes.tsx` and the test props.
4. The v3 path (`"look": null`) keeps round heads (the v3 regression must still pass).
5. Moving test of the cast in the 4 test sets → user approval → new regression baseline (`--make-baseline`), lock in
   `style_lock/locks_v4.md`, PLAN D19 "decided" → "built", `docs/PROJECT_MAP.md`.

## Later (not in this build)

- Mira's big round glasses hide part of the Chibi effect (a female character without glasses reads cuter).
- Heavier brows for men could make them more imposing (not tested).
- L2 3D clothing (`references/looks/README.md`) comes after identity.
