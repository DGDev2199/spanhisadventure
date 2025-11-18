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
  age: z.string().optional(),
  nationality: z.string().min(1, 'La nacionalidad es requerida'),
  timezone: z.string().min(1, 'La zona horaria es requerida'),
  languages: z.string().min(1, 'Indica al menos un idioma'),
  allergies: z.string().optional(),
  diet: z.string().optional(),
  // Role-specific fields
  availability: z.string().optional(), // For tutor/teacher
  experience: z.string().optional(), // For tutor/teacher
  studyObjectives: z.string().optional(), // For student
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

        // Update role in user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: validatedData.role })
          .eq('user_id', data.user.id);

        if (roleError) {
          console.error('Role update error:', roleError);
        }

        // Update additional profile data
        const profileUpdate: any = {
          age: validatedData.age ? parseInt(validatedData.age) : null,
          nationality: validatedData.nationality,
          timezone: validatedData.timezone,
          languages_spoken: validatedData.languages.split(',').map(l => l.trim()),
          allergies: validatedData.allergies || null,
          diet: validatedData.diet || null,
          updated_at: new Date().toISOString(),
        };

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
        toast.error('Por favor corrige los errores en el formulario');
      } else {
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
                      <Label htmlFor="register-age" className="text-sm">Edad</Label>
                      <Input
                        id="register-age"
                        type="number"
                        placeholder="25"
                        value={registerAge}
                        onChange={(e) => setRegisterAge(e.target.value)}
                        min="1"
                        max="120"
                        className="h-10 sm:h-11"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="register-nationality" className="text-sm">Nacionalidad</Label>
                      <Input
                        id="register-nationality"
                        type="text"
                        placeholder="España"
                        value={registerNationality}
                        onChange={(e) => setRegisterNationality(e.target.value)}
                        className="h-10 sm:h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="register-allergies" className="text-sm">Alergias</Label>
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
                    <Label htmlFor="register-diet" className="text-sm">Preferencias Dietéticas</Label>
                    <Input
                      id="register-diet"
                      type="text"
                      placeholder="Vegetariano"
                      value={registerDiet}
                      onChange={(e) => setRegisterDiet(e.target.value)}
                      className="h-10 sm:h-11"
                    />
                  </div>
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