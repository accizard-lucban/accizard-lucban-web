import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut, Camera } from "lucide-react";
import { Layout } from "./Layout";
import { PageHeader } from "./PageHeader";
import { useNavigate } from "react-router-dom";
export function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "John Admin",
    position: "System Administrator",
    idNumber: "ADM001",
    username: "admin",
    email: "admin@accizard.com",
    profilePicture: ""
  });
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Profile saved:", profile);
  };
  const handleSignOut = () => {
    console.log("Signing out...");
    navigate('/login');
  };
  const handleProfilePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        setProfile({
          ...profile,
          profilePicture: event.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };
  return <Layout>
        
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-end mb-6">
          <Button onClick={handleSignOut} variant="outline" className="flex items-center space-x-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-accizard-light">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#FF4F0B] data-[state=active]:text-white">Edit Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Profile Picture Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={profile.profilePicture} alt={profile.name} />
                        <AvatarFallback className="bg-slate-100 text-accizard-neutral text-lg ">
                          {profile.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <label htmlFor="profile-picture" className="absolute bottom-0 right-0 bg-[#FF4F0B] hover:bg-[#FF4F0B]/90 text-white p-2 rounded-full cursor-pointer">
                        <Camera className="h-4 w-4" />
                        <input id="profile-picture" type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-accizard-neutral">{profile.name}</h3>
                      <p className="text-accizard-neutral/70">{profile.position}</p>
                      <p className="text-sm text-accizard-neutral/60">ID: {profile.idNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-accizard-neutral">Full Name</Label>
                      <Input id="name" value={profile.name} onChange={e => setProfile({
                      ...profile,
                      name: e.target.value
                    })} className="focus:border-accizard-primary focus:ring-accizard-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position" className="text-accizard-neutral">Position</Label>
                      <Input id="position" value={profile.position} onChange={e => setProfile({
                      ...profile,
                      position: e.target.value
                    })} className="focus:border-accizard-primary focus:ring-accizard-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idNumber" className="text-accizard-neutral">ID Number</Label>
                      <Input id="idNumber" value={profile.idNumber} onChange={e => setProfile({
                      ...profile,
                      idNumber: e.target.value
                    })} className="focus:border-accizard-primary focus:ring-accizard-primary" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-accizard-neutral">Username</Label>
                      <Input id="username" value={profile.username} onChange={e => setProfile({
                      ...profile,
                      username: e.target.value
                    })} className="focus:border-accizard-primary focus:ring-accizard-primary" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="email" className="text-accizard-neutral">Email</Label>
                      <Input id="email" type="email" value={profile.email} onChange={e => setProfile({
                      ...profile,
                      email: e.target.value
                    })} className="focus:border-accizard-primary focus:ring-accizard-primary" />
                    </div>
                  </div>
                  <Button type="submit" className="bg-accizard-primary hover:bg-accizard-primary/90 text-white bg-[FF4F0B] bg-[#ff4f0b]">
                    Save Changes
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>;
}