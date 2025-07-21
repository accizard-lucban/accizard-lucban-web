
import { useState } from "react";
import { Send, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import accizardLogo from "@/../public/lovable-uploads/accizard-logo-svg.svg";
import accizardLogotype from "@/../public/lovable-uploads/accizard-logotype-svg.svg";
import accizardAppIcon from "@/../public/lovable-uploads/accizard-app-icon-white-text-svg.svg";

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
  profilePicture?: string; // Added profilePicture to the interface
}

interface ChatWindowProps {
  session: ChatSession | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSession: (session: ChatSession) => void;
}

export function ChatWindow({ session, isOpen, onClose, onUpdateSession }: ChatWindowProps) {
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !session) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: false, // Admin sending message
      timestamp: new Date(),
    };

    const updatedSession = {
      ...session,
      messages: [...session.messages, newMessage],
      lastMessage: inputMessage,
      lastActivity: new Date(),
      status: "active" as const
    };

    onUpdateSession(updatedSession);
    setInputMessage("");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "waiting": return "bg-yellow-500";
      case "resolved": return "bg-gray-400";
      default: return "bg-gray-400";
    }
  };

  if (!isOpen || !session) return null;

  const isNewChat = !session.messages || session.messages.length === 0;

  return (
    <div className="fixed left-[37rem] top-0 bottom-0 right-0 bg-white border-r border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {session.profilePicture ? (
              <img src={session.profilePicture} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">?</div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{session.customerName}</h3>
              <p className="text-sm text-gray-500">{session.customerEmail}</p>
            </div>
            <div className={`ml-2 w-3 h-3 rounded-full ${getStatusColor(session.status)}`} />
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages or Welcome */}
      {isNewChat ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <img src={accizardLogo} alt="Accizard Logo" className="w-32 h-32 mx-auto" />
          <img src={accizardLogotype} alt="Accizard Logotype" className="w-64 h-auto mx-auto" />
          <div className="text-center mt-2">
            <div className="text-gray-500 text-sm font-medium mb-2">Support Hours</div>
            <div className="text-gray-500 text-sm">Office: 8:00 AM - 5:00 PM &bull; Emergency: 24/7</div>
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {session.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.isUser
                      ? "bg-gray-100 text-gray-900"
                      : "bg-red-600 text-white"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.isUser ? "text-gray-500" : "text-red-100"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your response..."
            className="flex-1"
            disabled={isNewChat}
          />
          <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700" disabled={isNewChat}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
