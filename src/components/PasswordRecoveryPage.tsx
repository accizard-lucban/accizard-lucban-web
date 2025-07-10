import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "@/components/ui/sonner";

export function PasswordRecoveryPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setIsSubmitted(true);
      toast.success("Recovery link sent! Please check your email.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send recovery link.");
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return <div className="min-h-screen flex bg-black">
      {/* Left Side - Logo and Branding */}
      <div className="flex-1 bg-[url('/lovable-uploads/login-signup-cover.png')] bg-cover">
        <div className="text-center">
          
        </div>
      </div>

      {/* Right Side - Recovery Form */}
      <div className="flex-1 bg-white flex items-center justify-center p-12">
        <Card className="w-full max-w-md border-0 shadow-none">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800 mb-2">Password Recovery</CardTitle>
            
          </CardHeader>
          <CardContent>
            {!isSubmitted ? <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-800 font-medium">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required className="h-12 border-gray-300 focus:border-red-800 focus:ring-red-800" />
                </div>
                <Button type="submit" className="w-full h-12 bg-red-800 hover:bg-red-700 text-white font-medium rounded-lg">
                  Send Recovery Link
                </Button>
              </form> : <div className="text-center space-y-4">
                <div className="text-green-600 font-medium">Recovery link sent successfully! Please check your email for further instructions.</div>
              </div>}
            
            <div className="text-center mt-6">
              <button type="button" onClick={handleBackToLogin} className="flex items-center justify-center mx-auto text-red-600 hover:text-red-800 text-sm font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}