-- Drop the existing check constraint and add updated one with new event types
ALTER TABLE public.schedule_events 
DROP CONSTRAINT IF EXISTS schedule_events_event_type_check;

ALTER TABLE public.schedule_events 
ADD CONSTRAINT schedule_events_event_type_check 
CHECK (event_type IN ('class', 'tutoring', 'project', 'welcome', 'breakfast', 'lunch', 'break', 'cultural', 'sports', 'adventure', 'exchange', 'dance', 'elective'));