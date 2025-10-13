import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "@/components/ui/sonner";
import { SUPER_ADMIN_EMAIL } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    
    // Check if the email is the authorized super admin email
    if (email !== SUPER_ADMIN_EMAIL) {
      toast.error("Access denied. Password recovery is only available for authorized super admin accounts.");
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
      <div className="flex-1 bg-[url('/accizard-uploads/login-signup-cover.png')] bg-cover">
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
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required className="h-12 border-gray-300" />
                </div>
                <Button type="submit" className="w-full h-12 bg-brand-orange hover:bg-brand-orange-400 text-white font-medium rounded-lg">
                  Send Recovery Link
                </Button>
              </form> : <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-700 font-medium">
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
    </div>;
}