import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare } from "lucide-react";
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

interface BookingChatProps {
  bookingId: string;
  clientId: string;
  purohitId: string;
  isActive: boolean; // Chat enabled when booking is confirmed, disabled when completed/cancelled
}

export function BookingChat({ bookingId, clientId, purohitId, isActive }: BookingChatProps) {
  const { clientRecord, purohitRecord, isClient, isPurohit } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
  }, [bookingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeChat = async () => {
    setLoading(true);
    
    // Find or create a consultation for this booking conversation
    const { data: existingConsultation } = await supabase
      .from("consultations")
      .select("id")
      .eq("client_id", clientId)
      .eq("purohit_id", purohitId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConsultation) {
      setConsultationId(existingConsultation.id);
      await fetchMessages(existingConsultation.id);
      subscribeToMessages(existingConsultation.id);
    } else {
      // Create a new consultation for this booking's chat
      const { data: newConsultation, error } = await supabase
        .from("consultations")
        .insert({
          client_id: clientId,
          purohit_id: purohitId,
          status: "accepted", // Auto-accepted since booking already exists
        })
        .select("id")
        .single();

      if (newConsultation) {
        setConsultationId(newConsultation.id);
        subscribeToMessages(newConsultation.id);
      } else if (error) {
        console.error("Error creating consultation:", error);
      }
    }
    
    setLoading(false);
  };

  const fetchMessages = async (consId: string) => {
    const { data } = await supabase
      .from("consultation_messages")
      .select("*")
      .eq("consultation_id", consId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  };

  const subscribeToMessages = (consId: string) => {
    const channel = supabase
      .channel(`booking-chat-${consId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "consultation_messages",
          filter: `consultation_id=eq.${consId}`,
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
    const profileId = isClient ? clientRecord?.id : purohitRecord?.id;
    const senderRole = isClient ? "client" : "purohit";
    
    if (!newMessage.trim() || !profileId || !consultationId) return;
    setSending(true);

    const { error } = await supabase.from("consultation_messages").insert({
      consultation_id: consultationId,
      sender_role: senderRole,
      sender_id: profileId,
      message_text: newMessage.trim(),
    });

    setSending(false);

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage("");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading chat...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-72 overflow-y-auto p-4 space-y-3 bg-muted/30">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              {isActive 
                ? "No messages yet. Start the conversation!"
                : "No messages in this booking."}
            </p>
          ) : (
            messages.map((msg) => {
              const profileId = isClient ? clientRecord?.id : purohitRecord?.id;
              const isOwnMessage = msg.sender_id === profileId;
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

        {isActive ? (
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
        ) : (
          <div className="p-4 border-t">
            <p className="text-center text-sm text-muted-foreground">
              Chat is closed for completed/cancelled bookings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
