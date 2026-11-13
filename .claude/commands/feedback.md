---
description: Apply the approved (open) feedback items of a video from videos/<slug>/feedback.md, following generate-animated-shorts
argument-hint: "[slug or part of it, e.g. foggy-glasses]"
---

The user ran `/feedback`. This is the only way feedback gets applied.

Video: $ARGUMENTS

1. **Load the rules.** Use the `generate-animated-shorts` skill and follow it, especially its "Feedback" section, the locked look and the approval stops. Read `docs/PROJECT_MAP.md` if you need to find a file.

2. **Pick the video.** If a slug (or part of one) was given above, match it to a folder in `videos/`. If not, use the video in progress: the newest `videos/<date>-<slug>/` without `final.mp4`. If several fit, ask which one and stop.

3. **List the items.** Read `videos/<slug>/feedback.md`. Show the user a short table of every item that is not resolved: id, title, status, stage, `touches lock`.
   - Apply only `status: open` items (approved by the user).
   - `draft` items: list them as "waiting for your approval (say *aprovo o FB…* with explain-find-feedback)" and don't touch them.
   - `touches lock: yes` items: don't apply; say they wait for the user's v4 decision.
   - No file, or nothing `open`: say so and stop.

4. **Fix each open item**, one at a time, as the `generate-animated-shorts` Feedback section says: confirm the cause in the frames and the code, make the smallest fix, re-run the checks of the step it touches (and `tools/regress_frames.py` after any `src/` change).

5. **Show before and after.** For each item, re-render what is needed to see the fix (storyboard still of the shot, or the preview), then make the before/after image at the item's time:
   ```bash
   .venv/Scripts/python -I tools/feedback_frames.py videos/<slug> <seconds> --item FB<n> --before feedback/FB<n>_sheet.jpg
   ```
   It writes `feedback/FB<n>_after.jpg` and `feedback/FB<n>_compare.jpg` (BEFORE on top, AFTER below). Look at it yourself: if the AFTER row doesn't show the fix, the item is not resolved. If the tool prints `WARNING: AFTER is the same image as BEFORE`, the render is old or the fix didn't land — never mark it resolved.

6. **Mark resolved** only the items that are fixed and checked — re-read the changed file to confirm the new value is really there, and confirm the render you measured is newer than the change: `status: resolved` + the `resolved:` line in the format of the `generate-animated-shorts` Feedback section (with the concrete **before → after** value, so it can be explained in plain words). Anything not fixed stays `open` with a `note:`.

7. **Explain the result in Portuguese.** Use the `explain-find-feedback` skill, mode **RESULT**: for each item it sends `FB<n>_compare.jpg` and a short Portuguese briefing (o que estava errado → o que eu mudei → resultado), then names the approval stop that must be shown again (the items' `stage`) with the exact words. Your technical log stays in `feedback.md`; the user gets the translated version.

8. **Stop** and wait for the user. Don't continue to the next stop of the flow in this turn.
