import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { PageHeader } from "./PageHeader";
import { useLocation } from "react-router-dom";
import { Home, ClipboardList, BarChart3, MessageSquare, Bell, Users, User, LucideIcon, Menu, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore";

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
  },
  "/system-logs": {
    title: "System Logs",
    icon: Activity,
    subtitle: "View system activity and logs"
  },
  "/dashboard": {
    title: "Dashboard",
    icon: Home,
    subtitle: "Overview of your system"
  }
};

export function Layout({ children }: LayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unseenReportsCount, setUnseenReportsCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const location = useLocation();
  const currentPage = pageConfig[location.pathname] || {
    title: "404",
    subtitle: "Page not found"
  };

  // Fetch and count unseen reports
  useEffect(() => {
    try {
      const reportsQuery = query(collection(db, "reports"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
        // Get viewed reports from localStorage
        const viewedReportsData = localStorage.getItem("viewedReports");
        const viewedReports = viewedReportsData ? new Set(JSON.parse(viewedReportsData)) : new Set();
        
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const unseenCount = snapshot.docs.filter(doc => {
          const data = doc.data();
          const reportId = data.reportId || doc.id;
          
          // Check if report has been viewed
          if (viewedReports.has(reportId)) {
            return false;
          }
          
          // Check if report is within last 24 hours
          try {
            const timestamp = data.timestamp;
            let reportDate;
            
            if (timestamp && typeof timestamp.toDate === "function") {
              reportDate = timestamp.toDate();
            } else if (timestamp instanceof Date) {
              reportDate = timestamp;
            } else if (typeof timestamp === "number") {
              reportDate = new Date(timestamp);
            } else if (typeof timestamp === "string") {
              reportDate = new Date(timestamp);
            }
            
            if (reportDate && !isNaN(reportDate.getTime())) {
              return reportDate >= oneDayAgo && reportDate <= now;
            }
          } catch (error) {
            console.error("Error parsing timestamp:", error);
          }
          
          return false;
        }).length;
        
        setUnseenReportsCount(unseenCount);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching unseen reports:", error);
    }
  }, []);

  // Fetch and count unread chat messages
  useEffect(() => {
    try {
      const messagesRef = collection(db, "chat_messages");
      const q = query(messagesRef, where("isRead", "==", false));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let totalUnread = 0;
        
        snapshot.docs.forEach(msgDoc => {
          const data = msgDoc.data();
          const userId = data.userId;
          // Only count messages from users (not admin messages)
          if (userId && data.senderId === userId) {
            totalUnread++;
          }
        });
        
        setUnreadChatCount(totalUnread);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching unread chat messages:", error);
    }
  }, []);

  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      <Sidebar 
        isCollapsed={isCollapsed} 
        onCollapse={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        manageReportsBadge={unseenReportsCount}
        chatSupportBadge={unreadChatCount}
      />
      
      {/* Mobile hamburger button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? "lg:ml-16" : "lg:ml-64"}`}>
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
