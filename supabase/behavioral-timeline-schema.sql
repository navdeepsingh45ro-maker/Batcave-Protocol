create extension if not exists pgcrypto;

create table if not exists public.behavioral_timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_date date not null,
  occurred_at timestamptz not null default now(),
  event_type text not null,
  states text[] not null default '{}',
  threat_id text references public.threats(id),
  need_id text references public.needs(id),
  countermeasure_id text references public.countermeasures(id),
  foundation_id text references public.foundations(id),
  mission_redirect text check (mission_redirect is null or mission_redirect in ('Primary Mission', 'Secondary Mission', 'Recovery Mission')),
  outcome text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists behavioral_timeline_events_user_date_idx
  on public.behavioral_timeline_events (user_id, event_date desc, occurred_at);

create index if not exists behavioral_timeline_events_type_idx
  on public.behavioral_timeline_events (event_type);

create index if not exists behavioral_timeline_events_states_idx
  on public.behavioral_timeline_events using gin (states);
