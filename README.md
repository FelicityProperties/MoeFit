# MoeFit Command Center

Your personal **life operating system** for weight loss, food control, discipline, workouts, and daily structure. A live daily dashboard that acts like your personal AI fitness, food, and routine coach.

Built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts**. All your data is saved **locally in your browser** — no account, no server needed. Structured so you can connect a real AI API or a cloud database (Supabase / Firebase) later.

---

## Features

### 1. Daily Command Dashboard (`/`)
- Live date + ticking clock and a "Right now" banner telling you what you should be doing this hour.
- Hour-by-hour schedule with the current block highlighted and "up next".
- Quick rings/stats: calories remaining, water, protein, weight.
- **Today's Mission** — 3–5 checkable daily goals.
- Coach line that changes with the time of day.

### 2. Weight Loss & Food Control (`/food`)
- Calorie target auto-calculated from your weight, goal, height, age, activity, and timeline (Mifflin-St Jeor BMR → TDEE → safe deficit).
- Track calories + protein / carbs / fat / water against targets.
- Food log with quick-add chips and a built-in food database.
- **Order Smart** — describe a restaurant/delivery meal and the coach tells you: is it good for weight loss, approx calories & macros, better alternatives, and whether to eat it now or avoid it. One tap to log it.

### 3. Workout Planner (`/workout`)
- A 7-day fat-loss split: gym, cardio, running, HIIT, burpees, recovery, and rest days.
- Time-aware recommendation for *when* to train today.
- Track each session: completed / skipped / modified.
- **Adaptive coaching** — miss a workout and the plan adjusts with a recovery suggestion.
- Weekly calendar showing planned vs completed.

### 4. Personal AI Coach (`/coach`)
- A strict-but-supportive chatbot. Ask things like *"Can I eat this burger?"*, *"Is Coke Zero okay?"*, *"Should I work out now or later?"*, *"I feel lazy, what should I do?"*, *"How many calories should I eat today?"*
- Answers use your live context (calories left, water, today's workout, weight).

### 5. Daily Routine Control
- Editable hour-by-hour routine (morning → night) drives the dashboard's live "what to do now".

### 6. Progress Tracking (`/progress`)
- Charts: weight trend (with goal line), calories vs target (14 days), workout consistency, water (7 days), weekly discipline score.
- Streaks: workout, clean eating, calorie control, water.
- Before/after progress notes.

### 7. AI Daily Review (`/review`)
- End-of-day check-in: did you work out, what did you eat, did you overeat, energy level, what to improve.
- Generates a **score out of 100**, a grade, and a short report.

### 8. Design
- Modern, masculine, premium dark UI with dashboard cards, charts, calendar blocks, and a chat panel.
- Fully mobile-friendly (bottom tab nav on phones, sidebar on desktop).

---

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, go to **Settings**, and fill in your profile. Your plan is generated instantly.

Other scripts:

```bash
npm run build   # production build
npm run start   # run the production build
```

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com/new), **Import** the repo. Framework preset: **Next.js** (auto-detected).
3. Click **Deploy**. No environment variables are required — it works out of the box.

The app is a static-friendly Next.js app and needs no backend.

---

## Your data

- Stored in `localStorage` under the key `moefit:v1`.
- **Settings → Your Data** lets you **export** a JSON backup, **import** it on another device, or **reset** everything.
- Data is per-browser/per-device. Back up before clearing your browser.

---

## Connecting a real AI / cloud later

The code is structured with clear integration points (search the codebase for `INTEGRATION POINT`):

- **Real AI coach** — `lib/coach.ts`. `askCoach()` and `analyzeMealText()` currently use a fast, offline rule-based engine. To use a real LLM, create an API route (e.g. `app/api/coach/route.ts`) that calls OpenAI/Anthropic, then `POST` the message + `CoachContext` (already assembled for you) and return the model reply. Gate it on `NEXT_PUBLIC_AI_PROVIDER`.
- **Cloud sync** — `lib/store.tsx`. Replace `loadState()` / `saveState()` with Supabase/Firebase calls. The `AppState` shape is plain JSON and maps cleanly to a table/document.
- Copy `.env.example` to `.env.local` and fill in keys when you're ready.

---

## Project structure

```
app/                 # routes (dashboard, food, workout, coach, progress, review, settings)
components/          # AppShell (nav), UI primitives, gates
lib/
  types.ts           # data model
  store.tsx          # localStorage-backed React context (the "database")
  calculations.ts    # BMR/TDEE, calorie & macro targets, daily totals
  coach.ts           # the rule-based AI engine (chat, Order Smart, daily review)
  foods.ts           # built-in food/restaurant knowledge base
  workout.ts         # 7-day training plan
  progress.ts        # streaks, weekly discipline, chart series
  defaults.ts        # default routine & missions
```

---

This is built for **personal use**. Stay disciplined.
