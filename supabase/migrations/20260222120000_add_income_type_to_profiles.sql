alter table public.profiles
add column if not exists income_type text not null default 'fixed'
check (income_type in ('fixed', 'freelance'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, currency, monthly_income, income_type, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'currency', 'PYG'),
    case
      when new.raw_user_meta_data->>'monthly_income' is null then null
      else (new.raw_user_meta_data->>'monthly_income')::numeric
    end,
    coalesce(new.raw_user_meta_data->>'income_type', 'fixed'),
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
