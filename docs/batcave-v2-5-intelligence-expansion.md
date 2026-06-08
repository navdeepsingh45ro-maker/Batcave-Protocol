# Batcave Protocol V2.5-V2.8 Intelligence Expansion

## Operating System Shift

This expansion moves Batcave Protocol from static logging toward historical intelligence.

The system should not merely answer:

```text
What happened today?
```

It should answer:

```text
What pattern is forming?
What works when this state appears?
What should happen next?
```

## V2.5 Foundation Expansion

Foundations are still scored as binary daily wins, but they now support unlimited activity logs.

Example:

```json
{
  "foundation": "Builder Work",
  "activities": [
    {
      "type": "BudgetBuddy",
      "duration": 45
    },
    {
      "type": "Job Search",
      "duration": 20
    }
  ]
}
```

This means:

- Builder Work can show `3 activities completed`.
- Striker Work can show `Sprint Work` and `Mobility` on the same day.
- Daily score still counts Builder once.
- Historical analytics can use the richer activity detail.

Backend files:

- `src/lib/foundation/types.ts`
- `src/lib/foundation/calculations.ts`
- `src/lib/foundation/localStorageRepository.ts`
- `supabase/foundation-schema.sql`

New Supabase table:

- `foundation_activity_logs`

## V2.6 Countermeasure Stack

Countermeasure recommendations now return a stack:

- Primary Countermeasure
- Secondary Countermeasure
- Emergency Countermeasure

Each stack item includes:

- detected threat
- underlying need
- countermeasure
- identity activation
- mission redirect
- confidence score
- reason

The engine can consider context:

- selected states
- missed foundation counts
- sleep debt
- recent threats
- recently completed countermeasures

Example:

```text
Fatigued
+ Builder Work missed 3 days
+ Sleep debt

PRIMARY: Sleep Protection
SECONDARY: Recovery Walk
EMERGENCY: Deep Breath Reset
```

Backend files:

- `src/lib/countermeasures/types.ts`
- `src/lib/countermeasures/calculations.ts`
- `src/lib/countermeasures/apiContracts.ts`

## V2.7 Behavioral Timeline

The timeline stores the behavioral chain:

```text
State Check-in
Threat Detected
Countermeasure Accepted
Foundation Completed
```

This lets the Batcomputer ask:

```text
What works?
```

instead of only:

```text
What happened?
```

Backend files:

- `src/lib/behavioral-timeline/types.ts`
- `src/lib/behavioral-timeline/calculations.ts`
- `src/lib/behavioral-timeline/localStorageRepository.ts`
- `src/lib/behavioral-timeline/apiContracts.ts`
- `supabase/behavioral-timeline-schema.sql`

Suggested API routes:

- `POST /api/timeline/events`
- `GET /api/timeline/day?date=YYYY-MM-DD`
- `GET /api/timeline/working-chains?start=YYYY-MM-DD&end=YYYY-MM-DD`

## V2.8 Trend Analytics

Trend analytics generates:

- Weekly Foundation Score
- Monthly Foundation Score
- Weekly Foundation Heatmap
- Foundation Trends
- Identity Participation
- Threat Frequency
- Countermeasure Success Rate

Backend files:

- `src/lib/trend-analytics/types.ts`
- `src/lib/trend-analytics/calculations.ts`
- `src/lib/trend-analytics/apiContracts.ts`

Suggested API route:

- `GET /api/analytics/trends?start=YYYY-MM-DD&end=YYYY-MM-DD`

## Future Integration

Integration path:

- Foundation Layer emits activity completion events.
- State Detection emits state check-in events.
- Countermeasure System emits recommendation, accepted, and completed events.
- Mission System consumes mission redirects.
- AI Analysis Layer summarizes timeline chains and trend analytics.

The design keeps “showing up” protected while giving the operating system enough memory to learn.
