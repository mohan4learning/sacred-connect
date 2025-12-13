import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { ArrowLeft, Save } from "lucide-react";

export default function ClientProfile() {
  const navigate = useNavigate();
  const { user, clientRecord, loading: authLoading } = useAuth();
  
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (clientRecord) {
      setFullName(clientRecord.full_name || "");
      setCity(clientRecord.city || "");
      setArea(clientRecord.area || "");
      setAddress(clientRecord.address || "");
      setPhone(clientRecord.phone || "");
    }
  }, [clientRecord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientRecord?.id) {
      toast.error("Client record not found");
      return;
    }

    if (!fullName.trim() || !city.trim()) {
      toast.error("Full name and city are required");
      return;
    }

    setSaving(true);
    
    const { error } = await supabase
      .from("clients")
      .update({
        full_name: fullName.trim(),
        city: city.trim(),
        area: area.trim() || null,
        address: address.trim() || null,
        phone: phone.trim() || null,
      })
      .eq("id", clientRecord.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } else {
      toast.success("Profile updated successfully");
      navigate("/client");
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user || !clientRecord) {
    return (
      <Layout>
        <div className="container py-8 text-center">
          <p className="text-muted-foreground">Client profile not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/client")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <LocationAutocomplete
                  type="city"
                  value={city}
                  onChange={setCity}
                  placeholder="Select your city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area / Locality</Label>
                <Input
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Enter your area or locality"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  type="tel"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/client")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
