-- Run once in Supabase: SQL Editor → New query → paste → Run.

-- Every action Tala takes in the app (answers, lessons, tests, games...).
create table if not exists public.events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  client_ts timestamptz,
  type text not null,
  data jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_user_time on public.events (user_id, client_ts desc);

-- Latest snapshot of her progress (words, units, streak, time per day).
create table if not exists public.learner_state (
  user_id uuid primary key references auth.users on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

-- Who may watch whom (Eslam → Tala).
create table if not exists public.viewers (
  viewer_id uuid not null references auth.users on delete cascade,
  learner_id uuid not null references auth.users on delete cascade,
  primary key (viewer_id, learner_id)
);

alter table public.events enable row level security;
alter table public.learner_state enable row level security;
alter table public.viewers enable row level security;

create or replace function public.can_view(learner uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select learner = auth.uid()
      or exists (select 1 from public.viewers v where v.viewer_id = auth.uid() and v.learner_id = learner);
$$;

drop policy if exists "own insert" on public.events;
create policy "own insert" on public.events for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "view" on public.events;
create policy "view" on public.events for select to authenticated using (public.can_view(user_id));

drop policy if exists "own insert" on public.learner_state;
create policy "own insert" on public.learner_state for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "own update" on public.learner_state;
create policy "own update" on public.learner_state for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "view" on public.learner_state;
create policy "view" on public.learner_state for select to authenticated using (public.can_view(user_id));

drop policy if exists "own rows" on public.viewers;
create policy "own rows" on public.viewers for select to authenticated using (viewer_id = auth.uid());

grant select, insert on public.events to authenticated;
grant select, insert, update on public.learner_state to authenticated;
grant select on public.viewers to authenticated;

-- Short messages from Eslam, shown on Tala's home screen.
create table if not exists public.notes (
  id bigint generated always as identity primary key,
  learner_id uuid not null references auth.users on delete cascade,
  author_id uuid not null default auth.uid() references auth.users on delete cascade,
  text text not null check (char_length(text) <= 500),
  created_at timestamptz not null default now()
);
alter table public.notes enable row level security;
drop policy if exists "view" on public.notes;
create policy "view" on public.notes for select to authenticated using (public.can_view(learner_id));
drop policy if exists "viewer writes" on public.notes;
create policy "viewer writes" on public.notes for insert to authenticated
  with check (author_id = auth.uid() and exists (select 1 from public.viewers v where v.viewer_id = auth.uid() and v.learner_id = notes.learner_id));
grant select, insert on public.notes to authenticated;

-- Step 2, after creating both users under Authentication → Users → Add user:
-- replace the two e-mail addresses and run this line.
-- insert into public.viewers (viewer_id, learner_id)
--   select e.id, t.id from auth.users e, auth.users t
--   where e.email = 'ESLAM@EXAMPLE.COM' and t.email = 'TALA@EXAMPLE.COM';
