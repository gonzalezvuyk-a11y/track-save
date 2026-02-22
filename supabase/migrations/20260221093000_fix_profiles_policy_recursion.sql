-- Fix RLS infinite recursion on public.profiles by avoiding self-referential policy subqueries.

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = check_user_id and p.role = 'admin'
  );
$$;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (
  auth.uid() = id
  or public.is_admin(auth.uid())
);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
using (
  auth.uid() = id
  or public.is_admin(auth.uid())
)
with check (
  (
    auth.uid() = id
    and role = 'user'
  )
  or public.is_admin(auth.uid())
);

drop policy if exists "transactions_select_own_or_admin" on public.finance_transactions;
create policy "transactions_select_own_or_admin"
on public.finance_transactions
for select
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);

drop policy if exists "transactions_update_own_or_admin" on public.finance_transactions;
create policy "transactions_update_own_or_admin"
on public.finance_transactions
for update
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
)
with check (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);

drop policy if exists "transactions_delete_own_or_admin" on public.finance_transactions;
create policy "transactions_delete_own_or_admin"
on public.finance_transactions
for delete
using (
  auth.uid() = user_id
  or public.is_admin(auth.uid())
);
