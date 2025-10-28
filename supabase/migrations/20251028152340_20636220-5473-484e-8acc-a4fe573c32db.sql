-- Create test_answers table for student test responses
create table if not exists public.test_answers (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.test_assignments(id) on delete cascade,
  question_id uuid not null references public.test_questions(id) on delete cascade,
  answer_text text,
  is_correct boolean,
  points_earned int default 0,
  created_at timestamptz not null default now()
);

alter table public.test_answers enable row level security;

do $$ begin
  create policy "Students can manage their own test answers" on public.test_answers
  for all using (
    public.has_role(auth.uid(),'student') and
    exists (select 1 from public.test_assignments where id = test_answers.assignment_id and student_id = auth.uid())
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Teachers can view answers for their tests" on public.test_answers
  for select using (
    public.has_role(auth.uid(),'teacher') and
    exists (
      select 1 from public.test_assignments ta
      join public.custom_tests ct on ta.test_id = ct.id
      where ta.id = test_answers.assignment_id and ct.teacher_id = auth.uid()
    )
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can manage all test answers" on public.test_answers
  for all using (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;