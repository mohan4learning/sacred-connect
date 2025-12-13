import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { ArrowLeft, MapPin, Plus, X, Save } from "lucide-react";
import { toast } from "sonner";

export default function PurohitLocations() {
  const { session, loading: sessionLoading, isPurohit } = useSession();
  const navigate = useNavigate();
  const [serviceableCities, setServiceableCities] = useState<string[]>([]);
  const [newCity, setNewCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionLoading && (!session || !isPurohit)) {
      navigate('/start');
    }
  }, [session, sessionLoading, isPurohit, navigate]);

  useEffect(() => {
    if (session?.profileId) {
      fetchLocations();
    }
  }, [session?.profileId]);

  const fetchLocations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('purohits')
      .select('serviceable_cities, city')
      .eq('id', session!.profileId)
      .single();
    
    if (data) {
      const cities = data.serviceable_cities?.length > 0 
        ? data.serviceable_cities 
        : [data.city];
      setServiceableCities(cities);
    }
    setLoading(false);
  };

  const handleAddCity = () => {
    const city = newCity.trim().toUpperCase();
    if (!city) return;
    
    if (serviceableCities.includes(city)) {
      toast.error("This city is already in your list");
      return;
    }
    
    setServiceableCities([...serviceableCities, city]);
    setNewCity("");
  };

  const handleRemoveCity = (cityToRemove: string) => {
    if (serviceableCities.length === 1) {
      toast.error("You must have at least one serviceable city");
      return;
    }
    setServiceableCities(serviceableCities.filter(c => c !== cityToRemove));
  };

  const handleSave = async () => {
    if (serviceableCities.length === 0) {
      toast.error("Please add at least one city");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('purohits')
        .update({ serviceable_cities: serviceableCities })
        .eq('id', session!.profileId);

      if (error) throw error;
      toast.success("Service areas updated successfully!");
    } catch (error) {
      console.error('Error saving locations:', error);
      toast.error("Failed to save locations");
    } finally {
      setSaving(false);
    }
  };

  if (sessionLoading || loading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/purohit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Service Areas
            </CardTitle>
            <CardDescription>
              Add cities where you can provide pooja services. You'll see requests from clients in these cities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Cities */}
            <div>
              <Label className="mb-3 block">Your Serviceable Cities</Label>
              <div className="flex flex-wrap gap-2">
                {serviceableCities.map((city) => (
                  <Badge 
                    key={city} 
                    variant="secondary" 
                    className="px-3 py-1.5 text-sm flex items-center gap-2"
                  >
                    <MapPin className="h-3 w-3" />
                    {city}
                    <button
                      onClick={() => handleRemoveCity(city)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {serviceableCities.length === 0 && (
                <p className="text-sm text-muted-foreground">No cities added yet</p>
              )}
            </div>

            {/* Add New City */}
            <div className="space-y-2">
              <Label>Add a City</Label>
              <div className="flex gap-2">
                <LocationAutocomplete
                  type="city"
                  value={newCity}
                  onChange={setNewCity}
                  placeholder="Select or type city..."
                  className="flex-1"
                />
                <Button onClick={handleAddCity} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Select from suggestions or type a custom city name. Press Add to include the city.
              </p>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full btn-hero"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Service Areas'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}