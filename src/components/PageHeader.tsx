import { Avatar } from "@/components/ui/avatar";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  icon
}: PageHeaderProps) {
  // User info state
  const [user, setUser] = useState({
    name: "",
    role: "",
    avatarUrl: ""
  });

  useEffect(() => {
    async function fetchUser() {
      const adminLoggedIn = localStorage.getItem("adminLoggedIn") === "true";
      if (adminLoggedIn) {
        const username = localStorage.getItem("adminUsername");
        if (username) {
          const q = query(collection(db, "admins"), where("username", "==", username));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            setUser({
              name: data.name || data.username || "Admin",
              role: data.position || "Admin",
              avatarUrl: data.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || data.username || "Admin")}&background=random`
            });
            return;
          }
        }
      } else {
        const authUser = getAuth().currentUser;
        if (authUser) {
          if (authUser.email === "accizardlucban@gmail.com") {
            const q = query(collection(db, "superAdmin"), where("email", "==", authUser.email));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              const data = querySnapshot.docs[0].data();
              setUser({
                name: data.fullName || data.username || "Super Admin",
                role: data.role || data.position || "Super Admin",
                avatarUrl: data.profilePicture || authUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName || data.username || "Super Admin")}&background=random`
              });
              return;
            }
          }
          setUser({
            name: authUser.displayName || authUser.email?.split("@")[0] || "Super Admin",
            role: "Super Admin",
            avatarUrl: authUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser.displayName || authUser.email?.split("@")[0] || "Super Admin")}&background=random`
          });
        }
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {icon && <div className="w-8 h-8 flex items-center justify-center text-orange-600">
            {icon}
          </div>}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
            
            <div className="text-sm text-right">
              <div className="font-medium text-gray-900">{user.name}</div>
              <div className="text-gray-500">{user.role}</div>
            </div>
            <Avatar className="h-8 w-8">
              <img src={user.avatarUrl} alt={user.name} onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
              }} />
            </Avatar>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}