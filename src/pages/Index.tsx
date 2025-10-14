import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Compass, BookOpen, Users, Award, Calendar } from 'lucide-react';
import logo from '@/assets/logo.png';
import { useEffect } from 'react';

const Index = () => {
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
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <img src={logo} alt="Spanish Adventure" className="h-32 mb-8 animate-in fade-in zoom-in duration-500" />
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-in slide-in-from-bottom-4 duration-700">
              Spanish Adventure
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-white/90 animate-in slide-in-from-bottom-6 duration-700 delay-100">
              Begin your journey to Spanish fluency with personalized learning, expert teachers, and a supportive community
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth')}
                className="border-white text-white hover:bg-white/10"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Spanish Adventure?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience a comprehensive learning platform designed for your success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Placement Testing</h3>
                <p className="text-sm text-muted-foreground">
                  Automated tests plus oral assessment to find your perfect level (A1-C2)
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="rounded-full bg-secondary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Expert Teachers & Tutors</h3>
                <p className="text-sm text-muted-foreground">
                  Personal attention from dedicated teachers and tutors assigned to you
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="rounded-full bg-accent/20 w-12 h-12 flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-2">Track Your Progress</h3>
                <p className="text-sm text-muted-foreground">
                  View tasks, receive feedback, and monitor your improvement journey
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Organized Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Easy access to your weekly schedule, room assignments, and class times
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
                Ready to Start Your Adventure?
              </h2>
              <p className="text-lg mb-8 text-white/90">
                Join Spanish Adventure today and take the first step toward fluency
              </p>
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="bg-white text-primary hover:bg-white/90 shadow-lg"
              >
                Create Your Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-8 px-4">
        <div className="container mx-auto text-center">
          <img src={logo} alt="Spanish Adventure" className="h-12 mx-auto mb-4" />
          <p className="text-white/80">© 2025 Spanish Adventure. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
