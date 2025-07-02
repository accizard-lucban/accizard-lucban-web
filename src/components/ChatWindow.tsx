
import { useState } from "react";
import { Send, User, X } from "lucide-react";
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

  return (
    <div className="fixed left-[37rem] top-0 bottom-0 right-0 bg-white border-r border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-gray-400" />
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

      {/* Messages */}
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

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your response..."
            className="flex-1"
          />
          <Button type="submit" size="sm" className="bg-red-600 hover:bg-red-700">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
