create extension if not exists pgcrypto;

create table if not exists public.emotional_states (
  id text primary key,
  label text not null unique,
  risk_weight integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.risk_thresholds (
  id text primary key,
  level text not null unique check (level in ('GREEN', 'YELLOW', 'ORANGE', 'RED')),
  min_score integer not null,
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_state_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  log_date date not null,
  checked_at timestamptz not null default now(),
  selected_states text[] not null,
  risk_score integer not null,
  risk_level text not null check (risk_level in ('GREEN', 'YELLOW', 'ORANGE', 'RED')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table if not exists public.behavior_outcomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  behavior_date date not null,
  behavior text not null,
  category text not null,
  occurred boolean not null default true,
  foundation_id text references public.foundations(id),
  constraint_id text references public.constraints(id),
  source_system text not null,
  occurred_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.state_correlations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  state text not null,
  behavior text not null,
  behavior_category text not null,
  occurrences_with_state integer not null default 0,
  behavior_occurrences_with_state integer not null default 0,
  behavior_occurrences_without_state integer not null default 0,
  sample_size integer not null default 0,
  correlation_strength numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, state, behavior)
);

create table if not exists public.interventions (
  id uuid primary key default gen_random_uuid(),
  trigger_state text not null,
  recommendation text not null,
  target_system text not null default 'manual',
  priority integer not null default 100,
  effectiveness_score numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trigger_state, recommendation)
);

create table if not exists public.intervention_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  result_date date not null,
  trigger_state text not null,
  recommendation text not null,
  accepted boolean not null,
  effective boolean,
  effectiveness_score numeric,
  recorded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists daily_state_logs_user_date_idx
  on public.daily_state_logs (user_id, log_date desc);

create index if not exists behavior_outcomes_user_date_idx
  on public.behavior_outcomes (user_id, behavior_date desc);

create index if not exists behavior_outcomes_behavior_idx
  on public.behavior_outcomes (behavior, category);

create index if not exists state_correlations_user_strength_idx
  on public.state_correlations (user_id, correlation_strength desc);

create index if not exists intervention_results_user_date_idx
  on public.intervention_results (user_id, result_date desc);

insert into public.emotional_states (id, label, risk_weight)
values
  ('focused', 'Focused', -10),
  ('determined', 'Determined', -10),
  ('calm', 'Calm', -10),
  ('energized', 'Energized', -5),
  ('curious', 'Curious', -5),
  ('restless', 'Restless', 10),
  ('lonely', 'Lonely', 20),
  ('heavy', 'Heavy', 15),
  ('fatigued', 'Fatigued', 15),
  ('overwhelmed', 'Overwhelmed', 20),
  ('uncertain', 'Uncertain', 8),
  ('frustrated', 'Frustrated', 12),
  ('fired_up', 'Fired Up', -5)
on conflict (id) do update
set label = excluded.label,
    risk_weight = excluded.risk_weight;

insert into public.risk_thresholds (id, level, min_score, sort_order)
values
  ('green', 'GREEN', -999, 10),
  ('yellow', 'YELLOW', 10, 20),
  ('orange', 'ORANGE', 25, 30),
  ('red', 'RED', 45, 40)
on conflict (id) do update
set level = excluded.level,
    min_score = excluded.min_score,
    sort_order = excluded.sort_order;

insert into public.interventions (trigger_state, recommendation, target_system, priority)
values
  ('Lonely', 'Journal', 'manual', 10),
  ('Lonely', 'Call someone', 'recovery', 20),
  ('Lonely', 'Go outside', 'recovery', 30),
  ('Lonely', 'Mental Reset', 'foundation', 40),
  ('Fatigued', 'Sleep Protection', 'foundation', 10),
  ('Fatigued', 'Recovery Walk', 'foundation', 20),
  ('Fatigued', 'Reduce workload', 'mission', 30),
  ('Overwhelmed', 'Focus on one mission', 'mission', 10),
  ('Overwhelmed', 'Ignore secondary goals', 'mission', 20),
  ('Overwhelmed', 'Builder minimum viable win', 'foundation', 30),
  ('Restless', 'Move for ten minutes', 'recovery', 10),
  ('Heavy', 'Quiet Walk', 'foundation', 10),
  ('Frustrated', 'Breathing reset', 'foundation', 10),
  ('Uncertain', 'Choose the smallest next action', 'mission', 10)
on conflict (trigger_state, recommendation) do update
set target_system = excluded.target_system,
    priority = excluded.priority;
