import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { LoginForm } from "./components/LoginForm";
import { PasswordRecoveryPage } from "./components/PasswordRecoveryPage";
import { ProfilePage } from "./components/ProfilePage";
import { ManageUsersPage } from "./components/ManageUsersPage";
import { ManageReportsPage } from "./components/ManageReportsPage";
import { RiskMapPage } from "./components/RiskMapPage";
import { AnnouncementsPage } from "./components/AnnouncementsPage";
import { ChatSupportPage } from "./components/ChatSupportPage";
import { DashboardStats } from "./components/DashboardStats";
import { getAuth } from "firebase/auth";

function PrivateRoute() {
  const user = getAuth().currentUser;
  const adminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
  return user || adminLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter> 
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/password-recovery" element={<PasswordRecoveryPage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Index />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/manage-users" element={<ManageUsersPage />} />
            <Route path="/manage-reports" element={<ManageReportsPage />} />
            <Route path="/risk-map" element={<RiskMapPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/chat-support" element={<ChatSupportPage />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
