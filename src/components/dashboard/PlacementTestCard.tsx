import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle } from 'lucide-react';

interface PlacementTestCardProps {
  status: 'not_started' | 'pending' | 'completed' | null;
  writtenScore?: number | null;
  level?: string | null;
  oralCompleted?: boolean;
}

export const PlacementTestCard = memo(({ 
  status, 
  writtenScore, 
  level, 
  oralCompleted 
}: PlacementTestCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Examen de Nivelación
        </CardTitle>
        <CardDescription>
          {status === 'not_started' 
            ? 'Completa tu examen de nivelación para determinar tu nivel'
            : status === 'pending'
            ? 'Tu examen está siendo revisado por el profesor'
            : 'Examen completado y nivel asignado'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'not_started' ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Realiza el examen automatizado para comenzar. Tu profesor luego realizará una evaluación oral
              para finalizar tu nivel.
            </p>
            <Button 
              className="w-full"
              onClick={() => navigate('/placement-test')}
            >
              Iniciar Examen de Nivelación
            </Button>
          </>
        ) : status === 'pending' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 p-3 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Examen enviado exitosamente</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Puntuación Escrita:</span>
                <span className="font-bold text-lg">{writtenScore || 0}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tu profesor revisará tus respuestas y programará una evaluación oral pronto.
              </p>
            </div>
            <Button 
              className="w-full"
              disabled
              variant="outline"
            >
              Esperando Revisión del Profesor
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Examen completado</span>
            </div>
            <div className="space-y-2 bg-accent/10 p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Puntuación Escrita:</span>
                <span className="font-bold text-lg">{writtenScore || 0}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Nivel Asignado:</span>
                <span className="font-bold text-2xl text-primary">{level || 'N/A'}</span>
              </div>
              {oralCompleted && (
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  ✓ Evaluación oral completada
                </p>
              )}
            </div>
            <Button 
              className="w-full"
              disabled
              variant="secondary"
            >
              Test Finalizado
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PlacementTestCard.displayName = 'PlacementTestCard';
