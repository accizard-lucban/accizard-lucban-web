# Admin Chat Implementation Guide

## Overview

The Admin Chat feature provides a centralized group chat communication channel for all web application administrators. This allows internal coordination, updates, and real-time communication between admins, super admins, and other administrative staff without involving residents.

### Key Features

- ✅ Real-time group messaging for all administrators
- ✅ File attachment support (images, videos, audio, documents)
- ✅ Read receipts and delivery status
- ✅ Chronological message ordering
- ✅ Sender identification with name and role
- ✅ Accessible to all web app users (all are administrators)
- ✅ Separate from resident support chat

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                        Web Application                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐           ┌──────────────────────────┐   │
│  │   Sidebar    │           │    AdminChatPage         │   │
│  │              │           │                          │   │
│  │ Chat Support │──────────▶│  • Real-time messaging   │   │
│  │   Dropdown   │           │  • File uploads          │   │
│  │              │           │  • Read receipts         │   │
│  │ • Resident   │           │  • Message history       │   │
│  │   Support    │           │                          │   │
│  │ • Admin Chat │           └────────────┬─────────────┘   │
│  └──────────────┘                        │                  │
│                                           │                  │
└───────────────────────────────────────────┼──────────────────┘
                                            │
                                            ▼
                                ┌───────────────────────┐
                                │  Firebase Firestore   │
                                ├───────────────────────┤
                                │                       │
                                │ admin_chat_messages   │
                                │   Collection          │
                                │                       │
                                │ • Real-time sync      │
                                │ • Timestamp ordering  │
                                │ • Message metadata    │
                                └───────────────────────┘
```

---

## File Structure

### New Files Created

```
src/
├── components/
│   └── AdminChatPage.tsx          # Main admin group chat component
└── ADMIN_CHAT_IMPLEMENTATION.md   # This documentation file
```

### Modified Files

```
src/
├── components/
│   └── Sidebar.tsx                # Added Chat Support dropdown
├── App.tsx                        # Added /admin-chat route
```

---

## Database Schema

### Firestore Collection: `admin_chat_messages`

Each document in the collection represents a single message in the admin group chat.

#### Document Structure

```typescript
{
  id: string;                    // Auto-generated document ID
  message: string;               // Message text content
  senderId: string;              // Firebase UID of sender
  senderName: string;            // Display name of sender
  senderRole?: string;           // Role of sender (e.g., "admin", "super_admin")
  timestamp: Timestamp;          // Server timestamp (Firestore Timestamp)
  isRead?: boolean;              // Read status (default: false)
  
  // Optional attachment fields
  imageUrl?: string;             // URL to uploaded image
  videoUrl?: string;             // URL to uploaded video
  audioUrl?: string;             // URL to uploaded audio
  fileUrl?: string;              // URL to uploaded file (non-media)
  fileName?: string;             // Original filename
  fileSize?: number;             // File size in bytes
  fileType?: string;             // MIME type
  profilePictureUrl?: string;    // Sender's profile picture
}
```

#### Sample Document

```json
{
  "id": "abc123xyz",
  "message": "Team meeting at 3 PM today",
  "senderId": "user123abc",
  "senderName": "John Doe",
  "senderRole": "super_admin",
  "timestamp": "2025-10-21T14:30:00.000Z",
  "isRead": false
}
```

#### Sample Document with Attachment

```json
{
  "id": "def456uvw",
  "message": "Report for review",
  "senderId": "user456def",
  "senderName": "Jane Smith",
  "senderRole": "admin",
  "timestamp": "2025-10-21T15:45:00.000Z",
  "isRead": true,
  "fileUrl": "https://storage.googleapis.com/.../report.pdf",
  "fileName": "monthly_report.pdf",
  "fileSize": 2048576,
  "fileType": "application/pdf"
}
```

### Firestore Indexes

**Required Composite Index:**

```
Collection: admin_chat_messages
Fields:
  - timestamp (Ascending)
