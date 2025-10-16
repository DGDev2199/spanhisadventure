-- ============================================
-- 🔧 FIX: Repara relación entre student_profiles y profiles
-- ============================================

alter table if exists public.student_profiles
drop constraint if exists student_profiles_user_id_fkey;

alter table public.student_profiles
add constraint student_profiles_user_id_fkey
foreign key (user_id)
references public.profiles (id)
on delete cascade;
