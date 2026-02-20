-- Track Save: Auth + Profiles + Finance tables with secure defaults

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  currency text not null default 'PYG' check (currency in ('PYG', 'USD')),
  monthly_income numeric(14, 2) null check (monthly_income is null or monthly_income >= 0),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  description text not null,
  category text not null,
  type text not null check (type in ('Income', 'Expense')),
  account text not null check (account in ('Cash', 'Bank', 'Card')),
  amount numeric(14, 2) not null check (amount >= 0),
  tags text[] null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute procedure public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.finance_transactions;
create trigger set_transactions_updated_at
before update on public.finance_transactions
for each row
execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, currency, monthly_income, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'currency', 'PYG'),
    case
      when new.raw_user_meta_data->>'monthly_income' is null then null
      else (new.raw_user_meta_data->>'monthly_income')::numeric
    end,
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.finance_transactions enable row level security;

-- Profiles policies

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  auth.uid() = id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Transactions policies

drop policy if exists "transactions_select_own_or_admin" on public.finance_transactions;
create policy "transactions_select_own_or_admin"
on public.finance_transactions
for select
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "transactions_insert_own" on public.finance_transactions;
create policy "transactions_insert_own"
on public.finance_transactions
for insert
with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own_or_admin" on public.finance_transactions;
create policy "transactions_update_own_or_admin"
on public.finance_transactions
for update
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "transactions_delete_own_or_admin" on public.finance_transactions;
create policy "transactions_delete_own_or_admin"
on public.finance_transactions
for delete
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);
