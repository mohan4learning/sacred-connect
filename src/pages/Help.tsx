import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Help() {
  return (
    <Layout>
      <div className="container py-8 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-6">How to Use PurohitConnect</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>For Clients</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>1. Click "Get Started" and choose "I'm a Client"</p>
              <p>2. Select an existing profile or create a new one</p>
              <p>3. Browse purohits using filters (city, service, remote/in-person)</p>
              <p>4. Start a consultation or request a booking directly</p>
              <p>5. Track your bookings and consultations from your dashboard</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>For Purohits</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>1. Click "Get Started" and choose "I'm a Purohit"</p>
              <p>2. Select your profile or create one with your details</p>
              <p>3. Complete your portfolio (bio, services, languages)</p>
              <p>4. Respond to consultation requests and manage bookings</p>
              <p>5. Use the calendar view to see your schedule</p>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button asChild className="btn-hero"><Link to="/start">Get Started</Link></Button>
            <Button asChild variant="outline"><Link to="/purohits">Browse Purohits</Link></Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
