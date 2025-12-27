-- Create a secure view for profiles that hides sensitive data based on user relationship
-- Only profile owners, admins, and coordinators see all data
-- Assigned staff see student info but not sensitive health/financial data from other staff
-- Students see basic info about their assigned staff but not sensitive data

CREATE OR REPLACE VIEW public.safe_profiles_view
WITH (security_invoker = true)
AS
SELECT 
    id,
    full_name,
    avatar_url,
    bio,
    timezone,
    languages_spoken,
    availability,
    experience,
    study_objectives,
    staff_type,
    is_approved,
    is_public_profile,
    show_followers,
    show_following,
    social_links,
    created_at,
    updated_at,
    -- Email: only visible to profile owner, admins, and coordinators
    CASE 
        WHEN id = auth.uid() 
             OR has_role(auth.uid(), 'admin'::app_role) 
             OR has_role(auth.uid(), 'coordinator'::app_role)
        THEN email
        ELSE NULL
    END as email,
    -- Age: only visible to profile owner, admins, coordinators, and assigned staff
    CASE 
        WHEN id = auth.uid() 
             OR has_role(auth.uid(), 'admin'::app_role) 
             OR has_role(auth.uid(), 'coordinator'::app_role)
             OR EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = profiles.id AND (sp.teacher_id = auth.uid() OR sp.tutor_id = auth.uid()))
        THEN age
        ELSE NULL
    END as age,
    -- Nationality: only visible to profile owner, admins, coordinators, and assigned staff
    CASE 
        WHEN id = auth.uid() 
             OR has_role(auth.uid(), 'admin'::app_role) 
             OR has_role(auth.uid(), 'coordinator'::app_role)
             OR EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = profiles.id AND (sp.teacher_id = auth.uid() OR sp.tutor_id = auth.uid()))
        THEN nationality
        ELSE NULL
    END as nationality,
    -- Allergies: only visible to profile owner, admins, coordinators, and assigned staff (health info)
    CASE 
        WHEN id = auth.uid() 
             OR has_role(auth.uid(), 'admin'::app_role) 
             OR has_role(auth.uid(), 'coordinator'::app_role)
             OR EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = profiles.id AND (sp.teacher_id = auth.uid() OR sp.tutor_id = auth.uid()))
        THEN allergies
        ELSE NULL
    END as allergies,
    -- Diet: only visible to profile owner, admins, coordinators, and assigned staff (health info)
    CASE 
        WHEN id = auth.uid() 
             OR has_role(auth.uid(), 'admin'::app_role) 
             OR has_role(auth.uid(), 'coordinator'::app_role)
             OR EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = profiles.id AND (sp.teacher_id = auth.uid() OR sp.tutor_id = auth.uid()))
        THEN diet
        ELSE NULL
    END as diet,
    -- Hourly rate: only visible to profile owner, admins, and coordinators (salary info)
    CASE 
        WHEN id = auth.uid() 
             OR has_role(auth.uid(), 'admin'::app_role) 
             OR has_role(auth.uid(), 'coordinator'::app_role)
        THEN hourly_rate
        ELSE NULL
    END as hourly_rate,
    -- Currency: only visible to profile owner, admins, and coordinators
    CASE 
        WHEN id = auth.uid() 
             OR has_role(auth.uid(), 'admin'::app_role) 
             OR has_role(auth.uid(), 'coordinator'::app_role)
        THEN currency
        ELSE NULL
    END as currency,
    -- Approval info: only visible to admins and coordinators
    CASE 
        WHEN has_role(auth.uid(), 'admin'::app_role) 
             OR has_role(auth.uid(), 'coordinator'::app_role)
        THEN approved_by
        ELSE NULL
    END as approved_by,
    CASE 
        WHEN has_role(auth.uid(), 'admin'::app_role) 
             OR has_role(auth.uid(), 'coordinator'::app_role)
        THEN approved_at
        ELSE NULL
    END as approved_at
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.safe_profiles_view TO authenticated;