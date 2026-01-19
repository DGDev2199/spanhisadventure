-- 1. Update the exercise_type constraint to allow new types
ALTER TABLE public.practice_exercises 
DROP CONSTRAINT IF EXISTS practice_exercises_exercise_type_check;

ALTER TABLE public.practice_exercises 
ADD CONSTRAINT practice_exercises_exercise_type_check 
CHECK (exercise_type = ANY (ARRAY[
  'flashcard'::text, 
  'conjugation'::text, 
  'vocabulary'::text, 
  'sentence_order'::text, 
  'multiple_choice'::text, 
  'fill_gaps'::text, 
  'reading'::text
]));

-- 2. Award "Primera Semana" badge to students who have completed weeks but don't have it yet
INSERT INTO public.user_badges (user_id, badge_id)
SELECT DISTINCT spw.student_id, b.id
FROM public.student_progress_weeks spw
CROSS JOIN public.badges b
WHERE spw.is_completed = true
  AND b.criteria_type = 'weeks_completed'
  AND b.criteria_value = 1
  AND NOT EXISTS (
    SELECT 1 FROM public.user_badges ub 
    WHERE ub.user_id = spw.student_id 
    AND ub.badge_id = b.id
  );

-- 3. Award points for badges (related_id is UUID)
INSERT INTO public.user_points (user_id, points, reason, related_id)
SELECT DISTINCT spw.student_id, b.points_reward, 'badge_earned', b.id
FROM public.student_progress_weeks spw
CROSS JOIN public.badges b
WHERE spw.is_completed = true
  AND b.criteria_type = 'weeks_completed'
  AND b.criteria_value = 1
  AND b.points_reward IS NOT NULL
  AND b.points_reward > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.user_points up 
    WHERE up.user_id = spw.student_id 
    AND up.related_id = b.id
    AND up.reason = 'badge_earned'
  );