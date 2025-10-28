-- Add test_type column to custom_tests table
ALTER TABLE public.custom_tests ADD COLUMN test_type TEXT NOT NULL DEFAULT 'regular' CHECK (test_type IN ('regular', 'final'));

-- Add comment to explain the field
COMMENT ON COLUMN public.custom_tests.test_type IS 'Type of test: regular or final. Final tests allow level reassignment after completion.';