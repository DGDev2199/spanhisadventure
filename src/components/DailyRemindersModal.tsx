import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ElectiveSelectionModal } from '@/components/ElectiveSelectionModal';
import { Sun, BookOpen, Sparkles, Clock } from 'lucide-react';

interface ScheduleEvent {
  id: string;
  title: string;
  event_type: string;
  start_time: string;
  end_time: string;
  details_info?: string | null;
  elective_option_1?: string | null;
  elective_option_2?: string | null;
}

const EVENT_TYPE_CONFIG: Record<string, { emoji: string }> = {
  class: { emoji: '📚' },
  tutoring: { emoji: '👨‍🏫' },
  project: { emoji: '🎯' },
  welcome: { emoji: '👋' },
  breakfast: { emoji: '🍳' },
  lunch: { emoji: '🍽️' },
  break: { emoji: '☕' },
  cultural: { emoji: '🎭' },
  sports: { emoji: '⚽' },
  adventure: { emoji: '🏔️' },
  exchange: { emoji: '🌎' },
  dance: { emoji: '💃' },
  elective: { emoji: '📖' },
};

export const DailyRemindersModal = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showElectiveModal, setShowElectiveModal] = useState(false);
  const [electiveEvent, setElectiveEvent] = useState<ScheduleEvent | null>(null);

  const today = new Date();
  // Convert JS day (0=Sun, 1=Mon...) to our format (0=Mon, 1=Tue...)
  const jsDay = today.getDay();
  const dayOfWeek = jsDay === 0 ? 5 : jsDay - 1; // Sunday becomes Saturday (5), otherwise shift by 1
  const todayString = today.toISOString().split('T')[0];

  // Fetch today's events
  const { data: todayEvents } = useQuery({
    queryKey: ['today-events', dayOfWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedule_events')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .order('start_time');
      
      if (error) throw error;
      return data as ScheduleEvent[];
    },
  });

  // Note: Tasks are optional - will only show if the table exists
  // For now, skip tasks query to avoid type issues
  const pendingTasks: { id: string; title: string }[] = [];

  // Check for existing elective selection
  const electiveToday = todayEvents?.find(e => e.event_type === 'elective') || null;
  
  const { data: existingSelection } = useQuery({
    queryKey: ['elective-selection-check', electiveToday?.id, todayString],
    queryFn: async () => {
      if (!user?.id || !electiveToday?.id) return null;
      const { data } = await supabase
        .from('student_elective_selections')
        .select('selected_option')
        .eq('student_id', user.id)
        .eq('event_id', electiveToday.id)
        .eq('event_date', todayString)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id && !!electiveToday?.id,
  });

  // Check if elective reminder should show (1 hour before)
  useEffect(() => {
    if (!todayEvents || !electiveToday) return;
    
    const [eventHour, eventMin] = electiveToday.start_time.split(':').map(Number);
    const eventMinutes = eventHour * 60 + eventMin;
    const nowMinutes = today.getHours() * 60 + today.getMinutes();
    
    // If elective is in less than 60 min and hasn't passed, and no selection yet
    if (eventMinutes - nowMinutes <= 60 && eventMinutes > nowMinutes && !existingSelection) {
      setElectiveEvent(electiveToday);
      setShowElectiveModal(true);
    }
  }, [todayEvents, existingSelection, electiveToday]);

  // Check if should show morning reminder (8-10 AM)
  useEffect(() => {
    const hour = today.getHours();
    if (hour >= 8 && hour <= 10) {
      const hasSeenToday = localStorage.getItem(`reminder-${today.toDateString()}`);
      if (!hasSeenToday) {
        // Small delay to not overwhelm user immediately
        const timer = setTimeout(() => {
          setShowModal(true);
          localStorage.setItem(`reminder-${today.toDateString()}`, 'true');
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  // Filter special events with details
  const specialEvents = todayEvents?.filter(e => 
    ['adventure', 'cultural', 'sports', 'exchange'].includes(e.event_type) && e.details_info
  ) || [];

  const hasPendingTasks = pendingTasks && pendingTasks.length > 0;
  const hasElective = !!electiveToday && !existingSelection;
  const hasSpecialEvents = specialEvents.length > 0;

  // Don't show if nothing to show
  const hasContent = hasPendingTasks || hasElective || hasSpecialEvents;

  return (
    <>
      {/* Morning reminder modal */}
      <Dialog open={showModal && hasContent} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-yellow-500" />
              ¡Buenos días!
            </DialogTitle>
            <DialogDescription>
              Aquí tienes un resumen de tu día
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            {/* Pending tasks */}
            {hasPendingTasks && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <BookOpen className="h-4 w-4" />
                  Tienes {pendingTasks.length} tarea(s) pendiente(s)
                </h4>
                <ul className="mt-2 text-sm space-y-1 text-yellow-700 dark:text-yellow-300">
                  {pendingTasks.slice(0, 3).map(task => (
                    <li key={task.id} className="truncate">• {task.title}</li>
                  ))}
                  {pendingTasks.length > 3 && (
                    <li className="text-xs opacity-75">...y {pendingTasks.length - 3} más</li>
                  )}
                </ul>
              </div>
            )}

            {/* Elective today */}
            {hasElective && electiveToday && (
              <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <h4 className="font-medium flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                  <Clock className="h-4 w-4" />
                  Electiva hoy a las {formatTime(electiveToday.start_time)}
                </h4>
                <p className="text-sm mt-1 text-indigo-700 dark:text-indigo-300">
                  Recuerda seleccionar tu opción antes de que comience
                </p>
                <Button 
                  size="sm" 
                  className="mt-3"
                  onClick={() => {
                    setShowModal(false);
                    setElectiveEvent(electiveToday);
                    setShowElectiveModal(true);
                  }}
                >
                  Seleccionar Electiva
                </Button>
              </div>
            )}

            {/* Special events with details */}
            {hasSpecialEvents && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-500" />
                  Eventos Especiales Hoy
                </h4>
                {specialEvents.map(event => (
                  <div 
                    key={event.id} 
                    className="bg-cyan-50 dark:bg-cyan-950/30 p-3 rounded-lg border border-cyan-200 dark:border-cyan-800"
                  >
                    <div className="font-medium text-sm text-cyan-800 dark:text-cyan-200">
                      {EVENT_TYPE_CONFIG[event.event_type]?.emoji} {event.title}
                    </div>
                    <p className="text-xs text-cyan-700 dark:text-cyan-300 mt-1">
                      {formatTime(event.start_time)} - {event.details_info?.slice(0, 80)}
                      {(event.details_info?.length || 0) > 80 && '...'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowModal(false)} className="w-full sm:w-auto">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Elective selection modal */}
      {electiveEvent && (
        <ElectiveSelectionModal
          open={showElectiveModal}
          onOpenChange={setShowElectiveModal}
          event={electiveEvent}
          eventDate={todayString}
        />
      )}
    </>
  );
};
