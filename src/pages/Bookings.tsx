import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { MapPin, Calendar, Video, Users, Archive, IndianRupee, TrendingUp, Percent } from "lucide-react";
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
  price_agreed: number | null;
}

const COMMISSION_RATE = 0.10; // 10% platform commission

export default function Bookings() {
  const { clientRecord, purohitRecord, isClient, isPurohit } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const profileId = isClient ? clientRecord?.id : purohitRecord?.id;

  useEffect(() => {
    if (profileId) fetchBookings();
  }, [profileId]);

  const fetchBookings = async () => {
    const column = isClient ? 'client_id' : 'purohit_id';
    const { data } = await supabase
      .from('bookings')
      .select(`id, status, mode, scheduled_at, city, price_agreed, purohits(full_name), clients(full_name), pooja_services(name)`)
      .eq(column, profileId!)
      .order('created_at', { ascending: false });

    if (data) {
      setBookings(data.map((b: any) => ({
        id: b.id, status: b.status, mode: b.mode, scheduled_at: b.scheduled_at, city: b.city,
        price_agreed: b.price_agreed,
        purohit_name: b.purohits?.full_name || 'Unknown',
        client_name: b.clients?.full_name || 'Unknown',
        service_name: b.pooja_services?.name,
      })));
    }
    setLoading(false);
  };

  const now = new Date();
  const activeBookings = bookings.filter(b => {
    // Active: pending or confirmed, but only if scheduled date is in the future or not set
    if (['completed', 'cancelled'].includes(b.status)) return false;
    if (b.scheduled_at && new Date(b.scheduled_at) < now && b.status === 'pending') {
      return false; // Expired pending bookings go to past
    }
    return ['pending', 'confirmed'].includes(b.status);
  });
  const pastBookings = bookings.filter(b => {
    // Past: completed, cancelled, OR pending bookings that are past their scheduled date
    if (['completed', 'cancelled'].includes(b.status)) return true;
    if (b.scheduled_at && new Date(b.scheduled_at) < now && b.status === 'pending') {
      return true; // Expired pending bookings
    }
    return false;
  });

  // Calculate earnings for purohit
  const earningsData = useMemo(() => {
    if (!isPurohit) return null;
    
    const completedBookings = bookings.filter(b => b.status === 'completed');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.price_agreed || 0), 0);
    const pendingEarnings = confirmedBookings.reduce((sum, b) => sum + (b.price_agreed || 0), 0);
    const totalCommission = totalEarnings * COMMISSION_RATE;
    const netEarnings = totalEarnings - totalCommission;
    
    return {
      totalEarnings,
      pendingEarnings,
      totalCommission,
      netEarnings,
      completedCount: completedBookings.length,
      confirmedCount: confirmedBookings.length,
    };
  }, [bookings, isPurohit]);

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
            {b.price_agreed && <p className="text-sm font-medium mt-1">₹{b.price_agreed.toLocaleString()}</p>}
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
        
        {/* Purohit Earnings Dashboard */}
        {isPurohit && earningsData && (
          <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Net Earnings */}
              <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-br from-background to-emerald-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Net Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-mono tracking-tight">
                    ₹{earningsData.netEarnings.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {earningsData.completedCount} completed
                  </p>
                </CardContent>
              </Card>

              {/* Pending Earnings */}
              <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-background to-amber-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-mono tracking-tight">
                    ₹{earningsData.pendingEarnings.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {earningsData.confirmedCount} confirmed
                  </p>
                </CardContent>
              </Card>

              {/* Total Gross */}
              <Card className="border-l-4 border-l-primary bg-gradient-to-br from-background to-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Gross Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-mono tracking-tight">
                    ₹{earningsData.totalEarnings.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Before commission
                  </p>
                </CardContent>
              </Card>

              {/* Commission */}
              <Card className="border-l-4 border-l-rose-500 bg-gradient-to-br from-background to-rose-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Commission (10%)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-mono tracking-tight">
                    ₹{earningsData.totalCommission.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Platform fee
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

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
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    {isPurohit ? (
                      <>
                        <p className="text-lg font-medium mb-1">Waiting for clients</p>
                        <p className="text-muted-foreground text-sm">
                          New bookings will appear here when clients book your services
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-medium mb-1">No active bookings</p>
                        <p className="text-muted-foreground text-sm">
                          <Link to="/purohits" className="text-primary hover:underline">Find a purohit</Link> to book your first pooja
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {activeBookings.map((b) => <BookingCard key={b.id} b={b} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastBookings.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Archive className="h-6 w-6 text-muted-foreground" />
                    </div>
                    {isPurohit ? (
                      <>
                        <p className="text-lg font-medium mb-1">No completed bookings yet</p>
                        <p className="text-muted-foreground text-sm">
                          Your completed and cancelled bookings will appear here
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-lg font-medium mb-1">No past bookings</p>
                        <p className="text-muted-foreground text-sm">
                          Your booking history will appear here
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
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
