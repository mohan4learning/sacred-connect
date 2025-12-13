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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, MapPin, IndianRupee, Video, Users, MessageSquare, Send, Clock, User, CheckCircle, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { QuoteComparison } from "@/components/QuoteComparison";
import { cn } from "@/lib/utils";

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

interface MessageData {
  id: string;
  sender_role: string;
  sender_id: string;
  message_text: string;
  created_at: string;
}

interface ResponseData {
  id: string;
  purohit_id: string;
  purohit_name: string;
  status: string;
  created_at: string;
  quote: string | null;
  message: string | null;
  messages: MessageData[];
}

export default function PoojaRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { session, loading: sessionLoading, isPurohit, isClient } = useSession();
  const navigate = useNavigate();
  const [request, setRequest] = useState<PoojaRequestData | null>(null);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingPrice, setBookingPrice] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [creatingBooking, setCreatingBooking] = useState(false);

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/start');
    }
  }, [session, sessionLoading, navigate]);

  useEffect(() => {
    if (id) {
      fetchRequest();
      fetchResponses();
    }
  }, [id, session?.profileId]);

  // Subscribe to realtime message updates
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`request-responses-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_messages',
        },
        () => {
          // Refetch responses when new messages arrive
          fetchResponses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      navigate(isPurohit ? '/purohit' : '/client');
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

  const fetchResponses = async () => {
    if (!id) return;
    
    // Build query for consultations linked to this pooja request
    let query = supabase
      .from('consultations')
      .select(`
        id, purohit_id, status, created_at,
        purohits (full_name)
      `)
      .eq('pooja_request_id', id)
      .order('created_at', { ascending: false });

    // IMPORTANT: Purohits should only see their own responses, not other purohits' responses
    // Clients (request owners) can see all responses
    if (isPurohit && session?.profileId) {
      query = query.eq('purohit_id', session.profileId);
    }

    const { data: consultations } = await query;

    if (consultations) {
      // Check if current purohit has already responded
      if (isPurohit && session?.profileId) {
        setHasResponded(consultations.length > 0);
      }

      // Get all messages for each consultation
      const responsesWithMessages = await Promise.all(
        consultations.map(async (c: any) => {
          const { data: messages } = await supabase
            .from('consultation_messages')
            .select('*')
            .eq('consultation_id', c.id)
            .order('created_at', { ascending: true });

          const firstMessage = messages?.[0]?.message_text || '';
          const quoteMatch = firstMessage.match(/Quote: ₹([\d,]+)/);
          const quote = quoteMatch ? quoteMatch[0] : null;
          const messageWithoutQuote = firstMessage.replace(/Quote: ₹[\d,]+\n*/, '').trim();

          return {
            id: c.id,
            purohit_id: c.purohit_id,
            purohit_name: c.purohits?.full_name || 'Unknown Purohit',
            status: c.status,
            created_at: c.created_at,
            quote: quote,
            message: messageWithoutQuote || null,
            messages: messages || [],
          };
        })
      );

      setResponses(responsesWithMessages);
    }
  };

  const handleSubmitResponse = async () => {
    if (!session?.profileId || !request) return;
    
    setSubmitting(true);
    try {
      // Create a consultation linked to this pooja request
      const { data: consultation, error: consultationError } = await supabase
        .from('consultations')
        .insert({
          client_id: request.client_id,
          purohit_id: session.profileId,
          pooja_request_id: request.id,
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

      toast.success("Response sent! The client will be notified.");
      setHasResponded(true);
      setQuoteAmount("");
      setMessage("");
      fetchResponses();
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error("Failed to send response");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptResponse = async (responseId: string) => {
    try {
      // Update consultation status to accepted
      await supabase
        .from('consultations')
        .update({ status: 'accepted' })
        .eq('id', responseId);

      // Update pooja request status to matched
      await supabase
        .from('pooja_requests')
        .update({ status: 'matched' })
        .eq('id', request?.id);

      toast.success("Response accepted! You can now proceed with booking.");
      fetchRequest();
      fetchResponses();
    } catch (error) {
      console.error('Error accepting response:', error);
      toast.error("Failed to accept response");
    }
  };

  const handleOpenBookingDialog = (response: ResponseData) => {
    setSelectedResponse(response);
    // Pre-fill price from quote if available
    const quoteMatch = response.quote?.match(/₹([\d,]+)/);
    if (quoteMatch) {
      setBookingPrice(quoteMatch[1].replace(/,/g, ''));
    }
    // Pre-fill date if available
    if (request?.requested_date) {
      setBookingDate(request.requested_date);
    }
    setBookingDialogOpen(true);
  };

  const handleCreateBooking = async () => {
    if (!selectedResponse || !request || !session?.profileId) return;
    
    setCreatingBooking(true);
    try {
      const scheduledAt = bookingDate && bookingTime 
        ? new Date(`${bookingDate}T${bookingTime}`).toISOString()
        : bookingDate 
        ? new Date(bookingDate).toISOString()
        : null;

      const { error } = await supabase
        .from('bookings')
        .insert({
          client_id: request.client_id,
          purohit_id: selectedResponse.purohit_id,
          mode: request.mode as any,
          scheduled_at: scheduledAt,
          city: request.city,
          area: request.area,
          address: request.address,
          price_agreed: bookingPrice ? parseInt(bookingPrice) : null,
          notes: bookingNotes || request.notes,
          status: 'pending',
        });

      if (error) throw error;

      // Update consultation status to completed
      await supabase
        .from('consultations')
        .update({ status: 'completed' })
        .eq('id', selectedResponse.id);

      // Update request status to closed
      await supabase
        .from('pooja_requests')
        .update({ status: 'closed' })
        .eq('id', request.id);

      toast.success("Booking created successfully!");
      setBookingDialogOpen(false);
      navigate('/bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error("Failed to create booking");
    } finally {
      setCreatingBooking(false);
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

  const isOwner = isClient && request.client_id === session?.profileId;

  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to={isPurohit ? "/purohit" : "/client/requests"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isPurohit ? "Back to Dashboard" : "Back to My Requests"}
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
              <Badge variant={request.status === 'open' ? 'default' : request.status === 'matched' ? 'secondary' : 'outline'}>
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

        {/* Responses Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Responses ({responses.length})
                </CardTitle>
                <CardDescription>
                  {isOwner ? "Quotes and messages from purohits" : "Response history for this request"}
                </CardDescription>
              </div>
              {/* Quote Comparison Button - Only for clients with multiple responses */}
              {isOwner && responses.length >= 2 && (
                <QuoteComparison 
                  responses={responses}
                  requestStatus={request.status}
                  onAccept={handleAcceptResponse}
                  onOpenBooking={handleOpenBookingDialog}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                No responses yet.
              </p>
            ) : (
              <div className="space-y-4">
                {responses.map((response) => (
                  <div key={response.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{response.purohit_name}</span>
                        {isPurohit && response.purohit_id === session?.profileId && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={response.status as any} />
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(response.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                    
                    {/* Message Thread */}
                    <div className="space-y-2 mb-3">
                      {response.messages.map((msg, idx) => {
                        const isFirstMessage = idx === 0;
                        const displayText = isFirstMessage 
                          ? msg.message_text.replace(/Quote: ₹[\d,]+\n*/, '').trim()
                          : msg.message_text;
                        const senderLabel = msg.sender_role === 'purohit' ? response.purohit_name : request.client_name;
                        const isOwnMessage = msg.sender_id === session?.profileId;

                        return (
                          <div key={msg.id} className="space-y-1">
                            {isFirstMessage && response.quote && (
                              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 rounded text-emerald-700 dark:text-emerald-300 font-semibold">
                                {response.quote}
                              </div>
                            )}
                            {displayText && (
                              <div className={cn(
                                "p-2 rounded-lg text-sm",
                                isOwnMessage 
                                  ? "bg-primary/10 border-l-2 border-primary" 
                                  : "bg-muted/50 border-l-2 border-muted-foreground/30"
                              )}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">
                                    {isOwnMessage ? 'You' : senderLabel}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                                  </span>
                                </div>
                                <p className="text-muted-foreground">{displayText}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions for responses */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {/* Accept button for client on open responses */}
                      {isOwner && request.status === 'open' && response.status === 'requested' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleAcceptResponse(response.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept & Proceed
                        </Button>
                      )}

                      {/* Discuss/Negotiate button - always available for both parties */}
                      {['requested', 'accepted'].includes(response.status) && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          asChild
                        >
                          <Link to={`/consultations/${response.id}`}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Discuss / Negotiate
                          </Link>
                        </Button>
                      )}

                      {/* Create Booking button for client on accepted responses */}
                      {isOwner && response.status === 'accepted' && (
                        <Button 
                          size="sm" 
                          className="btn-hero"
                          onClick={() => handleOpenBookingDialog(response)}
                        >
                          <CalendarPlus className="h-4 w-4 mr-2" />
                          Create Booking
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Form for Purohits */}
        {isPurohit && request.status === 'open' && !hasResponded && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Your Quote
              </CardTitle>
              <CardDescription>
                Respond with your quote and message to the client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quote">Your Quote</Label>
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
                onClick={handleSubmitResponse}
                disabled={submitting || !message.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Sending...' : 'Send Response'}
              </Button>
            </CardContent>
          </Card>
        )}

        {isPurohit && hasResponded && (
          <Card className="bg-muted/30">
            <CardContent className="py-6 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-medium">You have already responded to this request</p>
              <p className="text-sm text-muted-foreground">Wait for the client to review your quote</p>
            </CardContent>
          </Card>
        )}
        {/* Booking Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Booking</DialogTitle>
              <DialogDescription>
                Finalize the booking with {selectedResponse?.purohit_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="booking-date">Date</Label>
                  <Input
                    id="booking-date"
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="booking-time">Time</Label>
                  <Input
                    id="booking-time"
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="booking-price">Agreed Price (₹)</Label>
                <Input
                  id="booking-price"
                  type="number"
                  value={bookingPrice}
                  onChange={(e) => setBookingPrice(e.target.value)}
                  placeholder="Enter agreed amount"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="booking-notes">Notes (optional)</Label>
                <Textarea
                  id="booking-notes"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Any special instructions..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <Button 
                className="w-full btn-hero" 
                onClick={handleCreateBooking}
                disabled={creatingBooking || !bookingDate}
              >
                <CalendarPlus className="h-4 w-4 mr-2" />
                {creatingBooking ? 'Creating...' : 'Confirm Booking'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
