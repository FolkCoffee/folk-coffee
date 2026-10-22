-- FOLk Coffee planner: one-time database setup for syncing between devices.
-- Paste this into Supabase → SQL Editor → New query, then press Run.

create table if not exists public.planner_state (
  owner uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Only the signed-in owner can read or change their own data.
alter table public.planner_state enable row level security;

drop policy if exists "owner can read" on public.planner_state;
create policy "owner can read" on public.planner_state
  for select to authenticated using ((select auth.uid()) = owner);

drop policy if exists "owner can insert" on public.planner_state;
create policy "owner can insert" on public.planner_state
  for insert to authenticated with check ((select auth.uid()) = owner);

drop policy if exists "owner can update" on public.planner_state;
create policy "owner can update" on public.planner_state
  for update to authenticated using ((select auth.uid()) = owner) with check ((select auth.uid()) = owner);

-- Send live updates to your other devices.
do $$ begin
  alter publication supabase_realtime add table public.planner_state;
exception when duplicate_object then null;
end $$;