```

This index enables efficient querying and real-time ordering of messages.

---

## Implementation Details

### 1. AdminChatPage Component

**Location:** `src/components/AdminChatPage.tsx`

#### Key Features

- **Real-time Messaging:** Uses Firestore `onSnapshot` for live updates
- **File Uploads:** Supports images, videos, audio, and documents
- **Message Ordering:** Client-side sorting ensures chronological display
- **Read Receipts:** Shows delivered/read status for messages
- **User Context:** Displays sender name and role for each message

#### Core Functions

```typescript
// Real-time listener for messages
useEffect(() => {
  const messagesRef = collection(db, "admin_chat_messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    // Process and sort messages
    // Mark messages as read
    // Update UI
  });
  
  return () => unsubscribe();
}, []);

// Send message with attachments
const handleSendMessage = async () => {
  // Upload attachments to Firebase Storage
  // Create message document(s) in Firestore
  // Clear input and attachments
};

// Mark messages as read
const markMessagesAsRead = async (messages) => {
  // Use batch write to update multiple documents
  // Only mark messages from other admins
};
```

#### State Management

```typescript
const [message, setMessage] = useState("");                    // Current message input
const [messages, setMessages] = useState<ChatMessage[]>([]);   // Message history
const [attachmentPreviews, setAttachmentPreviews] = useState<AttachmentPreview[]>([]); // File previews
const [sendingMessage, setSendingMessage] = useState(false);   // Send status
const [uploadingFile, setUploadingFile] = useState(false);     // Upload status
```

### 2. Sidebar Navigation

**Location:** `src/components/Sidebar.tsx`

#### Chat Support Dropdown

The Chat Support menu item has been converted to a dropdown with two options:

1. **Resident Support** (`/chat-support`)
   - Chat with residents/mobile app users
   - Manages multiple chat sessions
   - User search and filtering

2. **Admin Chat** (`/admin-chat`)
   - Internal admin communication
   - Single group chat room
   - No session management needed

#### Implementation

```typescript
// State for dropdown expansion
const [chatSupportExpanded, setChatSupportExpanded] = useState(false);

// Dropdown toggle logic
<button onClick={() => {
  if (isCollapsed && !isMobileOpen) {
    navigate("/chat-support");  // Direct navigation when collapsed
  } else {
    setChatSupportExpanded(!chatSupportExpanded);  // Toggle dropdown
  }
}}>
  Chat Support
</button>

// Dropdown menu
{chatSupportExpanded && (
  <div>
    <button onClick={() => navigate("/chat-support")}>
      Resident Support
    </button>
    <button onClick={() => navigate("/admin-chat")}>
      Admin Chat
    </button>
  </div>
)}
```

### 3. Routing

**Location:** `src/App.tsx`

#### Route Configuration

```typescript
// Lazy-loaded component
const AdminChatPage = lazy(() => 
  import("./components/AdminChatPage")
    .then(module => ({ default: module.AdminChatPage }))
);

// Route definition
<Route path="/admin-chat" element={<AdminChatPage />} />
```

The route is protected by the `PrivateRoute` wrapper, ensuring only authenticated users can access it.

---

## Access Control

### Current Implementation

**All authenticated web app users can access Admin Chat.**

#### Rationale

- The web application is exclusively for administrative staff
- All web app users are administrators (admins, super admins, etc.)
- Residents only use the mobile application
- Authentication layer provides sufficient security

#### Security Layers

1. **Route Protection:** `PrivateRoute` wrapper checks authentication
2. **Session Management:** `SessionManager` validates active sessions
3. **Firebase Auth:** Only authenticated users can read/write messages
4. **Firestore Rules:** Should be configured to allow authenticated users only

### Recommended Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin chat messages
    match /admin_chat_messages/{messageId} {
      // Allow read for all authenticated users
      allow read: if request.auth != null;
      
      // Allow write for authenticated users
      // Ensure senderId matches the authenticated user
      allow create: if request.auth != null 
                    && request.resource.data.senderId == request.auth.uid;
      
      // Allow update only for marking as read
      allow update: if request.auth != null 
                    && request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['isRead']);
      
      // Prevent deletion
      allow delete: if false;
    }
  }
}
```

---

## Message Flow

### Sending a Message

```
1. User types message and/or attaches files
   ↓
2. User clicks Send button
   ↓
3. Files are uploaded to Firebase Storage
   ↓
4. Message document created in Firestore
   │ • senderId: current user's UID
   │ • senderName: current user's display name
   │ • senderRole: current user's role
   │ • timestamp: serverTimestamp()
   │ • attachments: URLs from storage
   ↓
5. Firestore triggers real-time update
   ↓
6. All connected clients receive new message
   ↓
7. Messages are sorted chronologically
   ↓
8. UI updates with new message
```

