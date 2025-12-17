import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">Términos de Servicio</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar Spanish Adventure, usted acepta estos términos de servicio en su totalidad. 
              Si no está de acuerdo con alguna parte de estos términos, no debe usar nuestra plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Descripción del Servicio</h2>
            <p>
              Spanish Adventure es una plataforma educativa en línea que ofrece:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Clases de español con profesores cualificados</li>
              <li>Sesiones de tutoría personalizadas</li>
              <li>Tests de nivel y evaluaciones</li>
              <li>Seguimiento del progreso de aprendizaje</li>
              <li>Recursos educativos y materiales de estudio</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Registro y Cuenta</h2>
            <p>Para usar nuestros servicios, debe:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proporcionar información precisa y completa durante el registro</li>
              <li>Mantener la confidencialidad de su contraseña</li>
              <li>Notificarnos inmediatamente sobre cualquier uso no autorizado de su cuenta</li>
              <li>Ser responsable de todas las actividades que ocurran bajo su cuenta</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Conducta del Usuario</h2>
            <p>Al usar Spanish Adventure, usted se compromete a:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Tratar a profesores, tutores y otros usuarios con respeto</li>
              <li>No compartir contenido inapropiado, ofensivo o ilegal</li>
              <li>No intentar acceder a áreas restringidas de la plataforma</li>
              <li>No interferir con el funcionamiento normal del servicio</li>
              <li>Cumplir con los horarios de clases programadas</li>
              <li>Proporcionar retroalimentación constructiva cuando sea solicitada</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Propiedad Intelectual</h2>
            <p>
              Todo el contenido de Spanish Adventure, incluyendo pero no limitado a textos, gráficos, 
              logos, iconos, imágenes, clips de audio, descargas digitales y compilaciones de datos, 
              es propiedad de Spanish Adventure o sus proveedores de contenido y está protegido por 
              las leyes de propiedad intelectual.
            </p>
            <p>
              Los usuarios no pueden copiar, reproducir, distribuir o crear obras derivadas del 
              contenido sin autorización expresa por escrito.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Clases y Tutorías</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Las clases deben ser canceladas con al menos 24 horas de anticipación</li>
              <li>La puntualidad es esencial para el buen funcionamiento de las sesiones</li>
              <li>Los profesores y tutores se reservan el derecho de finalizar sesiones en caso de comportamiento inapropiado</li>
              <li>Las grabaciones de clases, cuando existan, son para uso educativo interno únicamente</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Limitación de Responsabilidad</h2>
            <p>
              Spanish Adventure no será responsable por:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Interrupciones del servicio debido a problemas técnicos</li>
              <li>Pérdida de datos debido a circunstancias fuera de nuestro control</li>
              <li>Acciones de otros usuarios de la plataforma</li>
              <li>Resultados específicos de aprendizaje, ya que estos dependen del esfuerzo individual</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Modificaciones del Servicio</h2>
            <p>
              Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del 
              servicio en cualquier momento, con o sin previo aviso. No seremos responsables ante 
              usted o terceros por cualquier modificación, suspensión o interrupción del servicio.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Terminación</h2>
            <p>
              Podemos terminar o suspender su cuenta y acceso al servicio inmediatamente, sin previo 
              aviso, por cualquier razón, incluyendo sin limitación si usted incumple estos términos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Cambios en los Términos</h2>
            <p>
              Nos reservamos el derecho de actualizar estos términos en cualquier momento. 
              Le notificaremos sobre cambios significativos a través de la plataforma. 
              El uso continuado del servicio después de dichos cambios constituye su aceptación 
              de los nuevos términos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">11. Ley Aplicable</h2>
            <p>
              Estos términos se regirán e interpretarán de acuerdo con las leyes aplicables, 
              sin tener en cuenta sus disposiciones sobre conflictos de leyes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">12. Contacto</h2>
            <p>
              Si tiene preguntas sobre estos términos de servicio, puede contactarnos a través 
              de la plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
