approved: 2026-11-07 (user)
storyboard (A3) approved: 2026-11-07 (user)
storyboard (A3) re-approved: 2026-11-07 (user), after FB2 (z-fighting fix) and FB3 (town, hills, bushes, fences, richer grass)
storyboard (A3) re-approved: 2026-11-07 (user), after FB4 (doors), FB6 (river into the haze, faceted hills on land) and FB7 (76 m shadow box, bridge sun [42, 46, 24])
preview (A4) approved: 2026-11-07 (user)
# Scene plan — The Bridge That Hated Marching

50.9 s · 1527 frames · 23 shots · dissolves + 1 cut (s22, ending punch) · one set: `bridge` (day), playing London today (sign shown) and Broughton 1831 (sign hidden) · 3 diagram inserts

Set "lights" (animated levels): `sign` on in London (s01–s03, s22–s23), off in 1831 · `march` (soldiers bob in step) s06–s11, s20–s21 · `bounce` (deck bounces in time) grows from w:43 "Then" to full on "harder", again s20–s21 · `drop` (left end falls into the river) on "corner drops", reset after s16.

| Shot | Time | Words | Set / place | Who | Camera | Light |
|---|---|---|---|---|---|---|
| s01 hook | 0.0–2.2 s | Soldiers are forbidden to march in step here. | bridge entrance, London today | rifleman beside the BREAK STEP sign, looking at it | fast entry on sign + soldier | day |
| s02 hook | 2.2–4.7 s | A sign on London's Albert Bridge still says so. | same | rifleman, thinking | pull out (sign, soldier, bridge rail) | day |
| s03 escalation | 4.7–6.3 s | It sounds like a silly rule. | same | rifleman, shrug | close-up + blur 3 | day |
| s04 escalation | 6.3–8.1 s | Now you're one of seventy-four soldiers | road before the bridge, 1831 (sign hidden) | 8 riflemen in ranks, "you" front, proud | push in | day |
| s05 escalation | 8.1–10.2 s | near Manchester, in eighteen thirty-one. | the bridge over the river, wide | — | push in, wide (establishing) | day |
| s06 escalation | 10.2–13.1 s | You march four abreast onto the Broughton Suspension Bridge. | bridge entry | 8 riflemen, four abreast, marching | push in | day, march on |
| s07 escalation | 13.1–16.1 s | Then the bridge starts to bounce, in time with your boots. | deck, low (boots + planks) | ranks; "you" surprised on "bounce" | push in on the feet | bounce starts |
| s08 escalation | 16.1–17.9 s | Some of the men think it's funny. So they | deck | rifleman B (mustache), happy → laughing | close-up + blur 3 | bounce |
| s09 escalation | 17.9–20.2 s | whistle a marching tune and step along with the bounce. | deck | ranks whistling (mouths open), laughing | push in | bounce grows |
| s10 escalation | 20.2–22.0 s | It shakes even harder. | deck | "you" surprised → worried | close-up, camera rolls ±2.5° (shake) | bounce full |
| s11 escalation | 22.0–23.5 s | Then one corner drops, | bridge left end, wide | 4 riflemen ride the deck down | push in, wide | **drop** on "corner" |
| s12 escalation | 23.5–25.5 s | and about forty men fall into the river. | river, at the fallen end | 3 riflemen waist-deep, arms up; splash | push in | day |
| s13 escalation | 25.5–27.3 s | Luckily, it's only two feet deep. | river | "you" standing shin-deep, surprised → happy on "two" | close-up + blur 3 | day |
| s14 escalation | 27.3–29.7 s | Nobody dies, but twenty men are hurt. | river | 4 riflemen, sad / worried | pull out | day |
| s15 turn | 29.7–32.2 s | Investigators found a badly made bolt that had snapped. | fallen iron column on the pier | — | push in on the column base | day |
| s16 turn | 32.2–34.5 s | But the marching is what snapped it that day. | river | "you" thinking, looking up | close-up + blur 3 | day |
| s17 you-see | 34.5–37.2 s | You see, every bridge has its own natural swing, | diagram (paper) | — | 2D push in | flat |
| s18 reveal | 37.2–39.9 s | like a playground swing. Push a swing at the right moment, | diagram | — | 2D push in | flat |
| s19 reveal | 39.9–42.4 s | every time, and it goes higher and higher. | diagram | — | 2D pull out | flat |
| s20 reveal | 42.4–44.3 s | Boots landing together are those pushes, | deck, low (boots) | 6 riflemen marching | push in on the feet | bounce + march |
| s21 reveal | 44.3–46.6 s | so each step adds to the last bounce. | bridge middle | 8 riflemen in ranks, "you" worried | pull out | bounce grows to full |
| s22 ending | 46.6–49.1 s | That's why the army still says: break step. | the sign, London today | — | **cut**, push in on the sign | sign back, all still |
| s23 ending | 49.1–50.9 s | Walk like a crowd, not a drum. | bridge middle | 5 riflemen scattered, out of step, happy | push in | still deck |

**Diagrams, built with the voice:**
- s17: two towers + deck; green dots (soldiers) on "every"; up/down red arrows on "natural swing".
- s18: swing frame, ropes and seat; the rider (circle) on "playground"; a push arrow on "Push"; a second one on "moment".
- s19: swing bar; three arrows, each bigger, on "every", "goes", "higher"; the rider at the top on the last "higher".

**Checks:**
- Plan check: PASS, 1 warning: 23 shots for 50.9 s (the reference rhythm gives ~17 ± 25 %, so up to ~21). Why: the escalation has many real steps (march, bounce, laugh, shake, drop, fall, splash, "two feet deep"), and each one gets its own picture on its words. The average shot is 2.2 s (the reference cuts every ~2.4 s), and no shot is under 1.5 s.
- Variety check: PASS, 1 warning: only 1 set. Why: the story happens at one bridge. London (today, with the sign) and Broughton 1831 (sign hidden, ranks, collapse, river) look different, and 3 diagram inserts break it up.
- Storyboard checked by eye (all 23 stills): fixed close-ups that framed the legs (camera aim was the feet), river shots where the camera went under the water, and the modern sign showing in the 1831 bolt shot (new `sign` switch in the set).

**New in src (since A1):** `bridge` set (`src/world/sets/Bridge.tsx` + `bridge.json`: lights `bounce`, `drop`, `march`, `sign`), riflemen cast (`rifleman`, `rifleman_b`, `rifleman_c`; parts `shako`, `riflemanJacket`, `rifle`), new textures, `actorOffset` in the set registry. `regress_frames.py`: PASS.
