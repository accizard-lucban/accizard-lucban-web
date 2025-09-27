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
import { db, auth, storage } from "@/lib/firebase";
import { getAuth, updateProfile, updateEmail } from "firebase/auth";
import { collection, query, where, getDocs, doc, updateDoc, orderBy, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "@/components/ui/sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { SUPER_ADMIN_EMAIL } from "@/lib/utils";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ProfilePage() {
  const navigate = useNavigate();
  const { canViewEmail, userRole, loading: roleLoading } = useUserRole();
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
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

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
          if (user.email === SUPER_ADMIN_EMAIL) {
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
  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if userRole is available
      if (!userRole) {
        toast.error("User information not loaded. Please refresh the page and try again.");
        return;
      }

      try {
        console.log("Starting profile picture upload...");
        console.log("User role:", userRole);
        console.log("File details:", {
          name: file.name,
          size: file.size,
          type: file.type
        });

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File size must be less than 5MB");
          return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error("Please select an image file");
          return;
        }

        // Create a unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const filename = `profile-pictures-web/${userRole.id}-${timestamp}.${fileExtension}`;
        
        console.log("Uploading to path:", filename);
        console.log("Storage instance:", storage);

        // Upload to Firebase Storage
        const storageRef = ref(storage, filename);
        console.log("Storage reference created:", storageRef);
        
        const snapshot = await uploadBytes(storageRef, file);
        console.log("Upload completed:", snapshot);
        
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log("Download URL obtained:", downloadURL);

        // Update profile with the download URL
        setProfile({
          ...profile,
          profilePicture: downloadURL
        });

        toast.success("Profile picture uploaded successfully!");
      } catch (error: any) {
        console.error("Detailed error uploading profile picture:", error);
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        
        // Provide more specific error messages
        if (error.code === 'storage/unauthorized') {
          toast.error("You don't have permission to upload files. Please contact your administrator.");
        } else if (error.code === 'storage/canceled') {
          toast.error("Upload was canceled. Please try again.");
        } else if (error.code === 'storage/unknown') {
          toast.error("An unknown error occurred. Please check your internet connection and try again.");
        } else if (error.code === 'storage/invalid-format') {
          toast.error("Invalid file format. Please select a valid image file.");
        } else if (error.code === 'storage/object-not-found') {
          toast.error("Storage bucket not found. Please contact your administrator.");
        } else {
          toast.error(`Failed to upload profile picture: ${error.message || 'Unknown error'}`);
        }
      }
    }
  };

  useEffect(() => {
    if (userRole && !roleLoading) {
      setProfile({
        name: userRole.name || "",
        position: userRole.position || "",
        idNumber: userRole.idNumber || "",
        username: userRole.username || "",
        email: userRole.email || "",
        profilePicture: userRole.profilePicture || "/accizard-uploads/login-signup-cover.png"
      });
    }
  }, [userRole, roleLoading]);

  // Fetch personal activity logs
  useEffect(() => {
    async function fetchLogs() {
      if (!profile.username) return;
      setLogsLoading(true);
      const q = query(
        collection(db, "activityLogs"),
        where("username", "==", profile.username),
        orderBy("timestamp", "desc"),
        limit(10)
      );
      const snap = await getDocs(q);
      setActivityLogs(snap.docs.map(doc => doc.data()));
      setLogsLoading(false);
    }
    fetchLogs();
  }, [profile.username]);

  return <Layout>
        
      <div className="max-w-4xl mx-auto">

        <Tabs defaultValue="profile" className="w-full">
          
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
                    {canViewEmail() && (
                      <div className="space-y-2 col-span-2">
                        <Label htmlFor="email" className="text-accizard-neutral">Email</Label>
                        <Input id="email" type="email" value={profile.email} onChange={e => setProfile({
                        ...profile,
                        email: e.target.value
                      })} className="focus:border-accizard-primary focus:ring-accizard-primary" />
                      </div>
                    )}
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
            {/* Personal Activity Log Section */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Personal Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="text-center text-gray-500 py-8">Loading activity logs...</div>
                ) : activityLogs.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">No activity logs found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Timestamp</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityLogs.map((log, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{log.action}</TableCell>
                            <TableCell>{log.details || log.description || '-'}</TableCell>
                            <TableCell>{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>;
}