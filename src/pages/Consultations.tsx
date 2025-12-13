import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { MessageSquare, Archive } from "lucide-react";
import { format } from "date-fns";

interface Consultation {
  id: string;
  status: string;
  created_at: string;
  purohit_name: string;
  client_name: string;
  service_name: string | null;
}

export default function Consultations() {
  const { clientRecord, purohitRecord, isClient } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  const profileId = isClient ? clientRecord?.id : purohitRecord?.id;

  useEffect(() => {
    if (profileId) fetchConsultations();
  }, [profileId]);

  const fetchConsultations = async () => {
    const column = isClient ? 'client_id' : 'purohit_id';
    const { data } = await supabase
      .from('consultations')
      .select(`id, status, created_at, purohits(full_name), clients(full_name), pooja_services(name)`)
      .eq(column, profileId!)
      .order('created_at', { ascending: false });

    if (data) {
      setConsultations(data.map((c: any) => ({
        id: c.id, status: c.status, created_at: c.created_at,
        purohit_name: c.purohits?.full_name || 'Unknown',
        client_name: c.clients?.full_name || 'Unknown',
        service_name: c.pooja_services?.name,
      })));
    }
    setLoading(false);
  };

  const activeConsultations = consultations.filter(c => ['requested', 'accepted'].includes(c.status));
  const pastConsultations = consultations.filter(c => ['completed', 'cancelled'].includes(c.status));

  const ConsultationCard = ({ c }: { c: Consultation }) => (
    <Link key={c.id} to={`/consultations/${c.id}`}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{c.service_name || 'General Consultation'}</p>
              <p className="text-sm text-muted-foreground">{isClient ? `with ${c.purohit_name}` : `from ${c.client_name}`}</p>
            </div>
          </div>
          <div className="text-right">
            <StatusBadge status={c.status as any} />
            <p className="text-xs text-muted-foreground mt-1">{format(new Date(c.created_at), 'MMM d, yyyy')}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <Layout>
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">Consultations</h1>
        {loading ? <p className="text-muted-foreground">Loading...</p> : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="active">
                Active ({activeConsultations.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-1">
                <Archive className="h-4 w-4" />
                Past ({pastConsultations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {activeConsultations.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">No active consultations.</p>
              ) : (
                <div className="space-y-4">
                  {activeConsultations.map((c) => <ConsultationCard key={c.id} c={c} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {pastConsultations.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">No past consultations.</p>
              ) : (
                <div className="space-y-4">
                  {pastConsultations.map((c) => <ConsultationCard key={c.id} c={c} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
