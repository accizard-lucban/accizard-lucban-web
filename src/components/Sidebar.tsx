import { Home, FileText, BarChart3, MessageSquare, Bell, Users, User, ChevronLeft, ClipboardList, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

const menuItems = [{
  title: "Dashboard",
  icon: Home,
  path: "/"
}, {
  title: "Manage Reports",
  icon: ClipboardList,
  path: "/manage-reports",
  badge: "3"
}, {
  title: "Risk and Utility Map",
  icon: BarChart3,
  path: "/risk-map"
}, {
  title: "Chat Support",
  icon: MessageSquare,
  path: "/chat-support"
}, {
  title: "Announcements",
  icon: Bell,
  path: "/announcements"
}, {
  title: "Manage Users",
  icon: Users,
  path: "/manage-users",
  badge: "5"
}];

const otherItems = [{
  title: "My Profile",
  icon: User,
  path: "/profile"
}];

export function Sidebar({ isCollapsed, onCollapse }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (item: typeof menuItems[0]) => {
    navigate(item.path);
  };

  const handleSignOut = () => {
    navigate("/login");
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return <div className={cn("bg-gradient-to-b from-orange-500 to-red-600 text-white transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-50", isCollapsed ? "w-16" : "w-64")}>
      {/* Header */}
      <div className="p-4 border-b border-orange-400/30 flex items-center justify-between">
        {!isCollapsed && <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent">
              <img alt="ACCIZARD" className="w-8 h-8" src="/lovable-uploads/eec8f7ad-8565-42b0-8c5d-c8244ea20e43.png" />
            </div>
            <div>
            <img alt="ACCIZARD" className="h-8" src="/lovable-uploads/accizard-logotype-png.png" />
            </div>
          </div>}
        <button onClick={() => onCollapse(!isCollapsed)} className="p-2 hover:bg-orange-400/20 rounded-lg transition-colors">
          <ChevronLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
        </button>
      </div>

      {/* Menu */}
      <div className="flex-1 py-6 overflow-y-auto">
        <div className="px-3">
          {!isCollapsed && <div className="text-xs font-semibold text-orange-100 uppercase tracking-wider mb-4 px-3">
              MENU
            </div>}
          <nav className="space-y-2">
            {menuItems.map(item => <button key={item.title} onClick={() => handleMenuClick(item)} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200", isActive(item.path) ? "bg-white text-orange-600 shadow-lg" : "text-orange-100 hover:bg-orange-400/20 hover:text-white")}>
                <div className="flex items-center">
                  <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </div>
                {!isCollapsed && item.badge && <Badge className="text-[#FF4F0B] text-xs border-0 bg-slate-50">
                    {item.badge}
                  </Badge>}
              </button>)}
          </nav>
        </div>

        <div className="px-3 mt-8">
          {!isCollapsed && <div className="text-xs font-semibold text-orange-100 uppercase tracking-wider mb-4 px-3">
              OTHERS
            </div>}
          <nav className="space-y-2">
            {otherItems.map(item => <button key={item.title} onClick={() => navigate(item.path)} className={cn("w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200", isActive(item.path) ? "bg-white text-orange-600 shadow-lg" : "text-orange-100 hover:bg-orange-400/20 hover:text-white")}>
                <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                {!isCollapsed && <span>{item.title}</span>}
              </button>)}
          </nav>
        </div>
      </div>

      {/* Sign Out Button */}
      <div className="p-3 border-t border-orange-400/30">
        <button onClick={handleSignOut} className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-orange-100 hover:bg-red-500 hover:text-white">
          <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>;
}