-- 1) Create schedule_events table if missing
create table if not exists public.schedule_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null check (event_type in ('class','tutoring','activity','exam','break')),
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  level public.cefr_level,
  color text default '#e5e7eb',
  room_id uuid references public.rooms(id) on delete set null,
  teacher_id uuid references public.profiles(id) on delete set null,
  tutor_id uuid references public.profiles(id) on delete set null,
  created_by uuid not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint end_after_start check (end_time > start_time)
);

-- Enable RLS
alter table public.schedule_events enable row level security;

-- Trigger for updated_at
create trigger schedule_events_set_updated_at
before update on public.schedule_events
for each row execute function public.update_updated_at_column();

-- Realtime support
alter table public.schedule_events replica identity full;
alter publication supabase_realtime add table public.schedule_events;

-- RLS Policies for schedule_events
-- Admins manage all
do $$ begin
  create policy "Admins can manage schedule events" on public.schedule_events
  for all using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;

-- Teachers can view
do $$ begin
  create policy "Teachers can view schedule events" on public.schedule_events
  for select using (public.has_role(auth.uid(),'teacher'));
exception when duplicate_object then null; end $$;

-- Tutors can view
do $$ begin
  create policy "Tutors can view schedule events" on public.schedule_events
  for select using (public.has_role(auth.uid(),'tutor'));
exception when duplicate_object then null; end $$;

-- Students can view active events
do $$ begin
  create policy "Students can view active schedule events" on public.schedule_events
  for select using (public.has_role(auth.uid(),'student') and is_active = true);
exception when duplicate_object then null; end $$;

-- Only admins can insert/update/delete (already covered by first policy), enforce created_by matches auth.uid on insert
-- Additional policy to allow insert for admins with created_by = auth.uid()
do $$ begin
  create policy "Admins can insert schedule events" on public.schedule_events
  for insert with check (public.has_role(auth.uid(),'admin') and created_by = auth.uid());
exception when duplicate_object then null; end $$;

-- 2) Allow students to update their own student_profiles (to submit placement test)
do $$ begin
  create policy "Students can update their own student profile" on public.student_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- 3) Create storage bucket for placement test audio responses
insert into storage.buckets (id, name, public)
values ('student-audio-responses','student-audio-responses', true)
on conflict (id) do nothing;

-- Storage policies for the bucket
-- Public read
do $$ begin
  create policy "Public read for student-audio-responses" on storage.objects
  for select using (bucket_id = 'student-audio-responses');
exception when duplicate_object then null; end $$;

-- Users can upload their own audio (first folder must be their user id)
do $$ begin
  create policy "Users can upload audio to their folder" on storage.objects
  for insert with check (
    bucket_id = 'student-audio-responses'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );
exception when duplicate_object then null; end $$;

-- Users can update their own audio
do $$ begin
  create policy "Users can update their own audio" on storage.objects
  for update using (
    bucket_id = 'student-audio-responses'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
exception when duplicate_object then null; end $$;

-- Users can delete their own audio
do $$ begin
  create policy "Users can delete their own audio" on storage.objects
  for delete using (
    bucket_id = 'student-audio-responses'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
exception when duplicate_object then null; end $$;