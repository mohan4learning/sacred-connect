import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Start from "./pages/Start";
import ClientDashboard from "./pages/ClientDashboard";
import ClientPoojaRequests from "./pages/ClientPoojaRequests";
import PurohitDashboard from "./pages/PurohitDashboard";
import PurohitListing from "./pages/PurohitListing";
import PurohitProfile from "./pages/PurohitProfile";
import PurohitServices from "./pages/PurohitServices";
import PurohitPortfolio from "./pages/PurohitPortfolio";
import Bookings from "./pages/Bookings";
import BookingDetail from "./pages/BookingDetail";
import Consultations from "./pages/Consultations";
import ConsultationDetail from "./pages/ConsultationDetail";
import RequestPooja from "./pages/RequestPooja";
import PoojaRequestDetail from "./pages/PoojaRequestDetail";
import PurohitCalendar from "./pages/PurohitCalendar";
import PurohitLocations from "./pages/PurohitLocations";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/start" element={<Start />} />
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/client/requests" element={<ClientPoojaRequests />} />
          <Route path="/purohit" element={<PurohitDashboard />} />
          <Route path="/purohit/calendar" element={<PurohitCalendar />} />
          <Route path="/purohit/locations" element={<PurohitLocations />} />
          <Route path="/purohit/services" element={<PurohitServices />} />
          <Route path="/purohit/portfolio" element={<PurohitPortfolio />} />
          <Route path="/purohit/edit" element={<PurohitPortfolio />} />
          <Route path="/purohits" element={<PurohitListing />} />
          <Route path="/purohits/:id" element={<PurohitProfile />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/bookings/:id" element={<BookingDetail />} />
          <Route path="/consultations" element={<Consultations />} />
          <Route path="/consultations/:id" element={<ConsultationDetail />} />
          <Route path="/request" element={<RequestPooja />} />
          <Route path="/request/:id" element={<PoojaRequestDetail />} />
          <Route path="/help" element={<Help />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
