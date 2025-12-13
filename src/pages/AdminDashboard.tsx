import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Users, UserCheck, Calendar, MessageSquare, 
  Clock, CheckCircle, XCircle, AlertCircle,
  TrendingUp, IndianRupee, ArrowLeft, Star, MapPin
} from "lucide-react";
import { format } from "date-fns";

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
  requestedConsultations: number;
  acceptedConsultations: number;
  completedConsultations: number;
  totalRevenue: number;
  totalServices: number;
  totalReviews: number;
  avgRating: number;
}

type DialogType = 'clients' | 'purohits' | 'services' | 'reviews' | 'bookings' | 'requests' | 'consultations' | null;

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [dialogData, setDialogData] = useState<any[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

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
      supabase.from('bookings').select('id, status, price_agreed'),
      supabase.from('pooja_requests').select('id, status'),
      supabase.from('consultations').select('id, status'),
      supabase.from('pooja_services').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('id, rating'),
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
      requestedConsultations: consultations.filter(c => c.status === 'requested').length,
      acceptedConsultations: consultations.filter(c => c.status === 'accepted').length,
      completedConsultations: consultations.filter(c => c.status === 'completed').length,
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
        const { data: reviews } = await supabase
          .from('reviews')
          .select('*, bookings(purohits(full_name), clients(full_name), pooja_services(name))')
          .order('created_at', { ascending: false });
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
          <div className="space-y-3">
            {dialogData.map((client) => (
              <div key={client.id} className="p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{client.full_name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {client.city}{client.area && `, ${client.area}`}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{client.email}</p>
                    <p>{client.phone}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'purohits':
        return (
          <div className="space-y-3">
            {dialogData.map((purohit) => (
              <Link key={purohit.id} to={`/purohits/${purohit.id}`} className="block">
                <div className="p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{purohit.full_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {purohit.city}{purohit.area && `, ${purohit.area}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {purohit.experience_years}+ years experience
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{purohit.email}</p>
                      <p>{purohit.phone}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        );

      case 'services':
        return (
          <div className="space-y-2">
            {dialogData.map((service) => (
              <div key={service.id} className="p-3 border rounded-lg">
                <p className="font-medium">{service.name}</p>
                {service.description && (
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                )}
              </div>
            ))}
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-3">
            {dialogData.map((review) => (
              <div key={review.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{review.bookings?.pooja_services?.name || 'Service'}</p>
                    <p className="text-xs text-muted-foreground">
                      {review.reviewer_role === 'client' ? 'By Client' : 'By Purohit'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                </div>
                {review.review_text && (
                  <p className="text-sm text-muted-foreground">{review.review_text}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(review.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        );

      case 'bookings':
        return (
          <div className="space-y-3">
            {dialogData.map((booking) => (
              <Link key={booking.id} to={`/bookings/${booking.id}`} className="block">
                <div className="p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{booking.pooja_services?.name || 'Custom Service'}</p>
                      <p className="text-sm text-muted-foreground">
                        Client: {booking.clients?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Purohit: {booking.purohits?.full_name}
                      </p>
                    </div>
                    <StatusBadge status={booking.status as any} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{booking.city}</span>
                    {booking.scheduled_at && (
                      <span>{format(new Date(booking.scheduled_at), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                  {booking.price_agreed && (
                    <p className="text-sm font-medium text-primary mt-1">
                      ₹{booking.price_agreed.toLocaleString()}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        );

      case 'requests':
        return (
          <div className="space-y-3">
            {dialogData.map((request) => (
              <Link key={request.id} to={`/request/${request.id}`} className="block">
                <div className="p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">
                        {request.pooja_services?.name || request.custom_service_text || 'Custom Request'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        By: {request.clients?.full_name}
                      </p>
                    </div>
                    <StatusBadge status={request.status as any} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{request.city}</span>
                    {request.requested_date && (
                      <span>{format(new Date(request.requested_date), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        );

      case 'consultations':
        return (
          <div className="space-y-3">
            {dialogData.map((consultation) => (
              <Link key={consultation.id} to={`/consultations/${consultation.id}`} className="block">
                <div className="p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">
                        {consultation.pooja_services?.name || 'Consultation'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Client: {consultation.clients?.full_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Purohit: {consultation.purohits?.full_name}
                      </p>
                    </div>
                    <StatusBadge status={consultation.status as any} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(consultation.created_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="text-center text-muted-foreground">Loading statistics...</div>
        </div>
      </Layout>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Clients",
      value: stats.totalClients,
      icon: Users,
      color: "text-blue-600 bg-blue-100",
      onClick: () => openDialog('clients'),
    },
    {
      title: "Total Purohits",
      value: stats.totalPurohits,
      icon: UserCheck,
      color: "text-emerald-600 bg-emerald-100",
      onClick: () => openDialog('purohits'),
    },
    {
      title: "Total Services",
      value: stats.totalServices,
      icon: Calendar,
      color: "text-purple-600 bg-purple-100",
      onClick: () => openDialog('services'),
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: "text-amber-600 bg-amber-100",
      onClick: () => openDialog('bookings', 'completed'),
    },
    {
      title: "Total Reviews",
      value: stats.totalReviews,
      subtitle: stats.avgRating > 0 ? `Avg: ${stats.avgRating.toFixed(1)}★` : undefined,
      icon: TrendingUp,
      color: "text-pink-600 bg-pink-100",
      onClick: () => openDialog('reviews'),
    },
  ];

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform overview and statistics</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card 
              key={stat.title} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={stat.onClick}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-amber-600">{stat.subtitle}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Bookings Stats */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 rounded-t-lg"
              onClick={() => openDialog('bookings')}
            >
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Bookings ({stats.totalBookings})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2"
                onClick={() => openDialog('bookings', 'pending')}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-semibold text-yellow-600">{stats.pendingBookings}</span>
              </div>
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2"
                onClick={() => openDialog('bookings', 'confirmed')}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Confirmed</span>
                </div>
                <span className="font-semibold text-blue-600">{stats.confirmedBookings}</span>
              </div>
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2"
                onClick={() => openDialog('bookings', 'completed')}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="font-semibold text-emerald-600">{stats.completedBookings}</span>
              </div>
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2"
                onClick={() => openDialog('bookings', 'cancelled')}
              >
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Cancelled</span>
                </div>
                <span className="font-semibold text-red-600">{stats.cancelledBookings}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pooja Requests Stats */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 rounded-t-lg"
              onClick={() => openDialog('requests')}
            >
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Pooja Requests ({stats.totalRequests})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2"
                onClick={() => openDialog('requests', 'open')}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Open</span>
                </div>
                <span className="font-semibold text-yellow-600">{stats.openRequests}</span>
              </div>
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2"
                onClick={() => openDialog('requests', 'matched')}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Matched</span>
                </div>
                <span className="font-semibold text-blue-600">{stats.matchedRequests}</span>
              </div>
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2"
                onClick={() => openDialog('requests', 'closed')}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">Closed</span>
                </div>
                <span className="font-semibold text-emerald-600">{stats.closedRequests}</span>
              </div>
            </CardContent>
          </Card>

          {/* Consultations Stats */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 rounded-t-lg"
              onClick={() => openDialog('consultations')}
            >
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Consultations ({stats.totalConsultations})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2"
                onClick={() => openDialog('consultations', 'requested')}
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Requested</span>
                </div>
                <span className="font-semibold text-yellow-600">{stats.requestedConsultations}</span>
              </div>
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2"
                onClick={() => openDialog('consultations', 'accepted')}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Accepted</span>
                </div>
                <span className="font-semibold text-blue-600">{stats.acceptedConsultations}</span>
              </div>
              <div 
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded -mx-2"
                onClick={() => openDialog('consultations', 'completed')}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="font-semibold text-emerald-600">{stats.completedConsultations}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={dialogType !== null} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            {renderDialogContent()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
