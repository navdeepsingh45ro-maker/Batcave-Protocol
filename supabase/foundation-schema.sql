create extension if not exists pgcrypto;

create table if not exists public.identities (
  id text primary key,
  label text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.foundations (
  id text primary key,
  label text not null unique,
  identity_id text not null references public.identities(id),
  minimum_viable_win text not null,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.foundation_subtypes (
  id text primary key,
  foundation_id text not null references public.foundations(id) on delete cascade,
  label text not null,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (foundation_id, label),
  unique (id, foundation_id)
);

create table if not exists public.constraints (
  id text primary key,
  label text not null unique,
  identity_id text not null references public.identities(id),
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.constraint_subtypes (
  id text primary key,
  constraint_id text not null references public.constraints(id) on delete cascade,
  label text not null,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (constraint_id, label),
  unique (id, constraint_id)
);

create table if not exists public.daily_foundation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  log_date date not null,
  foundation_id text not null references public.foundations(id),
  subtype_id text not null references public.foundation_subtypes(id),
  completed boolean not null default true,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  notes text,
  source text not null default 'quick-checkin',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subtype_id, foundation_id) references public.foundation_subtypes(id, foundation_id),
  unique (user_id, log_date, foundation_id, subtype_id)
);

create table if not exists public.foundation_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  activity_date date not null,
  foundation_id text not null references public.foundations(id),
  subtype_id text not null references public.foundation_subtypes(id),
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  notes text,
  source text not null default 'quick-checkin',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subtype_id, foundation_id) references public.foundation_subtypes(id, foundation_id)
);

create table if not exists public.daily_constraint_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  log_date date not null,
  constraint_id text not null references public.constraints(id),
  subtype_id text not null references public.constraint_subtypes(id),
  completed boolean not null,
  notes text,
  source text not null default 'quick-checkin',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (subtype_id, constraint_id) references public.constraint_subtypes(id, constraint_id),
  unique (user_id, log_date, constraint_id)
);

create table if not exists public.protocol_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_date date not null,
  system_key text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists daily_foundation_logs_user_date_idx
  on public.daily_foundation_logs (user_id, log_date desc);

create index if not exists daily_foundation_logs_foundation_date_idx
  on public.daily_foundation_logs (foundation_id, log_date desc);

create index if not exists foundation_activity_logs_user_date_idx
  on public.foundation_activity_logs (user_id, activity_date desc);

create index if not exists foundation_activity_logs_foundation_date_idx
  on public.foundation_activity_logs (foundation_id, activity_date desc);

create index if not exists daily_constraint_logs_user_date_idx
  on public.daily_constraint_logs (user_id, log_date desc);

create index if not exists protocol_events_user_system_date_idx
  on public.protocol_events (user_id, system_key, event_date desc);

insert into public.identities (id, label)
values
  ('king', 'King'),
  ('builder', 'Builder'),
  ('striker', 'Striker'),
  ('guardian', 'Guardian')
on conflict (id) do update set label = excluded.label;

insert into public.foundations (id, label, identity_id, minimum_viable_win, sort_order)
values
  ('striker_work', 'Striker Work', 'striker', 'Any honest body-forward action counts.', 10),
  ('builder_work', 'Builder Work', 'builder', 'Twenty focused minutes counts.', 20),
  ('mental_reset', 'Mental Reset', 'king', 'One deliberate reset counts.', 30),
  ('knowledge_intake', 'Knowledge Intake', 'builder', 'One useful input counts.', 40),
  ('sleep_protection', 'Sleep Protection', 'guardian', 'Protecting the routine counts, even after a rough day.', 50)
on conflict (id) do update
set label = excluded.label,
    identity_id = excluded.identity_id,
    minimum_viable_win = excluded.minimum_viable_win,
    sort_order = excluded.sort_order;

insert into public.foundation_subtypes (id, foundation_id, label, sort_order)
values
  ('striker_full_session', 'striker_work', 'Full Session', 10),
  ('striker_ball_work', 'striker_work', 'Ball Work', 20),
  ('striker_sprint_work', 'striker_work', 'Sprint Work', 30),
  ('striker_match', 'striker_work', 'Match', 40),
  ('striker_mobility', 'striker_work', 'Mobility', 50),
  ('striker_recovery_walk', 'striker_work', 'Recovery Walk', 60),
  ('builder_budgetbuddy', 'builder_work', 'BudgetBuddy', 10),
  ('builder_coding', 'builder_work', 'Coding', 20),
  ('builder_job_search', 'builder_work', 'Job Search', 30),
  ('builder_learning', 'builder_work', 'Learning', 40),
  ('builder_other', 'builder_work', 'Other', 50),
  ('mental_meditation', 'mental_reset', 'Meditation', 10),
  ('mental_simran', 'mental_reset', 'Simran', 20),
  ('mental_breathing', 'mental_reset', 'Breathing', 30),
  ('mental_reflection', 'mental_reset', 'Reflection', 40),
  ('mental_quiet_walk', 'mental_reset', 'Quiet Walk', 50),
  ('knowledge_book', 'knowledge_intake', 'Book', 10),
  ('knowledge_course', 'knowledge_intake', 'Course', 20),
  ('knowledge_research', 'knowledge_intake', 'Research', 30),
  ('knowledge_useful_article', 'knowledge_intake', 'Useful Article', 40),
  ('knowledge_podcast', 'knowledge_intake', 'Podcast', 50),
  ('sleep_before_target', 'sleep_protection', 'Slept before target', 10),
  ('sleep_routine', 'sleep_protection', 'Protected sleep routine', 20),
  ('sleep_recovery_protocol', 'sleep_protection', 'Recovery protocol followed', 30)
on conflict (id) do update
set foundation_id = excluded.foundation_id,
    label = excluded.label,
    sort_order = excluded.sort_order;

insert into public.constraints (id, label, identity_id, sort_order)
values ('no_porn', 'No Porn', 'guardian', 10)
on conflict (id) do update
set label = excluded.label,
    identity_id = excluded.identity_id,
    sort_order = excluded.sort_order;

insert into public.constraint_subtypes (id, constraint_id, label, sort_order)
values
  ('no_porn_yes', 'no_porn', 'Yes', 10),
  ('no_porn_no', 'no_porn', 'No', 20)
on conflict (id) do update
set constraint_id = excluded.constraint_id,
    label = excluded.label,
    sort_order = excluded.sort_order;
