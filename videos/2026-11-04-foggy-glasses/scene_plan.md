approved: 2026-11-04 (user)
storyboard (A3) approved: 2026-11-04 (user), with the s04 and diagram changes
preview (A4) approved: 2026-11-04 (user, approved together with the fix: s01/s04 re-aimed to the blue street)
preview (A4) re-approved: 2026-11-07 (user), after FB1 (s03 blur_bg 3 → 2, preview re-rendered 2026-11-07 02:14)
# Scene plan — Mira's Foggy Glasses (pipeline test)

12.4 s · 371 frames · 6 shots · dissolves only · sets: night_street (cool) → workshop (warm) → night_street → diagram → workshop

| Shot | Time | Words | Set | Who | Camera | Light |
|---|---|---|---|---|---|---|
| s01 hook | 0.0–1.9 s | Mira walks from the cold night into the warm workshop, | night street, far side (`street_far`) | Mira, neutral, looking right | fast entry, camera on the shop side filming across the street (`front` [0,0,-1], changed at A4) | cool night |
| s02 hook | 1.9–3.7 s | and instantly goes blind. Her | workshop | Mira, **fogged glasses**, surprised on "blind" | push in | warm, lamp on |
| s03 escalation | 3.7–5.2 s | glasses turn white in a single second. | workshop | Mira, fogged, worried | close-up + background blur 2 px (FB1, was 3) | warm |
| s04 turn | 5.2–7.7 s | But outside, in the cold, they're clear. | night street | Mira, clear glasses, thinking → happy on "clear" | close-up, no blur (A3), filmed across the street at `street_far` (A4: the shop window made it read warm) | cool night |
| s05 you-see + reveal | 7.7–10.8 s | You see, cold lenses chill warm air. So its vapor turns to | diagram (paper) | — | 2D push in | flat |
| s06 ending | 10.8–12.4 s | droplets. Homemade fog. | workshop | Mira, fogged, shrug | pull out | warm |

**Diagram (s05), built with the voice:** cold lens (blue circle) on "cold" → warm-air arrow on "chill" → orange
warm-air dots drifting down onto it on "warm" (layout changed at A3: lens lower, dots and arrow above it, clear of the push-in crop) → white droplets on the lens on "turns".

**Checks:** plan check PASS, 1 warning (6 shots for 12.4 s; the reference rhythm gives ~4–5). Variety check PASS.
**New in src:** `roundGlasses` takes an optional lens color; `mira_fogged` = Mira with fogged lenses (cast variant).

**A4 check:** only FAIL = length (12 s test vs 35–60 s rule). Light `CWWC-W`. Open: the blue street measures dark (luma 57–60 vs 74–131) → D3 brightness review; workshop dark → D12.
