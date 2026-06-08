# Batcave Protocol V1 - Foundation Layer Backend

## Core Model

Batcave Protocol stores daily proof that the user showed up. A partial session is valid. A recovery walk can satisfy Striker Work. Twenty minutes can satisfy Builder Work. The backend stores the context, but it does not judge the day as failed because a perfect target was missed.

The five foundations are scored. `No Porn` is tracked as a separate constraint so foundation progress is not erased by one failure.

V2.5 expansion: foundations can now store unlimited activity entries per day through `foundation_activity_logs`. A foundation still counts once for daily score, but the system can preserve details such as Builder Work containing BudgetBuddy, Job Search, and Learning on the same date.

## Database Schema

Use the SQL in `supabase/foundation-schema.sql`.

Main tables:

- `identities`: permanent identities: King, Builder, Striker, Guardian.
- `foundations`: the five scored foundations and their identity owner.
- `foundation_subtypes`: flexible completion options.
- `constraints`: separate non-score constraints such as No Porn.
- `constraint_subtypes`: Yes/No choices for constraints.
- `daily_foundation_logs`: daily foundation completions with subtype, duration, notes, source, and metadata.
- `foundation_activity_logs`: unlimited activity entries under a foundation for a date.
- `daily_constraint_logs`: daily constraint logs.
- `protocol_events`: future-compatible event stream for Threat Detection, Weapons, Missions, XP, Recovery, and AI Analysis.

## TypeScript Types

Types live in `src/lib/foundation/types.ts`.

Important shapes:

```ts
interface DailyFoundationLog {
  date: ISODate;
  foundation: FoundationType;
  subtype: FoundationSubtype;
  completed: boolean;
  durationMinutes?: number;
  notes?: string;
}
```

Example:

```ts
{
  date: "2026-06-04",
  foundation: "Builder Work",
  subtype: "BudgetBuddy",
  completed: true,
  durationMinutes: 45
}
```

## Backend Architecture

Recommended layers:

- `src/lib/foundation/config.ts`: permanent identities, foundation definitions, subtypes, and minimum viable wins.
- `src/lib/foundation/types.ts`: domain types and API DTOs.
- `src/lib/foundation/calculations.ts`: pure score and analytics functions.
- `src/lib/foundation/localStorageRepository.ts`: browser-only local storage persistence for v1.
- `supabase/foundation-schema.sql`: production-ready relational schema.

Keep calculations pure. Repositories should only load/save. API routes should validate input, call repositories, then call calculation helpers.

## API Endpoints

Suggested Next.js route structure:

- `GET /api/foundations/config`
  Returns identities, foundations, subtypes, constraints, and minimum viable wins.

- `POST /api/foundations/log`
  Creates or updates one foundation completion.

- `GET /api/foundations/today?date=2026-06-04`
  Returns completed and missed foundations for the date.

- `GET /api/foundations/weekly?start=2026-06-01&end=2026-06-07`
  Returns daily scores and weekly average.

- `GET /api/foundations/analytics?start=2026-06-01&end=2026-06-30`
  Returns most common subtype, streaks, completion frequency, and identity participation.

- `POST /api/constraints/no-porn`
  Creates or updates the daily No Porn constraint log.

Request body for `POST /api/foundations/log`:

```json
{
  "date": "2026-06-04",
  "foundation": "Builder Work",
  "subtype": "BudgetBuddy",
  "durationMinutes": 45,
  "notes": "Shipped one small slice."
}
```

## Calculations

Implemented in `src/lib/foundation/calculations.ts`.

- Daily Foundation Score: completed unique foundations / 5.
- Weekly Foundation Score: average of daily scores.
- Identity Activity Score: days where an identity had at least one completed foundation / total days.
- Consistency Score: current showing-up streak, best showing-up streak, and completion frequency.
- Most Common Foundation Subtype: highest count among completed logs.

Showing-up streak means at least one foundation was completed that day. This supports bad days instead of punishing them.

## Suggested Folder Structure

```text
src/
  app/
    api/
      foundations/
        config/route.ts
        log/route.ts
        today/route.ts
        weekly/route.ts
        analytics/route.ts
      constraints/
        no-porn/route.ts
  lib/
    foundation/
      calculations.ts
      config.ts
      index.ts
      localStorageRepository.ts
      types.ts
supabase/
  foundation-schema.sql
docs/
  batcave-foundation-backend.md
```

## Local Storage Version

Use `localFoundationRepository` from `src/lib/foundation/localStorageRepository.ts`.

It stores:

- `batcave.foundation.logs.v1`
- `batcave.constraint.logs.v1`

This is ideal for the first interactive version because the user can log a day with quick buttons and no backend account setup.

## Supabase Version

Run `supabase/foundation-schema.sql` in Supabase SQL editor.

For production:

- Enable Row Level Security on log tables.
- Add policies so users can only read/write rows where `user_id = auth.uid()`.
- Keep foundation definitions global and readable.
- Store future systems in dedicated tables later, using `protocol_events` only as a compatibility event stream.

## Foundation Analytics Queries

Backend functions already support:

- Foundations completed today: `getCompletedFoundationTypes(logs, date)`
- Foundations missed today: `getMissedFoundationTypes(logs, date)`
- Weekly completion trends: `calculateWeeklyFoundationScore(logs, start, end)`
- Most common foundation subtype: `getMostCommonFoundationSubtype(logs)`
- Longest streak: `calculateConsistencyScore(logs, start, end).bestStreak`
- Current streak: `calculateConsistencyScore(logs, start, end).currentStreak`
- Identity participation rate: `calculateAllIdentityActivityScores(logs, start, end)`

## Future Compatibility

Future systems should connect by adding their own domain tables and optionally writing summarized events to `protocol_events`:

- `system_key`: `threat-detection`, `weapon-system`, `mission-system`, `xp-system`, `recovery-protocols`, `ai-analysis`.
- `event_type`: concise action name.
- `payload`: structured JSON payload.

Foundation scoring should remain independent so future XP, missions, or AI analysis cannot accidentally turn the foundation layer into perfection tracking.
