-- FOLk planner: inbox so Claude can drop recipes and purchases into your app.
-- Paste into Supabase -> SQL Editor -> New query, then press Run. Safe to run again.
-- Claude only gets an inbox code. The code can add items to the inbox and nothing else:
-- it cannot read your recipes, prices, orders or the inbox itself.

create table if not exists public.planner_inbox (
  id bigint generated always as identity primary key,
  owner uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('add', 'buy')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  done_at timestamptz
);
alter table public.planner_inbox enable row level security;

drop policy if exists "owner reads inbox" on public.planner_inbox;
create policy "owner reads inbox" on public.planner_inbox
  for select to authenticated using ((select auth.uid()) = owner);
drop policy if exists "owner marks inbox done" on public.planner_inbox;
create policy "owner marks inbox done" on public.planner_inbox
  for update to authenticated using ((select auth.uid()) = owner) with check ((select auth.uid()) = owner);
drop policy if exists "owner clears inbox" on public.planner_inbox;
create policy "owner clears inbox" on public.planner_inbox
  for delete to authenticated using ((select auth.uid()) = owner);

-- Your inbox code (made in the app under More -> Settings).
create table if not exists public.planner_inbox_keys (
  owner uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  code text not null unique check (length(code) >= 20)
);
alter table public.planner_inbox_keys enable row level security;

drop policy if exists "owner reads code" on public.planner_inbox_keys;
create policy "owner reads code" on public.planner_inbox_keys
  for select to authenticated using ((select auth.uid()) = owner);
drop policy if exists "owner makes code" on public.planner_inbox_keys;
create policy "owner makes code" on public.planner_inbox_keys
  for insert to authenticated with check ((select auth.uid()) = owner);
drop policy if exists "owner changes code" on public.planner_inbox_keys;
create policy "owner changes code" on public.planner_inbox_keys
  for update to authenticated using ((select auth.uid()) = owner) with check ((select auth.uid()) = owner);

-- The only door in: add one item, if the code is right.
create or replace function public.inbox_add(code text, kind text, payload jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  o uuid;
  new_id bigint;
begin
  select k.owner into o from public.planner_inbox_keys k where k.code = inbox_add.code;
  if o is null then
    raise exception 'wrong inbox code';
  end if;
  if inbox_add.kind not in ('add', 'buy') then
    raise exception 'unknown kind';
  end if;
  if octet_length(inbox_add.payload::text) > 60000 then
    raise exception 'too big';
  end if;
  if (select count(*) from public.planner_inbox i where i.owner = o and i.done_at is null) >= 50 then
    raise exception 'inbox full';
  end if;
  insert into public.planner_inbox (owner, kind, payload)
    values (o, inbox_add.kind, inbox_add.payload)
    returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.inbox_add(text, text, jsonb) from public;
grant execute on function public.inbox_add(text, text, jsonb) to anon, authenticated;
