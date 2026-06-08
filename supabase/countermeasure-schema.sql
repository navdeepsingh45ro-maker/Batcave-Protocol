create extension if not exists pgcrypto;

create table if not exists public.threats (
  id text primary key,
  name text not null unique,
  description text not null,
  severity text not null check (severity in ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  associated_states text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.needs (
  id text primary key,
  name text not null unique,
  description text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.countermeasures (
  id text primary key,
  name text not null unique,
  description text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  category text not null,
  activates_identity_id text references public.identities(id),
  mission_redirect text not null check (mission_redirect in ('Primary Mission', 'Secondary Mission', 'Recovery Mission')),
  priority integer not null default 100,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.threat_need_mappings (
  threat_id text not null references public.threats(id) on delete cascade,
  need_id text not null references public.needs(id) on delete cascade,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  primary key (threat_id, need_id)
);

create table if not exists public.countermeasure_threat_mappings (
  countermeasure_id text not null references public.countermeasures(id) on delete cascade,
  threat_id text not null references public.threats(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (countermeasure_id, threat_id)
);

create table if not exists public.countermeasure_need_mappings (
  countermeasure_id text not null references public.countermeasures(id) on delete cascade,
  need_id text not null references public.needs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (countermeasure_id, need_id)
);

create table if not exists public.countermeasure_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  log_date date not null,
  trigger_states text[] not null default '{}',
  detected_threat_id text not null references public.threats(id),
  detected_need_id text not null references public.needs(id),
  countermeasure_id text not null references public.countermeasures(id),
  identity_id text references public.identities(id),
  mission_redirect text not null check (mission_redirect in ('Primary Mission', 'Secondary Mission', 'Recovery Mission')),
  accepted boolean not null default false,
  completed boolean not null default false,
  completed_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.intervention_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  history_date date not null,
  trigger_state text not null,
  detected_threat_id text not null references public.threats(id),
  recommended_countermeasure_id text not null references public.countermeasures(id),
  accepted boolean not null default false,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists threats_associated_states_idx
  on public.threats using gin (associated_states);

create index if not exists countermeasure_logs_user_date_idx
  on public.countermeasure_logs (user_id, log_date desc);

create index if not exists countermeasure_logs_countermeasure_idx
  on public.countermeasure_logs (countermeasure_id, completed);

create index if not exists intervention_history_user_date_idx
  on public.intervention_history (user_id, history_date desc);

insert into public.threats (id, name, description, severity, associated_states)
values
  ('emotional_escape', 'Emotional Escape', 'A pull to leave discomfort quickly through numbing, scrolling, or sexual release.', 'HIGH', array['Lonely', 'Heavy', 'Overwhelmed', 'Restless']),
  ('rumination', 'Rumination', 'Repeated thought loops that consume attention and intensify emotional load.', 'HIGH', array['Heavy', 'Uncertain', 'Frustrated', 'Lonely']),
  ('isolation', 'Isolation', 'Withdrawal from people or environment when connection would reduce risk.', 'MEDIUM', array['Lonely', 'Heavy', 'Uncertain']),
  ('fatigue', 'Fatigue', 'Low physical or mental energy increasing impulsive or avoidant choices.', 'MEDIUM', array['Fatigued', 'Heavy', 'Overwhelmed']),
  ('perfectionism', 'Perfectionism', 'All-or-nothing pressure that blocks minimum viable action.', 'MEDIUM', array['Uncertain', 'Frustrated', 'Overwhelmed']),
  ('avoidance', 'Avoidance', 'A drift away from conscious action because the next step feels too loaded.', 'HIGH', array['Overwhelmed', 'Uncertain', 'Fatigued', 'Restless']),
  ('digital_overstimulation', 'Digital Overstimulation', 'A pull toward high-stimulation digital input that fragments attention.', 'MEDIUM', array['Restless', 'Frustrated', 'Fired Up', 'Curious'])
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    severity = excluded.severity,
    associated_states = excluded.associated_states;

insert into public.needs (id, name, description)
values
  ('connection', 'Connection', 'Contact, belonging, or being witnessed.'),
  ('rest', 'Rest', 'Reduced load, sleep protection, or recovery.'),
  ('validation', 'Validation', 'Acknowledgment that the emotion is real and workable.'),
  ('certainty', 'Certainty', 'A clear next step that removes ambiguity.'),
  ('progress', 'Progress', 'A small visible win that restores agency.'),
  ('relief', 'Relief', 'A non-destructive release of emotional pressure.'),
  ('stimulation', 'Stimulation', 'Healthy novelty, movement, or intensity.')
on conflict (id) do update
set name = excluded.name,
    description = excluded.description;

insert into public.countermeasures (id, name, description, duration_minutes, category, activates_identity_id, mission_redirect, priority)
values
  ('journal_dump', 'Journal Dump', 'Write thoughts without editing.', 5, 'Mental Reset', 'guardian', 'Recovery Mission', 10),
  ('recovery_walk', 'Recovery Walk', 'Leave current environment and walk.', 10, 'Striker Work', 'striker', 'Recovery Mission', 20),
  ('deep_breath_reset', 'Deep Breath Reset', 'Controlled breathing protocol.', 3, 'Mental Reset', 'king', 'Recovery Mission', 15),
  ('builder_sprint', 'Builder Sprint', '20 minute focused work block.', 20, 'Builder Work', 'builder', 'Primary Mission', 25),
  ('phone_exile', 'Phone Exile', 'Move the phone out of reach and remove the immediate trigger.', 2, 'Digital Control', 'guardian', 'Primary Mission', 12),
  ('one_step_mission', 'One Step Mission', 'Choose one tiny action and ignore secondary goals.', 5, 'Mission Simplification', 'king', 'Primary Mission', 18),
  ('connection_ping', 'Connection Ping', 'Send one honest message or make one quick call.', 5, 'Connection', 'guardian', 'Recovery Mission', 8)
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    duration_minutes = excluded.duration_minutes,
    category = excluded.category,
    activates_identity_id = excluded.activates_identity_id,
    mission_redirect = excluded.mission_redirect,
    priority = excluded.priority;

insert into public.threat_need_mappings (threat_id, need_id, priority)
values
  ('emotional_escape', 'connection', 10),
  ('emotional_escape', 'relief', 20),
  ('emotional_escape', 'validation', 30),
  ('rumination', 'relief', 10),
  ('rumination', 'certainty', 20),
  ('rumination', 'validation', 30),
  ('isolation', 'connection', 10),
  ('isolation', 'relief', 20),
  ('fatigue', 'rest', 10),
  ('fatigue', 'relief', 20),
  ('perfectionism', 'progress', 10),
  ('perfectionism', 'certainty', 20),
  ('avoidance', 'progress', 10),
  ('avoidance', 'certainty', 20),
  ('digital_overstimulation', 'stimulation', 10),
  ('digital_overstimulation', 'relief', 20)
on conflict (threat_id, need_id) do update set priority = excluded.priority;

insert into public.countermeasure_threat_mappings (countermeasure_id, threat_id)
values
  ('journal_dump', 'emotional_escape'),
  ('journal_dump', 'rumination'),
  ('journal_dump', 'isolation'),
  ('recovery_walk', 'fatigue'),
  ('recovery_walk', 'isolation'),
  ('recovery_walk', 'digital_overstimulation'),
  ('deep_breath_reset', 'rumination'),
  ('deep_breath_reset', 'emotional_escape'),
  ('deep_breath_reset', 'avoidance'),
  ('builder_sprint', 'avoidance'),
  ('builder_sprint', 'perfectionism'),
  ('phone_exile', 'digital_overstimulation'),
  ('phone_exile', 'emotional_escape'),
  ('one_step_mission', 'avoidance'),
  ('one_step_mission', 'perfectionism'),
  ('one_step_mission', 'fatigue'),
  ('connection_ping', 'isolation'),
  ('connection_ping', 'emotional_escape')
on conflict do nothing;

insert into public.countermeasure_need_mappings (countermeasure_id, need_id)
values
  ('journal_dump', 'connection'),
  ('journal_dump', 'relief'),
  ('journal_dump', 'validation'),
  ('recovery_walk', 'rest'),
  ('recovery_walk', 'relief'),
  ('recovery_walk', 'stimulation'),
  ('deep_breath_reset', 'relief'),
  ('deep_breath_reset', 'certainty'),
  ('builder_sprint', 'progress'),
  ('builder_sprint', 'certainty'),
  ('phone_exile', 'relief'),
  ('phone_exile', 'certainty'),
  ('one_step_mission', 'progress'),
  ('one_step_mission', 'certainty'),
  ('connection_ping', 'connection'),
  ('connection_ping', 'validation')
on conflict do nothing;
