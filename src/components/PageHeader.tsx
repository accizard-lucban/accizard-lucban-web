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
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { Bell } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { SUPER_ADMIN_EMAIL } from "@/lib/utils";

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
  const { userRole, loading: roleLoading } = useUserRole();

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if (userRole && !roleLoading) {
      setUser({
        name: userRole.name || "",
        role: userRole.position || "",
        avatarUrl: userRole.profilePicture || "/accizard-uploads/login-signup-cover.png"
      });
    }
  }, [userRole, roleLoading]);

  useEffect(() => {
    async function fetchNotifications() {
      setNotifLoading(true);
      // Fetch latest 3 reports
      const reportsSnap = await getDocs(query(collection(db, "reports"), orderBy("createdAt", "desc"), limit(3)));
      const reports = reportsSnap.docs.map(doc => ({
        type: "report",
        id: doc.id,
        ...doc.data()
      }));
      // Fetch latest 3 users
      const usersSnap = await getDocs(query(collection(db, "users"), orderBy("createdDate", "desc"), limit(3)));
      const users = usersSnap.docs.map(doc => ({
        type: "user",
        id: doc.id,
        ...doc.data()
      }));
      // Fetch latest 3 chat notifications (mocked as 'chats' collection)
      let chats: any[] = [];
      try {
        const chatsSnap = await getDocs(query(collection(db, "chats"), orderBy("createdAt", "desc"), limit(3)));
        chats = chatsSnap.docs.map(doc => ({
          type: "chat",
          id: doc.id,
          ...doc.data()
        }));
      } catch {}
      setNotifications([
        ...reports,
        ...users,
        ...chats
      ].sort((a, b) => {
        // Sort by createdAt/createdDate desc
        const aDate = a.createdAt || a.createdDate || 0;
        const bDate = b.createdAt || b.createdDate || 0;
        return bDate > aDate ? 1 : bDate < aDate ? -1 : 0;
      }));
      setNotifLoading(false);
    }
    fetchNotifications();
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

        <div className="flex items-center gap-4">
          {/* Notifications Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none">
                <Bell className="h-6 w-6 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500"></span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-w-xs">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifLoading ? (
                <div className="p-4 text-center text-gray-500 text-sm">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">No notifications</div>
              ) : (
                notifications.slice(0, 9).map((notif, i) => (
                  <DropdownMenuItem key={notif.type + notif.id + i} className="flex flex-col items-start gap-1 py-2">
                    {notif.type === "report" && (
                      <>
                        <span className="font-medium text-orange-600">New Report Submitted</span>
                        <span className="text-xs text-gray-700 truncate w-full">{notif.title || notif.description || notif.type}</span>
                        <span className="text-xs text-gray-400">{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}</span>
                      </>
                    )}
                    {notif.type === "user" && (
                      <>
                        <span className="font-medium text-blue-600">New User Registered</span>
                        <span className="text-xs text-gray-700 truncate w-full">{notif.fullName || notif.name || notif.username}</span>
                        <span className="text-xs text-gray-400">{notif.createdDate ? notif.createdDate : ""}</span>
                      </>
                    )}
                    {notif.type === "chat" && (
                      <>
                        <span className="font-medium text-green-600">New Chat Message</span>
                        <span className="text-xs text-gray-700 truncate w-full">{notif.message || notif.lastMessage || notif.type}</span>
                        <span className="text-xs text-gray-400">{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ""}</span>
                      </>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
              <div className="text-sm text-right">
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500">{user.role}</div>
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
    </div>
  );
}