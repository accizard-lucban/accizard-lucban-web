import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Trash2, MessageSquare, Clock, User, Paperclip, Image, FileText, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Layout } from "./Layout";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import accizardLogo from "@/../public/lovable-uploads/accizard-logo-svg.svg";
import accizardLogotype from "@/../public/lovable-uploads/accizard-logotype-svg.svg";

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
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [chatSessions, setChatSessions] = useState<any[]>([]); // users with started chats
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []);

  // Filter users for search results (exclude those already in chatSessions)
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const alreadyInChat = chatSessions.some(cs => cs.id === user.id);
    return (
      !alreadyInChat &&
      (
        (user.userId && user.userId.toLowerCase().includes(term)) ||
        (user.fullName && user.fullName.toLowerCase().includes(term)) ||
        (user.mobileNumber && user.mobileNumber.toLowerCase().includes(term)) ||
        (user.barangay && user.barangay.toLowerCase().includes(term)) ||
        (user.cityTown && user.cityTown.toLowerCase().includes(term)) ||
        (user.province && user.province.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term))
      )
    );
  });

  // Handler to start a chat with a user
  const handleStartChat = (user: any) => {
    const sessionWithMessages = { ...user, messages: user.messages || [] };
    setChatSessions(prev => [...prev, sessionWithMessages]);
    setSelectedSession(sessionWithMessages);
  };

  // Handler to select a chat session
  const handleSelectSession = (user: any) => {
    setSelectedSession(user);
  };

  const activeSessions = users.filter(user => user.status === "active");
  const totalUnreadCount = users.reduce((sum, user) => sum + user.unreadCount, 0);

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

  // Helper to go to ManageUsersPage.tsx > Residents tab with search
  const goToResidentProfile = (user) => {
    const searchValue = `${user.fullName || user.name || ''}`.trim();
    navigate("/manage-users", { state: { tab: "residents", search: searchValue } });
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
                {/* Chat Sessions */}
                <div className="space-y-2 border-b pb-2">
                  {chatSessions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No active chat sessions.</div>
                  ) : (
                    chatSessions.map(user => (
                      <div
                        key={user.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedSession?.id === user.id ? 'bg-orange-50 border-orange-200' : ''}`}
                        onClick={e => { if (e.target === e.currentTarget) handleSelectSession(user); }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center min-w-0 gap-2">
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); goToResidentProfile(user); }}
                              className="focus:outline-none"
                              title="View Resident Profile"
                            >
                              {user.profilePicture ? (
                                <img src={user.profilePicture} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">?</div>
                              )}
                            </button>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">{user.fullName || user.name || user.userId}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{user.userId}</p>
                              <p className="text-xs text-gray-500 mt-1">{user.mobileNumber}</p>
                              <p className="text-xs text-gray-500 mt-1">{user.barangay}, {user.cityTown}{user.province ? `, ${user.province}` : ''}</p>
                              <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" onClick={e => { e.stopPropagation(); setChatSessions(prev => prev.filter(cs => cs.id !== user.id)); if (selectedSession?.id === user.id) setSelectedSession(null); }} title="Delete Chat Session">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Search Results */}
                {searchTerm && (
                  <div className="space-y-2 pt-2">
                    <div className="px-4 pb-2 text-xs text-gray-500 font-semibold">Search Results</div>
                    {loadingUsers ? (
                      <div className="p-4 text-center text-gray-500">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No users found.</div>
                    ) : (
                      filteredUsers.map(user => (
                        <div
                          key={user.id}
                          className="p-4 border-b flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {user.profilePicture ? (
                              <img src={user.profilePicture} alt="Profile" className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">?</div>
                            )}
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">{user.fullName || user.name || user.userId}</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{user.userId}</p>
                              <p className="text-xs text-gray-500 mt-1">{user.mobileNumber}</p>
                              <p className="text-xs text-gray-500 mt-1">{user.barangay}, {user.cityTown}{user.province ? `, ${user.province}` : ''}</p>
                              <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                            </div>
                          </div>
                          <Button size="sm" className="bg-[#FF4F0B] text-white" onClick={() => handleStartChat(user)}>
                            Start Chat
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                )}
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
                      <button
                        type="button"
                        onClick={() => goToResidentProfile(selectedSession)}
                        className="focus:outline-none"
                        title="View Resident Profile"
                      >
                        {selectedSession.profilePicture ? (
                          <img src={selectedSession.profilePicture} alt="Profile" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">?</div>
                        )}
                      </button>
                      <div>
                        <CardTitle className="text-lg">{selectedSession.fullName || selectedSession.name || selectedSession.userId}</CardTitle>
                        <p className="text-sm text-gray-500">{selectedSession.mobileNumber}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-4">
                    {/* Introduction section at the top of every chat session */}
                    <div className="flex flex-col items-center justify-center gap-6 w-full mb-6">
                      <img src={accizardLogo} alt="Accizard Logo" className="w-32 h-32 mx-auto" />
                      <img src={accizardLogotype} alt="Accizard Logotype" className="w-64 h-auto mx-auto" />
                      <div className="text-center mt-2">
                        <div className="text-gray-500 text-sm font-medium mb-2">Support Hours</div>
                        <div className="text-gray-500 text-sm">Office: 8:00 AM - 5:00 PM &bull; Emergency: 24/7</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {/* The currentChat state is removed, so this loop will not render any messages.
                          If you want to display messages from the selectedSession, you would need
                          to manage a state for messages or fetch them from the database. */}
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