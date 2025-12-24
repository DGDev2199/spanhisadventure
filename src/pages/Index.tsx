import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Compass, BookOpen, Users, Award, Calendar } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useEffect } from 'react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Language Switcher - Fixed Position */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <img src={logo} alt="Spanish Adventure" className="h-32 mb-8 animate-in fade-in zoom-in duration-500" />
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-in slide-in-from-bottom-4 duration-700">
              {t('landing.title')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 animate-in slide-in-from-bottom-6 duration-700 delay-100">
              {t('landing.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                {t('landing.getStarted')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth')}
                className="border-white text-white hover:bg-white/10"
              >
                {t('landing.signIn')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('landing.whyChoose')}</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('landing.whyChooseDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t('landing.placementTesting')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('landing.placementTestingDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="rounded-full bg-secondary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t('landing.expertTeachers')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('landing.expertTeachersDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="rounded-full bg-accent/20 w-12 h-12 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t('landing.trackProgress')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('landing.trackProgressDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{t('landing.organizedSchedule')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('landing.organizedScheduleDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-hero text-white shadow-xl max-w-4xl mx-auto">
            <CardContent className="p-12 text-center">
              <Compass className="h-16 w-16 mx-auto mb-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('landing.readyToStart')}
              </h2>
              <p className="text-lg mb-8 text-white/90">
                {t('landing.joinToday')}
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                {t('landing.createAccount')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col items-center">
            <img src={logo} alt="Spanish Adventure" className="h-12 mb-4" />
            <div className="flex flex-wrap justify-center gap-6 mb-4 text-sm">
              <button 
                onClick={() => navigate('/privacy')} 
                className="text-white/80 hover:text-white transition-colors"
              >
                {t('landing.privacyPolicy')}
              </button>
              <button 
                onClick={() => navigate('/terms')} 
                className="text-white/80 hover:text-white transition-colors"
              >
                {t('landing.termsOfService')}
              </button>
            </div>
            <p className="text-white/80 text-sm">© 2025 Spanish Adventure. {t('landing.allRightsReserved')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
