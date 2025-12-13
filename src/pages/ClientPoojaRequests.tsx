import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, MessageSquare, Plus, Archive } from "lucide-react";
import { format } from "date-fns";

interface PoojaRequest {
  id: string;
  service_name: string | null;
  custom_service_text: string | null;
  city: string;
  area: string | null;
  mode: string;
  requested_date: string | null;
  status: string;
  created_at: string;
  response_count: number;
}

export default function ClientPoojaRequests() {
  const { clientRecord, loading: authLoading, isClient, user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<PoojaRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !isClient)) {
      navigate('/auth');
    }
  }, [user, authLoading, isClient, navigate]);

  useEffect(() => {
    if (clientRecord?.id) {
      fetchRequests();
    }
  }, [clientRecord?.id]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('pooja_requests')
      .select(`
        id, mode, requested_date, city, area, status, created_at, custom_service_text,
        pooja_services (name)
      `)
      .eq('client_id', clientRecord!.id)
      .order('created_at', { ascending: false });

    if (data) {
      // Get response counts for each request
      const requestsWithCounts = await Promise.all(
        data.map(async (r: any) => {
          const { count } = await supabase
            .from('consultations')
            .select('id', { count: 'exact', head: true })
            .eq('pooja_request_id', r.id);

          return {
            id: r.id,
            service_name: r.pooja_services?.name || null,
            custom_service_text: r.custom_service_text,
            city: r.city,
            area: r.area,
            mode: r.mode,
            requested_date: r.requested_date,
            status: r.status || 'open',
            created_at: r.created_at,
            response_count: count || 0,
          };
        })
      );

      setRequests(requestsWithCounts);
    }
    setLoading(false);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'matched': return 'secondary';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  const activeRequests = requests.filter(r => ['open', 'matched'].includes(r.status));
  const pastRequests = requests.filter(r => r.status === 'closed');

  const RequestCard = ({ request }: { request: PoojaRequest }) => (
    <Link key={request.id} to={`/request/${request.id}`}>
      <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-primary/30">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">
                  {request.service_name || request.custom_service_text || 'Pooja Request'}
                </h3>
                <Badge variant={getStatusVariant(request.status)}>
                  {request.status === 'matched' ? 'Booked' : request.status}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {request.city}{request.area && `, ${request.area}`}
                </span>
                {request.requested_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(request.requested_date), 'MMM d, yyyy')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {request.response_count} {request.response_count === 1 ? 'response' : 'responses'}
                </span>
              </div>
            </div>

            {request.response_count > 0 && request.status === 'open' && (
              <div className="ml-4">
                <Badge variant="destructive" className="bg-primary">
                  {request.response_count} New
                </Badge>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Posted {format(new Date(request.created_at), 'MMM d, yyyy')}
          </p>
        </CardContent>
      </Card>
    </Link>
  );

  if (authLoading || loading) {
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold">My Pooja Requests</h1>
            <p className="text-muted-foreground mt-1">View responses and manage your requests</p>
          </div>
          <Button asChild className="btn-hero">
            <Link to="/request">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>

        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-lg mb-2">No requests yet</h3>
              <p className="text-muted-foreground mb-4">
                Post a pooja request to receive quotes from purohits
              </p>
              <Button asChild className="btn-hero">
                <Link to="/request">Create Your First Request</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                Active ({activeRequests.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-1">
                <Archive className="h-4 w-4" />
                Past ({pastRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No active requests. Create a new one to get quotes from purohits.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeRequests.map((request) => <RequestCard key={request.id} request={request} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No completed requests yet.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pastRequests.map((request) => <RequestCard key={request.id} request={request} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
