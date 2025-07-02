import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("super-admin");
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", {
      username,
      password,
      userType
    });
    // Handle login logic here - redirect to dashboard
    navigate("/");
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
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-800 font-medium">Username</Label>
                <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required className="h-12 border-gray-300 focus:border-red-800 focus:ring-red-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-800 font-medium">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required className="h-12 border-gray-300 focus:border-red-800 focus:ring-red-800" />
              </div>
              <Button type="submit" className="w-full h-12 bg-red-800 hover:bg-red-700 text-white font-medium rounded-lg">
                Login
              </Button>
              <div className="text-center">
                <button type="button" onClick={handleForgotPassword} className="text-sm font-medium underline text-red-800">
                  Forgot password?
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
}