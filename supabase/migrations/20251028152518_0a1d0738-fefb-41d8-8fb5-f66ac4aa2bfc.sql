-- Recrear tabla staff_hours con las columnas correctas
drop table if exists public.staff_hours cascade;

create table public.staff_hours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total_hours decimal(10,2) not null default 0 check (total_hours >= 0),
  calculated_hours decimal(10,2) not null default 0 check (calculated_hours >= 0),
  manual_adjustment_hours decimal(10,2) not null default 0,
  last_calculated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

alter table public.staff_hours enable row level security;

-- Trigger for updated_at
create trigger staff_hours_set_updated_at
before update on public.staff_hours
for each row execute function public.update_updated_at_column();

do $$ begin
  create policy "Staff can view their own hours" on public.staff_hours
  for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can manage all staff hours" on public.staff_hours
  for all using (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;