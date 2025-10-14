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
import { Eye, EyeOff, HelpCircle, Shield, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
      console.log("Attempting Firebase Auth login with:", email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Firebase Auth successful. User email:", user.email);
      
      // Check if the user exists in the superAdmin collection
      console.log("Checking superAdmin collection...");
      const superadminQuery = query(
        collection(db, "superAdmin"), 
        where("email", "==", user.email)
      );
      const superadminSnapshot = await getDocs(superadminQuery);
      
      console.log("SuperAdmin query results:", superadminSnapshot.size, "documents found");
      if (superadminSnapshot.size > 0) {
        console.log("First document data:", superadminSnapshot.docs[0].data());
      }
      
      if (superadminSnapshot.empty) {
        // User exists in Firebase Auth but not in superAdmin collection
        // Sign them out and show error
        console.log("User not found in superAdmin collection, signing out...");
        await auth.signOut();
        setError("Access denied. You are not authorized to access the web application.");
        toast.error("Access denied. You are not authorized to access the web application.");
        return;
      }
      
      // User is in superAdmin collection, allow access
      console.log("Login successful! Navigating to dashboard...");
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

  return <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-8">
      {/* Floating Container */}
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          {/* Left Side - Logo and Branding */}
          <div className="flex-1 bg-[url('/accizard-uploads/login-signup-cover.png')] bg-cover bg-center min-h-[300px] lg:min-h-auto">
            <div className="text-center">
              
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex-1 bg-white flex items-center justify-center p-4 sm:p-8 lg:p-12">
            <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="text-center pb-4 sm:pb-8">
            <div className="flex flex-col items-center justify-center mb-4">
              {userType === "super-admin" ? (
                <div className="flex flex-col items-center space-y-2">
                  <Shield className="h-8 w-8 text-brand-orange" />
                  <div className="text-center">
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800 mb-0">Account Login</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Welcome back, Super Admin!</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <User className="h-8 w-8 text-brand-orange" />
                  <div className="text-center">
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800 mb-0">Account Login</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">Welcome back, Admin!</p>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="super-admin" value={userType} onValueChange={setUserType} className="w-full">
              {/* User Type Toggle */}
              <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6 bg-gray-100 h-auto p-1">
                <TabsTrigger 
                  value="super-admin" 
                  className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium data-[state=active]:bg-brand-orange data-[state=active]:text-white text-gray-600 hover:bg-orange-100 hover:text-brand-orange transition-colors"
                >
                  Super Admin
                </TabsTrigger>
                <TabsTrigger 
                  value="admin"
                  className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium data-[state=active]:bg-brand-orange data-[state=active]:text-white text-gray-600 hover:bg-orange-100 hover:text-brand-orange transition-colors"
                >
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="super-admin" className="mt-0">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-800 font-medium text-sm sm:text-base">Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="h-10 sm:h-12 border-gray-300 focus:border-gray-300 focus:ring-[#1f2937] text-sm sm:text-base" />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="password" className="text-gray-800 font-medium text-sm sm:text-base">Password</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="h-10 sm:h-12 border-gray-300 focus:border-gray-300 focus:ring-[#1f2937] pr-10 text-sm sm:text-base" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-700 hover:bg-transparent"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10 sm:h-12 bg-brand-orange hover:bg-brand-orange-400 text-white font-medium rounded-lg text-sm sm:text-base">
                    Login
                  </Button>
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={handleForgotPassword}
                      className="text-sm font-medium underline text-brand-orange hover:text-brand-orange-400 p-0 h-auto"
                    >
                      Forgot password?
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="mt-0">
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-800 font-medium text-sm sm:text-base">Username</Label>
                    <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required className="h-10 sm:h-12 border-gray-300 focus:border-gray-300 focus:ring-[#1f2937] text-sm sm:text-base" />
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="password-admin" className="text-gray-800 font-medium text-sm sm:text-base">Password</Label>
                    <div className="relative">
                      <Input id="password-admin" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="h-10 sm:h-12 border-gray-300 focus:border-gray-300 focus:ring-[#1f2937] pr-10 text-sm sm:text-base" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-700 hover:bg-transparent"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10 sm:h-12 bg-brand-orange hover:bg-brand-orange-400 text-white font-medium rounded-lg text-sm sm:text-base">
                    Login
                  </Button>
                  <div className="text-center">
                    <div className="h-6"></div>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Help Button with Modal */}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute bottom-4 right-4 rounded-full shadow-md bg-gray-100 hover:bg-gray-200 border-0"
            aria-label="Password recovery help"
          >
            <HelpCircle className="h-5 w-5 text-gray-600" />
          </Button>
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
        </div>
      </div>
    </div>;
}