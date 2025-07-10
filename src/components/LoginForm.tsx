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

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("super-admin");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

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
      await signInWithEmailAndPassword(auth, email, password);
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

  return <div className="min-h-screen flex bg-black">
      {/* Left Side - Logo and Branding */}
      <div className="flex-1 bg-[url('/lovable-uploads/login-signup-cover.png')] bg-cover">
        <div className="text-center">
          
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-12">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-800 mb-0">Account Login</CardTitle>
            <p className="font-medium text-red-800 ">Welcome back!</p>
          </CardHeader>
          <CardContent>
            {/* User Type Toggle */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button type="button" onClick={() => setUserType("super-admin")} className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${userType === "super-admin" ? "bg-red-800 text-white" : "text-gray-600 hover:text-red-800"}`}>
                Super Admin
              </button>
              <button type="button" onClick={() => setUserType("admin")} className={`flex-1 py-3 px-4 rounded-md text-sm font-medium transition-colors ${userType === "admin" ? "bg-red-800 text-white" : "text-gray-600 hover:text-red-800"}`}>
                Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {userType === "super-admin" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-800 font-medium">Email</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required className="h-12 border-gray-300 focus:border-red-800 focus:ring-red-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-800 font-medium">Password</Label>
                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="h-12 border-gray-300 focus:border-red-800 focus:ring-red-800" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-gray-800 font-medium">Username</Label>
                    <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required className="h-12 border-gray-300 focus:border-red-800 focus:ring-red-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-800 font-medium">Password</Label>
                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="h-12 border-gray-300 focus:border-red-800 focus:ring-red-800" />
                  </div>
                </>
              )}
              <Button type="submit" className="w-full h-12 bg-red-800 hover:bg-red-700 text-white font-medium rounded-lg">
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
    </div>;
}