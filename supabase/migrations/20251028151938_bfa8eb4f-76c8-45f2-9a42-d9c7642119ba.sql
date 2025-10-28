-- 1) Ensure schedule_events has realtime support
alter table public.schedule_events replica identity full;

-- Add table to realtime publication if not already added
do $$ begin
  alter publication supabase_realtime add table public.schedule_events;
exception when duplicate_object then null; end $$;

-- 2) Allow students to update their own student_profiles (to submit placement test)
do $$ begin
  create policy "Students can update their own student profile" on public.student_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;