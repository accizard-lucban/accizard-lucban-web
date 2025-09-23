import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "@/components/ui/sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("super-admin");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (userType === "admin") {
      // Admin login: check Firestore for username/password
      if (!username || !password) {
        setError("Please enter your username and password.");
        toast.error("Please enter your username and password.");
        return;
      }
      try {
        const q = query(collection(db, "admins"), where("username", "==", username), where("password", "==", password));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          localStorage.setItem("adminLoggedIn", "true");
          toast.success("Admin login successful!");
          navigate("/dashboard");
        } else {
          setError("Invalid username or password.");
          toast.error("Invalid username or password.");
        }
      } catch (err: any) {
        setError("Login failed. Please try again.");
        toast.error("Login failed. Please try again.");
      }
      return;
    }
    // Super Admin login: Firebase Auth
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      toast.error("Invalid email address.");
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if the user exists in the superAdmin collection
      const superadminQuery = query(
        collection(db, "superAdmin"), 
        where("email", "==", user.email)
      );
      const superadminSnapshot = await getDocs(superadminQuery);
      
      if (superadminSnapshot.empty) {
        // User exists in Firebase Auth but not in superAdmin collection
        // Sign them out and show error
        await auth.signOut();
        setError("Access denied. You are not authorized to access the web application.");
        toast.error("Access denied. You are not authorized to access the web application.");
        return;
      }
      
      // User is in superAdmin collection, allow access
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
      toast.error("Login failed. Please check your credentials.");
    }
  };

  const handleForgotPassword = () => {
    navigate("/password-recovery");
  };

  return <div className="min-h-screen flex flex-col lg:flex-row bg-black relative">
      {/* Left Side - Logo and Branding */}
      <div className="flex-1 bg-[url('/accizard-uploads/login-signup-cover.png')] bg-cover bg-center min-h-[200px] lg:min-h-screen">
        <div className="text-center">
          
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="text-center pb-4 sm:pb-8">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800 mb-0">Account Login</CardTitle>
          </CardHeader>
          <CardContent>
            {/* User Type Toggle */}
            <div className="flex mb-4 sm:mb-6 bg-gray-100 rounded-lg p-1">
              <button type="button" onClick={() => setUserType("super-admin")} className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${userType === "super-admin" ? "bg-red-800 text-white" : "text-gray-600 hover:text-red-800"}`}>
                Super Admin
              </button>
              <button type="button" onClick={() => setUserType("admin")} className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors ${userType === "admin" ? "bg-red-800 text-white" : "text-gray-600 hover:text-red-800"}`}>
                Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {userType === "super-admin" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-800 font-medium text-sm sm:text-base">Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="h-10 sm:h-12 border-gray-300 focus:ring-red-800 text-sm sm:text-base" />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="password" className="text-gray-800 font-medium text-sm sm:text-base">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="h-10 sm:h-12 border-gray-300 focus:ring-red-800 pr-10 text-sm sm:text-base" />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none" tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-800 font-medium text-sm sm:text-base">Username</Label>
                    <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required className="h-10 sm:h-12 border-gray-300 focus:ring-red-800 text-sm sm:text-base" />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="password" className="text-gray-800 font-medium text-sm sm:text-base">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="h-10 sm:h-12 border-gray-300 focus:ring-red-800 pr-10 text-sm sm:text-base" />
                      <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 focus:outline-none" tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                    </div>
                  </div>
                </>
              )}
              <Button type="submit" className="w-full h-10 sm:h-12 bg-red-800 hover:bg-red-700 text-white font-medium rounded-lg text-sm sm:text-base">
                Login
              </Button>
              {userType === "super-admin" && (
                <div className="text-center">
                  <button type="button" onClick={handleForgotPassword} className="text-sm font-medium underline text-red-800">
                    Forgot password?
                  </button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Help Button with Modal */}
      <Dialog>
        <DialogTrigger asChild>
          <button 
            type="button"
            className="absolute bottom-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full shadow-md transition-colors"
            aria-label="Password recovery help"
          >
            <HelpCircle className="h-5 w-5 text-gray-600" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">Password Recovery Help</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-brand-red rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Super Admins</h4>
                  <p className="text-sm text-gray-600 mt-1">Can reset their password through email using the "Forgot password?" link below the login form.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-6 h-6 bg-brand-red rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Admins</h4>
                  <p className="text-sm text-gray-600 mt-1">If you forget your password, please contact your Super Admin to reset it for you.</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}