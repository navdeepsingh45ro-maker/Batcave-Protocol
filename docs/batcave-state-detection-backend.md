# Batcave Protocol V1.5 - State Detection System

## Core Model

The State Detection System answers two questions:

- What state am I in?
- What should I do next?

It is not a productivity tracker and it is not a judgment system. It stores emotional state signals, calculates risk, and recommends interventions before state changes become destructive behaviors.

## Daily State Check-In

The check-in is designed for under ten seconds:

- User taps one or more states.
- Backend stores `date`, `selectedStates`, `timestamp`, `riskScore`, and `riskLevel`.
- Backend returns recommended next actions.

States:

```text
Focused, Determined, Calm, Energized, Curious, Restless, Lonely, Heavy,
Fatigued, Overwhelmed, Uncertain, Frustrated, Fired Up
```

## Risk Engine

Risk values are configurable in `src/lib/state-detection/config.ts` and Supabase `emotional_states.risk_weight`.

Default examples:

- Lonely: `+20`
- Heavy: `+15`
- Fatigued: `+15`
- Overwhelmed: `+20`
- Restless: `+10`
- Focused: `-10`
- Calm: `-10`
- Determined: `-10`

Risk levels:

- `GREEN`: below 10
- `YELLOW`: 10+
- `ORANGE`: 25+
- `RED`: 45+

## Behavior Correlation

The system does not assume a state causes a behavior. It learns patterns from stored data.

Correlation inputs:

- `daily_state_logs`: what state was selected on a date.
- `behavior_outcomes`: what happened on that date.

Examples of behavior outcomes:

- `No Porn failure`
- `Missed Builder Work`
- `Missed Striker Work`
- `Instagram scrolling`
- `Avoidance`
- `Mission abandoned`

Correlation strength is calculated as:

```text
behavior rate on days with state - behavior rate on days without state
```

The result is stored as a percentage-like score. A positive score means the behavior appears more often when the state is present. A negative score means it appears less often.

## Intervention System

Interventions are configurable. They can point toward Foundation Layer, Mission System, Recovery Protocols, Weapon System, Threat Detection, or manual action.

Examples:

- Lonely: Journal, call someone, go outside, Mental Reset.
- Fatigued: Sleep Protection, Recovery Walk, reduce workload.
- Overwhelmed: focus on one mission, ignore secondary goals, Builder minimum viable win.

Effectiveness is learned from `intervention_results`, where the user or system records whether an intervention helped.

## Database Schema

Use `supabase/state-detection-schema.sql`.

Tables:

- `emotional_states`: configurable state list and risk weights.
- `risk_thresholds`: configurable level thresholds.
- `daily_state_logs`: date, timestamp, selected states, risk score, risk level.
- `behavior_outcomes`: behavior events imported from Foundation Layer, constraints, missions, threats, recovery, or manual entry.
- `state_correlations`: learned state-to-behavior statistics.
- `interventions`: configurable recommendations by trigger state.
- `intervention_results`: effectiveness feedback.

## TypeScript Architecture

Files:

- `src/lib/state-detection/types.ts`: domain types.
- `src/lib/state-detection/config.ts`: states, weights, thresholds, interventions.
- `src/lib/state-detection/calculations.ts`: risk scoring, recommendations, correlations, analytics.
- `src/lib/state-detection/localStorageRepository.ts`: local browser persistence.
- `src/lib/state-detection/apiContracts.ts`: suggested API contracts.
- `src/lib/state-detection/index.ts`: exports.

## API Endpoints

Suggested routes:

- `GET /api/state-detection/config`
  Returns states, risk weights, thresholds, and interventions.

- `POST /api/state-detection/check-in`
  Stores a quick state check-in and returns risk level plus recommendations.

- `GET /api/state-detection/today?date=2026-06-05`
  Returns the current state, risk score, risk level, and next actions.

- `GET /api/state-detection/correlations?start=2026-06-01&end=2026-06-30`
  Returns learned state-to-behavior correlations.

- `GET /api/state-detection/analytics?start=2026-06-01&end=2026-06-30`
  Returns common states, highest-risk days, state trends, correlations, and intervention effectiveness.

- `POST /api/state-detection/interventions/result`
  Records whether an intervention was accepted and whether it helped.

## Local Storage Version

Use `localStateDetectionRepository`.

It stores:

- `batcave.state.logs.v1`
- `batcave.behavior.outcomes.v1`
- `batcave.intervention.results.v1`

This supports a private first version with no auth and no database.

## Supabase Version

Run:

```text
supabase/foundation-schema.sql
supabase/state-detection-schema.sql
```

The state schema references foundation and constraint IDs for behavior outcomes, so the foundation schema should exist first.

For production:

- Enable Row Level Security on user-owned tables.
- Allow users to read global state/intervention config.
- Restrict logs, outcomes, correlations, and intervention results to `user_id = auth.uid()`.

## State Analytics

Implemented calculations:

- Most common emotional states: `calculateMostCommonStates(logs)`
- Highest-risk days: `getHighestRiskDays(logs)`
- State trends: `calculateMostCommonStates(logs, 20)`
- State-to-behavior correlations: `calculateStateCorrelations(stateLogs, behaviorOutcomes)`
- Most effective interventions: `getMostEffectiveInterventions(results)`

## Future Integration

Compatibility paths:

- Foundation Layer can emit missed/completed foundation outcomes into `behavior_outcomes`.
- No Porn constraint can emit `No Porn success` or `No Porn failure`.
- Threat Detection can import risk level as a threat signal.
- Mission System can use risk level to simplify missions on hard days.
- Weapon System can recommend tools based on trigger states.
- Recovery Protocols can receive intervention recommendations.
- AI Analysis Layer can summarize trends without rewriting scoring rules.

Design rule: the system never says the user is weak. It says what state is active and what action could help next.
