import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Video, Users, Calendar, Shield } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Verified Purohits",
    description: "All purohits are verified with experience and credentials checked."
  },
  {
    icon: Calendar,
    title: "Easy Booking",
    description: "Book poojas with just a few taps. Flexible scheduling options."
  },
  {
    icon: Video,
    title: "Remote Poojas",
    description: "Can't travel? Join poojas remotely via video call."
  },
  {
    icon: Shield,
    title: "Trusted Service",
    description: "Transparent pricing and genuine reviews from devotees."
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Redirect logged-in users to their respective dashboards
  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (profile.role === 'purohit') {
        navigate('/purohit', { replace: true });
      } else if (profile.role === 'client') {
        navigate('/client', { replace: true });
      }
    }
  }, [loading, user, profile, navigate]);

  // Show loading while checking session
  if (loading) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAzMHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        
        <div className="relative container py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center text-primary-foreground animate-fade-in">
            <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Book Trusted Purohits for Your Sacred Ceremonies
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Connect with experienced and verified purohits for poojas, weddings, and all religious ceremonies — at your home, temple, or online.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold shadow-lg">
                <Link to="/auth">I'm a Client</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-2 border-foreground bg-background text-foreground hover:bg-background/90">
                <Link to="/auth">I'm a Purohit</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold mb-4">Why Choose PurohitConnect?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We make it easy to find the right purohit for your ceremonies with trust, transparency, and convenience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div 
              key={feature.title}
              className="card-elevated p-6 text-center animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-full gradient-hero flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-16">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Whether you need a purohit for your ceremony or you're a purohit looking to connect with devotees, we're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="btn-hero">
              <Link to="/auth">Sign In to Get Started</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
