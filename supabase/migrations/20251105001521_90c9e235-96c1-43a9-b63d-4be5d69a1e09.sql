-- Make placement test options nullable for audio question types
ALTER TABLE placement_tests 
ALTER COLUMN option_a DROP NOT NULL,
ALTER COLUMN option_b DROP NOT NULL,
ALTER COLUMN option_c DROP NOT NULL,
ALTER COLUMN option_d DROP NOT NULL,
ALTER COLUMN correct_answer DROP NOT NULL;

-- Add initial_feedback to student_profiles for placement test results
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS initial_feedback text;