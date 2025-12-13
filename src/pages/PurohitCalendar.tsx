import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Layout } from "@/components/layout/Layout";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Video, Users, Phone, Mail, FileText, ArrowLeft, Plus, Ban, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addMinutes, format, parseISO } from "date-fns";

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
  type: 'booking';
}

interface BlockEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  reason: string | null;
  type: 'block';
}

type CalendarEvent = BookingEvent | BlockEvent;

const statusColors: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#10b981",
  completed: "#3b82f6",
  cancelled: "#ef4444",
};

const blockColor = "#6b7280"; // Gray for blocked time

export default function PurohitCalendar() {
  const { session, isPurohit, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingEvent[]>([]);
  const [blocks, setBlocks] = useState<BlockEvent[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<BlockEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  
  // Block dialog state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockStartDate, setBlockStartDate] = useState("");
  const [blockStartTime, setBlockStartTime] = useState("09:00");
  const [blockEndDate, setBlockEndDate] = useState("");
  const [blockEndTime, setBlockEndTime] = useState("17:00");
  const [blockReason, setBlockReason] = useState("");
  const [savingBlock, setSavingBlock] = useState(false);

  useEffect(() => {
    // Wait for session to load before checking role
    if (sessionLoading) return;
    
    if (!session || !isPurohit) {
      navigate("/start");
      return;
    }
    
    fetchBookings();
    fetchBlocks();
  }, [session?.profileId, isPurohit, sessionLoading]);

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
          type: 'booking' as const,
        };
      })
    );
    setLoading(false);
  };

  const fetchBlocks = async () => {
    const { data, error } = await supabase
      .from("purohit_availability_blocks")
      .select("*")
      .eq("purohit_id", session!.profileId);

    if (error) {
      console.error("Failed to load blocks:", error);
      return;
    }

    setBlocks(
      (data || []).map((b: any) => ({
        id: b.id,
        title: b.reason || "Unavailable",
        start: new Date(b.start_time),
        end: new Date(b.end_time),
        reason: b.reason,
        type: 'block' as const,
      }))
    );
  };

  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    const booking = bookings.find((b) => b.id === eventId);
    if (booking) {
      setSelectedBooking(booking);
      return;
    }
    const block = blocks.find((b) => b.id === eventId);
    if (block) {
      setSelectedBlock(block);
    }
  };

  const handleDateSelect = (selectInfo: any) => {
    // When user selects a date range, open block dialog
    const start = selectInfo.start;
    const end = selectInfo.end;
    setBlockStartDate(format(start, "yyyy-MM-dd"));
    setBlockStartTime(format(start, "HH:mm"));
    setBlockEndDate(format(end, "yyyy-MM-dd"));
    setBlockEndTime(format(end, "HH:mm"));
    setBlockReason("");
    setBlockDialogOpen(true);
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

  const handleSaveBlock = async () => {
    if (!blockStartDate || !blockEndDate) {
      toast.error("Please select start and end dates");
      return;
    }

    setSavingBlock(true);
    const startTime = parseISO(`${blockStartDate}T${blockStartTime}`);
    const endTime = parseISO(`${blockEndDate}T${blockEndTime}`);

    if (endTime <= startTime) {
      toast.error("End time must be after start time");
      setSavingBlock(false);
      return;
    }

    const { data, error } = await supabase
      .from("purohit_availability_blocks")
      .insert({
        purohit_id: session!.profileId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        reason: blockReason || null,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to create block");
    } else {
      toast.success("Time blocked successfully");
      setBlocks((prev) => [
        ...prev,
        {
          id: data.id,
          title: data.reason || "Unavailable",
          start: new Date(data.start_time),
          end: new Date(data.end_time),
          reason: data.reason,
          type: 'block' as const,
        },
      ]);
      setBlockDialogOpen(false);
    }
    setSavingBlock(false);
  };

  const handleDeleteBlock = async () => {
    if (!selectedBlock) return;

    const { error } = await supabase
      .from("purohit_availability_blocks")
      .delete()
      .eq("id", selectedBlock.id);

    if (error) {
      toast.error("Failed to delete block");
    } else {
      toast.success("Block removed");
      setBlocks((prev) => prev.filter((b) => b.id !== selectedBlock.id));
      setSelectedBlock(null);
    }
  };

  const filteredEvents = [
    ...bookings
      .filter((b) => statusFilter === "all" || b.status === statusFilter)
      .map((b) => ({
        id: b.id,
        title: b.title,
        start: b.start,
        end: b.end,
        backgroundColor: statusColors[b.status] || statusColors.pending,
        borderColor: statusColors[b.status] || statusColors.pending,
      })),
    ...blocks.map((b) => ({
      id: b.id,
      title: `🚫 ${b.title}`,
      start: b.start,
      end: b.end,
      backgroundColor: blockColor,
      borderColor: blockColor,
    })),
  ];

  // Show loading while session is being checked
  if (sessionLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/purohit">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <h1 className="font-display text-3xl font-bold">My Calendar</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const today = new Date();
                setBlockStartDate(format(today, "yyyy-MM-dd"));
                setBlockEndDate(format(today, "yyyy-MM-dd"));
                setBlockStartTime("09:00");
                setBlockEndTime("17:00");
                setBlockReason("");
                setBlockDialogOpen(true);
              }}
            >
              <Ban className="h-4 w-4 mr-2" />
              Block Time
            </Button>
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
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.pending }} />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.confirmed }} />
            <span>Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.completed }} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors.cancelled }} />
            <span>Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: blockColor }} />
            <span>Blocked</span>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading calendar...</p>
        ) : (
          <div className="bg-card rounded-lg p-4 shadow-sm border min-h-[calc(100vh-280px)]">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={filteredEvents}
              eventClick={handleEventClick}
              selectable={true}
              select={handleDateSelect}
              height="calc(100vh - 360px)"
              eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
            />
          </div>
        )}

        {/* Booking Detail Sheet */}
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

        {/* Block Detail Sheet */}
        <Sheet open={!!selectedBlock} onOpenChange={() => setSelectedBlock(null)}>
          <SheetContent>
            {selectedBlock && (
              <>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Ban className="h-5 w-5 text-muted-foreground" />
                    Blocked Time
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedBlock.start, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedBlock.start, "h:mm a")} - {format(selectedBlock.end, "h:mm a")}
                    </p>
                  </div>

                  {selectedBlock.reason && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Reason</h3>
                      <p className="text-sm text-muted-foreground">{selectedBlock.reason}</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <Button
                      variant="destructive"
                      onClick={handleDeleteBlock}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Block
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Add Block Dialog */}
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5" />
                Block Time
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={blockStartDate}
                    onChange={(e) => setBlockStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={blockStartTime}
                    onChange={(e) => setBlockStartTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={blockEndTime}
                    onChange={(e) => setBlockEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  placeholder="e.g., Personal leave, Travel, Other commitment"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveBlock} disabled={savingBlock}>
                {savingBlock ? "Saving..." : "Block Time"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}