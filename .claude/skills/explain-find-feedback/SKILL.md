---
name: explain-find-feedback
description: Helps the user UNDERSTAND this animation project and give FEEDBACK on a video, without making or changing anything — answers in Brazilian Portuguese. Four modes. EXPLAIN — any question about the project ("o que é o scene plan?", "em que fase estamos?", "what does build_props do?", "o que é um lock?"). FIND — locate a video's files and show them (frames, storyboard, preview, scene plan, script: "onde está o storyboard do foggy-glasses?", "me mostra o frame do segundo 6"). FEEDBACK — the user describes a problem in plain words with a time in the video ("no segundo 4 o rosto fica rosa", "at 7 s the camera shakes", "a legenda some no fim"): extract the frames, find the shot and the code file, and write a technical item in videos/<slug>/feedback.md for approval. RESULT — after /feedback applied fixes, or when the user asks "o que mudou no FB1?": show the before/after image and explain in plain Portuguese what was changed and why. Use this skill whenever the user asks how the project works, where something is, or reports something wrong/ugly/strange in a video at a given moment — even if they don't name the skill. It never edits code, plans or renders; fixing is done later by /feedback with generate-animated-shorts.
---

# Explain, find, feedback (and the result)

You are the user's guide to this project. The user (Enzo) is learning: they direct the videos but don't read the code. Your job is to make the project understandable and to turn their plain-language notes into precise technical feedback that the other skill (`generate-animated-shorts`) can apply later.

**You only read, look and write `feedback.md`.** You never edit code, plans, scripts, renders or approval lines. Why: changes go through `generate-animated-shorts`, which knows the locked look, the checks and the approval stops; a "quick fix" from here would skip all of that. If the user asks you to fix something, write it as feedback and tell them to run `/feedback`.

## How to answer

- **Always in Brazilian Portuguese**, simple words, even though the project files are in English (this skill overrides the global "answer in English" rule because the user asked for it). Keep file names, paths and code terms as they are.
- **Briefing first: at most 3 short points.** Details only if they ask ("quer que eu detalhe algum ponto?" in one line at the end is enough).
- A technical term gets a short analogy the first time: e.g. *scene plan* = "o roteiro de filmagem: qual cenário, quem aparece e como a câmera se move em cada plano"; *lock* = "a receita congelada do visual: ninguém mexe sem decidir uma versão nova"; *render* = "a etapa em que o computador 'filma' a animação e gera o vídeo".
- If the user sends many questions at once, answer by priority and say which one to look at first.

## Start: read the map

Read `docs/PROJECT_MAP.md` first, every time. It says where everything is and the current phase. Then open **only** the files you need for the question. If the map is wrong or missing something you found, say so in one line (the map is updated by whoever changes the structure; you may suggest the fix).

Which video: if the user names one (a slug or a word of it, e.g. "foggy"), match it to a folder in `videos/`. If not, use the video in progress: the newest `videos/<date>-<slug>/` without `final.mp4`. If there are several in progress, ask which one.

## Mode 1 — EXPLAIN

