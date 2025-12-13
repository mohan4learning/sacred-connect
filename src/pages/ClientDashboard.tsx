import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, MessageSquare, Calendar, MapPin, Clock, FileText, Users, Video, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface RecentBooking {
  id: string;
  status: string;
  scheduled_at: string | null;
  purohit_name: string;
  service_name: string | null;
  mode: string;
  price_agreed: number | null;
}

interface ActiveRequest {
  id: string;
  status: string;
  service_name: string | null;
  custom_service_text: string | null;
  city: string;
  mode: string;
  requested_date: string | null;
  created_at: string;
  response_count: number;
}

export default function ClientDashboard() {
  const { profile, clientRecord, loading } = useAuth();
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [activeRequests, setActiveRequests] = useState<ActiveRequest[]>([]);
  const [stats, setStats] = useState({ bookings: 0, consultations: 0, requests: 0 });

  useEffect(() => {
    if (clientRecord?.id) {
      fetchStats();
      fetchRecentBookings();
      fetchActiveRequests();
    }
  }, [clientRecord?.id]);

  const fetchStats = async () => {
    if (!clientRecord?.id) return;
    
    const [activeBookingsRes, requestsRes] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact' }).eq('client_id', clientRecord.id).in('status', ['pending', 'confirmed']),
      supabase.from('pooja_requests').select('id', { count: 'exact' }).eq('client_id', clientRecord.id).in('status', ['open', 'matched']),
    ]);

    setStats({
      bookings: activeBookingsRes.count || 0,
      consultations: 0,
      requests: requestsRes.count || 0,
    });
  };

  const fetchRecentBookings = async () => {
    if (!clientRecord?.id) return;
    
    const { data } = await supabase
      .from('bookings')
      .select(`
        id, status, scheduled_at, mode, price_agreed,
        purohits (full_name),
        pooja_services (name)
      `)
      .eq('client_id', clientRecord.id)
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setRecentBookings(data.map((b: any) => ({
        id: b.id,
        status: b.status,
        scheduled_at: b.scheduled_at,
        purohit_name: b.purohits?.full_name || 'Unknown',
        service_name: b.pooja_services?.name || null,
        mode: b.mode,
        price_agreed: b.price_agreed,
      })));
    }
  };

  const fetchActiveRequests = async () => {
    if (!clientRecord?.id) return;
    
    // Fetch active requests
    const { data: requests } = await supabase
      .from('pooja_requests')
      .select(`
        id, status, city, mode, requested_date, created_at, custom_service_text,
        pooja_services (name)
      `)
      .eq('client_id', clientRecord.id)
      .in('status', ['open', 'matched'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (requests) {
      // Fetch response counts for each request
      const requestsWithCounts = await Promise.all(
        requests.map(async (req: any) => {
          const { count } = await supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('pooja_request_id', req.id);

          return {
            id: req.id,
            status: req.status,
            service_name: req.pooja_services?.name || null,
            custom_service_text: req.custom_service_text,
            city: req.city,
            mode: req.mode,
            requested_date: req.requested_date,
            created_at: req.created_at,
            response_count: count || 0,
          };
        })
      );

      setActiveRequests(requestsWithCounts);
    }
  };

  if (loading || !clientRecord) {
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
      <div className="container py-8">
        {/* Profile Summary */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-display text-2xl">{clientRecord.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {clientRecord.city}{clientRecord.area && `, ${clientRecord.area}`}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/client/edit">Edit Profile</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <Link to="/bookings" className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                <div className="text-2xl font-bold text-primary">{stats.bookings}</div>
                <div className="text-sm text-muted-foreground">Active Bookings</div>
              </Link>
              <Link to="/client/requests" className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                <div className="text-2xl font-bold text-primary">{stats.requests}</div>
                <div className="text-sm text-muted-foreground">Active Requests</div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button asChild size="lg" className="h-auto py-6 flex-col gap-2 btn-hero">
            <Link to="/purohits">
              <Search className="h-6 w-6" />
              <span>Find Purohits</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2 btn-outline-hero">
            <Link to="/request">
              <Calendar className="h-6 w-6" />
              <span>Request a Pooja</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2">
            <Link to="/client/requests">
              <MessageSquare className="h-6 w-6" />
              <span>My Requests</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2">
            <Link to="/bookings">
              <Clock className="h-6 w-6" />
              <span>My Bookings</span>
            </Link>
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Active Bookings
                </CardTitle>
                <CardDescription>Pending and confirmed bookings</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/bookings" className="flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <Calendar className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-2">No active bookings</p>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/purohits">Find a purohit to get started</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <Link
                      key={booking.id}
                      to={`/bookings/${booking.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {booking.mode === 'remote' ? (
                          <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
                            <Video className="h-5 w-5 text-violet-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Users className="h-5 w-5 text-emerald-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{booking.service_name || 'Pooja Service'}</p>
                          <p className="text-sm text-muted-foreground">with {booking.purohit_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={booking.status as any} />
                        {booking.scheduled_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(booking.scheduled_at), 'MMM d, yyyy')}
                          </p>
                        )}
                        {booking.price_agreed && (
                          <p className="text-xs font-medium text-primary mt-0.5">
                            ₹{booking.price_agreed.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Active Requests
                </CardTitle>
                <CardDescription>Open pooja requests awaiting responses</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/client/requests" className="flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {activeRequests.length === 0 ? (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-2">No active requests</p>
                  <Button variant="link" size="sm" asChild>
                    <Link to="/request">Post a pooja request</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeRequests.map((request) => (
                    <Link
                      key={request.id}
                      to={`/request/${request.id}`}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {request.service_name || request.custom_service_text || 'Pooja Request'}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {request.city}
                            {request.mode === 'remote' && (
                              <Badge variant="secondary" className="ml-2 text-xs">Remote</Badge>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {request.response_count > 0 ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              {request.response_count} response{request.response_count !== 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Awaiting
                            </Badge>
                          )}
                        </div>
                        {request.requested_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            For {format(new Date(request.requested_date), 'MMM d, yyyy')}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Posted {format(new Date(request.created_at), 'MMM d')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
