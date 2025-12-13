import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReviewDialog } from "@/components/ReviewDialog";
import { ArrowLeft, MapPin, Video, Users, Calendar, Phone, Mail, FileText, ExternalLink, Star } from "lucide-react";
import { format, addMinutes } from "date-fns";
import { toast } from "sonner";

interface BookingDetail {
  id: string;
  status: string;
  mode: string;
  scheduled_at: string | null;
  estimated_duration_minutes: number | null;
  city: string | null;
  area: string | null;
  address: string | null;
  remote_meeting_link: string | null;
  notes: string | null;
  price_agreed: number | null;
  created_at: string;
  purohit: { id: string; full_name: string };
  client: { id: string; full_name: string; phone: string | null; email: string | null };
  service: { name: string } | null;
}

interface PrivateContact {
  email: string | null;
  phone: string | null;
}

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  reviewer_role: string;
  created_at: string;
}

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const { session, isClient, isPurohit } = useSession();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [purohitContact, setPurohitContact] = useState<PrivateContact | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBooking();
      fetchReviews();
    }
  }, [id]);

  const fetchBooking = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`*, purohits(id, full_name), clients(id, full_name, phone, email), pooja_services(name)`)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      toast.error("Booking not found");
      navigate("/bookings");
      return;
    }

    setBooking({
      ...data,
      purohit: data.purohits,
      client: data.clients,
      service: data.pooja_services,
    });
    
    // Fetch purohit private contact info (RLS will enforce access)
    if (data.purohits?.id) {
      const { data: privateData } = await supabase
        .from("purohit_private")
        .select("email, phone")
        .eq("purohit_id", data.purohits.id)
        .maybeSingle();
      
      if (privateData) {
        setPurohitContact(privateData);
      }
    }
    
    setLoading(false);
  };

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("booking_id", id)
      .order("created_at", { ascending: false });

    if (data) setReviews(data);
  };

  const updateStatus = async (newStatus: "pending" | "confirmed" | "completed" | "cancelled") => {
    if (!booking) return;
    const { error } = await supabase.from("bookings").update({ status: newStatus }).eq("id", booking.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Booking ${newStatus}`);
      setBooking({ ...booking, status: newStatus });
    }
  };

  const hasUserReviewed = reviews.some(
    (r) => r.reviewer_role === (isClient ? "client" : "purohit")
  );

  const canLeaveReview = booking?.status === "completed" && !hasUserReviewed;

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!booking) return null;

  const otherParty = isClient ? booking.purohit : booking.client;
  const start = booking.scheduled_at ? new Date(booking.scheduled_at) : null;
  const end = start ? addMinutes(start, booking.estimated_duration_minutes || 90) : null;

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate("/bookings")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-2xl flex items-center gap-2">
                {booking.mode === "remote" ? (
                  <Video className="h-6 w-6 text-violet-600" />
                ) : (
                  <Users className="h-6 w-6 text-emerald-600" />
                )}
                {booking.service?.name || "Pooja"}
              </CardTitle>
              <StatusBadge status={booking.status as any} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {start && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">{format(start, "EEEE, MMMM d, yyyy")}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(start, "h:mm a")} - {end && format(end, "h:mm a")}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">{isClient ? "Purohit" : "Client"}</h3>
              <Link 
                to={isClient ? `/purohits/${otherParty.id}` : "/client"} 
                className="font-medium text-primary hover:underline"
              >
                {otherParty.full_name}
              </Link>
              {isClient && purohitContact ? (
                <>
                  {purohitContact.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {purohitContact.phone}
                    </p>
                  )}
                  {purohitContact.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {purohitContact.email}
                    </p>
                  )}
                </>
              ) : !isClient && booking.client ? (
                <>
                  {booking.client.phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {booking.client.phone}
                    </p>
                  )}
                  {booking.client.email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {booking.client.email}
                    </p>
                  )}
                </>
              ) : null}
            </div>

            {booking.mode === "in_person" && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Location</h3>
                <p className="text-sm flex items-start gap-1">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  <span>
                    {[booking.address, booking.area, booking.city].filter(Boolean).join(", ") ||
                      "Not specified"}
                  </span>
                </p>
              </div>
            )}

            {booking.mode === "remote" && booking.remote_meeting_link && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Remote Meeting</h3>
                <a
                  href={booking.remote_meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" /> Join Meeting
                </a>
              </div>
            )}

            {booking.price_agreed && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-1">Agreed Price</h3>
                <p className="text-lg font-medium text-primary">₹{booking.price_agreed.toLocaleString()}</p>
              </div>
            )}

            {booking.notes && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2 flex items-center gap-1">
                  <FileText className="h-4 w-4" /> Notes
                </h3>
                <p className="text-sm text-muted-foreground">{booking.notes}</p>
              </div>
            )}

            {/* Reviews Section */}
            {reviews.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" /> Reviews
                </h3>
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          by {review.reviewer_role}
                        </span>
                      </div>
                      {review.review_text && (
                        <p className="text-sm text-muted-foreground">{review.review_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-4 space-y-2">
              {canLeaveReview && (
                <Button 
                  onClick={() => setReviewDialogOpen(true)} 
                  variant="outline"
                  className="w-full"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Leave a Review
                </Button>
              )}

              {isPurohit && (
                <>
                  {booking.status === "pending" && (
                    <>
                      {booking.price_agreed ? (
                        <Button onClick={() => updateStatus("confirmed")} className="w-full">
                          Confirm Booking
                        </Button>
                      ) : (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-center">
                          <p className="text-sm text-amber-800">
                            Please agree on the price with the client before confirming.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {booking.status === "confirmed" && (
                    <Button onClick={() => updateStatus("completed")} className="w-full">
                      Mark as Completed
                    </Button>
                  )}
                  {["pending", "confirmed"].includes(booking.status) && (
                    <Button variant="destructive" onClick={() => updateStatus("cancelled")} className="w-full">
                      Cancel Booking
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          bookingId={booking.id}
          reviewerId={session!.profileId}
          reviewerRole={isClient ? "client" : "purohit"}
          recipientName={otherParty.full_name}
          onReviewSubmitted={fetchReviews}
        />
      </div>
    </Layout>
  );
}
