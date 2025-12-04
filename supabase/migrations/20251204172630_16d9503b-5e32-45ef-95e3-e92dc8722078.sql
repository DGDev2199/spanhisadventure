-- Add parent_id column for nested replies in comments
ALTER TABLE public.post_comments 
ADD COLUMN parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- Create index for faster queries on parent_id
CREATE INDEX idx_post_comments_parent_id ON public.post_comments(parent_id);