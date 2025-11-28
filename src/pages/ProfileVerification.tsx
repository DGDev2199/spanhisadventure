import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

const ProfileVerification = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    nationality: "",
    age: "",
    timezone: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const loadProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile({
            full_name: data.full_name || "",
            email: data.email || "",
            nationality: data.nationality || "",
            age: data.age?.toString() || "",
            timezone: data.timezone || "",
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, navigate]);

  const handleConfirm = async () => {
    if (!profile.full_name.trim()) {
      toast({
        title: "Error",
        description: "El nombre completo es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name.trim(),
          nationality: profile.nationality.trim() || null,
          age: profile.age ? parseInt(profile.age) : null,
          timezone: profile.timezone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user!.id);

      if (error) throw error;

      toast({
        title: "Perfil confirmado",
        description: "Tus datos han sido guardados correctamente",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Verifica tu Perfil</CardTitle>
          <CardDescription>
            Por favor, confirma o actualiza tus datos antes de continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">
                Rol seleccionado: {userRole === "student" ? "Estudiante" : userRole === "tutor" ? "Tutor" : "Profesor"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nombre Completo *</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationality">Nacionalidad</Label>
                <Input
                  id="nationality"
                  value={profile.nationality}
                  onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                  placeholder="Tu nacionalidad"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                  placeholder="Tu edad"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Zona Horaria</Label>
              <Input
                id="timezone"
                value={profile.timezone}
                onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                placeholder="Ej: Europe/Madrid, America/Mexico_City"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleConfirm}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                "Confirmar y Continuar"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileVerification;
