import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { MapPin, Calendar, Video, Users, Archive } from "lucide-react";
import { format } from "date-fns";

interface Booking {
  id: string;
  status: string;
  mode: string;
  scheduled_at: string | null;
  city: string | null;
  purohit_name: string;
  client_name: string;
  service_name: string | null;
}

export default function Bookings() {
  const { session, isClient, isPurohit } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.profileId) fetchBookings();
  }, [session?.profileId]);

  const fetchBookings = async () => {
    const column = isClient ? 'client_id' : 'purohit_id';
    const { data } = await supabase
      .from('bookings')
      .select(`id, status, mode, scheduled_at, city, purohits(full_name), clients(full_name), pooja_services(name)`)
      .eq(column, session!.profileId)
      .order('created_at', { ascending: false });

    if (data) {
      setBookings(data.map((b: any) => ({
        id: b.id, status: b.status, mode: b.mode, scheduled_at: b.scheduled_at, city: b.city,
        purohit_name: b.purohits?.full_name || 'Unknown',
        client_name: b.clients?.full_name || 'Unknown',
        service_name: b.pooja_services?.name,
      })));
    }
    setLoading(false);
  };

  const activeBookings = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
  const pastBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  const BookingCard = ({ b }: { b: Booking }) => (
    <Link key={b.id} to={`/bookings/${b.id}`}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {b.mode === 'remote' ? <Video className="h-5 w-5 text-violet-600" /> : <Users className="h-5 w-5 text-emerald-600" />}
            <div>
              <p className="font-medium">{b.service_name || 'Pooja'}</p>
              <p className="text-sm text-muted-foreground">{isClient ? `with ${b.purohit_name}` : `for ${b.client_name}`}</p>
              {b.city && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{b.city}</p>}
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={b.status as any} />
            {b.scheduled_at && <p className="text-xs text-muted-foreground mt-1"><Calendar className="inline h-3 w-3 mr-1" />{format(new Date(b.scheduled_at), 'MMM d, h:mm a')}</p>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">My Bookings</h1>
        {loading ? <p className="text-muted-foreground">Loading...</p> : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                Active ({activeBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-1">
                <Archive className="h-4 w-4" />
                Past ({pastBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeBookings.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No active bookings.{" "}
                  {isClient && (
                    <Link to="/purohits" className="text-primary hover:underline">Find a purohit</Link>
                  )}
                  {isClient && " to book."}
                </p>
              ) : (
                <div className="space-y-4">
                  {activeBookings.map((b) => <BookingCard key={b.id} b={b} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastBookings.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">No past bookings.</p>
              ) : (
                <div className="space-y-4">
                  {pastBookings.map((b) => <BookingCard key={b.id} b={b} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