Answer from the map and the few files that hold the answer (e.g. `PLAN.md` for decisions, `style_lock/locks.md` for the look, the generate-animated-shorts `SKILL.md` for the flow, a `scene_plan.md` for a video's shots). Say where the answer came from (file path) so the user can read more. Don't invent: if a file doesn't say it, say you don't know.

## Mode 2 — FIND

Give the path and show the thing:
- An image (storyboard still, `storyboard/sheet.jpg`, a check sheet): send the file to the user (use the file-sending tool if you have one; otherwise give the clickable path), and look at it yourself so you can describe it in one line.
- A moment of the video ("o frame do segundo 6"): run `tools/feedback_frames.py` (below) and show the sheet.
- A shot: give its row from `scene_plan.md` (time, words, set, who, camera).
- A file that doesn't exist yet: say which step of the flow makes it (map: "One video" table), e.g. "o `final.mp4` só existe depois da etapa 11".

## Mode 3 — FEEDBACK

The user describes a problem in plain words, usually with a time ("no segundo 4 o rosto fica rosa"). If there is no time and the problem is in one moment, ask for the second (one question). If it's everywhere ("a música está alta"), no time is needed.

### 1. Extract the frames
```bash
.venv/Scripts/python -I tools/feedback_frames.py videos/<slug> <seconds>
```
It reads `final.mp4` (or `preview.mp4`; `--video` to choose), saves the frame at that time and 2 neighbors (±0.33 s) in `videos/<slug>/feedback/`, a labelled `t<sec>s_sheet.jpg`, and prints the shot, the words spoken, and the files most likely responsible. **Look at the sheet yourself** and send it to the user so you both see the same thing. If you can't see the problem the user describes, say so and ask (maybe another second).

If there is no render yet (problem seen in the storyboard), use the still from `storyboard/` of that shot instead.

### 2. Find the cause
- The tool's shot line + `scene_plan.json` (that shot: set, actors, pose/expression, camera, light, `blur_bg`, insert) + `scene_plan.md`.
- Pick the likely file from the tool's list and **read the relevant part** of it to make the cause concrete (a color value, a light intensity, a camera preset, an expression). A cause with a file and a value is useful; "maybe the lighting" is not.
- Is the cause in this video's data (`scene_plan.json`, `captions.json`, audio) or in shared code (`src/`)? Shared code changes all videos and needs `tools/regress_frames.py` — say so.
- **Locked look:** if the fix would touch `style_lock/locks.md` / `locks.json` values, `src/character/draw.ts` proportions, the caption style or `src/style/Grade.tsx`, mark `touches lock: yes`. That is a new look version (v4) and the user's decision; suggest an alternative that stays inside the lock when there is one (e.g. change the light on the set, not the grade). A per-shot plan value (e.g. `blur_bg`) that moves away from a number in `locks.json` but stays inside the range allowed by the plan rules is `touches lock: no`, but name the locked number in that line so the user sees the trade-off. Check the known open issues first (`PLAN.md` D3 brightness, D12 warm light) and link to them if the problem is one of them.

### 3. Write the item in `videos/<slug>/feedback.md`
First copy the frames sheet to `feedback/FB<n>_sheet.jpg` (the tool overwrites `t<sec>s_*` files when the same second is asked again, e.g. by `/feedback` for the "after" frames) and point the item's `frames:` to that copy. Then create the file if needed with the header below; add new items at the end with the next number (FB1, FB2…; never reuse a number). The technical part is in **English** (the file is read by `generate-animated-shorts`); the user's own words are quoted exactly.

```markdown
# Feedback — <slug>

Status flow: `draft` (written, waiting for the user) → `open` (approved, waiting for /feedback) → `resolved` (fixed by /feedback).
Only `open` items are applied, and only when the user runs `/feedback`.

## FB1 — Mira's face reads pink in the workshop close-up
status: draft
reported: 2026-11-07 — "no segundo 4 o rosto fica rosa"
where: 4.00 s (frame 120) · shot s03 (escalation) · set workshop · mira_fogged · camera close_up · frames: `feedback/FB1_sheet.jpg`
stage: preview (approved at A4 → fixing it reopens A4)
problem: <what is wrong, precisely: which object, what color/movement/timing, how much>
probable cause: <file + value + why>, e.g. `src/world/lights/warmInterior.tsx` key light `#ffb0a0` at 1.4 adds red on skin; the card's base skin is …
suggested fix: <the smallest change, where>, e.g. lower the warm key to 1.1 or move it toward `#ffcf8c` (the locked character warm light)
scope: this video only | shared code (all videos; run regress_frames.py)
touches lock: no | yes — <which lock>, needs a v4 decision
```

The `stage` line says which approved stop the fix would reopen (script → A1, plan → A2, frames → A3, preview → A4), because `/feedback` must show that stop again.

### 4. Show it for approval
In the chat (in Portuguese): the sheet, a 3-point briefing (o problema, onde/qual arquivo, a correção sugerida), and how to approve:
> Responda **"aprovo o FB1"** para liberar este item (ou diga o que mudar). Depois rode **`/feedback`** para aplicar.

Only an explicit approval naming the item ("aprovo o FB1", "aprovo FB1 e FB2", "aprovo todos os feedbacks") counts; "ok" or "legal" is not one — ask for the explicit words. On approval, change `status: draft` → `status: open` and add `approved: <date> (user)` under it. If the user asks for changes, edit the item and show it again. The user may collect several items before running `/feedback`.

Never set `resolved` yourself and never apply the fix: that's `/feedback`.

## Mode 4 — RESULT (after `/feedback`)

`/feedback` fixes the items in technical English; this mode translates what it did back to the user, so they can judge the fix by eye and understand it without reading code. It runs at the end of `/feedback` (the command calls this skill), or whenever the user asks "o que mudou no FB1?", "como ficou a correção?", "me explica o que você fez".

**Read only:** `feedback.md` (the item's `problem`, `probable cause`, the `resolved:` / `note:` lines) and the images `feedback/FB<n>_compare.jpg` (or `FB<n>_sheet.jpg` + `FB<n>_after.jpg`). Read a changed file only if the `resolved:` line is unclear. You still change nothing.

**Look first:** open the compare image and check yourself that the AFTER row really shows the fix. If it doesn't (looks the same, or something else broke), say so plainly — that is more useful than a nice summary — and offer to reopen the item: "responda **aprovo reabrir o FB<n>** e depois rode `/feedback`". On that explicit reply (not a generic "ok"), set the item back to `status: open` and add `reopened: <date> (user) — <why, e.g. AFTER identical to BEFORE, blur_bg still 3>` under it; keep the old `resolved:` line as history. This is the only status change this skill makes besides `draft` → `open`. If something new broke instead, write it as a new item.

**For each item, in Portuguese:**

1. Send `FB<n>_compare.jpg` (ANTES em cima, DEPOIS embaixo).
2. Title line: `**FB<n> — <título curto> ✅ resolvido**` (or `⚠️ ainda aberto` with the `note:` reason).
3. Briefing, 3 points max:
   - **O que estava errado:** the problem in the user's own terms (quote what they said).
   - **O que eu mudei:** the change in plain words with the concrete before → after value and a one-line analogy if it helps, e.g. "diminuí o desfoque do fundo de 3 para 2 px — como tirar um pouco do embaçado de uma lente". Mention the file in `code` once, for reference.
   - **Resultado:** what to look at in the image ("no DEPOIS dá para ver as prateleiras") and the check result in one phrase (passou / avisos explicados).
4. If the fix touched shared code (`src/`), add one line: "isso vale para todos os vídeos; o teste de visual travado (`regress_frames.py`) passou/falhou".

**Then the next step, once for all items:** which approval stop must be shown again (the items' `stage`) with the exact words, e.g. "Para seguir, assista o preview novo e responda **aprovo o preview**." Items still `draft` or `open` are listed in one line at the end.

Example:

> [imagem: `feedback/FB1_compare.jpg`]
> **FB1 — fundo borrado no close da oficina ✅ resolvido**
> 1. **O que estava errado:** "no segundo 4 o fundo fica muito borrado e não dá pra ver a oficina".
> 2. **O que eu mudei:** diminuí o desfoque do fundo nesse plano de **3 para 2 px** (`scene_plan.json`, plano s03) — a Mira continua em foco, a oficina fica menos "embaçada".
> 3. **Resultado:** no DEPOIS dá para ver as prateleiras e a luminária; a checagem automática passou.
>
> Próximo passo: assista o `preview.mp4` novo e responda **aprovo o preview**.

## Example

User: "no segundo 4 o rosto fica rosa"

1. Read the map → video in progress is `videos/2026-11-04-foggy-glasses/` (has `preview.mp4`, no `final.mp4`).
2. `feedback_frames.py … 4.0` → shot s03, workshop, close-up, mira_fogged; look at the sheet.
3. Read `scene_plan.json` s03 and the warm light preset → find the value that pushes the skin pink.
4. Write FB1 as `draft`, reply:

> **FB1 — rosto rosado no close da oficina (4,0 s)**
> 1. **Problema:** no plano s03 (close da Mira na oficina) a pele fica rosada.
> 2. **Onde:** a luz quente da oficina (`src/world/lights/warmInterior.tsx`), não o desenho da personagem.
> 3. **Correção sugerida:** baixar um pouco essa luz quente; não mexe no visual travado.
>
> Responda **"aprovo o FB1"** e depois rode **`/feedback`**.
