import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Clock, Globe, Languages, User, Star, Send, Loader2, GraduationCap, UserCheck, Eye } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.png';
import { NotificationBell } from '@/components/NotificationBell';
import { StaffProfileDialog } from '@/components/StaffProfileDialog';
import { StarRating } from '@/components/StarRating';

interface StaffMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
  timezone: string | null;
  languages_spoken: string[] | null;
  availability: string | null;
  experience: string | null;
  role: 'teacher' | 'tutor';
  hourly_rate: number | null;
  currency: string | null;
  avgRating?: number;
  totalReviews?: number;
}

const BrowseTeachers = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [requestMessage, setRequestMessage] = useState('');

  // Fetch approved teachers with ratings
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['browse-teachers'],
    queryFn: async () => {
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher');

      if (!rolesData || rolesData.length === 0) return [];

      const teacherIds = rolesData.map(r => r.user_id);
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, timezone, languages_spoken, availability, experience, is_approved, hourly_rate, currency')
        .in('id', teacherIds)
        .eq('is_approved', true);

      if (error) throw error;

      // Fetch ratings for all teachers
      const { data: reviewsData } = await supabase
        .from('class_reviews')
        .select('staff_id, rating')
        .in('staff_id', teacherIds);

      const ratingMap = new Map<string, { total: number; count: number }>();
      reviewsData?.forEach(r => {
        const current = ratingMap.get(r.staff_id) || { total: 0, count: 0 };
        ratingMap.set(r.staff_id, { total: current.total + r.rating, count: current.count + 1 });
      });

      return (profilesData || []).map(p => {
        const stats = ratingMap.get(p.id);
        return {
          ...p,
          role: 'teacher' as const,
          avgRating: stats ? stats.total / stats.count : 0,
          totalReviews: stats?.count || 0,
        };
      });
    },
  });

  // Fetch approved tutors with ratings
  const { data: tutors, isLoading: tutorsLoading } = useQuery({
    queryKey: ['browse-tutors'],
    queryFn: async () => {
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'tutor');

      if (!rolesData || rolesData.length === 0) return [];

      const tutorIds = rolesData.map(r => r.user_id);
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, timezone, languages_spoken, availability, experience, is_approved, hourly_rate, currency')
        .in('id', tutorIds)
        .eq('is_approved', true);

      if (error) throw error;

      // Fetch ratings for all tutors
      const { data: reviewsData } = await supabase
        .from('class_reviews')
        .select('staff_id, rating')
        .in('staff_id', tutorIds);

      const ratingMap = new Map<string, { total: number; count: number }>();
      reviewsData?.forEach(r => {
        const current = ratingMap.get(r.staff_id) || { total: 0, count: 0 };
        ratingMap.set(r.staff_id, { total: current.total + r.rating, count: current.count + 1 });
      });

      return (profilesData || []).map(p => {
        const stats = ratingMap.get(p.id);
        return {
          ...p,
          role: 'tutor' as const,
          avgRating: stats ? stats.total / stats.count : 0,
          totalReviews: stats?.count || 0,
        };
      });
    },
  });

  // Fetch existing requests
  const { data: myRequests } = useQuery({
    queryKey: ['my-class-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('class_requests')
        .select('*')
        .eq('student_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Send request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedStaff) return;
      
      const { error } = await supabase
        .from('class_requests')
        .insert({
          student_id: user.id,
          teacher_id: selectedStaff.role === 'teacher' ? selectedStaff.id : null,
          tutor_id: selectedStaff.role === 'tutor' ? selectedStaff.id : null,
          request_type: selectedStaff.role,
          message: requestMessage || null,
        });

      if (error) throw error;

      // Create notification for the staff member
      await supabase.rpc('create_notification', {
        p_user_id: selectedStaff.id,
        p_title: 'Nueva Solicitud de Clase',
        p_message: `Un estudiante te ha solicitado como ${selectedStaff.role === 'teacher' ? 'profesor' : 'tutor'}`,
        p_type: 'class_request',
        p_related_id: user.id,
      });
    },
    onSuccess: () => {
      toast.success('Solicitud enviada correctamente');
      setRequestDialogOpen(false);
      setRequestMessage('');
      setSelectedStaff(null);
      queryClient.invalidateQueries({ queryKey: ['my-class-requests'] });
    },
    onError: (error: any) => {
      toast.error('Error al enviar solicitud: ' + error.message);
    },
  });

  const getTimezoneOffset = (tz: string | null) => {
    if (!tz) return null;
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: 'numeric' });
      return formatter.format(now);
    } catch {
      return null;
    }
  };

  const hasRequestedStaff = (staffId: string) => {
    return myRequests?.some(r => 
      (r.teacher_id === staffId || r.tutor_id === staffId) && r.status === 'pending'
    );
  };

  const handleRequestClick = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setRequestDialogOpen(true);
  };

  const handleViewProfile = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setProfileDialogOpen(true);
  };

  const StaffCard = ({ staff }: { staff: StaffMember }) => {
    const requested = hasRequestedStaff(staff.id);
    const localTime = getTimezoneOffset(staff.timezone);

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
            <div className="flex items-start gap-4">
            <Avatar 
              className="h-16 w-16 border-2 border-primary/20 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleViewProfile(staff)}
            >
              <AvatarImage src={staff.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {staff.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 
                  className="font-semibold truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleViewProfile(staff)}
                >
                  {staff.full_name}
                </h3>
                <Badge variant={staff.role === 'teacher' ? 'default' : 'secondary'} className="text-xs">
                  {staff.role === 'teacher' ? 'Profesor' : 'Tutor'}
                </Badge>
              </div>

              {/* Rating */}
              {staff.totalReviews && staff.totalReviews > 0 ? (
                <div className="mb-2">
                  <StarRating 
                    rating={staff.avgRating || 0} 
                    size="sm" 
                    showValue 
                    totalReviews={staff.totalReviews} 
                  />
                </div>
              ) : null}

              {/* Price */}
              {staff.hourly_rate && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 mb-2">
                  {staff.currency || 'USD'} ${staff.hourly_rate}/hora
                </Badge>
              )}

              {staff.experience && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {staff.experience}
                </p>
              )}

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                {staff.timezone && localTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {localTime}
                  </span>
                )}
                {staff.languages_spoken && staff.languages_spoken.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Languages className="h-3 w-3" />
                    {staff.languages_spoken.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleViewProfile(staff)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Perfil
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  disabled={requested}
                  onClick={() => handleRequestClick(staff)}
                >
                  {requested ? (
                    <>
                      <Clock className="h-4 w-4 mr-1" />
                      Pendiente
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Solicitar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const isLoading = teachersLoading || tutorsLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-primary shadow-md">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logo} alt="Spanish Adventure" className="h-10" />
            <div>
              <h1 className="text-lg font-bold text-white">Spanish Adventure</h1>
              <p className="text-xs text-white/80">Buscar Profesores y Tutores</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Encuentra tu Profesor o Tutor</h2>
          <p className="text-muted-foreground">
            Explora los perfiles de nuestros profesores y tutores disponibles. 
            Envía una solicitud para comenzar tus clases.
          </p>
        </div>

        <Tabs defaultValue="teachers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="teachers" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Profesores ({teachers?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="tutors" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Tutores ({tutors?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teachers">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : teachers && teachers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teachers.map((teacher) => (
                  <StaffCard key={teacher.id} staff={teacher as StaffMember} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay profesores disponibles en este momento</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tutors">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : tutors && tutors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tutors.map((tutor) => (
                  <StaffCard key={tutor.id} staff={tutor as StaffMember} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay tutores disponibles en este momento</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Solicitar {selectedStaff?.role === 'teacher' ? 'Clases' : 'Tutorías'}
            </DialogTitle>
            <DialogDescription>
              Envía una solicitud a {selectedStaff?.full_name} para comenzar tus clases.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar>
                <AvatarImage src={selectedStaff?.avatar_url || undefined} />
                <AvatarFallback>
                  {selectedStaff?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedStaff?.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedStaff?.role === 'teacher' ? 'Profesor' : 'Tutor'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensaje (opcional)</Label>
              <Textarea
                id="message"
                placeholder="Cuéntale un poco sobre ti y tus objetivos de aprendizaje..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => sendRequestMutation.mutate()}
              disabled={sendRequestMutation.isPending}
            >
              {sendRequestMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      {selectedStaff && (
        <StaffProfileDialog
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
          staffId={selectedStaff.id}
          staffRole={selectedStaff.role}
          hasRequested={hasRequestedStaff(selectedStaff.id)}
          onRequestClick={() => {
            setProfileDialogOpen(false);
            setRequestDialogOpen(true);
          }}
        />
      )}
    </div>
  );
};

export default BrowseTeachers;
