import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "@/components/ui/sonner";
import { SUPER_ADMIN_EMAIL } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function PasswordRecoveryPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address.");
        return;
      }
      
      // Check if the email is the authorized super admin email
      if (email !== SUPER_ADMIN_EMAIL) {
        toast.error("Access denied. Password recovery is only available for authorized super admin accounts.");
        return;
      }
      
      await sendPasswordResetEmail(auth, email);
      setIsSubmitted(true);
      toast.success("Recovery link sent! Please check your email.");
    } catch (err: any) {
      console.error("Password recovery error:", err);
      
      // Check for network connectivity
      if (!navigator.onLine) {
        toast.error("No internet connection. Please check your network and try again.");
      }
      // Check for Firebase network errors
      else if (err.code === 'auth/network-request-failed' || 
               err.message?.includes('network') ||
               err.message?.includes('fetch')) {
        toast.error("Network error. Please check your internet connection and try again.");
      }
      // Generic error fallback
      else {
        toast.error(err.message || "Failed to send recovery link.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-8">
      {/* Floating Container */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
        <div className="flex flex-col lg:flex-row min-h-[500px]">
          {/* Left Side - Logo and Branding */}
          <div className="flex-1 bg-[url('/accizard-uploads/login-image.png')] bg-cover bg-center min-h-[250px] lg:min-h-auto">
            <div className="text-center">
              
            </div>
          </div>

          {/* Right Side - Recovery Form */}
          <div className="flex-1 bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <Card className="w-full max-w-sm border-0 shadow-none">
          <CardHeader className="text-center pb-3 sm:pb-6">
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="flex flex-col items-center space-y-2">
                <div className="h-12 w-12 bg-brand-orange/10 rounded-full flex items-center justify-center">
                  <Lock className="h-6 w-6 text-brand-orange" />
                </div>
                <div className="text-center">
                  <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-800 mb-0">Password Recovery</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Enter your email to reset your password</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!isSubmitted ? <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-800 font-medium text-sm sm:text-base">Email Address</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required className="h-10 sm:h-12 border-gray-300 focus:border-gray-300 focus:ring-0 text-sm sm:text-base" />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-10 sm:h-12 bg-brand-orange hover:bg-brand-orange-400 text-white font-medium rounded-lg text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </div>
                  ) : (
                    "Send Recovery Link"
                  )}
                </Button>
              </form> : <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-sm text-green-700 font-medium">
                  Recovery link sent successfully! Please check your email for further instructions.
                </AlertDescription>
              </Alert>}
            
            <div className="text-center mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToLogin}
                className="flex items-center justify-center mx-auto text-brand-orange hover:text-brand-orange-400 hover:bg-transparent text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </div>;
}