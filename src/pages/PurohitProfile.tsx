import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Star, Video, Users, Clock, Languages, Award, MessageSquare, Calendar, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface PurohitDetail {
  id: string;
  full_name: string;
  city: string;
  area: string | null;
  languages: string[];
  experience_years: number;
  bio: string | null;
  remote_pooja_available: boolean;
  in_person_available: boolean;
  avatar_url: string | null;
}

interface ServiceItem {
  id: string;
  name: string;
  price_min: number | null;
  price_max: number | null;
}

interface PortfolioItem {
  id: string;
  type: string;
  title: string;
  content_url: string | null;
  content_text: string | null;
}

export default function PurohitProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clientRecord, isClient, user } = useAuth();
  
  const [purohit, setPurohit] = useState<PurohitDetail | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Consultation/Booking dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'consultation' | 'booking'>('consultation');
  const [selectedService, setSelectedService] = useState('');
  const [selectedMode, setSelectedMode] = useState<'remote' | 'in_person'>('in_person');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPurohitData();
    }
  }, [id]);

  const fetchPurohitData = async () => {
    setLoading(true);

    const [purohitRes, servicesRes, portfolioRes, bookingsRes] = await Promise.all([
      supabase.from('purohits').select('id, full_name, city, area, bio, languages, experience_years, remote_pooja_available, in_person_available, avatar_url, is_verified, user_id').eq('id', id).single(),
      supabase.from('purohit_services').select(`
        id,
        price_min,
        price_max,
        pooja_services (id, name)
      `).eq('purohit_id', id),
      supabase.from('purohit_portfolio_items').select('*').eq('purohit_id', id),
      supabase.from('bookings').select('id', { count: 'exact' }).eq('purohit_id', id).eq('status', 'completed'),
    ]);

    if (purohitRes.data) setPurohit(purohitRes.data as PurohitDetail);
    if (servicesRes.data) {
      setServices(servicesRes.data.map((s: any) => ({
        id: s.pooja_services?.id,
        name: s.pooja_services?.name,
        price_min: s.price_min,
        price_max: s.price_max,
      })).filter((s: ServiceItem) => s.name));
    }
    if (portfolioRes.data) setPortfolio(portfolioRes.data);
    setBookingCount(bookingsRes.count || 0);
    
    setLoading(false);
  };

  const getRating = (count: number) => {
    if (count >= 50) return 4.9;
    if (count >= 20) return 4.7;
    if (count >= 10) return 4.5;
    if (count >= 5) return 4.3;
    return 4.0;
  };

  const handleStartConsultation = () => {
    if (!user || !isClient) {
      toast.error('Please login as a client first');
      navigate('/auth');
      return;
    }
    setDialogType('consultation');
    setDialogOpen(true);
  };

  const handleRequestBooking = () => {
    if (!user || !isClient) {
      toast.error('Please login as a client first');
      navigate('/auth');
      return;
    }
    setDialogType('booking');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!clientRecord || !purohit) return;
    
    setSubmitting(true);

    if (dialogType === 'consultation') {
      const { error } = await supabase.from('consultations').insert({
        client_id: clientRecord.id,
        purohit_id: purohit.id,
        service_id: selectedService || null,
        mode: selectedMode,
        status: 'requested',
      });

      if (error) {
        toast.error('Failed to start consultation');
      } else {
        toast.success('Consultation request sent!');
        setDialogOpen(false);
        navigate('/consultations');
      }
    } else {
      const { error } = await supabase.from('bookings').insert({
        client_id: clientRecord.id,
        purohit_id: purohit.id,
        service_id: selectedService || null,
        mode: selectedMode,
        status: 'pending',
        notes: notes || null,
        city: purohit.city,
      });

      if (error) {
        toast.error('Failed to create booking');
      } else {
        toast.success('Booking request sent!');
        setDialogOpen(false);
        navigate('/bookings');
      }
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!purohit) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <p className="text-muted-foreground mb-4">Purohit not found</p>
          <Button asChild><Link to="/purohits">Back to Listing</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        {/* Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {purohit.avatar_url ? (
                <img 
                  src={purohit.avatar_url} 
                  alt={purohit.full_name}
                  className="w-24 h-24 rounded-full object-cover flex-shrink-0 border-4 border-background shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-display text-4xl font-bold">
                    {purohit.full_name.charAt(0)}
                  </span>
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h1 className="font-display text-2xl font-bold">{purohit.full_name}</h1>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="font-semibold">{getRating(bookingCount).toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({bookingCount} bookings)</span>
                  </div>
                </div>

                <p className="text-muted-foreground flex items-center gap-1 mb-3">
                  <MapPin className="h-4 w-4" />
                  {purohit.city}{purohit.area && `, ${purohit.area}`}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {purohit.remote_pooja_available && (
                    <span className="inline-flex items-center gap-1 text-sm bg-violet-100 text-violet-700 px-3 py-1 rounded-full">
                      <Video className="h-4 w-4" /> Remote Available
                    </span>
                  )}
                  {purohit.in_person_available && (
                    <span className="inline-flex items-center gap-1 text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                      <Users className="h-4 w-4" /> In-Person
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {purohit.experience_years}+ years experience
                  </span>
                  {purohit.languages.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Languages className="h-4 w-4" />
                      {purohit.languages.join(', ')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Button size="lg" className="btn-hero" onClick={handleStartConsultation}>
            <MessageSquare className="mr-2 h-5 w-5" />
            Start Consultation
          </Button>
          <Button size="lg" variant="outline" className="btn-outline-hero" onClick={handleRequestBooking}>
            <Calendar className="mr-2 h-5 w-5" />
            Request Booking
          </Button>
          {purohit.remote_pooja_available && (
            <Button size="lg" variant="outline" onClick={() => {
              setSelectedMode('remote');
              handleRequestBooking();
            }}>
              <Video className="mr-2 h-5 w-5" />
              Book Remote Pooja
            </Button>
          )}
        </div>

        {/* Bio */}
        {purohit.bio && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{purohit.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Services */}
        {services.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
              <CardDescription>Available poojas and ceremonies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <span className="font-medium">{service.name}</span>
                    {(service.price_min || service.price_max) && (
                      <span className="text-sm text-muted-foreground">
                        ₹{service.price_min?.toLocaleString()} - ₹{service.price_max?.toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
              <CardDescription>Certifications and testimonials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {portfolio.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-4 rounded-lg border">
                    <Award className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {item.content_text && (
                        <p className="text-sm text-muted-foreground mt-1">{item.content_text}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {dialogType === 'consultation' ? 'Start Consultation' : 'Request Booking'}
              </DialogTitle>
              <DialogDescription>
                {dialogType === 'consultation' 
                  ? 'Send a consultation request to discuss your requirements'
                  : 'Send a booking request to schedule a pooja'
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Service (Optional)</label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Mode</label>
                <Select value={selectedMode} onValueChange={(v) => setSelectedMode(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {purohit.in_person_available && (
                      <SelectItem value="in_person">In-Person</SelectItem>
                    )}
                    {purohit.remote_pooja_available && (
                      <SelectItem value="remote">Remote</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {dialogType === 'booking' && (
                <div>
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Textarea 
                    placeholder="Any specific requirements or preferences..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              )}

              <Button 
                className="w-full btn-hero" 
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
