-- Add column to store student's test answers
ALTER TABLE student_profiles 
ADD COLUMN placement_test_answers JSONB;

-- Add comment to document the structure
COMMENT ON COLUMN student_profiles.placement_test_answers IS 'Stores student answers as {question_id: answer_letter} pairs';