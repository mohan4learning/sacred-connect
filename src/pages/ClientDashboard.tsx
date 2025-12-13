import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Search, MessageSquare, Calendar, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";

interface ClientData {
  id: string;
  full_name: string;
  city: string;
  area: string | null;
  phone: string | null;
  email: string | null;
}

interface RecentBooking {
  id: string;
  status: string;
  scheduled_at: string | null;
  purohit_name: string;
  service_name: string | null;
}

export default function ClientDashboard() {
  const { session, loading: sessionLoading, isClient } = useSession();
  const navigate = useNavigate();
  const [client, setClient] = useState<ClientData | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [stats, setStats] = useState({ bookings: 0, consultations: 0, requests: 0 });

  useEffect(() => {
    if (!sessionLoading && (!session || !isClient)) {
      navigate('/start');
    }
  }, [session, sessionLoading, isClient, navigate]);

  useEffect(() => {
    if (session?.profileId) {
      fetchClientData();
      fetchStats();
      fetchRecentBookings();
    }
  }, [session?.profileId]);

  const fetchClientData = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .eq('id', session!.profileId)
      .single();
    
    if (data) setClient(data);
  };

  const fetchStats = async () => {
    const [activeBookingsRes, requestsRes] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact' }).eq('client_id', session!.profileId).in('status', ['pending', 'confirmed']),
      supabase.from('pooja_requests').select('id', { count: 'exact' }).eq('client_id', session!.profileId).in('status', ['open', 'matched']),
    ]);

    setStats({
      bookings: activeBookingsRes.count || 0,
      consultations: 0,
      requests: requestsRes.count || 0,
    });
  };

  const fetchRecentBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        id, status, scheduled_at,
        purohits (full_name),
        pooja_services (name)
      `)
      .eq('client_id', session!.profileId)
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(3);

    if (data) {
      setRecentBookings(data.map((b: any) => ({
        id: b.id,
        status: b.status,
        scheduled_at: b.scheduled_at,
        purohit_name: b.purohits?.full_name || 'Unknown',
        service_name: b.pooja_services?.name || null,
      })));
    }
  };

  if (sessionLoading || !client) {
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
                <CardTitle className="font-display text-2xl">{client.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {client.city}{client.area && `, ${client.area}`}
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

        {/* Active Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Bookings</CardTitle>
              <CardDescription>Pending and confirmed bookings</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/bookings">View All →</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No bookings yet. <Link to="/purohits" className="text-primary hover:underline">Find a purohit</Link> to get started!
              </p>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    to={`/bookings/${booking.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{booking.service_name || 'Pooja Service'}</p>
                      <p className="text-sm text-muted-foreground">with {booking.purohit_name}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={booking.status as any} />
                      {booking.scheduled_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(booking.scheduled_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
