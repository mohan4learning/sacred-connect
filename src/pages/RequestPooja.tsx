import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const schema = z.object({
  service_id: z.string().optional(),
  custom_service_text: z.string().optional(),
  mode: z.enum(["remote", "in_person"]),
  city: z.string().min(1, "City is required"),
  area: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  budget_min: z.coerce.number().optional(),
  budget_max: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

interface Service {
  id: string;
  name: string;
}

export default function RequestPooja() {
  const { session, isClient, loading } = useSession();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [requestedDate, setRequestedDate] = useState<Date | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { mode: "in_person" },
  });

  const mode = watch("mode");

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session || !isClient) {
      navigate("/start");
    }
  }, [loading, session, isClient, navigate]);

  const fetchServices = async () => {
    const { data } = await supabase.from("pooja_services").select("id, name").order("name");
    if (data) setServices(data);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  const onSubmit = async (data: FormData) => {
    if (!session?.profileId) return;
    setSubmitting(true);

    const { error } = await supabase.from("pooja_requests").insert({
      client_id: session.profileId,
      service_id: data.service_id || null,
      custom_service_text: data.custom_service_text || null,
      mode: data.mode,
      requested_date: requestedDate ? format(requestedDate, "yyyy-MM-dd") : null,
      city: data.city,
      area: data.area || null,
      address: data.address || null,
      notes: data.notes || null,
      budget_min: data.budget_min || null,
      budget_max: data.budget_max || null,
      status: "open",
    });

    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit request");
    } else {
      toast.success("Pooja request submitted successfully!");
      navigate("/client");
    }
  };

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-2xl">Request a Pooja</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label>Pooja Type</Label>
                <Select onValueChange={(v) => setValue("service_id", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a pooja type" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Or describe your custom requirement"
                  {...register("custom_service_text")}
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Mode</Label>
                <RadioGroup
                  defaultValue="in_person"
                  onValueChange={(v) => setValue("mode", v as "remote" | "in_person")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="in_person" id="in_person" />
                    <Label htmlFor="in_person" className="cursor-pointer">
                      In-Person
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="remote" id="remote" />
                    <Label htmlFor="remote" className="cursor-pointer">
                      Remote / Online
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !requestedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {requestedDate ? format(requestedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={requestedDate}
                      onSelect={setRequestedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <LocationAutocomplete
                    type="city"
                    value={watch("city") || ""}
                    onChange={(v) => setValue("city", v)}
                    placeholder="Select or type city..."
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Area</Label>
                  <LocationAutocomplete
                    type="area"
                    value={watch("area") || ""}
                    onChange={(v) => setValue("area", v)}
                    city={watch("city") || ""}
                    placeholder="Select or type area..."
                  />
                </div>
              </div>

              {mode === "in_person" && (
                <div className="space-y-2">
                  <Label>Full Address</Label>
                  <Textarea placeholder="Your complete address" {...register("address")} />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Budget Min (₹)</Label>
                  <Input type="number" placeholder="1000" {...register("budget_min")} />
                </div>
                <div className="space-y-2">
                  <Label>Budget Max (₹)</Label>
                  <Input type="number" placeholder="5000" {...register("budget_max")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  placeholder="Any special requirements or preferences..."
                  {...register("notes")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
