import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { PageHeader } from "./PageHeader";
import { useLocation } from "react-router-dom";
import { Home, ClipboardList, BarChart3, MessageSquare, Bell, Users, User, LucideIcon } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

interface PageConfig {
  title: string;
  subtitle: string;
  icon?: LucideIcon;
}

// Map of routes to their corresponding page titles and icons
const pageConfig: Record<string, PageConfig> = {
  "/": {
    title: "Dashboard",
    icon: Home,
    subtitle: "Overview of your system"
  },
  "/manage-reports": {
    title: "Manage Reports",
    icon: ClipboardList,
    subtitle: "View and manage accident reports"
  },
  "/risk-map": {
    title: "Risk and Utility Map",
    icon: BarChart3,
    subtitle: "Analyze risk areas and utilities"
  },
  "/chat-support": {
    title: "Chat Support",
    icon: MessageSquare,
    subtitle: "Communicate with users"
  },
  "/announcements": {
    title: "Announcements",
    icon: Bell,
    subtitle: "Manage system announcements"
  },
  "/manage-users": {
    title: "Manage Users",
    icon: Users,
    subtitle: "View and manage system users"
  },
  "/profile": {
    title: "My Profile",
    icon: User,
    subtitle: "Manage your account settings"
  }
};

export function Layout({ children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const currentPage = pageConfig[location.pathname] || {
    title: "404",
    subtitle: "Page not found"
  };

  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      <Sidebar isCollapsed={isCollapsed} onCollapse={setIsCollapsed} />
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? "ml-16" : "ml-64"}`}>
        <PageHeader
          title={currentPage.title}
          subtitle={currentPage.subtitle}
          icon={currentPage.icon && <currentPage.icon className="h-6 w-6" />}
        />
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
