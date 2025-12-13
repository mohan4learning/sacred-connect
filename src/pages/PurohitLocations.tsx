import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, MapPin, Plus, X, Save, Globe } from "lucide-react";
import { toast } from "sonner";
import { INDIAN_STATES, DISTRICTS_BY_STATE } from "@/lib/indianLocations";

export default function PurohitLocations() {
  const { purohitRecord, loading: authLoading, isPurohit, user } = useAuth();
  const navigate = useNavigate();
  const [serviceableCities, setServiceableCities] = useState<string[]>([]);
  const [newCity, setNewCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isPurohit)) {
      navigate('/auth');
    }
  }, [user, authLoading, isPurohit, navigate]);

  useEffect(() => {
    if (purohitRecord?.id) {
      fetchLocations();
    }
  }, [purohitRecord?.id]);

  const fetchLocations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('purohits')
      .select('serviceable_cities, city')
      .eq('id', purohitRecord!.id)
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
        .eq('id', purohitRecord!.id);

      if (error) throw error;
      toast.success("Service areas updated successfully!");
    } catch (error) {
      console.error('Error saving locations:', error);
      toast.error("Failed to save locations");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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

            {/* Add All Cities from State */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Add All Cities from a State
              </Label>
              <Select onValueChange={(state) => {
                const stateCities = DISTRICTS_BY_STATE[state] || [];
                if (stateCities.length === 0) {
                  toast.error("No cities found for this state");
                  return;
                }
                const uppercaseCities = stateCities.map(c => c.toUpperCase());
                const newCities = uppercaseCities.filter(c => !serviceableCities.includes(c));
                if (newCities.length === 0) {
                  toast.info("All cities from this state are already added");
                  return;
                }
                setServiceableCities([...serviceableCities, ...newCities]);
                toast.success(`Added ${newCities.length} cities from ${state}`);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a state to add all its cities" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state} ({DISTRICTS_BY_STATE[state]?.length || 0} cities)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecting a state will add all cities/districts from that state
              </p>
            </div>

            {/* Add New City */}
            <div className="space-y-2">
              <Label>Add Individual City</Label>
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
                Or add individual cities one by one
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