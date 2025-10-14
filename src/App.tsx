import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createContext, useContext, useEffect, useState, lazy, Suspense, Component, ReactNode } from "react";

// Error Boundary for catching chunk load errors
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-600 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand-orange hover:bg-brand-orange-400 text-white px-6 py-2 rounded-lg font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy-loaded route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginForm = lazy(() => import("./components/LoginForm").then(module => ({ default: module.LoginForm })));
const PasswordRecoveryPage = lazy(() => import("./components/PasswordRecoveryPage").then(module => ({ default: module.PasswordRecoveryPage })));
const ProfilePage = lazy(() => import("./components/ProfilePage").then(module => ({ default: module.ProfilePage })));
const ManageUsersPage = lazy(() => import("./components/ManageUsersPage").then(module => ({ default: module.ManageUsersPage })));
const ManageReportsPage = lazy(() => import("./components/ManageReportsPage").then(module => ({ default: module.ManageReportsPage })));
const RiskMapPage = lazy(() => import("./components/RiskMapPage").then(module => ({ default: module.RiskMapPage })));
const AnnouncementsPage = lazy(() => import("./components/AnnouncementsPage").then(module => ({ default: module.AnnouncementsPage })));
const ChatSupportPage = lazy(() => import("./components/ChatSupportPage").then(module => ({ default: module.ChatSupportPage })));

// Auth context and provider
const AuthContext = createContext<{ user: User | null, loading: boolean }>({ user: null, loading: true });

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
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

function SpinnerOverlay({ fullScreen = true }: { fullScreen?: boolean }) {
  return (
    <div style={{
      position: fullScreen ? 'fixed' : 'relative',
      top: 0,
      left: 0,
      width: fullScreen ? '100vw' : '100%',
      height: fullScreen ? '100vh' : '100%',
      minHeight: fullScreen ? 'auto' : '400px',
      background: fullScreen ? 'rgba(255,255,255,0.4)' : 'transparent',
      zIndex: fullScreen ? 9999 : 1,
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

// Loading fallback for route code splitting
function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <svg className="animate-spin mx-auto mb-4" width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" stroke="#FF4F0B" strokeWidth="6" opacity="0.2" />
          <path d="M44 24c0-11.046-8.954-20-20-20" stroke="#FF4F0B" strokeWidth="6" strokeLinecap="round" />
        </svg>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
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
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteLoader />}>
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
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
