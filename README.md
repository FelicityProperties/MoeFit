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
3. Click **Deploy**. No environment variables are required — it works out of the box in local-only mode.

The app is a static-friendly Next.js app and needs no backend to run.

---

## Cloud sync with Neon (optional, recommended for phone + laptop)

By default everything is stored in your browser. To sync across devices, turn on
**Neon Postgres** cloud sync. Your whole state is stored as a single JSONB row,
with localStorage kept as an offline cache (it still works with no signal and
syncs when you're back online).

### Set it up on Vercel

1. **Add Neon.** In your Vercel project → **Storage** → **Create Database** →
   **Neon** (Postgres). Vercel provisions it and sets `DATABASE_URL` for you.
   (Or create a DB at [neon.tech](https://neon.tech) and paste its connection
   string into `DATABASE_URL` yourself.)
2. **Add two env vars** in Vercel → Settings → Environment Variables:
   - `NEXT_PUBLIC_CLOUD_ENABLED` = `true`
   - `APP_PASSCODE` = a strong passcode you'll type to unlock the app
3. **Redeploy.** On first load you'll see a passcode screen; the `user_state`
   table is created automatically on the first save. The sidebar shows a live
   **Synced / Syncing / Offline** indicator.

No migrations to run, no schema to manage — the table is `CREATE TABLE IF NOT
EXISTS`-ed on demand (`lib/db.ts`).

### Run cloud mode locally

```bash
cp .env.example .env.local      # then fill in the three values below
# NEXT_PUBLIC_CLOUD_ENABLED=true
# DATABASE_URL=postgres://...    (from the Neon dashboard)
# APP_PASSCODE=your-passcode
npm run dev
```

### How auth works

A single shared **passcode** gates the app (great for personal use). It's checked
server-side; on success an httpOnly cookie (`sha256(passcode)`) is set and every
`/api/state` call is verified against it. Endpoints: `app/api/auth/route.ts`
(login/status/logout) and `app/api/state/route.ts` (read/write, JSONB). For true
multi-user accounts later, swap the passcode for Auth.js / Clerk.

---

## Your data

- **Local mode:** stored in `localStorage` under `moefit:v1`.
- **Cloud mode:** stored in Neon (`user_state` table, JSONB), cached locally.
- **Settings → Your Data** lets you **export** a JSON backup, **import** it, or
  **reset** everything. Conflicts resolve last-write-wins by timestamp.

---

## Connecting a real AI later

The cloud database is already wired up (Neon, see above). The AI coach is still a
fast offline rule-based engine and is the remaining pluggable piece — search the
codebase for `INTEGRATION POINT`:

- **Real AI coach** — `lib/coach.ts`. `askCoach()` and `analyzeMealText()` use a
  fast, offline rule-based engine. To use a real LLM, create an API route (e.g.
  `app/api/coach/route.ts`) that calls OpenAI/Anthropic, then `POST` the message +
  `CoachContext` (already assembled for you) and return the model reply. Gate it
  on `NEXT_PUBLIC_AI_PROVIDER`.
- Copy `.env.example` to `.env.local` and fill in keys when you're ready.

---

## Project structure

```
app/
  (routes)           # dashboard, food, workout, coach, progress, review, settings
  api/auth/route.ts  # passcode login / status / logout
  api/state/route.ts # read/write AppState JSONB (auth-guarded)
components/          # AppShell (nav + sync badge), UI primitives, AuthGate, gates
lib/
  types.ts           # data model
  store.tsx          # React context: localStorage + optional Neon write-through
  db.ts              # server-only Neon access (JSONB user_state)
  auth.ts            # server-only passcode helpers
  calculations.ts    # BMR/TDEE, calorie & macro targets, daily totals
  coach.ts           # the rule-based AI engine (chat, Order Smart, daily review)
  foods.ts           # built-in food/restaurant knowledge base
  workout.ts         # 7-day training plan
  progress.ts        # streaks, weekly discipline, chart series
  defaults.ts        # default routine & missions
```

---

This is built for **personal use**. Stay disciplined.
