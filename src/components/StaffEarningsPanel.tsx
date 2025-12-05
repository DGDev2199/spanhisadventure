import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const StaffEarningsPanel = () => {
  const { user, userRole } = useAuth();

  // Fetch earnings for current staff member
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['staff-earnings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const query = supabase
        .from('class_bookings')
        .select(`
          *,
          student:profiles!class_bookings_student_id_fkey(full_name)
        `)
        .gt('price', 0)
        .order('booking_date', { ascending: false });

      if (userRole === 'teacher') {
        query.eq('teacher_id', user.id);
      } else {
        query.eq('tutor_id', user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Calculate totals
  const totals = bookings?.reduce((acc, booking) => {
    const earnings = Number(booking.staff_earnings) || 0;
    const isPaid = booking.payment_status === 'paid';
    
    return {
      totalEarnings: acc.totalEarnings + earnings,
      paidEarnings: isPaid ? acc.paidEarnings + earnings : acc.paidEarnings,
      pendingEarnings: !isPaid ? acc.pendingEarnings + earnings : acc.pendingEarnings,
      totalClasses: acc.totalClasses + 1,
    };
  }, {
    totalEarnings: 0,
    paidEarnings: 0,
    pendingEarnings: 0,
    totalClasses: 0,
  }) || { totalEarnings: 0, paidEarnings: 0, pendingEarnings: 0, totalClasses: 0 };

  // Get current month stats
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthBookings = bookings?.filter(b => {
    const date = new Date(b.booking_date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  }) || [];

  const thisMonthEarnings = thisMonthBookings.reduce((acc, b) => acc + (Number(b.staff_earnings) || 0), 0);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Mis Ganancias
        </CardTitle>
        <CardDescription>
          Resumen de tus ingresos por clases online (85% del precio de la clase)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-xs text-green-600 font-medium mb-1">Total Ganado</p>
            <p className="text-2xl font-bold text-green-700">${totals.totalEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-medium mb-1">Este Mes</p>
            <p className="text-2xl font-bold text-blue-700">${thisMonthEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4">
            <p className="text-xs text-amber-600 font-medium mb-1">Pendiente</p>
            <p className="text-2xl font-bold text-amber-700">${totals.pendingEarnings.toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-xs text-purple-600 font-medium mb-1">Clases Impartidas</p>
            <p className="text-2xl font-bold text-purple-700">{totals.totalClasses}</p>
          </div>
        </div>

        {/* Recent Earnings */}
        {bookings && bookings.length > 0 ? (
          <div>
            <h4 className="font-medium mb-3">Historial de Ganancias</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead className="text-right">Tu Ganancia</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.slice(0, 10).map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      {format(new Date(booking.booking_date), 'dd/MM/yyyy', { locale: es })}
                    </TableCell>
                    <TableCell>{booking.student?.full_name || 'Sin nombre'}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ${Number(booking.staff_earnings).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                        {booking.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            No hay ganancias registradas aún. Configura tu tarifa por hora en tu perfil.
          </p>
        )}
      </CardContent>
    </Card>
  );
};