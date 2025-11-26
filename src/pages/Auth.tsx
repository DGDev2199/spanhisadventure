import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Compass, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import logo from '@/assets/logo.png';
import { TimeZoneSelector } from '@/components/TimeZoneSelector';
import { AvatarUpload } from '@/components/AvatarUpload';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const registerSchema = z.object({
  role: z.enum(['student', 'tutor', 'teacher'], { required_error: 'Selecciona un rol' }),
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  age: z.string().optional().or(z.literal('')),
  nationality: z.string().optional().or(z.literal('')),
  timezone: z.string().optional().or(z.literal('')),
  languages: z.string().optional().or(z.literal('')),
  allergies: z.string().optional().or(z.literal('')),
  diet: z.string().optional().or(z.literal('')),
  // Role-specific fields
  availability: z.string().optional().or(z.literal('')), // For tutor/teacher
  experience: z.string().optional().or(z.literal('')), // For tutor/teacher
  studyObjectives: z.string().optional().or(z.literal('')), // For student
});

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkSession();
  }, [navigate]);

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [registerRole, setRegisterRole] = useState<'student' | 'tutor' | 'teacher'>('student');
  const [registerFullName, setRegisterFullName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerAge, setRegisterAge] = useState('');
  const [registerNationality, setRegisterNationality] = useState('');
  const [registerTimezone, setRegisterTimezone] = useState('');
  const [registerLanguages, setRegisterLanguages] = useState('');
  const [registerAllergies, setRegisterAllergies] = useState('');
  const [registerDiet, setRegisterDiet] = useState('');
  // Role-specific fields
  const [registerAvailability, setRegisterAvailability] = useState('');
  const [registerExperience, setRegisterExperience] = useState('');
  const [registerStudyObjectives, setRegisterStudyObjectives] = useState('');
  const [registerAvatar, setRegisterAvatar] = useState<string | null>(null);
  const [registerAvatarFile, setRegisterAvatarFile] = useState<File | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión con Google');
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate input
      const validatedData = loginSchema.parse({
        email: loginEmail,
        password: loginPassword,
      });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email o contraseña incorrectos');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor confirma tu email antes de iniciar sesión');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success('¡Bienvenido de vuelta!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Por favor corrige los errores en el formulario');
      } else {
        toast.error('Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      // Validate input
      const validatedData = registerSchema.parse({
        role: registerRole,
        fullName: registerFullName,
        email: registerEmail,
        password: registerPassword,
        age: registerAge,
        nationality: registerNationality,
        timezone: registerTimezone,
        languages: registerLanguages,
        allergies: registerAllergies,
        diet: registerDiet,
        availability: registerAvailability,
        experience: registerExperience,
        studyObjectives: registerStudyObjectives,
      });

      const redirectUrl = `${window.location.origin}/dashboard`;

      // Log role before creating user
      console.log('Registering user with role:', validatedData.role);
      console.log('Current registerRole state:', registerRole);

      // Create user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: validatedData.fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          toast.error('Este email ya está registrado. Por favor inicia sesión.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Wait a bit for trigger to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Insert the correct role in user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: data.user.id,
            role: validatedData.role 
          });

        if (roleError) {
          console.error('Role insert error:', roleError);
          toast.error('Error al asignar el rol');
          return;
        }

        // Create student_profile only if role is student
        if (validatedData.role === 'student') {
          const { error: studentProfileError } = await supabase
            .from('student_profiles')
            .insert({
              user_id: data.user.id,
              status: 'active',
              placement_test_status: 'not_started'
            });

          if (studentProfileError) {
            console.error('Student profile creation error:', studentProfileError);
          }
        }

        // Upload avatar if provided
        let avatarUrl: string | null = null;
        if (registerAvatarFile) {
          try {
            const fileExt = registerAvatarFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${data.user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, registerAvatarFile, {
                contentType: registerAvatarFile.type,
                upsert: false
              });

            if (uploadError) {
              console.error('Avatar upload error:', uploadError);
            } else {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
              avatarUrl = publicUrl;
            }
          } catch (uploadErr) {
            console.error('Error uploading avatar:', uploadErr);
          }
        }

        // Update additional profile data
        const profileUpdate: any = {
          age: validatedData.age ? parseInt(validatedData.age) : null,
          nationality: validatedData.nationality || null,
          timezone: validatedData.timezone || null,
          languages_spoken: validatedData.languages ? validatedData.languages.split(',').map(l => l.trim()) : null,
          allergies: validatedData.allergies || null,
          diet: validatedData.diet || null,
          updated_at: new Date().toISOString(),
        };

        // Add avatar URL if uploaded
        if (avatarUrl) {
          profileUpdate.avatar_url = avatarUrl;
        }

        // Add role-specific fields
        if (validatedData.role === 'teacher' || validatedData.role === 'tutor') {
          profileUpdate.availability = validatedData.availability;
          profileUpdate.experience = validatedData.experience;
        } else if (validatedData.role === 'student') {
          profileUpdate.study_objectives = validatedData.studyObjectives;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
        }

        toast.success('¡Cuenta creada exitosamente!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        console.log('Errores de validación:', fieldErrors);
        toast.error('Por favor corrige los errores en el formulario');
      } else {
        console.error('Error al crear cuenta:', error);
        toast.error('Error al crear la cuenta');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo and Title */}
        <div className="text-center mb-6 sm:mb-8">
          <img src={logo} alt="Spanish Adventure" className="h-16 sm:h-20 mx-auto mb-3 sm:mb-4" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Spanish Adventure</h1>
          <p className="text-sm sm:text-base text-white/90">Tu aventura hacia la fluidez comienza aquí</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              <Compass className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Bienvenido
            </CardTitle>
            <CardDescription className="text-sm">Inicia sesión o crea una cuenta nueva</CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 h-10 sm:h-11">
                <TabsTrigger value="login" className="text-sm sm:text-base">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="register" className="text-sm sm:text-base">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="login-email" className="text-sm">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={loginEmail}
                      onChange={(e) => {
                        setLoginEmail(e.target.value);
                        setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      required
                      className={`h-10 sm:h-11 ${errors.email ? 'border-destructive' : ''}`}
                    />
                    {errors.email && (
                      <p className="text-xs sm:text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="login-password" className="text-sm">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        setErrors(prev => ({ ...prev, password: '' }));
                      }}
                      required
                      minLength={6}
                      className={`h-10 sm:h-11 ${errors.password ? 'border-destructive' : ''}`}
                    />
                    {errors.password && (
                      <p className="text-xs sm:text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.password}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Mínimo 6 caracteres
                    </p>
                  </div>
                  <Button type="submit" className="w-full h-10 sm:h-11 touch-target" disabled={loading}>
                    {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                  
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        O continúa con
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 sm:h-11 touch-target"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4 max-h-[60vh] sm:max-h-none overflow-y-auto custom-scrollbar pr-1">
                  {/* Role Selection */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">Selecciona tu rol *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Setting role to: student');
                          setRegisterRole('student');
                        }}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          registerRole === 'student'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-sm font-medium">Estudiante</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Setting role to: tutor');
                          setRegisterRole('tutor');
                        }}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          registerRole === 'tutor'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-sm font-medium">Tutor</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log('Setting role to: teacher');
                          setRegisterRole('teacher');
                        }}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          registerRole === 'teacher'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="text-sm font-medium">Profesor</div>
                      </button>
                    </div>
                    {errors.role && (
                      <p className="text-xs sm:text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.role}
                      </p>
                    )}
                  </div>

                  {/* Avatar Upload */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-sm">Foto de perfil (opcional)</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 border-2 border-border rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {registerAvatar ? (
                          <img src={registerAvatar} alt="Avatar preview" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl text-muted-foreground">
                            {registerFullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (!file.type.startsWith('image/')) {
                                toast.error('Por favor selecciona un archivo de imagen');
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error('La imagen debe ser menor a 5MB');
                                return;
                              }
                              setRegisterAvatarFile(file);
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setRegisterAvatar(e.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="h-10"
                        />
                        {registerAvatar && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRegisterAvatar(null);
                              setRegisterAvatarFile(null);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="register-name" className="text-sm">Nombre Completo *</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Juan Pérez"
                      value={registerFullName}
                      onChange={(e) => {
                        setRegisterFullName(e.target.value);
                        setErrors(prev => ({ ...prev, fullName: '' }));
                      }}
                      onBlur={(e) => {
                        if (e.target.value.length < 2) {
                          setErrors(prev => ({ ...prev, fullName: 'El nombre debe tener al menos 2 caracteres' }));
                        }
                      }}
                      required
                      className={`h-10 sm:h-11 ${errors.fullName ? 'border-destructive' : ''}`}
                    />
                    {errors.fullName && (
                      <p className="text-xs sm:text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="register-email" className="text-sm">Email *</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="tu@email.com"
                      value={registerEmail}
                      onChange={(e) => {
                        setRegisterEmail(e.target.value);
                        setErrors(prev => ({ ...prev, email: '' }));
                      }}
                      onBlur={(e) => {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(e.target.value)) {
                          setErrors(prev => ({ ...prev, email: 'Email inválido' }));
                        }
                      }}
                      required
                      className={`h-10 sm:h-11 ${errors.email ? 'border-destructive' : ''}`}
                    />
                    {errors.email && (
                      <p className="text-xs sm:text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="register-password" className="text-sm">Contraseña *</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerPassword}
                      onChange={(e) => {
                        setRegisterPassword(e.target.value);
                        setErrors(prev => ({ ...prev, password: '' }));
                      }}
                      onBlur={(e) => {
                        if (e.target.value.length < 6) {
                          setErrors(prev => ({ ...prev, password: 'La contraseña debe tener al menos 6 caracteres' }));
                        }
                      }}
                      required
                      minLength={6}
                      className={`h-10 sm:h-11 ${errors.password ? 'border-destructive' : ''}`}
                    />
                    {errors.password && (
                      <p className="text-xs sm:text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.password}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Mínimo 6 caracteres
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="register-age" className="text-sm">Edad (opcional)</Label>
                      <Input
                        id="register-age"
                        type="number"
                        placeholder="25"
                        value={registerAge}
                        onChange={(e) => {
                          setRegisterAge(e.target.value);
                          setErrors(prev => ({ ...prev, age: '' }));
                        }}
                        onBlur={(e) => {
                          const age = parseInt(e.target.value);
                          if (e.target.value && (age < 1 || age > 120)) {
                            setErrors(prev => ({ ...prev, age: 'Edad inválida' }));
                          }
                        }}
                        min="1"
                        max="120"
                        className={`h-10 sm:h-11 ${errors.age ? 'border-destructive' : ''}`}
                      />
                      {errors.age && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.age}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="register-nationality" className="text-sm">Nacionalidad (opcional)</Label>
                      <Input
                        id="register-nationality"
                        type="text"
                        placeholder="España"
                        value={registerNationality}
                        onChange={(e) => {
                          setRegisterNationality(e.target.value);
                          setErrors(prev => ({ ...prev, nationality: '' }));
                        }}
                        className={`h-10 sm:h-11 ${errors.nationality ? 'border-destructive' : ''}`}
                      />
                      {errors.nationality && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.nationality}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="register-timezone" className="text-sm">Zona Horaria (opcional)</Label>
                    <TimeZoneSelector
                      value={registerTimezone}
                      onChange={(value) => {
                        setRegisterTimezone(value);
                        setErrors(prev => ({ ...prev, timezone: '' }));
                      }}
                    />
                    {errors.timezone && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.timezone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="register-languages" className="text-sm">Idiomas que hablas (opcional)</Label>
                    <Input
                      id="register-languages"
                      type="text"
                      placeholder="Español, Inglés"
                      value={registerLanguages}
                      onChange={(e) => {
                        setRegisterLanguages(e.target.value);
                        setErrors(prev => ({ ...prev, languages: '' }));
                      }}
                      className={`h-10 sm:h-11 ${errors.languages ? 'border-destructive' : ''}`}
                    />
                    {errors.languages && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.languages}
                      </p>
                    )}
                  </div>

                  {/* Role-specific fields */}
                  {(registerRole === 'teacher' || registerRole === 'tutor') && (
                    <>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="register-availability" className="text-sm">Disponibilidad (opcional)</Label>
                        <Input
                          id="register-availability"
                          type="text"
                          placeholder="Lunes a Viernes, 9:00 - 17:00"
                          value={registerAvailability}
                          onChange={(e) => setRegisterAvailability(e.target.value)}
                          className="h-10 sm:h-11"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="register-experience" className="text-sm">Experiencia (opcional)</Label>
                        <Input
                          id="register-experience"
                          type="text"
                          placeholder="5 años enseñando español"
                          value={registerExperience}
                          onChange={(e) => setRegisterExperience(e.target.value)}
                          className="h-10 sm:h-11"
                        />
                      </div>
                    </>
                  )}

                  {registerRole === 'student' && (
                    <>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="register-study-objectives" className="text-sm">Objetivos de Estudio (opcional)</Label>
                        <Input
                          id="register-study-objectives"
                          type="text"
                          placeholder="Mejorar conversación en español"
                          value={registerStudyObjectives}
                          onChange={(e) => setRegisterStudyObjectives(e.target.value)}
                          className="h-10 sm:h-11"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="register-allergies" className="text-sm">Alergias (opcional)</Label>
                        <Input
                          id="register-allergies"
                          type="text"
                          placeholder="Ninguna"
                          value={registerAllergies}
                          onChange={(e) => setRegisterAllergies(e.target.value)}
                          className="h-10 sm:h-11"
                        />
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="register-diet" className="text-sm">Preferencias Dietéticas (opcional)</Label>
                        <Input
                          id="register-diet"
                          type="text"
                          placeholder="Vegetariano"
                          value={registerDiet}
                          onChange={(e) => setRegisterDiet(e.target.value)}
                          className="h-10 sm:h-11"
                        />
                      </div>
                    </>
                  )}
                  <Button type="submit" className="w-full h-10 sm:h-11 touch-target" disabled={loading}>
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        O continúa con
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 sm:h-11 touch-target"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;