import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, IndianRupee, Trash2, Edit2, Sparkles, PenLine } from "lucide-react";
import { toast } from "sonner";

interface PoojaService {
  id: string;
  name: string;
  description: string | null;
}

interface PurohitService {
  id: string;
  service_id: string;
  service_name: string;
  price_min: number | null;
  price_max: number | null;
}

export default function PurohitServices() {
  const { purohitRecord, loading: authLoading, isPurohit, user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<PurohitService[]>([]);
  const [allServices, setAllServices] = useState<PoojaService[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<PurohitService | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialogTab, setDialogTab] = useState<"existing" | "custom">("existing");
  const [customServiceName, setCustomServiceName] = useState("");
  const [customServiceDescription, setCustomServiceDescription] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || !isPurohit)) {
      navigate('/auth');
    }
  }, [user, authLoading, isPurohit, navigate]);

  useEffect(() => {
    if (purohitRecord?.id) {
      fetchServices();
      fetchAllServices();
    }
  }, [purohitRecord?.id]);

  const fetchServices = async () => {
    const { data } = await supabase
      .from('purohit_services')
      .select(`
        id, service_id, price_min, price_max,
        pooja_services (name)
      `)
      .eq('purohit_id', purohitRecord!.id);

    if (data) {
      setServices(data.map((s: any) => ({
        id: s.id,
        service_id: s.service_id,
        service_name: s.pooja_services?.name || 'Unknown',
        price_min: s.price_min,
        price_max: s.price_max,
      })));
    }
    setLoading(false);
  };

  const fetchAllServices = async () => {
    const { data } = await supabase
      .from('pooja_services')
      .select('id, name, description')
      .order('name');

    if (data) {
      setAllServices(data);
    }
  };

  const resetForm = () => {
    setSelectedServiceId("");
    setPriceMin("");
    setPriceMax("");
    setEditingService(null);
    setDialogTab("existing");
    setCustomServiceName("");
    setCustomServiceDescription("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (service: PurohitService) => {
    setEditingService(service);
    setSelectedServiceId(service.service_id);
    setPriceMin(service.price_min?.toString() || "");
    setPriceMax(service.price_max?.toString() || "");
    setDialogTab("existing");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      let serviceIdToUse = selectedServiceId;

      // If adding custom service, first create the pooja_service
      if (dialogTab === "custom" && !editingService) {
        const trimmedName = customServiceName.trim();
        if (!trimmedName) {
          toast.error("Please enter a service name");
          setSaving(false);
          return;
        }

        if (trimmedName.length > 100) {
          toast.error("Service name must be less than 100 characters");
          setSaving(false);
          return;
        }

        // Check if service with same name already exists
        const existingService = allServices.find(
          s => s.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (existingService) {
          // Use existing service instead of creating duplicate
          serviceIdToUse = existingService.id;
        } else {
          // Create new pooja service
          const { data: newService, error: createError } = await supabase
            .from('pooja_services')
            .insert({
              name: trimmedName,
              description: customServiceDescription.trim() || null,
            })
            .select('id')
            .single();

          if (createError) throw createError;
          serviceIdToUse = newService.id;
          
          // Refresh all services list
          fetchAllServices();
        }
      }

      if (!serviceIdToUse) {
        toast.error("Please select or create a service");
        setSaving(false);
        return;
      }

      if (editingService) {
        // Update existing
        const { error } = await supabase
          .from('purohit_services')
          .update({
            service_id: serviceIdToUse,
            price_min: priceMin ? parseInt(priceMin) : null,
            price_max: priceMax ? parseInt(priceMax) : null,
          })
          .eq('id', editingService.id);

        if (error) throw error;
        toast.success("Service updated");
      } else {
        // Check if already added
        const existing = services.find(s => s.service_id === serviceIdToUse);
        if (existing) {
          toast.error("This service is already added");
          setSaving(false);
          return;
        }

        // Add new
        const { error } = await supabase
          .from('purohit_services')
          .insert({
            purohit_id: purohitRecord!.id,
            service_id: serviceIdToUse,
            price_min: priceMin ? parseInt(priceMin) : null,
            price_max: priceMax ? parseInt(priceMax) : null,
          });

        if (error) throw error;
        toast.success(dialogTab === "custom" ? "Custom service created and added" : "Service added");
      }

      setDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error("Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('purohit_services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;
      toast.success("Service removed");
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error("Failed to remove service");
    }
  };

  // Filter out already added services when adding new
  const availableServices = editingService 
    ? allServices 
    : allServices.filter(s => !services.find(ps => ps.service_id === s.id));

  const isFormValid = editingService 
    ? !!selectedServiceId
    : dialogTab === "existing" 
      ? !!selectedServiceId 
      : !!customServiceName.trim();

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
      <div className="container py-8 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/purohit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold">My Services</h1>
            <p className="text-muted-foreground mt-1">
              Manage the pooja services you offer and your pricing
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-hero" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
                <DialogDescription>
                  {editingService ? 'Update your pricing for this service' : 'Choose an existing service or create your own'}
                </DialogDescription>
              </DialogHeader>
              
              {!editingService && (
                <Tabs value={dialogTab} onValueChange={(v) => setDialogTab(v as "existing" | "custom")} className="mt-2">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Existing
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="flex items-center gap-2">
                      <PenLine className="h-4 w-4" />
                      Custom
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              <div className="space-y-4 pt-4">
                {(dialogTab === "existing" || editingService) && (
                  <div>
                    <Label htmlFor="service">Pooja Service</Label>
                    <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableServices.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {dialogTab === "custom" && !editingService && (
                  <>
                    <div>
                      <Label htmlFor="customName">Service Name *</Label>
                      <Input
                        id="customName"
                        placeholder="e.g. Vastu Shanti Pooja"
                        value={customServiceName}
                        onChange={(e) => setCustomServiceName(e.target.value)}
                        className="mt-1"
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label htmlFor="customDescription">Description (optional)</Label>
                      <Textarea
                        id="customDescription"
                        placeholder="Brief description of the service..."
                        value={customServiceDescription}
                        onChange={(e) => setCustomServiceDescription(e.target.value)}
                        className="mt-1"
                        rows={2}
                        maxLength={500}
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="priceMin">Min Price (₹)</Label>
                    <Input
                      id="priceMin"
                      type="number"
                      placeholder="e.g. 2000"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="priceMax">Max Price (₹)</Label>
                    <Input
                      id="priceMax"
                      type="number"
                      placeholder="e.g. 5000"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Leave prices empty for "Price on Request"
                </p>

                <Button 
                  className="w-full btn-hero" 
                  onClick={handleSave}
                  disabled={saving || !isFormValid}
                >
                  {saving ? 'Saving...' : editingService ? 'Update Service' : dialogTab === "custom" ? 'Create & Add Service' : 'Add Service'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {services.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">No services added yet</h3>
              <p className="text-muted-foreground mb-4">
                Add the pooja services you offer to appear in client searches
              </p>
              <Button className="btn-hero" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <Card key={service.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{service.service_name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <IndianRupee className="h-4 w-4" />
                        {service.price_min && service.price_max ? (
                          <span>₹{service.price_min.toLocaleString()} - ₹{service.price_max.toLocaleString()}</span>
                        ) : service.price_min ? (
                          <span>From ₹{service.price_min.toLocaleString()}</span>
                        ) : service.price_max ? (
                          <span>Up to ₹{service.price_max.toLocaleString()}</span>
                        ) : (
                          <span className="text-muted-foreground">Price on request</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleOpenEdit(service)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(service.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
