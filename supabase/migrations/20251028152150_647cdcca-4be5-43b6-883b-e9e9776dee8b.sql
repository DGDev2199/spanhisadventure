-- 1) Create test_templates table
create table if not exists public.test_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  test_type text not null,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.test_templates enable row level security;

do $$ begin
  create policy "Teachers can manage their templates" on public.test_templates
  for all using (public.has_role(auth.uid(),'teacher') and teacher_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can manage all templates" on public.test_templates
  for all using (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;

-- 2) Create test_assignments table FIRST
create table if not exists public.test_assignments (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.custom_tests(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed','graded')),
  score int,
  answers jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  graded_at timestamptz,
  feedback text,
  created_at timestamptz not null default now(),
  unique(test_id, student_id)
);

alter table public.test_assignments enable row level security;

do $$ begin
  create policy "Students can view their assignments" on public.test_assignments
  for select using (public.has_role(auth.uid(),'student') and student_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Students can update their assignments" on public.test_assignments
  for update using (public.has_role(auth.uid(),'student') and student_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Teachers can manage assignments for their tests" on public.test_assignments
  for all using (
    public.has_role(auth.uid(),'teacher') and
    exists (select 1 from public.custom_tests where id = test_assignments.test_id and teacher_id = auth.uid())
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can manage all assignments" on public.test_assignments
  for all using (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;

-- 3) Now create test_questions table (with policy referencing test_assignments)
create table if not exists public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.custom_tests(id) on delete cascade,
  question_type text not null check (question_type in ('multiple_choice','free_text','true_false')),
  question_text text not null,
  options jsonb,
  correct_answer text,
  points int not null default 1,
  order_number int not null,
  created_at timestamptz not null default now()
);

alter table public.test_questions enable row level security;

do $$ begin
  create policy "Teachers can manage questions for their tests" on public.test_questions
  for all using (
    public.has_role(auth.uid(),'teacher') and 
    exists (select 1 from public.custom_tests where id = test_questions.test_id and teacher_id = auth.uid())
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can manage all test questions" on public.test_questions
  for all using (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Students can view questions for assigned tests" on public.test_questions
  for select using (
    public.has_role(auth.uid(),'student') and
    exists (select 1 from public.test_assignments where test_id = test_questions.test_id and student_id = auth.uid())
  );
exception when duplicate_object then null; end $$;

-- 4) Create template_questions table
create table if not exists public.template_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.test_templates(id) on delete cascade,
  question_type text not null check (question_type in ('multiple_choice','free_text','true_false')),
  question_text text not null,
  options jsonb,
  correct_answer text,
  points int not null default 1,
  order_number int not null,
  created_at timestamptz not null default now()
);

alter table public.template_questions enable row level security;

do $$ begin
  create policy "Teachers can manage questions for their templates" on public.template_questions
  for all using (
    public.has_role(auth.uid(),'teacher') and
    exists (select 1 from public.test_templates where id = template_questions.template_id and teacher_id = auth.uid())
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can manage all template questions" on public.template_questions
  for all using (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;

-- 5) Create staff_hours table
create table if not exists public.staff_hours (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  hours_worked decimal(5,2) not null check (hours_worked >= 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.staff_hours enable row level security;

do $$ 
begin
  create trigger staff_hours_set_updated_at
  before update on public.staff_hours
  for each row execute function public.update_updated_at_column();
exception when duplicate_object then null; 
end $$;

do $$ begin
  create policy "Staff can view their own hours" on public.staff_hours
  for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Staff can manage their own hours" on public.staff_hours
  for all using (user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Admins can manage all staff hours" on public.staff_hours
  for all using (public.has_role(auth.uid(),'admin'));
exception when duplicate_object then null; end $$;

-- 6) Add question_type column to placement_tests if missing
do $$ 
begin
  alter table public.placement_tests add column if not exists question_type text not null default 'text';
  alter table public.placement_tests add column if not exists audio_url text;
  
  -- Add check constraint only if column exists and constraint doesn't exist
  if not exists (select 1 from pg_constraint where conname = 'placement_tests_question_type_check') then
    alter table public.placement_tests add constraint placement_tests_question_type_check 
      check (question_type in ('text','audio_response','audio_listen'));
  end if;
exception when others then null;
end $$;