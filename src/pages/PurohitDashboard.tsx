import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Edit, MessageSquare, Calendar, Clock, MapPin, Video, Users, Sparkles, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface PurohitData {
  id: string;
  full_name: string;
  city: string;
  area: string | null;
  bio: string | null;
  experience_years: number;
  languages: string[];
  remote_pooja_available: boolean;
  in_person_available: boolean;
}

interface UpcomingBooking {
  id: string;
  status: string;
  scheduled_at: string | null;
  client_name: string;
  service_name: string | null;
  mode: string;
}

interface PoojaRequest {
  id: string;
  service_name: string | null;
  custom_service_text: string | null;
  client_name: string;
  city: string;
  area: string | null;
  mode: string;
  requested_date: string | null;
  budget_min: number | null;
  budget_max: number | null;
  created_at: string;
}

export default function PurohitDashboard() {
  const { session, loading: sessionLoading, isPurohit } = useSession();
  const navigate = useNavigate();
  const [purohit, setPurohit] = useState<PurohitData | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>([]);
  const [openRequests, setOpenRequests] = useState<PoojaRequest[]>([]);
  const [stats, setStats] = useState({ 
    totalBookings: 0, 
    pendingBookings: 0, 
    consultations: 0,
    portfolioItems: 0,
    services: 0,
    openRequests: 0
  });
  const [portfolioCompletion, setPortfolioCompletion] = useState(0);

  useEffect(() => {
    if (!sessionLoading && (!session || !isPurohit)) {
      navigate('/start');
    }
  }, [session, sessionLoading, isPurohit, navigate]);

  useEffect(() => {
    if (session?.profileId) {
      fetchPurohitData();
    }
  }, [session?.profileId]);

  useEffect(() => {
    if (session?.profileId && purohit) {
      fetchStats();
      fetchUpcomingBookings();
      fetchOpenRequests();
    }
  }, [session?.profileId, purohit?.city]);

  const fetchPurohitData = async () => {
    const { data } = await supabase
      .from('purohits')
      .select('*')
      .eq('id', session!.profileId)
      .single();
    
    if (data) {
      setPurohit(data);
      calculatePortfolioCompletion(data);
    }
  };

  const calculatePortfolioCompletion = (data: PurohitData) => {
    let score = 0;
    if (data.full_name) score += 15;
    if (data.city) score += 15;
    if (data.bio) score += 20;
    if (data.languages.length > 0) score += 15;
    if (data.experience_years > 0) score += 15;
    if (data.remote_pooja_available || data.in_person_available) score += 20;
    setPortfolioCompletion(score);
  };

  const fetchStats = async () => {
    const [
      totalBookingsRes, 
      pendingBookingsRes, 
      consultationsRes, 
      portfolioRes,
      servicesRes,
      openRequestsRes
    ] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact' }).eq('purohit_id', session!.profileId),
      supabase.from('bookings').select('id', { count: 'exact' }).eq('purohit_id', session!.profileId).eq('status', 'pending'),
      supabase.from('consultations').select('id', { count: 'exact' }).eq('purohit_id', session!.profileId).eq('status', 'requested'),
      supabase.from('purohit_portfolio_items').select('id', { count: 'exact' }).eq('purohit_id', session!.profileId),
      supabase.from('purohit_services').select('id', { count: 'exact' }).eq('purohit_id', session!.profileId),
      supabase.from('pooja_requests').select('id', { count: 'exact' }).eq('status', 'open'),
    ]);

    setStats({
      totalBookings: totalBookingsRes.count || 0,
      pendingBookings: pendingBookingsRes.count || 0,
      consultations: consultationsRes.count || 0,
      portfolioItems: portfolioRes.count || 0,
      services: servicesRes.count || 0,
      openRequests: openRequestsRes.count || 0,
    });
  };

  const fetchOpenRequests = async () => {
    if (!purohit) return;
    
    // Fetch open requests matching purohit's city
    const { data } = await supabase
      .from('pooja_requests')
      .select(`
        id, mode, requested_date, budget_min, budget_max, city, area, created_at, custom_service_text,
        clients (full_name),
        pooja_services (name)
      `)
      .eq('status', 'open')
      .eq('city', purohit.city)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setOpenRequests(data.map((r: any) => ({
        id: r.id,
        service_name: r.pooja_services?.name || null,
        custom_service_text: r.custom_service_text,
        client_name: r.clients?.full_name || 'Unknown',
        city: r.city,
        area: r.area,
        mode: r.mode,
        requested_date: r.requested_date,
        budget_min: r.budget_min,
        budget_max: r.budget_max,
        created_at: r.created_at,
      })));
    }
  };

  const fetchUpcomingBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select(`
        id, status, scheduled_at, mode,
        clients (full_name),
        pooja_services (name)
      `)
      .eq('purohit_id', session!.profileId)
      .in('status', ['pending', 'confirmed'])
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(5);

    if (data) {
      setUpcomingBookings(data.map((b: any) => ({
        id: b.id,
        status: b.status,
        scheduled_at: b.scheduled_at,
        client_name: b.clients?.full_name || 'Unknown',
        service_name: b.pooja_services?.name || null,
        mode: b.mode,
      })));
    }
  };

  if (sessionLoading || !purohit) {
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
                <CardTitle className="font-display text-2xl">{purohit.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4" />
                  {purohit.city}{purohit.area && `, ${purohit.area}`}
                </CardDescription>
                <div className="flex gap-2 mt-2">
                  {purohit.remote_pooja_available && (
                    <span className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
                      <Video className="h-3 w-3" /> Remote Available
                    </span>
                  )}
                  {purohit.in_person_available && (
                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                      <Users className="h-3 w-3" /> In-Person
                    </span>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/purohit/edit">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Portfolio
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Portfolio Completion */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Portfolio Completion</span>
                <span className="font-medium">{portfolioCompletion}%</span>
              </div>
              <Progress value={portfolioCompletion} className="h-2" />
              {portfolioCompletion < 100 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Complete your portfolio to get more booking requests
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{stats.totalBookings}</div>
                <div className="text-sm text-muted-foreground">Total Bookings</div>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <div className="text-2xl font-bold text-amber-600">{stats.pendingBookings}</div>
                <div className="text-sm text-amber-600">Pending</div>
              </div>
              <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
                <div className="text-2xl font-bold text-violet-600">{stats.consultations}</div>
                <div className="text-sm text-violet-600">Consultation Requests</div>
              </div>
              <div className="p-4 rounded-lg bg-saffron-50 border border-saffron-200">
                <div className="text-2xl font-bold text-saffron-600">{stats.openRequests}</div>
                <div className="text-sm text-saffron-600">Open Gigs</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="text-2xl font-bold text-primary">{stats.services}</div>
                <div className="text-sm text-muted-foreground">Services</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Button asChild size="lg" className="h-auto py-6 flex-col gap-2 btn-hero">
            <Link to="/purohit/edit">
              <Edit className="h-6 w-6" />
              <span>Edit Portfolio</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2">
            <Link to="/consultations">
              <MessageSquare className="h-6 w-6" />
              <span>Consultations</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2">
            <Link to="/bookings">
              <Clock className="h-6 w-6" />
              <span>Bookings</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2 btn-outline-hero">
            <Link to="/purohit/calendar">
              <Calendar className="h-6 w-6" />
              <span>Calendar</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-auto py-6 flex-col gap-2">
            <Link to="/purohit/services">
              <Users className="h-6 w-6" />
              <span>My Services</span>
            </Link>
          </Button>
        </div>

        {/* Open Pooja Requests (Gigs) */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-saffron-500" />
                Open Pooja Requests
              </CardTitle>
              <CardDescription>Clients looking for purohits in your area</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {openRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No open requests in your area right now. Check back later!
              </p>
            ) : (
              <div className="space-y-4">
                {openRequests.map((request) => (
                  <Link
                    key={request.id}
                    to={`/pooja-requests/${request.id}`}
                    className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors hover:border-saffron-300"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">
                            {request.service_name || request.custom_service_text || 'Pooja Service'}
                          </p>
                          <Badge variant={request.mode === 'remote' ? 'secondary' : 'outline'} className="text-xs">
                            {request.mode === 'remote' ? 'Remote' : request.mode === 'in_person' ? 'In-Person' : 'Both'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          by {request.client_name} • {request.city}{request.area && `, ${request.area}`}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          {request.requested_date && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(request.requested_date), 'MMM d, yyyy')}
                            </span>
                          )}
                          {(request.budget_min || request.budget_max) && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <IndianRupee className="h-3 w-3" />
                              {request.budget_min && request.budget_max
                                ? `${request.budget_min.toLocaleString()} - ${request.budget_max.toLocaleString()}`
                                : request.budget_min
                                ? `From ${request.budget_min.toLocaleString()}`
                                : `Up to ${request.budget_max?.toLocaleString()}`}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(request.created_at), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Bookings</CardTitle>
              <CardDescription>Your scheduled appointments</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/purohit/calendar">View Calendar →</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No upcoming bookings. Complete your portfolio to receive more requests!
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
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
                        <p className="text-sm text-muted-foreground">with {booking.client_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={booking.status as any} />
                      {booking.scheduled_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(booking.scheduled_at), 'MMM d, h:mm a')}
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
