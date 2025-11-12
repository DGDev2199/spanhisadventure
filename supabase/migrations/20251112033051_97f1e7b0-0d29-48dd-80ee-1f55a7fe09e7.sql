-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'task', 'schedule', 'event', 'room', 'assignment', 'extra_hours'
  read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID, -- ID of the related entity (task_id, schedule_id, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_related_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger function for task assignments
CREATE OR REPLACE FUNCTION public.notify_task_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  teacher_name TEXT;
BEGIN
  SELECT full_name INTO teacher_name FROM profiles WHERE id = NEW.teacher_id;
  
  PERFORM create_notification(
    NEW.student_id,
    'Nueva Tarea Asignada',
    'El profesor ' || COALESCE(teacher_name, 'desconocido') || ' te ha asignado una nueva tarea: ' || NEW.title,
    'task',
    NEW.id
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_created
AFTER INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.notify_task_assignment();

-- Trigger function for student schedule assignments
CREATE OR REPLACE FUNCTION public.notify_schedule_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_name TEXT;
  day_name TEXT;
BEGIN
  -- Get day name
  day_name := CASE NEW.day_of_week
    WHEN 0 THEN 'Domingo'
    WHEN 1 THEN 'Lunes'
    WHEN 2 THEN 'Martes'
    WHEN 3 THEN 'Miércoles'
    WHEN 4 THEN 'Jueves'
    WHEN 5 THEN 'Viernes'
    WHEN 6 THEN 'Sábado'
  END;
  
  IF NEW.schedule_type = 'class' THEN
    SELECT full_name INTO staff_name FROM profiles WHERE id = NEW.teacher_id;
    PERFORM create_notification(
      NEW.student_id,
      'Nuevo Horario de Clase',
      'Se te ha asignado una clase los ' || day_name || ' de ' || NEW.start_time || ' a ' || NEW.end_time || ' con el profesor ' || COALESCE(staff_name, 'desconocido'),
      'schedule',
      NEW.id
    );
  ELSE
    SELECT full_name INTO staff_name FROM profiles WHERE id = NEW.tutor_id;
    PERFORM create_notification(
      NEW.student_id,
      'Nuevo Horario de Tutoría',
      'Se te ha asignado una tutoría los ' || day_name || ' de ' || NEW.start_time || ' a ' || NEW.end_time || ' con el tutor ' || COALESCE(staff_name, 'desconocido'),
      'schedule',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_student_schedule_created
AFTER INSERT ON public.student_class_schedules
FOR EACH ROW
EXECUTE FUNCTION public.notify_schedule_assignment();

-- Trigger function for room assignments
CREATE OR REPLACE FUNCTION public.notify_room_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.room IS NOT NULL AND (OLD.room IS NULL OR OLD.room != NEW.room) THEN
    PERFORM create_notification(
      NEW.user_id,
      'Asignación de Cuarto',
      'Se te ha asignado el cuarto: ' || NEW.room,
      'room',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_room_assigned
AFTER UPDATE ON public.student_profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_room_assignment();

-- Trigger function for teacher/tutor assignments
CREATE OR REPLACE FUNCTION public.notify_staff_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  teacher_name TEXT;
  tutor_name TEXT;
BEGIN
  -- Notify about teacher assignment
  IF NEW.teacher_id IS NOT NULL AND (OLD.teacher_id IS NULL OR OLD.teacher_id != NEW.teacher_id) THEN
    SELECT full_name INTO teacher_name FROM profiles WHERE id = NEW.teacher_id;
    PERFORM create_notification(
      NEW.user_id,
      'Asignación de Profesor',
      'Se te ha asignado el profesor: ' || COALESCE(teacher_name, 'desconocido'),
      'assignment',
      NEW.id
    );
  END IF;
  
  -- Notify about tutor assignment
  IF NEW.tutor_id IS NOT NULL AND (OLD.tutor_id IS NULL OR OLD.tutor_id != NEW.tutor_id) THEN
    SELECT full_name INTO tutor_name FROM profiles WHERE id = NEW.tutor_id;
    PERFORM create_notification(
      NEW.user_id,
      'Asignación de Tutor',
      'Se te ha asignado el tutor: ' || COALESCE(tutor_name, 'desconocido'),
      'assignment',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_staff_assigned
AFTER UPDATE ON public.student_profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_staff_assignment();

-- Trigger function for extra hours approval
CREATE OR REPLACE FUNCTION public.notify_extra_hours_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approver_name TEXT;
BEGIN
  IF NEW.approved = true AND (OLD.approved IS NULL OR OLD.approved = false) THEN
    SELECT full_name INTO approver_name FROM profiles WHERE id = NEW.approved_by;
    PERFORM create_notification(
      NEW.user_id,
      'Horas Extra Aprobadas',
      'Tus ' || NEW.hours || ' horas extra han sido aprobadas por ' || COALESCE(approver_name, 'el administrador'),
      'extra_hours',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_extra_hours_approved
AFTER UPDATE ON public.extra_hours
FOR EACH ROW
EXECUTE FUNCTION public.notify_extra_hours_approval();