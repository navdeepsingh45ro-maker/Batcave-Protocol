# Batcave Protocol V2 - Countermeasure System

## Core Model

The Countermeasure System sits between State Detection and User Action.

Flow:

```text
State
Threat
Underlying Need
Countermeasure
Identity Activation
Mission Redirect
```

The system does not shame the user. It assumes biological urges can arrive automatically and behavioral choices can be redirected consciously. The goal is not suppression. The goal is redirection.

The system answers:

- What is happening to me?
- What should I do next?

## Threats

Threats are configurable in `src/lib/countermeasures/config.ts` and `supabase/countermeasure-schema.sql`.

Initial threats:

- Emotional Escape
- Rumination
- Isolation
- Fatigue
- Perfectionism
- Avoidance
- Digital Overstimulation

Each threat has:

- `id`
- `name`
- `description`
- `severity`
- `associatedStates`

## Underlying Needs

Needs:

- Connection
- Rest
- Validation
- Certainty
- Progress
- Relief
- Stimulation

Threats can map to multiple needs through `threat_need_mappings`.

Example:

```text
Emotional Escape -> Connection, Relief, Validation
```

## Countermeasures

Countermeasures are configurable responses with duration, category, identity activation, target threats, target needs, and mission redirect.

Initial countermeasures:

- Journal Dump: 5 minutes, Mental Reset, activates Guardian, redirects to Recovery Mission.
- Recovery Walk: 10 minutes, Striker Work, activates Striker, redirects to Recovery Mission.
- Deep Breath Reset: 3 minutes, Mental Reset, activates King, redirects to Recovery Mission.
- Builder Sprint: 20 minutes, Builder Work, activates Builder, redirects to Primary Mission.
- Phone Exile: 2 minutes, Digital Control, activates Guardian, redirects to Primary Mission.
- One Step Mission: 5 minutes, Mission Simplification, activates King, redirects to Primary Mission.
- Connection Ping: 5 minutes, Connection, activates Guardian, redirects to Recovery Mission.

## Recommendation Engine

Input:

```ts
{
  selectedStates: ["Lonely", "Heavy"]
}
```

Output:

```ts
{
  detectedThreat: "Emotional Escape",
  recommendedNeed: "Connection",
  recommendedCountermeasure: "Journal Dump",
  recommendedIdentity: "Guardian",
  missionRedirect: "Recovery Mission"
}
```

Logic:

- Score threats by matched selected states and threat severity.
- Pick the highest-priority need mapped to that threat.
- Score countermeasures by threat match, need match, mission preference, priority, and historical completion effectiveness.
- Return the fastest useful action path.

V2.6 expansion: the recommendation engine now supports a countermeasure stack with `PRIMARY`, `SECONDARY`, and `EMERGENCY` recommendations. Each stack item returns its own confidence score and reason.

## Effectiveness Engine

Effectiveness comes from `countermeasure_logs`.

Example:

```text
Journal Dump recommended 30 times
Journal Dump completed 24 times
Effectiveness = 80%
```

Calculated fields:

- recommended count
- accepted count
- completed count
- acceptance rate
- completion rate
- effectiveness score

## Database Schema

Use `supabase/countermeasure-schema.sql`.

Tables:

- `threats`
- `needs`
- `countermeasures`
- `threat_need_mappings`
- `countermeasure_threat_mappings`
- `countermeasure_need_mappings`
- `countermeasure_logs`
- `intervention_history`

The schema assumes `supabase/foundation-schema.sql` exists first because countermeasures reference permanent identities.

## TypeScript Architecture

Files:

- `src/lib/countermeasures/types.ts`: domain types.
- `src/lib/countermeasures/config.ts`: threats, needs, mappings, countermeasures.
- `src/lib/countermeasures/calculations.ts`: recommendation and effectiveness logic.
- `src/lib/countermeasures/localStorageRepository.ts`: local browser persistence.
- `src/lib/countermeasures/apiContracts.ts`: suggested API contracts.
- `src/lib/countermeasures/index.ts`: exports.

## API Routes

- `GET /api/countermeasures/recommend?states=Lonely,Heavy`
  Returns threat, need, countermeasure, identity activation, and mission redirect.

- `POST /api/countermeasures/complete`
  Stores accepted/completed status for a recommendation.

- `GET /api/countermeasures/effectiveness`
  Returns most effective countermeasures.

- `GET /api/threats`
  Returns configurable threats and associated states.

## Local Storage Version

Use `localCountermeasureRepository`.

It stores:

- `batcave.countermeasure.logs.v1`

This supports a private first implementation without auth or a database.

## Future Compatibility

Integration points:

- Foundation Layer: countermeasure categories can map to foundations such as Mental Reset, Builder Work, and Striker Work.
- State Detection: selected states feed directly into `recommendCountermeasure`.
- Weapon System: future weapons can be attached as countermeasure categories or target systems.
- Mission System: mission redirects point to Primary, Secondary, or Recovery Mission.
- AI Analysis Layer: can summarize logs, effectiveness, and recurring threat/need patterns.

The module keeps all core definitions configurable so future systems can extend without rewriting the recommendation engine.
