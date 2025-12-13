import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/lib/session";
import { User, Users, Plus, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Step = 'role' | 'profile';

interface Profile {
  id: string;
  full_name: string;
  city: string;
}

export default function Start() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useSession();
  
  const [step, setStep] = useState<Step>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(
    (searchParams.get('role') as UserRole) || null
  );
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedRole) {
      setStep('profile');
      fetchProfiles(selectedRole);
    }
  }, [selectedRole]);

  const fetchProfiles = async (role: UserRole) => {
    setLoading(true);
    const table = role === 'client' ? 'clients' : 'purohits';
    const { data, error } = await supabase
      .from(table)
      .select('id, full_name, city')
      .order('full_name');
    
    if (error) {
      toast.error('Failed to load profiles');
      console.error(error);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const handleSelectProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile && selectedRole) {
      login({
        role: selectedRole,
        profileId: profile.id,
        profileName: profile.full_name,
      });
      toast.success(`Welcome, ${profile.full_name}!`);
      // Clients go to request page, purohits go to dashboard
      navigate(selectedRole === 'client' ? '/request' : '/purohit');
    }
  };

  const handleCreateProfile = async () => {
    if (!newName.trim() || !newCity.trim() || !selectedRole) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    const table = selectedRole === 'client' ? 'clients' : 'purohits';
    
    const { data, error } = await supabase
      .from(table)
      .insert({ full_name: newName.trim(), city: newCity.trim() })
      .select('id, full_name, city')
      .single();

    if (error) {
      toast.error('Failed to create profile');
      console.error(error);
    } else if (data) {
      login({
        role: selectedRole,
        profileId: data.id,
        profileName: data.full_name,
      });
      toast.success(`Profile created! Welcome, ${data.full_name}!`);
      // Clients go to request page, purohits go to dashboard
      navigate(selectedRole === 'client' ? '/request' : '/purohit');
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div className="container py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Get Started</h1>
          <p className="text-muted-foreground">
            {step === 'role' ? 'Choose how you want to use PurohitConnect' : 'Select or create your profile'}
          </p>
        </div>

        {step === 'role' && (
          <div className="grid sm:grid-cols-2 gap-6">
            <Card 
              className="cursor-pointer hover:border-primary hover:shadow-lg transition-all"
              onClick={() => setSelectedRole('client')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>I'm a Client</CardTitle>
                <CardDescription>
                  Looking to book purohits for poojas and ceremonies
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="btn-hero w-full">
                  Continue as Client
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:border-secondary hover:shadow-lg transition-all"
              onClick={() => setSelectedRole('purohit')}
            >
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle>I'm a Purohit</CardTitle>
                <CardDescription>
                  Offering services for poojas and religious ceremonies
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="secondary" className="w-full">
                  Continue as Purohit
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'profile' && selectedRole && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedRole === 'client' ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                {selectedRole === 'client' ? 'Client' : 'Purohit'} Profile
              </CardTitle>
              <CardDescription>
                Select an existing profile or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isCreating ? (
                <>
                  {profiles.length > 0 && (
                    <div className="space-y-3">
                      <Label>Select Existing Profile</Label>
                      <Select value={selectedProfileId} onValueChange={handleSelectProfile}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a profile..." />
                        </SelectTrigger>
                        <SelectContent>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.full_name} ({profile.city})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setIsCreating(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Profile
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Enter your city"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsCreating(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 btn-hero"
                      onClick={handleCreateProfile}
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create & Continue'}
                    </Button>
                  </div>
                </div>
              )}

              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => {
                  setStep('role');
                  setSelectedRole(null);
                  setIsCreating(false);
                }}
              >
                ← Back to Role Selection
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
