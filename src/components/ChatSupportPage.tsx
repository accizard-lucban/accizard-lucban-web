import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Trash2, MessageSquare, Clock, User, Paperclip, Image, FileText, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Layout } from "./Layout";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ChatSession {
  id: string;
  customerName: string;
  customerPhone: string;
  lastMessage: string;
  lastActivity: Date;
  unreadCount: number;
  status: "active" | "waiting" | "resolved";
}

export function ChatSupportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatSessions] = useState<ChatSession[]>([{
    id: "1",
    customerName: "Maria Santos",
    customerPhone: "09123456789",
    lastMessage: "I need help with my emergency report",
    lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    unreadCount: 2,
    status: "active"
  }, {
    id: "2",
    customerName: "Juan Dela Cruz",
    customerPhone: "09123456789",
    lastMessage: "Thank you for your assistance",
    lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    unreadCount: 0,
    status: "resolved"
  }, {
    id: "3",
    customerName: "Ana Rodriguez",
    customerPhone: "09123456789",
    lastMessage: "Is anyone available to help?",
    lastActivity: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    unreadCount: 3,
    status: "waiting"
  }]);

  const [currentChat] = useState([{
    id: "1",
    text: "Hello, I need help with my emergency report",
    isUser: true,
    timestamp: new Date() 
  }, {
    id: "2",
    text: "Hi! I'd be happy to help you with your report. What specific issue are you experiencing?",
    isUser: false,
    timestamp: new Date()
  }, {
    id: "3",
    text: "I submitted a report but haven't received any confirmation",
    isUser: true,
    timestamp: new Date()
  }]);

  const filteredSessions = chatSessions.filter(session => 
    session.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    session.customerPhone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSessions = chatSessions.filter(session => session.status === "active");
  const totalUnreadCount = chatSessions.reduce((sum, session) => sum + session.unreadCount, 0);

  const handleDeleteSession = (sessionId: string) => {
    console.log("Deleting chat session:", sessionId);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Handle file upload logic here
      console.log("Files selected:", files);
    }
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle send message logic here
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <Layout>
      <div className="">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Sessions List */}
          <div className="lg:col-span-1">
            <Card className="border-none shadow-md">
              <CardHeader className="border-b bg-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>Chat Sessions</CardTitle>
                  </div>

                </div>
                <div className="relative pt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 w-full border-gray-200"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2">
                  {filteredSessions.map(session => (
                    <div
                      key={session.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedSession?.id === session.id ? 'bg-orange-50 border-orange-200' : ''
                      }`}
                      onClick={() => setSelectedSession(session)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-[#FF4F0B]" />
                            <span className="font-medium text-sm">{session.customerName}</span>
                            {session.unreadCount > 0 && (
                              <Badge className="bg-red-500 text-white text-xs">
                                {session.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{session.customerPhone}</p>
                          <p className="text-sm text-gray-700 mt-2 truncate">{session.lastMessage}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{formatTime(session.lastActivity)}</span>
                            </div>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this chat session with {session.customerName}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSession(session.id)} className="bg-red-600 hover:bg-red-700">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-8rem)] flex flex-col border-none shadow-md">
              {selectedSession ? (
                <>
                  <CardHeader className="border-b bg-white rounded-t-lg">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-[#FF4F0B]" />
                      <div>
                        <CardTitle className="text-lg">{selectedSession.customerName}</CardTitle>
                          <p className="text-sm text-gray-500">{selectedSession.customerPhone}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-4">
                    <div className="space-y-4">
                      {currentChat.map(message => (
                        <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.isUser ? 'bg-[#FF4F0B] text-white' : 'bg-gray-100 text-gray-800'
                          }`}>
                            <p className="text-sm">{message.text}</p>
                            <p className={`text-xs ${message.isUser ? 'text-orange-100' : 'text-gray-500'}`}>
                              {message.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <div className="border-t p-4 bg-white rounded-b-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                        <Input
                          placeholder="Type your message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          multiple
                        />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-[#FF4F0B]">
                              <Paperclip className="h-5 w-5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="align-end">
                            <div className="space-y-2">
                              
                              <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Add Attachment
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        className="bg-[#FF4F0B] hover:bg-[#FF4F0B]/90 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[#FF4F0B]" />
                    <p className="text-lg font-medium">Select a chat session</p>
                    <p className="text-sm">Choose a conversation from the list to start chatting</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}