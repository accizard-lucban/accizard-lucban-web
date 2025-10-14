import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Search, Trash2, MessageSquare, Clock, User, Paperclip, Image, FileText, Send, Check, CheckCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Layout } from "./Layout";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, setDoc, writeBatch } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

interface ChatMessage {
  id: string;
  message?: string;  // Web app field
  content?: string;  // Mobile app field
  senderId: string;
  senderName: string;
  timestamp: any;
  userId?: string;   // Web app field (camelCase)
  userID?: string;   // Mobile app field (PascalCase)
  userName?: string;
  isRead?: boolean;
  imageUrl?: string; // For image attachments
  profilePictureUrl?: string; // For user profile pictures
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [chatSessions, setChatSessions] = useState<any[]>([]); // users with active chats
  const [loadingChatSessions, setLoadingChatSessions] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  // Fetch all users for search
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

  // Real-time listener for chat sessions (from chats collection)
  useEffect(() => {
    setLoadingChatSessions(true);
    try {
      const chatsRef = collection(db, "chats");
      const unsubscribe = onSnapshot(chatsRef, async (snapshot) => {
        const sessionsData = await Promise.all(snapshot.docs.map(async doc => {
          const data = doc.data();
          
          // Try to fetch user profile picture from users collection if not in chat data
          let profilePicture = data.profilePicture;
          if (!profilePicture && data.userId) {
            try {
              const userQuery = query(
                collection(db, "users"),
                where("firebaseUid", "==", data.userId)
              );
              const userSnapshot = await getDocs(userQuery);
              if (!userSnapshot.empty) {
                const userData = userSnapshot.docs[0].data();
                profilePicture = userData.profilePicture;
              }
            } catch (error) {
              console.error("Error fetching user profile picture:", error);
            }
          }
          
          return {
            id: doc.id,
            userId: data.userId || doc.id,
            userName: data.userName || "Unknown User",
            userEmail: data.userEmail || "",
            fullName: data.userName || "Unknown User",
            lastMessage: data.lastMessage || "",
            lastMessageTime: data.lastMessageTime,
            lastAccessTime: data.lastAccessTime,
            createdAt: data.createdAt,
            profilePicture: profilePicture,
            ...data
          };
        }));
        
        // Sort by most recent activity
        sessionsData.sort((a, b) => {
          const timeA = a.lastMessageTime?.toDate?.() || a.lastAccessTime?.toDate?.() || new Date(0);
          const timeB = b.lastMessageTime?.toDate?.() || b.lastAccessTime?.toDate?.() || new Date(0);
          return timeB.getTime() - timeA.getTime();
        });
        
        setChatSessions(sessionsData);
        setLoadingChatSessions(false);
      }, (error) => {
        console.error("Error loading chat sessions:", error);
        setLoadingChatSessions(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up chat sessions listener:", error);
      setLoadingChatSessions(false);
    }
  }, []);

  // Real-time listener for unread message counts
  useEffect(() => {
    try {
      const messagesRef = collection(db, "chat_messages");
      const q = query(messagesRef, where("isRead", "==", false));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const counts: Record<string, number> = {};
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          const userId = data.userId;
          // Only count messages from users (not admin messages)
          if (userId && data.senderId === userId) {
            counts[userId] = (counts[userId] || 0) + 1;
          }
        });
        
        setUnreadCounts(counts);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up unread counts listener:", error);
    }
  }, []);

  // Mark messages as read
  const markMessagesAsRead = async (messagesToMark: ChatMessage[]) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Filter messages that are from the user (not admin) and not already read
      const unreadMessages = messagesToMark.filter(
        msg => msg.senderId === selectedSession?.userId && !msg.isRead
      );

      if (unreadMessages.length === 0) return;

      // Use batch write for better performance
      const batch = writeBatch(db);
      
      unreadMessages.forEach(msg => {
        const msgRef = doc(db, "chat_messages", msg.id);
        batch.update(msgRef, { isRead: true });
      });

      await batch.commit();
      console.log(`✅ Marked ${unreadMessages.length} messages as read`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Real-time listener for messages when a session is selected
  useEffect(() => {
    if (!selectedSession?.userId) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    
    try {
      const messagesRef = collection(db, "chat_messages");
      
      // Query with userId and orderBy timestamp (Firestore index enabled)
      const q = query(
        messagesRef,
        where("userId", "==", selectedSession.userId),
        orderBy("timestamp", "asc")
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log("📨 Raw snapshot data:", snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
        
        const messagesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChatMessage[];
        
        console.log("💬 Processed messages:", messagesData);
        setMessages(messagesData);
        setLoadingMessages(false);
        
        // Mark messages as read after loading
        markMessagesAsRead(messagesData);
        
        // Scroll to bottom after messages load
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }, (error) => {
        console.error("Error loading messages:", error);
        setLoadingMessages(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("❌ Error setting up messages listener:", error);
      setLoadingMessages(false);
    }
  }, [selectedSession?.userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  // Handler to start a chat with a user (creates a new chat session)
  const handleStartChat = async (user: any) => {
    setStartingChat(user.id);
    try {
      // Check if chat already exists
      const existingChat = chatSessions.find(cs => cs.userId === user.firebaseUid || cs.id === user.id);
      if (existingChat) {
        setSelectedSession(existingChat);
        setStartingChat(null);
        return;
      }

      // Create new chat session in chats collection
      const chatRef = doc(db, "chats", user.firebaseUid || user.id);
      await setDoc(chatRef, {
        userId: user.firebaseUid || user.id,
        userName: user.fullName || user.name || "Unknown User",
        userEmail: user.email || "",
        createdAt: serverTimestamp(),
        lastAccessTime: serverTimestamp()
      }, { merge: true });

      setSelectedSession({
        id: user.firebaseUid || user.id,
        userId: user.firebaseUid || user.id,
        fullName: user.fullName || user.name || "Unknown User",
        ...user
      });
      toast.success("Chat session started");
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat session");
    } finally {
      setStartingChat(null);
    }
  };

  // Handler to select a chat session
  const handleSelectSession = (session: any) => {
    setSelectedSession(session);
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

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedSession || sendingMessage) {
      return;
    }

    setSendingMessage(true);
    try {
      const currentUser = auth.currentUser;
      const adminName = currentUser?.displayName || currentUser?.email?.split('@')[0] || "Admin";
      const adminId = currentUser?.uid || "admin";

      // Add message to chat_messages collection
      await addDoc(collection(db, "chat_messages"), {
        userId: selectedSession.userId,
        senderId: adminId,
        senderName: adminName,
        message: message.trim(),
        timestamp: serverTimestamp(),
        isRead: false
      });

      // Update or create chat metadata in chats collection
      const chatRef = doc(db, "chats", selectedSession.userId);
      await setDoc(chatRef, {
        userId: selectedSession.userId,
        userName: selectedSession.fullName || selectedSession.userName || "Unknown User",
        userEmail: selectedSession.userEmail || selectedSession.email || "",
        lastMessage: message.trim(),
        lastMessageTime: serverTimestamp(),
        lastMessageSenderName: adminName,
        lastAccessTime: serverTimestamp()
      }, { merge: true });

      setMessage("");
      toast.success("Message sent");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
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
                {/* Conditional rendering: Show search results OR chat sessions, not both */}
                {searchTerm ? (
                  // Search Results (shown when searching)
                  <div className="space-y-2">
                    <div className="px-4 pt-4 pb-2 text-xs text-gray-500 font-semibold">Search Results</div>
                    {loadingUsers ? (
                      <div className="p-8 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
                        <p className="text-sm text-gray-500">Loading users...</p>
                      </div>
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
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-400" />
                              </div>
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
                          <Button 
                            size="sm" 
                            className="bg-brand-orange hover:bg-brand-orange-400 text-white disabled:opacity-50" 
                            onClick={() => handleStartChat(user)}
                            disabled={startingChat === user.id}
                          >
                            {startingChat === user.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Starting...
                              </>
                            ) : (
                              'Start Chat'
                            )}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Chat Sessions (shown when not searching)
                  <div className="space-y-2">
                    {loadingChatSessions ? (
                      <div className="p-8 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
                        <p className="text-sm text-gray-500">Loading chat sessions...</p>
                      </div>
                    ) : chatSessions.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No active chat sessions.</div>
                    ) : (
                      chatSessions.map(user => (
                        <div
                          key={user.id}
                          className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedSession?.id === user.id ? 'bg-orange-50 border-l-4 border-l-brand-orange' : ''}`}
                          onClick={() => handleSelectSession(user)}
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
                                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-400" />
                                  </div>
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-sm truncate">{user.fullName || user.userName || user.name || user.userId}</span>
                                  {/* Unread count badge */}
                                  {unreadCounts[user.userId] > 0 && (
                                    <Badge className="bg-brand-orange hover:bg-brand-orange-400 text-white text-xs px-2 py-0 h-5">
                                      {unreadCounts[user.userId]}
                                    </Badge>
                                  )}
                                </div>
                                {user.lastMessage && (
                                  <p className="text-xs text-gray-600 mt-1 truncate font-medium">
                                    {user.lastMessageSenderName ? `${user.lastMessageSenderName}: ` : ''}{user.lastMessage}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1 truncate">{user.userEmail || user.email}</p>
                                {user.lastMessageTime && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatTime(
                                      user.lastMessageTime?.toDate?.() || 
                                      (user.lastMessageTime instanceof Date ? user.lastMessageTime : new Date(user.lastMessageTime))
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button size="icon" variant="ghost" className="text-brand-red hover:text-brand-red-700" onClick={e => { e.stopPropagation(); setChatSessions(prev => prev.filter(cs => cs.id !== user.id)); if (selectedSession?.id === user.id) setSelectedSession(null); }} title="Delete Chat Session">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                          <img 
                            src={selectedSession.profilePicture} 
                            alt={selectedSession.fullName || selectedSession.name || selectedSession.userId} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </button>
                      <div>
                        <CardTitle className="text-lg">{selectedSession.fullName || selectedSession.name || selectedSession.userId}</CardTitle>
                        <p className="text-sm text-gray-500">{selectedSession.mobileNumber}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto p-4 bg-gray-50">
                    {/* Introduction section at the top of every chat session */}
                    <div className="flex flex-col items-center justify-center gap-6 w-full mb-6">
                      <img src="/accizard-uploads/accizard-logo-svg.svg" alt="Accizard Logo" className="w-32 h-32 mx-auto" />
                      <img src="/accizard-uploads/accizard-logotype-svg.svg" alt="Accizard Logotype" className="w-64 h-auto mx-auto" />
                      <div className="text-center mt-2">
                        <div className="text-gray-500 text-sm font-medium mb-2">Support Hours</div>
                        <div className="text-gray-500 text-sm">Office: 8:00 AM - 5:00 PM &bull; Emergency: 24/7</div>
                      </div>
                    </div>
                    
                    {/* Messages */}
                    <div className="space-y-4">
                      {loadingMessages ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
                          <p className="text-sm text-gray-500">Loading messages...</p>
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">No messages yet. Start the conversation!</div>
                      ) : (
                        messages.map((msg) => {
                          console.log("🔍 Rendering message:", msg);
                          console.log("Message content field:", msg.message);
                          
                          const isAdmin = msg.senderId !== selectedSession?.userId;
                          
                          // Handle different timestamp formats
                          let messageTime: Date;
                          if (msg.timestamp?.toDate && typeof msg.timestamp.toDate === 'function') {
                            // Firestore Timestamp
                            messageTime = msg.timestamp.toDate();
                          } else if (msg.timestamp instanceof Date) {
                            // Already a Date object
                            messageTime = msg.timestamp;
                          } else if (typeof msg.timestamp === 'number') {
                            // Unix timestamp (milliseconds)
                            messageTime = new Date(msg.timestamp);
                          } else if (typeof msg.timestamp === 'string') {
                            // ISO string
                            messageTime = new Date(msg.timestamp);
                          } else {
                            // Fallback: use a very old date to indicate missing timestamp
                            messageTime = new Date(0);
                          }
                          
                          return (
                            <div
                              key={msg.id}
                              className={`flex gap-2 ${isAdmin ? 'justify-end' : 'justify-start'}`}
                            >
                              {/* User profile picture (only for non-admin messages) */}
                              {!isAdmin && (
                                <div className="flex-shrink-0">
                                  {selectedSession.profilePicture ? (
                                    <img 
                                      src={selectedSession.profilePicture} 
                                      alt={msg.senderName || 'User'} 
                                      className="h-8 w-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                      <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                  isAdmin
                                    ? 'bg-brand-orange text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-semibold ${isAdmin ? 'text-orange-100' : 'text-gray-600'}`}>
                                    {msg.senderName || (msg as any).sender || (msg as any).from || 'Unknown'}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.message || (msg as any).text || (msg as any).content || (msg as any).body || '[No message content]'}
                                </p>
                                <div className={`flex items-center gap-1 mt-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                  <span className={`text-xs ${isAdmin ? 'text-orange-100' : 'text-gray-500'}`}>
                                    {messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {/* Read receipt indicator (only for user messages) */}
                                  {!isAdmin && (
                                    <span className="text-xs" title={msg.isRead ? 'Read' : 'Delivered'}>
                                      {msg.isRead ? (
                                        <CheckCheck className="h-3 w-3 text-brand-orange" />
                                      ) : (
                                        <Check className="h-3 w-3 text-gray-400" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </CardContent>
                  <div className="border-t p-4 bg-white rounded-b-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                        <Input
                          placeholder="Type your message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
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
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-brand-orange">
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
                        disabled={sendingMessage || !message.trim()}
                        className="bg-brand-orange hover:bg-brand-orange-400 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-brand-orange" />
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