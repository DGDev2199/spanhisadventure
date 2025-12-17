import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft, Compass, BookOpen, Users, HelpCircle } from "lucide-react";
import logo from "@/assets/logo.png";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const suggestions = [
    { icon: Home, label: "Inicio", path: "/", description: "Volver a la página principal" },
    { icon: BookOpen, label: "Dashboard", path: "/dashboard", description: "Tu panel de control" },
    { icon: Users, label: "Profesores", path: "/browse-teachers", description: "Explorar profesores" },
    { icon: HelpCircle, label: "Ayuda", path: "/", description: "Centro de ayuda" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo} alt="Spanish Adventure" className="h-10" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Illustration */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <Compass className="w-64 h-64 text-primary" />
            </div>
            <div className="relative">
              <h1 className="text-8xl md:text-9xl font-bold text-primary/20 select-none">404</h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <Compass className="w-16 h-16 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-4 mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              ¡Parece que te has perdido en la aventura!
            </h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              La página que buscas no existe o ha sido movida. No te preocupes, te ayudamos a encontrar el camino.
            </p>
            <p className="text-sm text-muted-foreground/70 font-mono bg-muted/50 inline-block px-3 py-1 rounded-md">
              {location.pathname}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              size="lg"
              onClick={() => navigate(-1)}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver atrás
            </Button>
            <Button
              size="lg"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              Ir al inicio
            </Button>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {suggestions.map((item) => (
              <Card
                key={item.path + item.label}
                className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
                onClick={() => navigate(item.path)}
              >
                <CardContent className="p-4 text-center">
                  <item.icon className="w-8 h-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                  <p className="font-medium text-sm group-hover:text-primary transition-colors">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 hidden md:block">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        <p>© 2025 Spanish Adventure. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default NotFound;