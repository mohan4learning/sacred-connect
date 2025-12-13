import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SelectRole from "./pages/SelectRole";
import AdminLogin from "./pages/AdminLogin";
import ClientDashboard from "./pages/ClientDashboard";
import ClientProfile from "./pages/ClientProfile";
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
import AdminDashboard from "./pages/AdminDashboard";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/select-role" element={<SelectRole />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/purohits" element={<PurohitListing />} />
            <Route path="/purohits/:id" element={<PurohitProfile />} />
            <Route path="/help" element={<Help />} />

            {/* Client routes */}
            <Route path="/client" element={<ProtectedRoute allowedRoles={['client']}><ClientDashboard /></ProtectedRoute>} />
            <Route path="/client/edit" element={<ProtectedRoute allowedRoles={['client']}><ClientProfile /></ProtectedRoute>} />
            <Route path="/client/requests" element={<ProtectedRoute allowedRoles={['client']}><ClientPoojaRequests /></ProtectedRoute>} />
            <Route path="/request" element={<ProtectedRoute allowedRoles={['client']}><RequestPooja /></ProtectedRoute>} />

            {/* Purohit routes */}
            <Route path="/purohit" element={<ProtectedRoute allowedRoles={['purohit']}><PurohitDashboard /></ProtectedRoute>} />
            <Route path="/purohit/calendar" element={<ProtectedRoute allowedRoles={['purohit']}><PurohitCalendar /></ProtectedRoute>} />
            <Route path="/purohit/locations" element={<ProtectedRoute allowedRoles={['purohit']}><PurohitLocations /></ProtectedRoute>} />
            <Route path="/purohit/services" element={<ProtectedRoute allowedRoles={['purohit']}><PurohitServices /></ProtectedRoute>} />
            <Route path="/purohit/portfolio" element={<ProtectedRoute allowedRoles={['purohit']}><PurohitPortfolio /></ProtectedRoute>} />
            <Route path="/purohit/edit" element={<ProtectedRoute allowedRoles={['purohit']}><PurohitPortfolio /></ProtectedRoute>} />

            {/* Shared authenticated routes */}
            <Route path="/bookings" element={<ProtectedRoute allowedRoles={['client', 'purohit']}><Bookings /></ProtectedRoute>} />
            <Route path="/bookings/:id" element={<ProtectedRoute allowedRoles={['client', 'purohit']}><BookingDetail /></ProtectedRoute>} />
            <Route path="/consultations" element={<ProtectedRoute allowedRoles={['client', 'purohit']}><Consultations /></ProtectedRoute>} />
            <Route path="/consultations/:id" element={<ProtectedRoute allowedRoles={['client', 'purohit']}><ConsultationDetail /></ProtectedRoute>} />
            <Route path="/request/:id" element={<ProtectedRoute allowedRoles={['client', 'purohit']}><PoojaRequestDetail /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
