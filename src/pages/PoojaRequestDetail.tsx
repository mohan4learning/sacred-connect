import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, MapPin, IndianRupee, Video, Users, MessageSquare, Send } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface PoojaRequestData {
  id: string;
  service_name: string | null;
  custom_service_text: string | null;
  client_id: string;
  client_name: string;
  city: string;
  area: string | null;
  address: string | null;
  mode: string;
  requested_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  notes: string | null;
  status: string;
  created_at: string;
}

export default function PoojaRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { session, loading: sessionLoading, isPurohit } = useSession();
  const navigate = useNavigate();
  const [request, setRequest] = useState<PoojaRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionLoading && (!session || !isPurohit)) {
      navigate('/start');
    }
  }, [session, sessionLoading, isPurohit, navigate]);

  useEffect(() => {
    if (id) {
      fetchRequest();
    }
  }, [id]);

  const fetchRequest = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pooja_requests')
      .select(`
        id, mode, requested_date, budget_min, budget_max, city, area, address, notes, status, created_at, custom_service_text, client_id,
        clients (full_name),
        pooja_services (name)
      `)
      .eq('id', id!)
      .maybeSingle();

    if (error || !data) {
      toast.error("Request not found");
      navigate('/purohit');
      return;
    }

    setRequest({
      id: data.id,
      service_name: data.pooja_services?.name || null,
      custom_service_text: data.custom_service_text,
      client_id: data.client_id,
      client_name: data.clients?.full_name || 'Unknown',
      city: data.city,
      area: data.area,
      address: data.address,
      mode: data.mode,
      requested_date: data.requested_date,
      budget_min: data.budget_min,
      budget_max: data.budget_max,
      notes: data.notes,
      status: data.status || 'open',
      created_at: data.created_at,
    });
    setLoading(false);
  };

  const handleStartConsultation = async () => {
    if (!session?.profileId || !request) return;
    
    setSubmitting(true);
    try {
      // Create a consultation
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .insert({
          client_id: request.client_id,
          purohit_id: session.profileId,
          mode: request.mode as any,
          status: 'requested',
        })
        .select()
        .single();

      if (consultationError) throw consultationError;

      // Add initial message with quote if provided
      let messageText = message.trim();
      if (quoteAmount) {
        messageText = `Quote: ₹${parseInt(quoteAmount).toLocaleString()}\n\n${messageText}`;
      }

      if (messageText) {
        const { error: messageError } = await supabase
          .from('consultation_messages')
          .insert({
            consultation_id: consultation.id,
            sender_id: session.profileId,
            sender_role: 'purohit',
            message_text: messageText,
          });

        if (messageError) throw messageError;
      }

      toast.success("Consultation started! The client will be notified.");
      navigate(`/consultations/${consultation.id}`);
    } catch (error) {
      console.error('Error starting consultation:', error);
      toast.error("Failed to start consultation");
    } finally {
      setSubmitting(false);
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

  if (!request) {
    return null;
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

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-display">
                  {request.service_name || request.custom_service_text || 'Pooja Service Request'}
                </CardTitle>
                <CardDescription className="mt-1">
                  Posted by {request.client_name} on {format(new Date(request.created_at), 'MMMM d, yyyy')}
                </CardDescription>
              </div>
              <Badge variant={request.status === 'open' ? 'default' : 'secondary'}>
                {request.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">
                  {request.city}{request.area && `, ${request.area}`}
                </p>
                {request.address && (
                  <p className="text-sm text-muted-foreground">{request.address}</p>
                )}
              </div>
            </div>

            {/* Mode */}
            <div className="flex items-start gap-3">
              {request.mode === 'remote' ? (
                <Video className="h-5 w-5 text-violet-500 mt-0.5" />
              ) : (
                <Users className="h-5 w-5 text-emerald-500 mt-0.5" />
              )}
              <div>
                <p className="font-medium">Service Mode</p>
                <p className="text-muted-foreground">
                  {request.mode === 'remote' ? 'Remote / Online' : request.mode === 'in_person' ? 'In-Person' : 'Both (Flexible)'}
                </p>
              </div>
            </div>

            {/* Date */}
            {request.requested_date && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Preferred Date</p>
                  <p className="text-muted-foreground">
                    {format(new Date(request.requested_date), 'EEEE, MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}

            {/* Budget */}
            {(request.budget_min || request.budget_max) && (
              <div className="flex items-start gap-3">
                <IndianRupee className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="font-medium">Budget Range</p>
                  <p className="text-muted-foreground">
                    {request.budget_min && request.budget_max
                      ? `₹${request.budget_min.toLocaleString()} - ₹${request.budget_max.toLocaleString()}`
                      : request.budget_min
                      ? `From ₹${request.budget_min.toLocaleString()}`
                      : `Up to ₹${request.budget_max?.toLocaleString()}`}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {request.notes && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-medium mb-2">Additional Notes</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{request.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Card */}
        {request.status === 'open' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Respond to This Request
              </CardTitle>
              <CardDescription>
                Start a consultation with the client to discuss this pooja
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quote">Your Quote (Optional)</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                  <Input
                    id="quote"
                    type="number"
                    placeholder="Enter your quote amount"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message to Client</Label>
                <Textarea
                  id="message"
                  placeholder="Introduce yourself and explain how you can help with this pooja..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <Button 
                className="w-full btn-hero" 
                size="lg"
                onClick={handleStartConsultation}
                disabled={submitting || !message.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Sending...' : 'Start Consultation'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}