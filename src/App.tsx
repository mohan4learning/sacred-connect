import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Start from "./pages/Start";
import ClientDashboard from "./pages/ClientDashboard";
import PurohitDashboard from "./pages/PurohitDashboard";
import PurohitListing from "./pages/PurohitListing";
import PurohitProfile from "./pages/PurohitProfile";
import Bookings from "./pages/Bookings";
import Consultations from "./pages/Consultations";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/start" element={<Start />} />
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/purohit" element={<PurohitDashboard />} />
          <Route path="/purohits" element={<PurohitListing />} />
          <Route path="/purohits/:id" element={<PurohitProfile />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/consultations" element={<Consultations />} />
          <Route path="/help" element={<Help />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
