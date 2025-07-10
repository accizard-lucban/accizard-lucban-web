import { useState, useEffect } from "react";
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
import { db, auth } from "@/lib/firebase";
import { getAuth, updateProfile, updateEmail } from "firebase/auth";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { toast } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";

export function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "",
    position: "",
    idNumber: "",
    username: "",
    email: "",
    profilePicture: ""
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowConfirm(false);
    setSaving(true);
    try {
      const adminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
      if (adminLoggedIn) {
        // Update admin profile in Firestore by username
        const username = localStorage.getItem("adminUsername");
        if (username) {
          const q = query(collection(db, "admins"), where("username", "==", username));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const docRef = doc(db, "admins", querySnapshot.docs[0].id);
            await updateDoc(docRef, {
              name: profile.name,
              position: profile.position,
              idNumber: profile.idNumber,
              username: profile.username,
              email: profile.email,
              profilePicture: profile.profilePicture
            });
            toast.success("Profile updated successfully!");
          }
        }
      } else {
        // Super-admin: use Firebase Auth
        const user = getAuth().currentUser;
        if (user) {
          if (user.email === "accizardlucban@gmail.com") {
            // Update superAdmin profile in Firestore by email
            const q = query(collection(db, "superAdmin"), where("email", "==", user.email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const docRef = doc(db, "superAdmin", querySnapshot.docs[0].id);
              await updateDoc(docRef, {
                fullName: profile.name,
                position: profile.position,
                idNumber: profile.idNumber,
                username: profile.username,
                email: profile.email,
                profilePicture: profile.profilePicture
              });
              toast.success("Profile updated successfully!");
            }
          } else {
            // For other super-admins, update Firebase Auth profile (displayName, photoURL)
            await updateProfile(user, {
              displayName: profile.name,
              photoURL: profile.profilePicture
            });
            // Optionally update email
            if (profile.email && profile.email !== user.email) {
              await updateEmail(user, profile.email);
            }
            toast.success("Profile updated successfully!");
          }
        }
      }
    } catch (error) {
      toast.error("Failed to update profile.");
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
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

  useEffect(() => {
    async function fetchProfile() {
      // Check if admin or super-admin
      const adminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
      if (adminLoggedIn) {
        // Admin: get username from localStorage (set after login)
        const username = localStorage.getItem("adminUsername");
        if (username) {
          const q = query(collection(db, "admins"), where("username", "==", username));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            setProfile({
              name: data.name || "",
              position: data.position || "",
              idNumber: data.idNumber || "",
              username: data.username || "",
              email: data.email || "",
              profilePicture: data.profilePicture || ""
            });
          }
        }
      } else {
        // Super-admin: use Firebase Auth
        const user = getAuth().currentUser;
        if (user) {
          if (user.email === "accizardlucban@gmail.com") {
            // Fetch from superAdmin collection
            const q = query(collection(db, "superAdmin"), where("email", "==", user.email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const data = querySnapshot.docs[0].data();
              setProfile({
                name: data.fullName || "",
                position: data.position || "",
                idNumber: data.idNumber || "",
                username: data.username || "",
                email: data.email || user.email,
                profilePicture: data.profilePicture || user.photoURL || ""
              });
              return;
            }
          }
          // Fallback: use Firebase Auth
          setProfile({
            name: user.displayName || "",
            position: "Super Admin",
            idNumber: user.uid || "",
            username: user.email?.split("@")[0] || "",
            email: user.email || "",
            profilePicture: user.photoURL || ""
          });
        }
      }
    }
    fetchProfile();
  }, []);

  return <Layout>
        
      <div className="max-w-4xl mx-auto">

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-accizard-light">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#FF4F0B] data-[state=active]:text-white">Edit Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card>
              <CardContent className="p-6">
                <form onSubmit={e => { e.preventDefault(); setShowConfirm(true); }} className="space-y-6">
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
                  <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                    <AlertDialogTrigger asChild>
                      <Button type="submit" className="bg-accizard-primary hover:bg-accizard-primary/90 text-white bg-[FF4F0B] bg-[#ff4f0b]">
                        Save Changes
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Save</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to save these changes to your profile?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSaveProfile} disabled={saving}>Confirm</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>;
}