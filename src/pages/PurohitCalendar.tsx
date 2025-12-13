import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Layout } from "@/components/layout/Layout";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Video, Users, Phone, Mail, FileText } from "lucide-react";
import { toast } from "sonner";
import { addMinutes, format } from "date-fns";

interface BookingEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  mode: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  address: string | null;
  area: string | null;
  city: string | null;
  remote_meeting_link: string | null;
  notes: string | null;
  service_name: string | null;
}

const statusColors: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#10b981",
  completed: "#3b82f6",
  cancelled: "#ef4444",
};

export default function PurohitCalendar() {
  const { session, isPurohit } = useSession();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingEvent[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isPurohit) {
      navigate("/start");
      return;
    }
    if (session?.profileId) fetchBookings();
  }, [session?.profileId, isPurohit]);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`*, clients(full_name, phone, email), pooja_services(name)`)
      .eq("purohit_id", session!.profileId);

    if (error) {
      toast.error("Failed to load bookings");
      return;
    }

    setBookings(
      (data || []).map((b: any) => {
        const start = b.scheduled_at ? new Date(b.scheduled_at) : new Date(b.created_at);
        const duration = b.estimated_duration_minutes || 90;
        return {
          id: b.id,
          title: `${b.pooja_services?.name || "Pooja"} - ${b.clients?.full_name?.split(" ")[0] || "Client"}`,
          start,
          end: addMinutes(start, duration),
          status: b.status,
          mode: b.mode,
          client_name: b.clients?.full_name || "Unknown",
          client_phone: b.clients?.phone,
          client_email: b.clients?.email,
          address: b.address,
          area: b.area,
          city: b.city,
          remote_meeting_link: b.remote_meeting_link,
          notes: b.notes,
          service_name: b.pooja_services?.name,
        };
      })
    );
    setLoading(false);
  };

  const handleEventClick = (info: any) => {
    const booking = bookings.find((b) => b.id === info.event.id);
    if (booking) setSelectedBooking(booking);
  };

  const updateStatus = async (newStatus: "pending" | "confirmed" | "completed" | "cancelled") => {
    if (!selectedBooking) return;
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", selectedBooking.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Booking ${newStatus}`);
      setSelectedBooking({ ...selectedBooking, status: newStatus });
      setBookings((prev) =>
        prev.map((b) => (b.id === selectedBooking.id ? { ...b, status: newStatus } : b))
      );
    }
  };

  const filteredEvents = bookings
    .filter((b) => statusFilter === "all" || b.status === statusFilter)
    .map((b) => ({
      id: b.id,
      title: b.title,
      start: b.start,
      end: b.end,
      backgroundColor: statusColors[b.status] || statusColors.pending,
      borderColor: statusColors[b.status] || statusColors.pending,
    }));

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold">My Calendar</h1>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading calendar...</p>
        ) : (
          <div className="bg-card rounded-lg p-4 shadow-sm border">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              events={filteredEvents}
              eventClick={handleEventClick}
              height="auto"
              eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
            />
          </div>
        )}

        <Sheet open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
          <SheetContent className="overflow-y-auto">
            {selectedBooking && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    {selectedBooking.mode === "remote" ? (
                      <Video className="h-5 w-5 text-violet-600" />
                    ) : (
                      <Users className="h-5 w-5 text-emerald-600" />
                    )}
                    {selectedBooking.service_name || "Pooja"}
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  <div>
                    <StatusBadge status={selectedBooking.status as any} />
                    <p className="text-sm text-muted-foreground mt-1">
                      {format(selectedBooking.start, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedBooking.start, "h:mm a")} - {format(selectedBooking.end, "h:mm a")}
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Client Details</h3>
                    <p className="font-medium">{selectedBooking.client_name}</p>
                    {selectedBooking.client_phone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {selectedBooking.client_phone}
                      </p>
                    )}
                    {selectedBooking.client_email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {selectedBooking.client_email}
                      </p>
                    )}
                  </div>

                  {selectedBooking.mode === "in_person" && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Location</h3>
                      <p className="text-sm flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        {[selectedBooking.address, selectedBooking.area, selectedBooking.city]
                          .filter(Boolean)
                          .join(", ") || "Not specified"}
                      </p>
                    </div>
                  )}

                  {selectedBooking.mode === "remote" && selectedBooking.remote_meeting_link && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Remote Meeting</h3>
                      <a
                        href={selectedBooking.remote_meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Join Meeting Link
                      </a>
                    </div>
                  )}

                  {selectedBooking.notes && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2 flex items-center gap-1">
                        <FileText className="h-4 w-4" /> Notes
                      </h3>
                      <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-2">
                    <h3 className="font-semibold mb-2">Actions</h3>
                    {selectedBooking.status === "pending" && (
                      <Button onClick={() => updateStatus("confirmed")} className="w-full">
                        Confirm Booking
                      </Button>
                    )}
                    {selectedBooking.status === "confirmed" && (
                      <Button onClick={() => updateStatus("completed")} className="w-full">
                        Mark as Completed
                      </Button>
                    )}
                    {["pending", "confirmed"].includes(selectedBooking.status) && (
                      <Button
                        variant="destructive"
                        onClick={() => updateStatus("cancelled")}
                        className="w-full"
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
}
