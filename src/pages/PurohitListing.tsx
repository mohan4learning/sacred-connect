import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchAutocomplete } from "@/components/SearchAutocomplete";
import { MapPin, Star, Video, Users, Clock, Filter, Languages } from "lucide-react";

interface Purohit {
  id: string;
  full_name: string;
  city: string;
  area: string | null;
  languages: string[];
  experience_years: number;
  bio: string | null;
  remote_pooja_available: boolean;
  in_person_available: boolean;
  services: string[];
  bookingCount: number;
}

interface Service {
  id: string;
  name: string;
}

export default function PurohitListing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [purohits, setPurohits] = useState<Purohit[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '');
  const [serviceFilter, setServiceFilter] = useState(searchParams.get('service') || '');
  const [modeFilter, setModeFilter] = useState(searchParams.get('mode') || '');
  const [sortBy, setSortBy] = useState('recommended');

  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune'];

  useEffect(() => {
    fetchServices();
    fetchPurohits();
  }, [cityFilter, serviceFilter, modeFilter, sortBy]);

  const fetchServices = async () => {
    const { data } = await supabase.from('pooja_services').select('id, name').order('name');
    if (data) setServices(data);
  };

  const fetchPurohits = async () => {
    setLoading(true);
    
    let query = supabase
      .from('purohits')
      .select(`
        id, full_name, city, area, languages, experience_years, bio,
        remote_pooja_available, in_person_available,
        purohit_services (
          pooja_services (name)
        )
      `);

    if (cityFilter) {
      query = query.eq('city', cityFilter);
    }

    if (modeFilter === 'remote') {
      query = query.eq('remote_pooja_available', true);
    } else if (modeFilter === 'in_person') {
      query = query.eq('in_person_available', true);
    }

    const { data } = await query;

    if (data) {
      // Get booking counts
      const { data: bookingCounts } = await supabase
        .from('bookings')
        .select('purohit_id')
        .eq('status', 'completed');

      const countMap: Record<string, number> = {};
      bookingCounts?.forEach((b: any) => {
        countMap[b.purohit_id] = (countMap[b.purohit_id] || 0) + 1;
      });

      let processed = data.map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        city: p.city,
        area: p.area,
        languages: p.languages || [],
        experience_years: p.experience_years || 0,
        bio: p.bio,
        remote_pooja_available: p.remote_pooja_available,
        in_person_available: p.in_person_available,
        services: p.purohit_services?.map((ps: any) => ps.pooja_services?.name).filter(Boolean) || [],
        bookingCount: countMap[p.id] || 0,
      }));

      // Filter by service
      if (serviceFilter) {
        processed = processed.filter(p => 
          p.services.some((s: string) => s.toLowerCase().includes(serviceFilter.toLowerCase()))
        );
      }

      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        processed = processed.filter(p =>
          p.full_name.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query) ||
          p.services.some((s: string) => s.toLowerCase().includes(query))
        );
      }

      // Sort
      if (sortBy === 'experience') {
        processed.sort((a, b) => b.experience_years - a.experience_years);
      } else if (sortBy === 'reviews') {
        processed.sort((a, b) => b.bookingCount - a.bookingCount);
      }

      setPurohits(processed);
    }
    
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPurohits();
  };

  const getRating = (bookingCount: number) => {
    // MVP: Derive rating from completed bookings
    if (bookingCount >= 50) return 4.9;
    if (bookingCount >= 20) return 4.7;
    if (bookingCount >= 10) return 4.5;
    if (bookingCount >= 5) return 4.3;
    return 4.0;
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Find Purohits</h1>
          <p className="text-muted-foreground">Discover verified purohits for your ceremonies</p>
        </div>

        {/* Search & Filters */}
        <div className="bg-card rounded-xl border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <SearchAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={() => fetchPurohits()}
              placeholder="Search by name, city, or service..."
              className="flex-1"
            />
            <Button onClick={() => fetchPurohits()} className="btn-hero">Search</Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Select value={cityFilter || "all"} onValueChange={(v) => setCityFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[150px]">
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={serviceFilter || "all"} onValueChange={(v) => setServiceFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Service Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.name}>{service.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={modeFilter || "all"} onValueChange={(v) => setModeFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[150px]">
                <Video className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="in_person">In-Person</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">Recommended</SelectItem>
                <SelectItem value="experience">Most Experienced</SelectItem>
                <SelectItem value="reviews">Most Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading purohits...</div>
        ) : purohits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No purohits found matching your criteria.</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setCityFilter('');
              setServiceFilter('');
              setModeFilter('');
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purohits.map((purohit) => (
              <Link key={purohit.id} to={`/purohits/${purohit.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full gradient-hero flex items-center justify-center">
                          <span className="text-primary-foreground font-display text-xl font-bold">
                            {purohit.full_name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{purohit.full_name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {purohit.city}{purohit.area && `, ${purohit.area}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-medium">{getRating(purohit.bookingCount).toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {purohit.remote_pooja_available && (
                        <span className="inline-flex items-center gap-1 text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
                          <Video className="h-3 w-3" /> Remote
                        </span>
                      )}
                      {purohit.in_person_available && (
                        <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          <Users className="h-3 w-3" /> In-Person
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{purohit.experience_years}+ years experience</span>
                      </div>
                      {purohit.languages.length > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Languages className="h-4 w-4" />
                          <span>{purohit.languages.slice(0, 3).join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {purohit.services.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {purohit.services.slice(0, 3).map((service, i) => (
                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded">
                              {service}
                            </span>
                          ))}
                          {purohit.services.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{purohit.services.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
