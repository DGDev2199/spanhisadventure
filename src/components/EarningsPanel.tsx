import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Users, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const EarningsPanel = () => {
  // Fetch all paid bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-earnings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_bookings')
        .select(`
          *,
          student:profiles!class_bookings_student_id_fkey(full_name),
          teacher:profiles!class_bookings_teacher_id_fkey(full_name),
          tutor:profiles!class_bookings_tutor_id_fkey(full_name)
        `)
        .gt('price', 0)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate totals
  const totals = bookings?.reduce((acc, booking) => {
    const price = Number(booking.price) || 0;
    const platformFee = Number(booking.platform_fee) || 0;
    const staffEarnings = Number(booking.staff_earnings) || 0;
    
    return {
      totalRevenue: acc.totalRevenue + price,
      platformCommission: acc.platformCommission + platformFee,
      staffPayouts: acc.staffPayouts + staffEarnings,
      totalBookings: acc.totalBookings + 1,
    };
  }, {
    totalRevenue: 0,
    platformCommission: 0,
    staffPayouts: 0,
    totalBookings: 0,
  }) || { totalRevenue: 0, platformCommission: 0, staffPayouts: 0, totalBookings: 0 };

  // Get earnings by staff
  const staffEarnings = bookings?.reduce((acc, booking) => {
    const staffId = booking.teacher_id || booking.tutor_id;
    const staffName = booking.teacher?.full_name || booking.tutor?.full_name || 'Sin nombre';
    const earnings = Number(booking.staff_earnings) || 0;
    
    if (!staffId) return acc;
    
    if (!acc[staffId]) {
      acc[staffId] = { name: staffName, total: 0, classes: 0 };
    }
    acc[staffId].total += earnings;
    acc[staffId].classes += 1;
    
    return acc;
  }, {} as Record<string, { name: string; total: number; classes: number }>) || {};

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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totals.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.totalBookings} reservas con pago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comisión Escuela (15%)</CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${totals.platformCommission.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tu ganancia neta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pagado a Staff (85%)</CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary">
              ${totals.staffPayouts.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Profesores y tutores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clases Pagadas</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.totalBookings}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de reservas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings by Staff */}
      <Card>
        <CardHeader>
          <CardTitle>Ganancias por Profesor/Tutor</CardTitle>
          <CardDescription>Desglose de ingresos por miembro del staff</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(staffEarnings).length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-center">Clases</TableHead>
                  <TableHead className="text-right">Total Ganado (85%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(staffEarnings).map(([staffId, data]) => (
                  <TableRow key={staffId}>
                    <TableCell className="font-medium">{data.name}</TableCell>
                    <TableCell className="text-center">{data.classes}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ${data.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No hay ingresos registrados aún
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
          <CardDescription>Últimas reservas con pago</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Profesor/Tutor</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Tu Comisión</TableHead>
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
                    <TableCell>
                      {booking.teacher?.full_name || booking.tutor?.full_name || 'Sin nombre'}
                    </TableCell>
                    <TableCell className="text-right">
                      ${Number(booking.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      ${Number(booking.platform_fee).toFixed(2)}
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
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No hay transacciones aún
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};