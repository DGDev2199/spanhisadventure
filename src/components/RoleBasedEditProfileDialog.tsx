import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TimeZoneSelector } from "@/components/TimeZoneSelector";
import { AvatarUpload } from "@/components/AvatarUpload";
import { StaffVideoUpload } from "@/components/StaffVideoUpload";
import { Eye, EyeOff, Globe, MapPin, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RoleBasedEditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RoleBasedEditProfileDialog = ({ open, onOpenChange }: RoleBasedEditProfileDialogProps) => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: "",
    nationality: "",
    age: "",
    timezone: "",
    languages: "",
    diet: "",
    allergies: "",
    availability: "",
    experience: "",
    study_objectives: "",
    avatar_url: null as string | null,
    staff_type: "presencial" as "presencial" | "online" | "both",
    hourly_rate: "",
    currency: "USD",
    intro_video_url: null as string | null,
    bio: "",
    show_followers: true,
    show_following: true,
    is_public_profile: true,
  });
  const [requestingModality, setRequestingModality] = useState(false);
  const [modalityReason, setModalityReason] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user && open,
  });

  const { data: pendingRequest } = useQuery({
    queryKey: ["modality-request", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff_modality_requests")
        .select("*")
        .eq("user_id", user!.id)
        .eq("status", "pending")
        .maybeSingle();
      return data;
    },
    enabled: !!user && (userRole === "teacher" || userRole === "tutor"),
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        nationality: profile.nationality || "",
        age: profile.age?.toString() || "",
        timezone: profile.timezone || "",
        languages: profile.languages_spoken?.join(", ") || "",
        diet: profile.diet || "",
        allergies: profile.allergies || "",
        availability: profile.availability || "",
        experience: profile.experience || "",
        study_objectives: profile.study_objectives || "",
        avatar_url: profile.avatar_url || null,
        staff_type: (profile as any).staff_type || "presencial",
        hourly_rate: (profile as any).hourly_rate?.toString() || "",
        currency: (profile as any).currency || "USD",
        intro_video_url: (profile as any).intro_video_url || null,
        bio: (profile as any).bio || "",
        show_followers: (profile as any).show_followers !== false,
        show_following: (profile as any).show_following !== false,
        is_public_profile: (profile as any).is_public_profile !== false,
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updates: any = {
        full_name: formData.full_name,
        nationality: formData.nationality,
        age: formData.age ? parseInt(formData.age) : null,
        timezone: formData.timezone,
        languages_spoken: formData.languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        diet: formData.diet,
        allergies: formData.allergies,
        avatar_url: formData.avatar_url,
        bio: formData.bio,
        show_followers: formData.show_followers,
        show_following: formData.show_following,
        is_public_profile: formData.is_public_profile,
        updated_at: new Date().toISOString(),
      };

      if (userRole === "teacher" || userRole === "tutor") {
        updates.availability = formData.availability;
        updates.experience = formData.experience;
        updates.hourly_rate = formData.hourly_rate ? parseFloat(formData.hourly_rate) : null;
        updates.currency = formData.currency;
        // Note: staff_type changes require admin approval
      } else if (userRole === "student") {
        updates.study_objectives = formData.study_objectives;
      }

      const { error } = await supabase.from("profiles").update(updates).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil actualizado");
      onOpenChange(false);
    },
    onError: () => toast.error("Error al actualizar perfil"),
  });

  const requestModalityMutation = useMutation({
    mutationFn: async (requestedModality: string) => {
      const { error } = await supabase.from("staff_modality_requests").insert({
        user_id: user!.id,
        current_modality: (profile as any)?.staff_type || "presencial",
        requested_modality: requestedModality,
        reason: modalityReason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modality-request"] });
      toast.success("Solicitud enviada. Un administrador la revisará.");
      setRequestingModality(false);
      setModalityReason("");
    },
    onError: () => toast.error("Error al enviar solicitud"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>Actualiza tu información personal</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <AvatarUpload
            value={profile?.avatar_url || null}
            onChange={(url) => setFormData({ ...formData, avatar_url: url })}
            userId={user?.id}
            userName={formData.full_name}
          />
          <div className="space-y-2">
            <Label>Nombre Completo</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Cuéntanos un poco sobre ti..."
              className="h-20"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nacionalidad</Label>
              <Input
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Edad</Label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
          </div>
          <TimeZoneSelector
            value={formData.timezone}
            onChange={(value) => setFormData({ ...formData, timezone: value })}
          />
          <div className="space-y-2">
            <Label>Idiomas (separados por comas)</Label>
            <Input
              value={formData.languages}
              onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dieta</Label>
              <Input value={formData.diet} onChange={(e) => setFormData({ ...formData, diet: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Alergias</Label>
              <Input
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              />
            </div>
          </div>

          {/* Privacy Section */}
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Privacidad
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Perfil público</Label>
                  <p className="text-xs text-muted-foreground">Otros pueden ver tu información completa</p>
                </div>
                <Switch
                  checked={formData.is_public_profile}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public_profile: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar seguidores</Label>
                  <p className="text-xs text-muted-foreground">Otros pueden ver quién te sigue</p>
                </div>
                <Switch
                  checked={formData.show_followers}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_followers: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar a quién sigo</Label>
                  <p className="text-xs text-muted-foreground">Otros pueden ver a quién sigues</p>
                </div>
                <Switch
                  checked={formData.show_following}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_following: checked })}
                />
              </div>
            </div>
          </div>

          {(userRole === "teacher" || userRole === "tutor") && (
            <>
              <Separator />
              {/* Video Upload */}
              <StaffVideoUpload
                userId={user?.id}
                currentVideoUrl={formData.intro_video_url}
                onVideoChange={(url) => setFormData({ ...formData, intro_video_url: url })}
              />

              {/* Modality Section */}
              <div className="space-y-3">
                <Label>Modalidad Actual</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  {(profile as any)?.staff_type === "online" && <Globe className="h-4 w-4 text-primary" />}
                  {(profile as any)?.staff_type === "presencial" && <MapPin className="h-4 w-4 text-primary" />}
                  {(profile as any)?.staff_type === "both" && (
                    <>
                      <Globe className="h-4 w-4 text-primary" />
                      <MapPin className="h-4 w-4 text-primary" />
                    </>
                  )}
                  <span className="font-medium">
                    {(profile as any)?.staff_type === "online"
                      ? "Online"
                      : (profile as any)?.staff_type === "both"
                        ? "Online y Presencial"
                        : "Presencial"}
                  </span>
                </div>

                {pendingRequest ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Tienes una solicitud pendiente para cambiar a{" "}
                      <strong>
                        {pendingRequest.requested_modality === "both"
                          ? "Online y Presencial"
                          : pendingRequest.requested_modality}
                      </strong>
                    </AlertDescription>
                  </Alert>
                ) : !requestingModality ? (
                  <Button variant="outline" size="sm" onClick={() => setRequestingModality(true)}>
                    Solicitar cambio de modalidad
                  </Button>
                ) : (
                  <div className="space-y-3 p-3 border rounded-lg">
                    <Label>Nueva modalidad</Label>
                    <Select onValueChange={(v) => requestModalityMutation.mutate(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar modalidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {(profile as any)?.staff_type !== "presencial" && (
                          <SelectItem value="presencial">📍 Presencial</SelectItem>
                        )}
                        {(profile as any)?.staff_type !== "online" && <SelectItem value="online">🌐 Online</SelectItem>}
                        {(profile as any)?.staff_type !== "both" && (
                          <SelectItem value="both">🌐📍 Online y Presencial</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <div className="space-y-2">
                      <Label>Razón (opcional)</Label>
                      <Textarea
                        value={modalityReason}
                        onChange={(e) => setModalityReason(e.target.value)}
                        placeholder="¿Por qué deseas cambiar de modalidad?"
                        className="h-16"
                      />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setRequestingModality(false)}>
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Disponibilidad</Label>
                <Textarea
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Experiencia</Label>
                <Textarea
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                />
              </div>
            </>
          )}
          {userRole === "student" && (
            <div className="space-y-2">
              <Label>Objetivos de Estudio</Label>
              <Textarea
                value={formData.study_objectives}
                onChange={(e) => setFormData({ ...formData, study_objectives: e.target.value })}
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="flex-1">
              {updateMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
