import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Política de Privacidad</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Información que Recopilamos</h2>
            <p>
              En Spanish Adventure recopilamos la siguiente información para proporcionar nuestros servicios educativos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Información de cuenta:</strong> Nombre completo, dirección de correo electrónico y contraseña.</li>
              <li><strong>Información de perfil:</strong> Foto de perfil, biografía, nacionalidad, idiomas hablados y zona horaria.</li>
              <li><strong>Datos educativos:</strong> Nivel de español (CEFR), resultados de tests, progreso de aprendizaje y objetivos de estudio.</li>
              <li><strong>Información de uso:</strong> Horarios de clases, interacciones con profesores y tutores, y participación en actividades.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Cómo Utilizamos su Información</h2>
            <p>Utilizamos la información recopilada para:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar y personalizar nuestros servicios educativos</li>
              <li>Facilitar la comunicación entre estudiantes, profesores y tutores</li>
              <li>Realizar seguimiento del progreso de aprendizaje</li>
              <li>Enviar notificaciones sobre clases, tareas y actividades</li>
              <li>Mejorar nuestros servicios y desarrollar nuevas funcionalidades</li>
              <li>Garantizar la seguridad de nuestra plataforma</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Almacenamiento y Seguridad</h2>
            <p>
              Sus datos se almacenan de forma segura en servidores protegidos. Implementamos medidas de seguridad 
              técnicas y organizativas para proteger su información personal contra acceso no autorizado, 
              alteración, divulgación o destrucción.
            </p>
            <p>
              Utilizamos encriptación SSL/TLS para todas las comunicaciones y almacenamos las contraseñas 
              de forma segura mediante algoritmos de hash.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Compartir Información</h2>
            <p>
              No vendemos ni alquilamos su información personal a terceros. Podemos compartir su información:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Con profesores y tutores asignados para facilitar su aprendizaje</li>
              <li>Con administradores de la plataforma para gestión educativa</li>
              <li>Cuando sea requerido por ley o proceso legal</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Sus Derechos</h2>
            <p>Usted tiene derecho a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Acceso:</strong> Solicitar una copia de sus datos personales</li>
              <li><strong>Rectificación:</strong> Corregir datos inexactos o incompletos</li>
              <li><strong>Eliminación:</strong> Solicitar la eliminación de sus datos</li>
              <li><strong>Portabilidad:</strong> Recibir sus datos en un formato estructurado</li>
              <li><strong>Oposición:</strong> Oponerse al procesamiento de sus datos</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Cookies</h2>
            <p>
              Utilizamos cookies esenciales para el funcionamiento de la plataforma, incluyendo 
              autenticación y preferencias de usuario. No utilizamos cookies de seguimiento 
              publicitario.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Menores de Edad</h2>
            <p>
              Nuestros servicios están dirigidos a personas mayores de 13 años. Para menores de 18 años, 
              recomendamos la supervisión de un padre o tutor legal.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Cambios en esta Política</h2>
            <p>
              Podemos actualizar esta política de privacidad periódicamente. Le notificaremos sobre 
              cambios significativos a través de la plataforma o por correo electrónico.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Contacto</h2>
            <p>
              Si tiene preguntas sobre esta política de privacidad o sobre cómo manejamos sus datos, 
              puede contactarnos a través de la plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
