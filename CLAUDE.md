# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**KATA** — a gamified vocabulary app where your body is the controller. Players physically act out the meaning of a word (point, touch, strike a pose...) and the camera detects the motion to flip the card. Built for a hackathon under the theme of expanding the user's own thinking, action, and creativity.

**Team Overclocked:** Miki Kamochi, Horise Yoshito

## Commands

```bash
npm run dev      # Start dev server (localhost:5173 + network URL for phones)
npm run build    # tsc -b && vite build → dist/   (type-check is part of the build)
npm run preview  # Preview the production build locally
npx tsc --noEmit # Fast type-check on its own
```

**There is no test or lint script.** Type-checking (via `npm run build` or `npx tsc --noEmit`) is the only automated gate — keep it clean.

**Deploy:** the repo is linked to a Vercel project (`.vercel/project.json`). Deploy with `vercel --prod --yes`. Supabase env vars live in the Vercel project settings (and `.env.local` locally). Pushing to `main` may also trigger an auto-deploy.

## Stack

- **Vite + React + TypeScript** — no router; screens are a union-type state machine in `src/App.tsx`
- **Tailwind CSS** — utility-first, configured in `tailwind.config.js`
- **Teachable Machine Pose** — loaded via CDN in `index.html` (avoids npm peer-dep conflicts); exposes `window.tmPose` (TensorFlow.js + PoseNet under the hood). All detection runs **on-device** — no video leaves the browser.
- **Supabase Realtime** — battle mode only; Broadcast + Presence channels, **no database tables**
- **Deploy:** Vercel (HTTPS required for camera access)

## Architecture

`src/App.tsx` is a typed `Screen` state machine (no router). Screens are remounted via React `key` so internal state resets cleanly on replay/redeck:
```
TopicSelect → GameScreen → ResultScreen
TopicSelect → BattleScreen (own sub-flow)
```

### Core game loop
Webcam frame → `usePoseClassifier` → `{ className, probability }[]` per frame → `MotionMatcher.push()` → match confirmed after N qualifying frames → card clears, next word loads.

### Game-length invariant (important)
Every game plays **exactly `GAME_LENGTH` (= 10) cards**, regardless of deck size. `GameScreen` shuffles the deck and **repeats it** to fill 10. Therefore:
- A player's max score is `GAME_LENGTH`, **not** `deck.cards.length`.
- Any "X out of total" display (ResultScreen score/best, battle progress bars, home best-score %, the Stats sheet) must divide by the exported `GAME_LENGTH` from `src/data/decks.ts`.
- Reserve `deck.cards.length` for "how many distinct cards the deck contains" (book covers, the info-panel "cards" stat).

Mixing these up produces impossible fractions like "10 / 8" and >100% bars — a trap that has already bitten once.

### Matcher rules (`src/game/matcher.ts`)
A frame **qualifies** only when the target motion clears `MATCH_THRESHOLD` **and** beats the `idle` class by `IDLE_MARGIN`. It takes `REQUIRED_HITS` consecutive qualifying frames to confirm; a single bad frame only decrements the count (so flicker doesn't wipe progress). After a match the matcher **disarms** until it sees one non-qualifying frame — this stops a held pose from instantly clearing the next card when consecutive cards share a motion. Class-name matching is **case-insensitive**, so TM labels like `Right` / `T_pose` match the lowercase `motion` strings in decks.

### Battle mode
`src/net/useBattleRoom.ts` owns one Supabase Realtime channel per room (`battle:<code>`). It uses **Presence** (tiny `{id, name}`) + **Broadcast** events only — no DB. Things not to break:
- **Photos travel over broadcast**, not presence: avatars (~10KB base64) exceed Presence's payload limit, so they ride a `profile` broadcast event; late joiners get a re-send.
- **Clock-synced start**: the host broadcasts `startAt = Date.now() + 600ms`; both clients delay mounting `GameScreen` until that wall-clock moment so the 3-2-1 countdown lines up. `BattleScreen` shows a "Get ready…" splash during the gap (not the lobby).
- Both players share a `seed`, so `seededShuffle` (`src/game/shuffle.ts`) gives identical card order.
- `battleEnabled` in `src/lib/supabase.ts` (both env vars present) gates the whole feature; solo mode works without Supabase.
- **Known limitation:** near-simultaneous finishes can each resolve "win" locally (first-to-finish race). Left as-is intentionally.

### i18n + speech
`Lang = "en" | "zh" | "ja"`. `cardText(card, lang)` in `src/data/decks.ts` resolves word/hint with English fallback. `GameScreen` reads the word then the hint aloud via the Web Speech API with per-language voice selection.

### Mock mode
If a deck has no trained model files, the app runs in **mock mode** automatically — a "Simulate motion" button substitutes for real detection. The full game loop is testable without a trained model.

### Fonts (gotcha)
`Syne` is a **wide display face** loaded via CDN in `index.html`. In `tailwind.config.js` it is wired to the **`display`** family only (the `font-display` class — logo/headings). Body text uses the system `sans` stack. **Do not** set Syne as the default `sans` — it makes the entire UI render oversized and wide.

### Key files

| File | Role |
|------|------|
| `src/App.tsx` | Typed screen state machine; remounts screens via `key` |
| `src/data/decks.ts` | `Deck`/`Card`/`Lang` types, `DECKS`, `IDLE_CLASS`, `GAME_LENGTH`, `cardText()` |
| `src/hooks/usePoseClassifier.ts` | Camera setup + TM model loader; auto-falls back to mock |
| `src/game/matcher.ts` | Confidence smoothing — threshold, idle margin, required hits, disarm gate |
| `src/game/shuffle.ts` | Seeded shuffle for matching battle card order |
| `src/components/GameScreen.tsx` | Main game loop: feeds predictions, advances cards, countdown, stopwatch, speech |
| `src/components/BattleScreen.tsx` | Battle orchestration: start sync, "Get ready…" splash, win/lose resolution |
| `src/components/BattleLobby.tsx` | Create/join room, waiting room, profile photo capture |
| `src/net/useBattleRoom.ts` | Supabase Realtime channel: presence, broadcast, start/progress/finish |
| `src/lib/supabase.ts` | Realtime-only client + `battleEnabled` flag |
| `src/lib/sounds.ts` | Named sound events → audio files; plays fail silently |
| `public/models/<deckId>/` | Trained model files (`model.json`, `metadata.json`, `weights.bin`) |

### Adding a new deck
1. Train a Teachable Machine **Pose** project at teachablemachine.withgoogle.com (one class per motion + an `idle` class; 4–8 classes max per model for reliable accuracy).
2. Export → TensorFlow.js → download the 3 files into `public/models/<deckId>/`.
3. Add the deck entry to `DECKS` in `src/data/decks.ts` — `motion` strings must match the TM class names (case-insensitive). Add per-deck cover colors in `TopicSelect.tsx` (`DECK_COLORS`) and `DashboardSheet.tsx` (`DECK_BAR_COLOR`).

### Motion model rules
- Every model **must** include an `idle` class (standing neutral) to prevent false triggers.
- Keep each deck to **4–8 physically distinct** motions — accuracy degrades as classes grow or look similar.
- Held arm/torso poses with distinct silhouettes detect far more reliably than fast or leg-based gestures (the front-facing webcam barely sees fast motions or bent-away torsos).
- Record ~5–10 varied bursts per class (different angles, speeds, both teammates) with balanced sample counts across classes.
