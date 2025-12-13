import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/ui/status-badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, MapPin, Star } from "lucide-react";
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

interface Stats {
  totalClients: number;
  totalPurohits: number;
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRequests: number;
  openRequests: number;
  matchedRequests: number;
  closedRequests: number;
  totalConsultations: number;
  totalRevenue: number;
  totalServices: number;
  totalReviews: number;
  avgRating: number;
}

type DialogType = 'clients' | 'purohits' | 'services' | 'reviews' | 'bookings' | 'requests' | 'consultations' | null;
type FilterPeriod = 'week' | 'month' | 'year' | 'fy' | 'custom' | 'all';

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [dialogData, setDialogData] = useState<any[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const getDateRange = (): { start: Date | null; end: Date | null } => {
    const now = new Date();
    
    switch (filterPeriod) {
      case 'week':
        return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'fy':
        // Indian Financial Year: April 1 to March 31
        const currentMonth = now.getMonth();
        const fyStartYear = currentMonth >= 3 ? now.getFullYear() : now.getFullYear() - 1;
        return { 
          start: new Date(fyStartYear, 3, 1), 
          end: new Date(fyStartYear + 1, 2, 31) 
        };
      case 'custom':
        return { 
          start: dateRange?.from || null, 
          end: dateRange?.to || null 
        };
      default:
        return { start: null, end: null };
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterPeriod, dateRange]);

  const fetchStats = async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    let bookingsQuery = supabase.from('bookings').select('id, status, price_agreed, created_at');
    let requestsQuery = supabase.from('pooja_requests').select('id, status, created_at');
    let consultationsQuery = supabase.from('consultations').select('id, status, created_at');
    let reviewsQuery = supabase.from('reviews').select('id, rating, created_at');

    if (start && end) {
      const startStr = start.toISOString();
      const endStr = end.toISOString();
      bookingsQuery = bookingsQuery.gte('created_at', startStr).lte('created_at', endStr);
      requestsQuery = requestsQuery.gte('created_at', startStr).lte('created_at', endStr);
      consultationsQuery = consultationsQuery.gte('created_at', startStr).lte('created_at', endStr);
      reviewsQuery = reviewsQuery.gte('created_at', startStr).lte('created_at', endStr);
    }

    const [
      clientsRes,
      purohitsRes,
      bookingsRes,
      requestsRes,
      consultationsRes,
      servicesRes,
      reviewsRes,
    ] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('purohits').select('id', { count: 'exact', head: true }),
      bookingsQuery,
      requestsQuery,
      consultationsQuery,
      supabase.from('pooja_services').select('id', { count: 'exact', head: true }),
      reviewsQuery,
    ]);

    const bookings = bookingsRes.data || [];
    const requests = requestsRes.data || [];
    const consultations = consultationsRes.data || [];
    const reviews = reviewsRes.data || [];

    const totalRevenue = bookings
      .filter(b => b.status === 'completed' && b.price_agreed)
      .reduce((sum, b) => sum + (b.price_agreed || 0), 0);

    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    setStats({
      totalClients: clientsRes.count || 0,
      totalPurohits: purohitsRes.count || 0,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      totalRequests: requests.length,
      openRequests: requests.filter(r => r.status === 'open').length,
      matchedRequests: requests.filter(r => r.status === 'matched').length,
      closedRequests: requests.filter(r => r.status === 'closed').length,
      totalConsultations: consultations.length,
      totalRevenue,
      totalServices: servicesRes.count || 0,
      totalReviews: reviews.length,
      avgRating,
    });

    setLoading(false);
  };

  const openDialog = async (type: DialogType, status?: string) => {
    setDialogType(type);
    setStatusFilter(status || null);
    setDialogLoading(true);
    setDialogData([]);

    const { start, end } = getDateRange();
    let data: any[] = [];

    switch (type) {
      case 'clients':
        const { data: clients } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });
        data = clients || [];
        break;

      case 'purohits':
        const { data: purohits } = await supabase
          .from('purohits')
          .select('*')
          .order('created_at', { ascending: false });
        data = purohits || [];
        break;

      case 'services':
        const { data: services } = await supabase
          .from('pooja_services')
          .select('*')
          .order('name');
        data = services || [];
        break;

      case 'reviews':
        let reviewsQuery = supabase
          .from('reviews')
          .select('*, bookings(purohits(full_name), clients(full_name), pooja_services(name))')
          .order('created_at', { ascending: false });
        if (start && end) {
          reviewsQuery = reviewsQuery.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
        }
        const { data: reviews } = await reviewsQuery;
        data = reviews || [];
        break;

      case 'bookings':
        let bookingsQuery = supabase
          .from('bookings')
          .select('*, purohits(full_name), clients(full_name), pooja_services(name)')
          .order('created_at', { ascending: false });
        if (status) {
          bookingsQuery = bookingsQuery.eq('status', status as any);
        }
        if (start && end) {
          bookingsQuery = bookingsQuery.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
        }
        const { data: bookings } = await bookingsQuery;
        data = bookings || [];
        break;

      case 'requests':
        let requestsQuery = supabase
          .from('pooja_requests')
          .select('*, clients(full_name), pooja_services(name)')
          .order('created_at', { ascending: false });
        if (status) {
          requestsQuery = requestsQuery.eq('status', status as any);
        }
        if (start && end) {
          requestsQuery = requestsQuery.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
        }
        const { data: requests } = await requestsQuery;
        data = requests || [];
        break;

      case 'consultations':
        let consultationsQuery = supabase
          .from('consultations')
          .select('*, clients(full_name), purohits(full_name), pooja_services(name)')
          .order('created_at', { ascending: false });
        if (status) {
          consultationsQuery = consultationsQuery.eq('status', status as any);
        }
        if (start && end) {
          consultationsQuery = consultationsQuery.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
        }
        const { data: consultations } = await consultationsQuery;
        data = consultations || [];
        break;
    }

    setDialogData(data);
    setDialogLoading(false);
  };

  const getDialogTitle = () => {
    const titles: Record<string, string> = {
      clients: 'All Clients',
      purohits: 'All Purohits',
      services: 'All Services',
      reviews: 'All Reviews',
      bookings: statusFilter ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Bookings` : 'All Bookings',
      requests: statusFilter ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests` : 'All Requests',
      consultations: statusFilter ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Consultations` : 'All Consultations',
    };
    return titles[dialogType || ''] || '';
  };

  const renderDialogContent = () => {
    if (dialogLoading) {
      return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
    }

    if (dialogData.length === 0) {
      return <div className="text-center py-8 text-muted-foreground">No data found</div>;
    }

    switch (dialogType) {
      case 'clients':
        return (
          <div className="space-y-2">
            {dialogData.map((client) => (
              <div key={client.id} className="p-4 border-b last:border-0">
                <p className="font-medium">{client.full_name}</p>
                <p className="text-sm text-muted-foreground">{client.city} • {client.email}</p>
              </div>
            ))}
          </div>
        );

      case 'purohits':
        return (
          <div className="space-y-2">
            {dialogData.map((purohit) => (
              <Link key={purohit.id} to={`/purohits/${purohit.id}`} className="block p-4 border-b last:border-0 hover:bg-muted/50">
                <p className="font-medium">{purohit.full_name}</p>
                <p className="text-sm text-muted-foreground">{purohit.city} • {purohit.experience_years}+ years</p>
              </Link>
            ))}
          </div>
        );

      case 'services':
        return (
          <div className="space-y-2">
            {dialogData.map((service) => (
              <div key={service.id} className="p-4 border-b last:border-0">
                <p className="font-medium">{service.name}</p>
              </div>
            ))}
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-3">
            {dialogData.map((review) => (
              <div key={review.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-4 w-4", i < review.rating ? 'fill-current' : 'opacity-30')} />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(review.created_at), 'MMM d, yyyy')}</span>
                </div>
                {review.review_text && (
                  <p className="text-sm mb-3 italic">"{review.review_text}"</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2 mt-2">
                  <div>
                    <span className="font-medium">Service:</span> {review.bookings?.pooja_services?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Purohit:</span> {review.bookings?.purohits?.full_name || 'N/A'}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Client:</span> {review.bookings?.clients?.full_name || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        );

      case 'bookings':
        return (
          <div className="space-y-2">
            {dialogData.map((booking) => (
              <Link key={booking.id} to={`/bookings/${booking.id}`} className="block p-4 border-b last:border-0 hover:bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{booking.pooja_services?.name || 'Service'}</p>
                    <p className="text-sm text-muted-foreground">{booking.clients?.full_name} → {booking.purohits?.full_name}</p>
                  </div>
                  <StatusBadge status={booking.status as any} />
                </div>
              </Link>
            ))}
          </div>
        );

      case 'requests':
        return (
          <div className="space-y-2">
            {dialogData.map((request) => (
              <Link key={request.id} to={`/request/${request.id}`} className="block p-4 border-b last:border-0 hover:bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{request.pooja_services?.name || request.custom_service_text || 'Request'}</p>
                    <p className="text-sm text-muted-foreground">{request.clients?.full_name} • {request.city}</p>
                  </div>
                  <StatusBadge status={request.status as any} />
                </div>
              </Link>
            ))}
          </div>
        );

      case 'consultations':
        return (
          <div className="space-y-2">
            {dialogData.map((consultation) => (
              <Link key={consultation.id} to={`/consultations/${consultation.id}`} className="block p-4 border-b last:border-0 hover:bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{consultation.pooja_services?.name || 'Consultation'}</p>
                    <p className="text-sm text-muted-foreground">{consultation.clients?.full_name} → {consultation.purohits?.full_name}</p>
                  </div>
                  <StatusBadge status={consultation.status as any} />
                </div>
              </Link>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const getFilterLabel = () => {
    const { start, end } = getDateRange();
    if (filterPeriod === 'all') return 'All Time';
    if (start && end) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    }
    return 'Select Period';
  };

  if (loading && !stats) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="text-center text-muted-foreground">Loading statistics...</div>
        </div>
      </Layout>
    );
  }

  if (!stats) return null;

  return (
    <Layout>
      <div className="container py-8 max-w-6xl">
        {/* Swiss Style Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
            </Button>
            <div>
              <h1 className="text-5xl font-bold tracking-tight">Admin</h1>
              <p className="text-muted-foreground mt-1">Platform Analytics</p>
            </div>
          </div>

          {/* Date Filter */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {[
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'year', label: 'Year' },
                { value: 'fy', label: 'FY' },
                { value: 'all', label: 'All' },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={filterPeriod === option.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilterPeriod(option.value as FilterPeriod)}
                  className="px-4"
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn(filterPeriod === 'custom' && 'border-primary')}>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Custom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range);
                    setFilterPeriod('custom');
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>

            <span className="text-sm text-muted-foreground ml-2">{getFilterLabel()}</span>
          </div>
        </div>

        {/* Swiss Grid - Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mb-px">
          <Card 
            className="rounded-none border-0 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => openDialog('clients')}
          >
            <CardContent className="p-8">
              <p className="text-6xl font-bold tracking-tighter">{stats.totalClients}</p>
              <p className="text-sm uppercase tracking-widest text-muted-foreground mt-2">Clients</p>
            </CardContent>
          </Card>
          <Card 
            className="rounded-none border-0 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => openDialog('purohits')}
          >
            <CardContent className="p-8">
              <p className="text-6xl font-bold tracking-tighter">{stats.totalPurohits}</p>
              <p className="text-sm uppercase tracking-widest text-muted-foreground mt-2">Purohits</p>
            </CardContent>
          </Card>
          <Card 
            className="rounded-none border-0 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => openDialog('bookings')}
          >
            <CardContent className="p-8">
              <p className="text-6xl font-bold tracking-tighter">{stats.totalBookings}</p>
              <p className="text-sm uppercase tracking-widest text-muted-foreground mt-2">Bookings</p>
            </CardContent>
          </Card>
          <Card 
            className="rounded-none border-0 cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => openDialog('bookings', 'completed')}
          >
            <CardContent className="p-8">
              <p className="text-6xl font-bold tracking-tighter">₹{(stats.totalRevenue / 1000).toFixed(0)}K</p>
              <p className="text-sm uppercase tracking-widest text-muted-foreground mt-2">Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Booking Status Grid */}
        <div className="grid grid-cols-4 gap-px bg-border mb-px">
          <Card 
            className="rounded-none border-0 cursor-pointer hover:bg-amber-50 transition-colors"
            onClick={() => openDialog('bookings', 'pending')}
          >
            <CardContent className="p-6">
              <p className="text-4xl font-bold text-amber-600">{stats.pendingBookings}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Pending</p>
            </CardContent>
          </Card>
          <Card 
            className="rounded-none border-0 cursor-pointer hover:bg-blue-50 transition-colors"
            onClick={() => openDialog('bookings', 'confirmed')}
          >
            <CardContent className="p-6">
              <p className="text-4xl font-bold text-blue-600">{stats.confirmedBookings}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Confirmed</p>
            </CardContent>
          </Card>
          <Card 
            className="rounded-none border-0 cursor-pointer hover:bg-emerald-50 transition-colors"
            onClick={() => openDialog('bookings', 'completed')}
          >
            <CardContent className="p-6">
              <p className="text-4xl font-bold text-emerald-600">{stats.completedBookings}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>
          <Card 
            className="rounded-none border-0 cursor-pointer hover:bg-red-50 transition-colors"
            onClick={() => openDialog('bookings', 'cancelled')}
          >
            <CardContent className="p-6">
              <p className="text-4xl font-bold text-red-600">{stats.cancelledBookings}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-1">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Requests & Consultations */}
        <div className="grid md:grid-cols-2 gap-px bg-border mb-px">
          <Card className="rounded-none border-0">
            <CardContent className="p-8">
              <h2 className="text-lg font-bold uppercase tracking-widest mb-6">Requests</h2>
              <div className="space-y-4">
                <div 
                  className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded"
                  onClick={() => openDialog('requests', 'open')}
                >
                  <span className="text-sm uppercase tracking-wider">Open</span>
                  <span className="text-2xl font-bold text-amber-600">{stats.openRequests}</span>
                </div>
                <div 
                  className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded"
                  onClick={() => openDialog('requests', 'matched')}
                >
                  <span className="text-sm uppercase tracking-wider">Matched</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.matchedRequests}</span>
                </div>
                <div 
                  className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded"
                  onClick={() => openDialog('requests', 'closed')}
                >
                  <span className="text-sm uppercase tracking-wider">Closed</span>
                  <span className="text-2xl font-bold text-emerald-600">{stats.closedRequests}</span>
                </div>
                <div className="border-t pt-4 mt-4">
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => openDialog('requests')}
                  >
                    <span className="text-sm uppercase tracking-wider font-bold">Total</span>
                    <span className="text-2xl font-bold">{stats.totalRequests}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border-0">
            <CardContent className="p-8">
              <h2 className="text-lg font-bold uppercase tracking-widest mb-6">Other</h2>
              <div className="space-y-4">
                <div 
                  className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded"
                  onClick={() => openDialog('consultations')}
                >
                  <span className="text-sm uppercase tracking-wider">Consultations</span>
                  <span className="text-2xl font-bold">{stats.totalConsultations}</span>
                </div>
                <div 
                  className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded"
                  onClick={() => openDialog('services')}
                >
                  <span className="text-sm uppercase tracking-wider">Services</span>
                  <span className="text-2xl font-bold">{stats.totalServices}</span>
                </div>
                <div 
                  className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded"
                  onClick={() => openDialog('reviews')}
                >
                  <span className="text-sm uppercase tracking-wider">Reviews</span>
                  <span className="text-2xl font-bold">{stats.totalReviews}</span>
                </div>
                {stats.avgRating > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div 
                      className="flex justify-between items-center cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded"
                      onClick={() => openDialog('reviews')}
                    >
                      <span className="text-sm uppercase tracking-wider font-bold">Avg Rating</span>
                      <span className="text-2xl font-bold flex items-center gap-1">
                        {stats.avgRating.toFixed(1)}
                        <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={dialogType !== null} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest">{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {renderDialogContent()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
