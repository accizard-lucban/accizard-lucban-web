
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/password-recovery" element={<PasswordRecoveryPage />} />
          <Route path="/" element={<Index />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/manage-users" element={<ManageUsersPage />} />
          <Route path="/manage-reports" element={<ManageReportsPage />} />
          <Route path="/risk-map" element={<RiskMapPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/chat-support" element={<ChatSupportPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