### Receiving a Message

```
1. Another admin sends a message
   ↓
2. Firestore onSnapshot listener detects change
   ↓
3. New message added to local state
   ↓
4. Client-side sorting ensures proper order
   ↓
5. Auto-scroll to latest message
   ↓
6. Message marked as read (batch update)
   ↓
7. Sender sees read receipt update
```

---

## File Attachments

### Supported File Types

| Category   | Formats                     | MIME Types                          |
|------------|-----------------------------|------------------------------------|
| Images     | JPEG, PNG, GIF, WEBP        | `image/*`                          |
| Videos     | MP4, AVI, MOV, WMV          | `video/*`                          |
| Audio      | MP3, WAV, OGG, M4A          | `audio/*`                          |
| Documents  | PDF, DOC, DOCX              | `application/pdf`, `.doc`, `.docx` |

### Upload Process

1. **File Selection:** User selects files via popover menu
2. **Preview Generation:** Creates local preview with `URL.createObjectURL()`
3. **Upload:** Uses `uploadSingleFile()` from `useFileUpload` hook
4. **Storage Path:** `chat_attachments/admin_chat/{timestamp}_{filename}`
5. **Message Creation:** Stores download URL in message document

### File Message Fields

```typescript
{
  imageUrl?: string;    // For images - displays inline
  videoUrl?: string;    // For videos - shows video player
  audioUrl?: string;    // For audio - shows audio player
  fileUrl?: string;     // For documents - shows download link
  fileName?: string;    // Original filename for display
  fileSize?: number;    // Size in bytes for display
  fileType?: string;    // MIME type for proper handling
}
```

---

## UI Components

### Message Bubble

Messages are displayed with different styling based on sender:

- **Current User Messages:** Right-aligned, orange background
- **Other Admin Messages:** Left-aligned, white background with shadow

