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
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

// Auth context and provider
const AuthContext = createContext<{ user: User | null, loading: boolean }>({ user: null, loading: true });

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

function SpinnerOverlay() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(255,255,255,0.4)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <svg className="animate-spin" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="20" stroke="#FF4F0B" strokeWidth="6" opacity="0.2" />
        <path d="M44 24c0-11.046-8.954-20-20-20" stroke="#FF4F0B" strokeWidth="6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function PrivateRoute() {
  const { user, loading } = useAuth();
  const adminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
  if (loading) return <SpinnerOverlay />;
  return user || adminLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
