# Feedback — 2026-11-04-foggy-glasses

Status flow: `draft` (written, waiting for the user) → `open` (approved, waiting for /feedback) → `resolved` (fixed by /feedback).
Only `open` items are applied, and only when the user runs `/feedback`.

## FB1 — Workshop background too blurred in the close-up
status: resolved
approved: 2026-11-07 (user)
resolved: 2026-11-07 — `scene_plan.json` s03: `blur_bg` 3 → 2 (`scene_plan.md` s03 row noted) — build_props PASS (same 1 warn: shot count); preview re-rendered 02:14 after the 02:13 change; check_render same verdict as approved A4 (only FAIL = 12 s duration of the pipeline test; blur share 20 % PASS) — compare: feedback/FB1_compare.jpg
note: the change is subtle at sheet size; at 1:1 the shelf/jar outlines are visibly crisper (edge strength +5–7 %, `feedback/FB1_detail_3px_vs_2px.png`, left 3 px, right 2 px). If the user still finds it too soft, next step is removing `blur_bg` from s03 (blur share would drop to 0/6 → plan WARN).
reported: 2026-11-07 — "no segundo 4 o fundo fica muito borrado e não dá pra ver a oficina"
where: 4.00 s (frame 120) · shot s03 (escalation) 3.67–5.23 s · set workshop · mira_fogged · camera close_up · frames: `feedback/FB1_sheet.jpg`
stage: preview (approved at A4 → fixing it reopens A4)
problem: in the s03 close-up the whole 3D world layer is blurred, so the workshop details (shelf jars, brick patches, wall cracks, table) read as soft shapes; right after the sharp wide shot s02 the place "disappears" and the cut feels like a different room.
probable cause: `scene_plan.json` s03 `"blur_bg": 3` → `src/episode/Episode.tsx` applies `blur(3px)` (plus `scale(1.02)`) to the whole ThreeCanvas world layer. Rendering is full size (1080×1920), so it is a true 3 px blur, not a scaling artefact.
suggested fix: set s03 `blur_bg` to `2` (lowest value allowed by the plan rules, 2–4). Character stays sharp (separate canvas). Note: the locked v3 close-up uses `blur_shot_px: 3` (`style_lock/locks.json`); 2 px keeps the blur-shot idea but drifts from the locked number, and check_render's blur measure (`blur_shot_sigma_px` 2.0) may warn — accept the warning if the shelves read clearly. If 2 px is still too soft, the alternative is removing `blur_bg` from s03 (but then the blur share, 1-in-10…2-in-5, must still be met by another shot).
scope: this video only
touches lock: no (per-shot plan value inside the 2–4 range; locked reference number is `blur_shot_px: 3`)
