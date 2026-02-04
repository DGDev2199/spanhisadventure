DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'practice_exercises'
      AND policyname = 'Students can view assigned exercises'
  ) THEN
    EXECUTE 'CREATE POLICY "Students can view assigned exercises"
      ON public.practice_exercises
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.practice_assignments pa
          WHERE pa.exercise_id = practice_exercises.id
            AND pa.student_id = auth.uid()
        )
      )';
  END IF;
END $$;