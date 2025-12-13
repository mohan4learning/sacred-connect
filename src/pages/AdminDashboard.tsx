import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, UserCheck, Calendar, MessageSquare, 
  Clock, CheckCircle, XCircle, AlertCircle,
  TrendingUp, IndianRupee, ArrowLeft
} from "lucide-react";

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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
    },
    {
      title: "Total Purohits",
      value: stats.totalPurohits,
      icon: UserCheck,
      color: "text-emerald-600 bg-emerald-100",
    },
    {
      title: "Total Services",
      value: stats.totalServices,
      icon: Calendar,
      color: "text-purple-600 bg-purple-100",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: IndianRupee,
      color: "text-amber-600 bg-amber-100",
    },
    {
      title: "Total Reviews",
      value: stats.totalReviews,
      subtitle: stats.avgRating > 0 ? `Avg: ${stats.avgRating.toFixed(1)}★` : undefined,
      icon: TrendingUp,
      color: "text-pink-600 bg-pink-100",
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
            <Card key={stat.title}>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Bookings ({stats.totalBookings})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-semibold text-yellow-600">{stats.pendingBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Confirmed</span>
                </div>
                <span className="font-semibold text-blue-600">{stats.confirmedBookings}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="font-semibold text-emerald-600">{stats.completedBookings}</span>
              </div>
              <div className="flex items-center justify-between">
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Pooja Requests ({stats.totalRequests})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Open</span>
                </div>
                <span className="font-semibold text-yellow-600">{stats.openRequests}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Matched</span>
                </div>
                <span className="font-semibold text-blue-600">{stats.matchedRequests}</span>
              </div>
              <div className="flex items-center justify-between">
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Consultations ({stats.totalConsultations})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Requested</span>
                </div>
                <span className="font-semibold text-yellow-600">{stats.requestedConsultations}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Accepted</span>
                </div>
                <span className="font-semibold text-blue-600">{stats.acceptedConsultations}</span>
              </div>
              <div className="flex items-center justify-between">
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
    </Layout>
  );
}
