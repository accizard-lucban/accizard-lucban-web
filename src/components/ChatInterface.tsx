import { useState } from "react";
import { Send, X, MessageSquare, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  lastActivity: Date;
  unreadCount: number;
  status: "active" | "waiting" | "resolved";
  messages: Message[];
}

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const mockSessions: ChatSession[] = [
  {
    id: "1",
    customerName: "John Smith",
    customerEmail: "john.smith@email.com",
    lastMessage: "I'm having trouble accessing my account",
    lastActivity: new Date(Date.now() - 5 * 60 * 1000),
    unreadCount: 2,
    status: "active",
    messages: [
      {
        id: "1",
        text: "Hello, I need help with my account",
        isUser: true,
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        id: "2",
        text: "Hello! I'd be happy to help you with your account. What specific issue are you experiencing?",
        isUser: false,
        timestamp: new Date(Date.now() - 8 * 60 * 1000),
      },
      {
        id: "3",
        text: "I'm having trouble accessing my account",
        isUser: true,
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
      },
    ],
  },
  {
    id: "2",
    customerName: "Sarah Johnson",
    customerEmail: "sarah.j@email.com",
    lastMessage: "Thank you for your help!",
    lastActivity: new Date(Date.now() - 15 * 60 * 1000),
    unreadCount: 0,
    status: "resolved",
    messages: [
      {
        id: "1",
        text: "I need to update my billing information",
        isUser: true,
        timestamp: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        id: "2",
        text: "I can help you with that. Please navigate to your account settings and look for the billing section.",
        isUser: false,
        timestamp: new Date(Date.now() - 18 * 60 * 1000),
      },
      {
        id: "3",
        text: "Thank you for your help!",
        isUser: true,
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
      },
    ],
  },
  {
    id: "3",
    customerName: "Mike Chen",
    customerEmail: "mike.chen@email.com",
    lastMessage: "Is there a mobile app available?",
    lastActivity: new Date(Date.now() - 30 * 60 * 1000),
    unreadCount: 1,
    status: "waiting",
    messages: [
      {
        id: "1",
        text: "Is there a mobile app available?",
        isUser: true,
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
      },
    ],
  },
];

export function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [sessions, setSessions] = useState<ChatSession[]>(mockSessions);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !selectedSession) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: false, // Admin sending message
      timestamp: new Date(),
    };

    setSessions(prev => prev.map(session => 
      session.id === selectedSession.id 
        ? { 
            ...session, 
            messages: [...session.messages, newMessage],
            lastMessage: inputMessage,
            lastActivity: new Date(),
            status: "active" as const
          }
        : session
    ));

    setSelectedSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMessage],
      lastMessage: inputMessage,
      lastActivity: new Date(),
      status: "active" as const
    } : null);

    setInputMessage("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastActivity = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "waiting": return "bg-yellow-500";
      case "resolved": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-64 top-0 bottom-0 w-96 bg-white border-r border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Sessions List Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-semibold">Chat Sessions</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                  selectedSession?.id === session.id
                    ? "bg-red-50 border border-red-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {session.customerName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session.customerEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
                    {session.unreadCount > 0 && (
                      <span className="bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {session.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mt-1 truncate">
                  {session.lastMessage}
                </p>
                
                <div className="flex items-center mt-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatLastActivity(session.lastActivity)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Selected Session Indicator */}
      {selectedSession && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedSession.customerName}
              </p>
              <p className="text-xs text-gray-500">Click to view full chat</p>
            </div>
            <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedSession.status)}`} />
          </div>
        </div>
      )}
    </div>
  );
}