```tsx
<div className={`flex gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
  {/* Profile avatar for other admins */}
  {!isCurrentUser && <ProfileAvatar />}
  
  <div className={`flex flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
    {/* Attachment preview */}
    {msg.imageUrl && <ImagePreview />}
    {msg.videoUrl && <VideoPlayer />}
    {msg.audioUrl && <AudioPlayer />}
    {msg.fileUrl && <FileDownloadCard />}
    
    {/* Text message bubble */}
    <div className={`rounded-lg px-4 py-2 ${
      isCurrentUser 
        ? 'bg-brand-orange text-white' 
        : 'bg-white text-gray-800 shadow-sm'
    }`}>
      <div className="sender-info">
        {msg.senderName} {msg.senderRole && `(${msg.senderRole})`}
      </div>
      <div className="message-content">{msg.message}</div>
      <div className="timestamp-and-status">
        {formatTime(msg.timestamp)}
        {isCurrentUser && <ReadReceipt isRead={msg.isRead} />}
      </div>
    </div>
  </div>
</div>
```

### Input Area

```tsx
<div className="border-t p-4 bg-white">
  {/* Attachment previews */}
  {attachmentPreviews.length > 0 && <AttachmentPreviewList />}
  
  {/* Input and send button */}
  <div className="flex items-center space-x-2">
    <Input 
      placeholder="Type your message..."
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
    />
    
    {/* Attachment button with popover */}
    <Popover>
      <PopoverTrigger>
        <Paperclip />
      </PopoverTrigger>
      <PopoverContent>
        <AttachmentTypeSelector />
      </PopoverContent>
    </Popover>
    
    {/* Send button */}
    <Button onClick={handleSendMessage}>
      <Send />
    </Button>
  </div>
</div>
```

---

## Timestamp Handling

### Multiple Format Support

The implementation handles various timestamp formats from different sources:

```typescript
const getTimestamp = (msg: ChatMessage): number => {
  if (!msg.timestamp) return 0;
  
  // Firestore Timestamp
  if (msg.timestamp?.toDate && typeof msg.timestamp.toDate === 'function') {
    return msg.timestamp.toDate().getTime();
  }
  
  // JavaScript Date object
  if (msg.timestamp instanceof Date) {
    return msg.timestamp.getTime();
  }
  
  // Unix timestamp (milliseconds)
  if (typeof msg.timestamp === 'number') {
    return msg.timestamp;
  }
  
  // ISO string
  if (typeof msg.timestamp === 'string') {
    return new Date(msg.timestamp).getTime();
  }
  
  return 0; // Fallback
};
```

### Client-Side Sorting

Messages are sorted on the client to ensure proper ordering:

```typescript
messagesData.sort((a, b) => {
  const timeA = getTimestamp(a);
  const timeB = getTimestamp(b);
  return timeA - timeB; // Ascending (oldest first)
});
```

This handles cases where:
- Firestore's `orderBy` might not work correctly with `serverTimestamp()`
- Messages arrive out of order due to network latency
- Different timestamp formats cause ordering issues

---

## Performance Considerations

### Real-time Listeners

- **Single Collection Query:** Uses one `onSnapshot` listener for all messages
- **Ascending Order:** Messages are queried in chronological order
- **Automatic Updates:** Firestore handles incremental updates efficiently

### Batch Operations

- **Read Receipts:** Uses `writeBatch()` to mark multiple messages as read simultaneously
- **Limit:** Maximum 500 operations per batch (Firestore limit)

### Memory Management

- **Attachment Cleanup:** Revokes object URLs when attachments are removed
- **Listener Cleanup:** Unsubscribes from listeners on component unmount

```typescript
useEffect(() => {
  const unsubscribe = onSnapshot(q, callback);
  return () => unsubscribe(); // Cleanup on unmount
}, []);

// Cleanup attachment previews
const removeAttachment = (id: string) => {
  setAttachmentPreviews(prev => {
    const attachment = prev.find(a => a.id === id);
    if (attachment) {
      URL.revokeObjectURL(attachment.url); // Free memory
    }
    return prev.filter(a => a.id !== id);
  });
};
```

---

## Usage Guide

### For Administrators

#### Accessing Admin Chat

1. Log in to the web application
2. Click **"Chat Support"** in the sidebar
3. Select **"Admin Chat"** from the dropdown menu

#### Sending a Text Message

1. Type your message in the input field at the bottom
2. Press **Enter** or click the **Send** button
3. Your message appears on the right side (orange bubble)

#### Sending Files

1. Click the **paperclip icon** next to the message input
2. Choose the file type:
   - **Photos** (JPEG, PNG, GIF, WEBP)
   - **Documents** (PDF, DOC, DOCX)
   - **Videos** (MP4, AVI, MOV, WMV)
   - **Audio** (MP3, WAV, OGG, M4A)
3. Select file(s) from your device
4. Preview appears above the input field
5. Add optional text message
6. Click **Send**

#### Multiple Files

- You can attach multiple files to a single message
- Each file type has a color-coded preview icon
- Remove unwanted files by clicking the **X** button on the preview

#### Reading Messages

- Messages from other admins appear on the left side (white bubbles)
- Sender's name and role are displayed above each message
- Messages are automatically marked as read when you view them

#### Message Status

- **Single check mark:** Message delivered
- **Double check mark:** Message read by recipient(s)

---

## Troubleshooting

### Messages Not Appearing

**Issue:** Messages sent but not showing up in the chat

**Solutions:**
1. Check Firestore rules allow read/write access
2. Verify Firestore index for `admin_chat_messages` collection
3. Check browser console for errors
4. Verify internet connection
5. Refresh the page

### Files Not Uploading

**Issue:** File upload fails or hangs

**Solutions:**
1. Check file size (Firebase Storage limits)
2. Verify Firebase Storage rules allow uploads
3. Check internet connection speed
4. Try smaller files
5. Ensure supported file format

### Messages Out of Order

**Issue:** New messages appearing in wrong position

**Solutions:**
1. Client-side sorting should handle this automatically
2. Check timestamp values in Firestore console
3. Verify `serverTimestamp()` is being used
4. Clear browser cache and reload

### Read Receipts Not Updating

**Issue:** Messages not marked as read

**Solutions:**
1. Verify batch write permissions in Firestore rules
2. Check if `isRead` field update is allowed
3. Ensure user is authenticated
4. Check browser console for errors

---

## Future Enhancements

### Potential Features

1. **Typing Indicators**
   - Show when another admin is typing
   - Similar to resident chat implementation

2. **Message Reactions**
   - Add emoji reactions to messages
   - Useful for quick acknowledgments

3. **Message Editing**
   - Allow editing of sent messages
   - Show edit history/timestamp

4. **Message Deletion**
   - Allow users to delete their own messages
   - Optional: Admin ability to delete any message

5. **Message Search**
   - Search through message history
   - Filter by sender, date, or content

6. **Notifications**
   - Desktop notifications for new messages
   - Email notifications for important messages
   - Badge count in sidebar

7. **Direct Messages**
   - Private messages between specific admins
   - Create separate chat rooms

8. **Message Threading**
   - Reply to specific messages
   - Organize related conversations

9. **Rich Text Formatting**
   - Bold, italic, underline
   - Markdown support
   - Code blocks for technical discussions

10. **Voice/Video Calls**
    - Integrate WebRTC for real-time calls
    - Screen sharing for remote assistance

### Database Optimizations

1. **Message Pagination**
   - Load messages in chunks (e.g., 50 at a time)
   - Implement "Load More" button
   - Reduce initial load time

2. **Message Archiving**
   - Archive old messages (e.g., > 6 months)
   - Separate active and archived collections
   - Reduce query costs

3. **Caching Strategy**
   - Cache recent messages locally
   - Offline support with local storage
   - Sync when connection restored

---

## Testing

### Manual Testing Checklist

- [ ] Send text message
- [ ] Send image attachment
- [ ] Send video attachment
- [ ] Send audio attachment
- [ ] Send document attachment
- [ ] Send multiple files at once
- [ ] Remove attachment preview before sending
- [ ] Receive message from another admin
- [ ] Verify message order (chronological)
- [ ] Check read receipts update
- [ ] Test on mobile viewport
- [ ] Test with sidebar collapsed
- [ ] Verify dropdown navigation
- [ ] Test keyboard shortcuts (Enter to send)
- [ ] Check error handling (large files, network errors)

### Browser Compatibility

Test in the following browsers:
- [ ] Chrome/Edge (Chromium-based)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

## Dependencies

### Required npm Packages

```json
{
  "firebase": "^10.x.x",
  "@tanstack/react-query": "^5.x.x",
  "react": "^18.x.x",
  "react-router-dom": "^6.x.x",
  "lucide-react": "^0.x.x"
}
```

### Custom Hooks

- `useFileUpload` - File upload handling
- `useUserRole` - User role checking

### Utility Functions

- `formatFileSize` - Format bytes to human-readable size
- `isImageFile` - Check if file is an image
- `isVideoFile` - Check if file is a video
- `isAudioFile` - Check if file is audio

---

## Maintenance

### Regular Tasks

1. **Monitor Firestore Usage**
   - Check read/write counts
   - Monitor storage usage
   - Optimize queries if needed

2. **Review Security Rules**
   - Ensure rules are up to date
   - Test for vulnerabilities
   - Update as needed

3. **Performance Monitoring**
   - Track message load times
   - Monitor real-time sync performance
   - Identify bottlenecks

4. **User Feedback**
   - Gather feedback from admins
   - Prioritize feature requests
   - Fix reported bugs

### Backup Strategy

- Firestore automatic backups (if enabled)
- Export message history periodically
- Store exports in secure location

---

## Support and Documentation

### Related Documentation

- [Resident Chat Implementation](CHAT_IMPLEMENTATION_GUIDE.md)
- [Firebase Setup](docs/FIREBASE_STORAGE_SETUP.md)
- [Security Rules Checklist](SECURITY_RULES_CHECKLIST.md)

### Contact

For questions or issues with Admin Chat:
1. Check this documentation
2. Review Firebase console logs
3. Contact development team

---

## Changelog

### Version 1.0.0 (October 2025)

**Initial Release**
- ✅ Real-time group chat for administrators
- ✅ File attachment support (images, videos, audio, documents)
- ✅ Read receipts and delivery status
- ✅ Sidebar dropdown navigation
- ✅ Chronological message ordering
- ✅ Role-based identification

---

## License

Copyright © 2025 AcciZard. All rights reserved.

---

**Document Version:** 1.0.0  
**Last Updated:** October 21, 2025  
**Author:** Development Team  
**Review Status:** Initial Release

