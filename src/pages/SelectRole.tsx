import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Users, BookOpen, Loader2, ArrowLeft } from 'lucide-react';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';

export default function SelectRole() {
  const navigate = useNavigate();
  const { user, profile, loading, needsRoleSelection, selectRole, signOut } = useAuth();

  const [step, setStep] = useState<'role' | 'details'>('role');
  const [selectedRole, setSelectedRole] = useState<'client' | 'purohit' | null>(null);
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Pre-fill name from user metadata if available
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (profile && !needsRoleSelection) {
        // User already has a profile, redirect
        if (profile.role === 'admin') {
          navigate('/admin');
        } else if (profile.role === 'purohit') {
          navigate('/purohit');
        } else {
          navigate('/client');
        }
      }
    }
  }, [loading, user, profile, needsRoleSelection, navigate]);

  const handleRoleSelect = (role: 'client' | 'purohit') => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !fullName.trim() || !city.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    const { error } = await selectRole(selectedRole, fullName.trim(), city.trim());
    if (error) {
      toast.error('Failed to create profile: ' + error.message);
      setIsSubmitting(false);
    } else {
      toast.success('Profile created successfully!');
      // Navigation will happen automatically via useEffect
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-2xl py-12">
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">Complete Your Profile</CardTitle>
            <CardDescription>
              {step === 'role' 
                ? 'Choose how you want to use PurohitConnect' 
                : `Set up your ${selectedRole} profile`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'role' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card
                  className="cursor-pointer border-2 hover:border-primary transition-colors"
                  onClick={() => handleRoleSelect('client')}
                >
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">I'm a Client</h3>
                    <p className="text-sm text-muted-foreground">
                      Looking to book purohits for poojas and ceremonies
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer border-2 hover:border-primary transition-colors"
                  onClick={() => handleRoleSelect('purohit')}
                >
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">I'm a Purohit</h3>
                    <p className="text-sm text-muted-foreground">
                      Offering pooja and ceremony services to clients
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('role')}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Change Role
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <LocationAutocomplete
                    type="city"
                    value={city}
                    onChange={setCity}
                    placeholder="Select your city"
                    disabled={isSubmitting}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Create {selectedRole === 'client' ? 'Client' : 'Purohit'} Profile
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Button variant="link" onClick={handleSignOut} className="text-muted-foreground">
                Sign out and use a different account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
