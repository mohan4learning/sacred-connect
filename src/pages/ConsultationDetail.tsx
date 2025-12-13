import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { ArrowLeft, Send, MessageSquare, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_role: string;
  sender_id: string;
  message_text: string;
  created_at: string;
}

interface ConsultationData {
  id: string;
  status: string;
  created_at: string;
  mode: string | null;
  purohit: { id: string; full_name: string };
  client: { id: string; full_name: string };
  service: { name: string } | null;
}

export default function ConsultationDetail() {
  const { id } = useParams<{ id: string }>();
  const { session, isClient, isPurohit } = useSession();
  const navigate = useNavigate();
  const [consultation, setConsultation] = useState<ConsultationData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [updatingQuote, setUpdatingQuote] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Extract current quote from messages
  const currentQuote = messages.reduce((quote, msg) => {
    const match = msg.message_text.match(/Quote: ₹([\d,]+)/);
    if (match) return match[1].replace(/,/g, '');
    return quote;
  }, "");

  useEffect(() => {
    if (id) {
      fetchConsultation();
      fetchMessages();
      subscribeToMessages();
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Initialize quote amount from current quote
    if (currentQuote && !quoteAmount) {
      setQuoteAmount(currentQuote);
    }
  }, [currentQuote]);

  const fetchConsultation = async () => {
    const { data, error } = await supabase
      .from("consultations")
      .select(`*, purohits(id, full_name), clients(id, full_name), pooja_services(name)`)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast.error("Consultation not found");
      navigate("/consultations");
      return;
    }

    // SECURITY: Verify user has access to this consultation
    // Only the client or the purohit involved can view it
    const isParticipant = 
      (isClient && data.client_id === session?.profileId) ||
      (isPurohit && data.purohit_id === session?.profileId);

    if (!isParticipant) {
      toast.error("You don't have access to this consultation");
      navigate("/consultations");
      return;
    }

    setConsultation({
      ...data,
      purohit: data.purohits,
      client: data.clients,
      service: data.pooja_services,
    });
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("consultation_messages")
      .select("*")
      .eq("consultation_id", id)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`consultation-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consultation_messages",
          filter: `consultation_id=eq.${id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session?.profileId) return;
    setSending(true);

    const { error } = await supabase.from("consultation_messages").insert({
      consultation_id: id,
      sender_role: session.role,
      sender_id: session.profileId,
      message_text: newMessage.trim(),
    });

    setSending(false);

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
  };

  const handleUpdateQuote = async () => {
    if (!quoteAmount || !session?.profileId) return;
    setUpdatingQuote(true);

    const { error } = await supabase.from("consultation_messages").insert({
      consultation_id: id,
      sender_role: session.role,
      sender_id: session.profileId,
      message_text: `Quote: ₹${parseInt(quoteAmount).toLocaleString()}`,
    });

    setUpdatingQuote(false);

    if (error) {
      toast.error("Failed to update quote");
    } else {
      toast.success("Quote updated");
    }
  };

  const updateStatus = async (newStatus: "requested" | "accepted" | "completed" | "cancelled") => {
    if (!consultation) return;
    const { error } = await supabase
      .from("consultations")
      .update({ status: newStatus })
      .eq("id", consultation.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Consultation ${newStatus}`);
      setConsultation({ ...consultation, status: newStatus });
    }
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

  if (!consultation) return null;

  const otherParty = isClient ? consultation.purohit : consultation.client;

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/consultations")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Consultations
        </Button>

        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-xl flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                {consultation.service?.name || "General Consultation"}
              </CardTitle>
              <StatusBadge status={consultation.status as any} />
            </div>
            <p className="text-sm text-muted-foreground">
              with{" "}
              {isClient ? (
                <Link to={`/purohits/${otherParty.id}`} className="text-primary hover:underline">
                  {otherParty.full_name}
                </Link>
              ) : (
                <Link to="/client" className="text-primary hover:underline">
                  {otherParty.full_name}
                </Link>
              )}{" "}
              • Started {format(new Date(consultation.created_at), "MMM d, yyyy")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quote Section - editable by purohit */}
            {["requested", "accepted"].includes(consultation.status) && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="h-4 w-4 text-emerald-600" />
                  <Label className="font-medium">Agreed Amount</Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    className="flex-1"
                    disabled={!isPurohit}
                  />
                  {isPurohit && (
                    <Button 
                      size="sm" 
                      onClick={handleUpdateQuote}
                      disabled={updatingQuote || !quoteAmount}
                    >
                      {updatingQuote ? "Updating..." : "Update Quote"}
                    </Button>
                  )}
                </div>
                {currentQuote && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current quote: ₹{parseInt(currentQuote).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            {isPurohit && consultation.status === "requested" && (
              <div className="flex gap-2">
                <Button onClick={() => updateStatus("accepted")} size="sm">
                  Accept
                </Button>
                <Button variant="outline" onClick={() => updateStatus("cancelled")} size="sm">
                  Decline
                </Button>
              </div>
            )}
            {consultation.status === "accepted" && (
              <Button onClick={() => updateStatus("completed")} size="sm" variant="outline">
                Mark as Completed
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="h-96 overflow-y-auto p-4 space-y-3 bg-muted/30">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((msg) => {
                  const isOwnMessage = msg.sender_id === session?.profileId;
                  return (
                    <div
                      key={msg.id}
                      className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-3 py-2",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border"
                        )}
                      >
                        <p className="text-sm">{msg.message_text}</p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {format(new Date(msg.created_at), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {["requested", "accepted"].includes(consultation.status) && (
              <div className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  disabled={sending}
                />
                <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
