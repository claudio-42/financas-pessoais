create extension if not exists pgcrypto;

create table if not exists public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  value numeric(12,2) not null check (value > 0),
  due_day smallint not null check (due_day between 1 and 31),
  category text not null check (char_length(category) between 1 and 40),
  start_month text not null check (start_month ~ '^\\d{4}-(0[1-9]|1[0-2])$'),
  duration_months integer check (duration_months is null or duration_months between 1 and 600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  account_id text not null,
  description text not null,
  category text,
  amount numeric(14,2) not null,
  transaction_date date not null,
  status text,
  raw jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.fixed_expenses enable row level security;
alter table public.transactions enable row level security;

create policy "own fixed expenses select" on public.fixed_expenses for select to authenticated using ((select auth.uid()) = user_id);
create policy "own fixed expenses insert" on public.fixed_expenses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own fixed expenses update" on public.fixed_expenses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own fixed expenses delete" on public.fixed_expenses for delete to authenticated using ((select auth.uid()) = user_id);
create policy "own transactions select" on public.transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "own transactions insert" on public.transactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own transactions update" on public.transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.fixed_expenses from anon;
revoke all on public.transactions from anon;
grant select, insert, update, delete on public.fixed_expenses to authenticated;
grant select, insert, update on public.transactions to authenticated;

create index if not exists fixed_expenses_user_id_idx on public.fixed_expenses(user_id);
create index if not exists transactions_user_date_idx on public.transactions(user_id, transaction_date desc);
