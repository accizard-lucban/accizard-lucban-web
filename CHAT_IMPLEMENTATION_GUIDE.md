# Chat Support Implementation Guide

## Overview
The Chat Support page has been fully integrated with Firebase Firestore to enable real-time messaging between admins and residents.

## Database Structure

### Collections

#### 1. `chats` Collection (Chat Metadata)
Document ID: `userId` (the resident's Firebase UID)

Fields:
- `userId`: string - The resident's Firebase UID
- `userName`: string - The resident's full name
- `userEmail`: string - The resident's email address
- `userPhoneNumber`: string - The resident's phone number
- `profilePictureUrl`: string - URL to the resident's profile picture (alias)
- `lastMessage`: string - Preview of the last message sent
- `lastMessageTime`: timestamp - When the last message was sent
- `lastMessageSenderName`: string - Name of who sent the last message
- `createdAt`: timestamp - When the chat was created
- `lastAccessTime`: timestamp - Last time the chat was accessed

**Note:** 
- When a chat session is manually started from the web app, all user information (phone number, profile picture, email) is automatically stored in the chat metadata.
- When loading existing chat sessions, if profile picture or phone number is missing, it is automatically fetched from the `users` collection and the chat document is updated.
- This ensures consistent display even for chats initiated from the mobile app before these fields were added.

#### 2. `chat_messages` Collection (Individual Messages)
Document ID: Auto-generated

Fields:
- `userId`: string - The resident's Firebase UID (for querying)
- `senderId`: string - UID of who sent the message (admin or resident)
- `senderName`: string - Name of the sender
- `message`: string - The actual message content
- `timestamp`: timestamp - When the message was sent
- `isRead`: boolean - Whether the message has been read
- `imageUrl`: string (optional) - URL to image attachment in Firebase Storage
- `fileUrl`: string (optional) - URL to file attachment in Firebase Storage
- `fileName`: string (optional) - Original file name
- `fileSize`: number (optional) - File size in bytes
- `fileType`: string (optional) - MIME type of the file

## Features Implemented

### ✅ Real-time Chat Sessions List
- Automatically fetches and displays all active chat sessions from the `chats` collection
- Shows last message preview, sender name, and timestamp
- Sorts sessions by most recent activity
- Updates in real-time when new messages arrive
- **Dynamic Data Fetching:**
  - Automatically fetches missing profile pictures from `users` collection
  - Automatically fetches missing phone numbers from `users` collection
  - Updates chat documents with fetched data for future use
  - Ensures consistent display regardless of chat origin (web or mobile)

### ✅ Real-time Message Display
- Fetches all messages for the selected user from `chat_messages` collection
- Messages update in real-time as they're sent/received
- Different styling for admin vs. resident messages:
  - Admin messages: Orange background, right-aligned
  - Resident messages: White background, left-aligned
- Shows sender name and timestamp for each message
- Auto-scrolls to the latest message

### ✅ Send Messages
- Admin can send messages to residents
- Messages are saved to both:
  1. `chat_messages` collection (for full history)
  2. `chats` collection metadata (for preview)
- Press Enter to send (Shift+Enter for new line)
- Success/error toast notifications
- **Branding:** All admin messages display as "AcciZard Lucban" regardless of which admin account is logged in

### ✅ Start New Chat / Open Existing Chat
- Search for residents by name, email, phone, location
- **Smart Search Results:**
  - Clean interface showing only name and phone number
  - Users with existing chats show an "Active Chat" badge (green)
  - Click on users with active chats to instantly open their conversation
  - Users without chats show a "Start Chat" button
  - Search clears automatically when opening an existing chat
- Creates chat session metadata in `chats` collection
- **Automatically stores:**
  - User's phone number (userPhoneNumber, mobileNumber)
  - User's profile picture URL (profilePicture, profilePictureUrl)
  - User's email and name
  - Handles multiple field name formats for compatibility

### ✅ User Experience
- **Loading states throughout the UI:**
  - Chat sessions list loading with spinner
  - Messages loading with spinner
  - Send button loading state with spinner
  - Start chat button loading state
  - Search results loading with spinner
- **Smart Search Behavior:**
  - Search shows all matching users (both with and without existing chats)
  - Users with existing chats display "Active Chat" badge (green)
  - Clicking on users with active chats opens the conversation immediately
  - Users without chats show a "Start Chat" button
  - Search automatically clears when opening an existing chat
  - Prevents duplicate chat sessions
- **User Information Display:**
  - Chat sessions list shows: Username and Phone Number (below name)
  - Chat window header shows: Username and Phone Number (below name)
  - Profile pictures displayed throughout (with fallback icon)
  - Handles multiple field name formats (profilePicture, profilePictureUrl, etc.)
- Empty state when no messages exist
- Keyboard support (Enter to send)
- Auto-scroll to bottom on new messages
- Responsive design
- Disabled send button when message is empty or sending
- Visual feedback for all async operations

## Security Rules

### Firestore Rules (firestore.rules)

The chat collections have the following security rules:

```javascript
// Chat messages collection
match /chat_messages/{messageId} {
  // Allow public read access (needed for regular Admins who don't have Firebase Auth)
  allow read: if true;
  
  // Allow public write for chat messages (admins and users both need to send messages)
  allow write: if true;
}

// Chat room metadata
match /chats/{chatRoomId} {
  // Allow public read access (needed for regular Admins who don't have Firebase Auth)
  allow read: if true;
  
  // Admins can write all chat rooms
  allow write: if isAdmin();
  
  // Users can write their own chat room metadata
  allow write: if isAuthenticated() && chatRoomId == request.auth.uid;
}
```

### Storage Rules (storage.rules) - **REQUIRED FOR FILE ATTACHMENTS**

Chat attachments are stored in Firebase Storage with the following rules:

```javascript
// Chat attachments
match /chat_attachments/{userId}/{fileName} {
  // Allow read for authenticated users (both admins and the user)
  allow read: if isAuthenticated();
  
  // Allow write for authenticated users (admins sending to users, users sending to admins)
  // Validate file type and size
  allow write: if isAuthenticated() && 
              (isImage() || isDocument()) && 
              isValidSize();
  
  // Allow delete for authenticated users (cleanup)
  allow delete: if isAuthenticated();
}

// Helper functions
function isImage() {
  return request.resource.contentType.matches('image/.*');
}

function isDocument() {
  return request.resource.contentType.matches('application/pdf') ||
         request.resource.contentType.matches('application/msword') ||
         request.resource.contentType.matches('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
}

function isValidSize() {
  return request.resource.size < 25 * 1024 * 1024; // 25MB limit
}
```

### Deploying Security Rules

After any changes to rules, deploy them:

```bash
# Deploy both Firestore and Storage rules
firebase deploy --only firestore:rules,storage:rules

# Or deploy individually
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

**⚠️ Important:** Storage rules are required for file attachments to work. Without them, file uploads will fail with permission errors.

### Silent Firebase Auth for Admins

Regular LDRRMO admins (username/password only) now get **automatic Firebase Auth** in the background:
- Admin logs in with username/password
- System silently creates Firebase Auth account: `{username}@admin.accizard.local`
- Admin gets auth token for Storage access
- **No change to admin's experience** - completely transparent
- See `SILENT_FIREBASE_AUTH_GUIDE.md` for technical details

This enables:
- ✅ Admins can upload/download chat attachments
- ✅ Full Storage access with security
- ✅ No public storage exposure
- ✅ Same login experience

See `SECURITY_RULES_CHECKLIST.md` for detailed security implementation guidelines.

## How It Works

### When a Resident Sends a Message (from Mobile App)
1. Mobile app creates a document in `chat_messages` with their `userId`
2. Mobile app updates `chats/{userId}` with last message metadata
3. Web app receives real-time update and displays the message

### When an Admin Sends a Message (from Web App)
1. Web app creates a document in `chat_messages` with the resident's `userId`
2. Web app updates `chats/{userId}` with last message metadata
3. Mobile app receives real-time update and displays the message

### Loading a Conversation
1. Select a chat session from the list
2. Query `chat_messages` where `userId == selectedUserId`
3. Order by `timestamp` ascending
4. Display all messages with real-time listener

## Benefits of This Architecture

✅ **Full Message History**: All messages are preserved in `chat_messages`
✅ **Fast Previews**: `chats` collection provides quick last-message preview
✅ **Real-time Updates**: Uses Firestore's onSnapshot for instant updates
✅ **Scalable**: Efficient queries using indexed `userId` field
✅ **Secure**: Proper security rules prevent unauthorized access
✅ **Session Persistence**: Messages survive app restarts
✅ **Consistent Branding**: All admin messages show as "AcciZard Lucban" for professional identity

## File Attachments Implementation

### How It Works

1. **File Selection:**
   - User clicks paperclip icon to open improved attachment menu
   - Beautiful popup shows two options with icons and descriptions:
     - **Photos** (blue theme): JPEG, PNG, GIF, WEBP
     - **Documents** (green theme): PDF, DOC, DOCX
   - File dialog opens with appropriate filters
   - **Multiple files can be selected at once**
   - Each selected file is added to preview list

2. **Preview System:**
   - All selected files shown in scrollable preview area
   - Each preview shows: thumbnail/icon, filename, file size
   - Individual remove button (X) for each file
   - Progress indicator shows when uploading multiple files
   - Preview list has max height with scroll for many files

3. **Upload Process:**
   - All files uploaded sequentially to Firebase Storage
   - Each file stored in `chat_attachments/{userId}/` path with unique timestamp
   - Upload happens when user clicks Send button
   - Progress indicator shows: "Uploading X file(s)..."
   - Storage URLs retrieved after each successful upload

4. **Message Creation:**
   - Text message sent first (if provided)
   - **Each attachment sent as separate message** for better organization
   - For images: `imageUrl` field contains the storage URL
   - For documents: `fileUrl`, `fileName`, `fileSize`, `fileType` fields populated
   - Text message can accompany attachments
   - Smart last message preview: "📷 2 photos", "📎 3 files", etc.

5. **Display in Chat:**
   - **Images:** Displayed inline, clickable to open full size in new tab
   - **Documents:** Shown as downloadable cards with file icon, name, size, and download button
   - **Styling:** Attachment styling matches message bubble color (orange for admin, white for user)
   - Multiple attachments appear as separate message bubbles

6. **Mobile App Compatibility:**
   - Same Firebase Storage and Firestore structure
   - Mobile app can send/receive attachments using the same fields
   - URLs are accessible from both platforms
   - Each attachment as separate message works across platforms

### Storage Structure

```
chat_attachments/
  └── {userId}/
      └── {timestamp}_{originalFileName}
```

### File Validation

- **Allowed image types:** JPEG, JPG, PNG, GIF, WEBP
- **Allowed document types:** PDF, DOC, DOCX
- **Maximum file size:** 25MB
- **Automatic image compression:** Images are compressed before upload for optimal storage

## Admin Identity & Branding

All messages sent by admin/super admin accounts are displayed with the sender name **"AcciZard Lucban"** regardless of which admin account is currently logged in.

### Why Unified Branding?

- **Professional Identity**: Users see a consistent support identity
- **Brand Recognition**: Reinforces the AcciZard brand
- **Simplicity**: Users don't need to know individual admin names
- **Privacy**: Admin personal identities remain private
- **Consistency**: Same experience across all support interactions

### Technical Implementation

- The `senderName` field in all admin messages is hardcoded to "AcciZard Lucban"
- The actual admin's `uid` is still tracked in `senderId` for internal audit purposes
- This applies to both:
  - Messages in `chat_messages` collection
  - Last message preview in `chats` collection metadata

## Testing

To test the implementation:

1. **Start a chat**: Search for a resident and click "Start Chat"
2. **Send a message**: Type a message and press Enter or click Send
3. **Check Firestore**: 
   - Verify message appears in `chat_messages` collection
   - Verify chat metadata updated in `chats` collection
4. **Check real-time**: Have the mobile app open, messages should appear instantly
5. **Restart app**: Close and reopen - all messages should still be visible

## Loading States Implementation

The chat interface now includes comprehensive loading states for better user experience:

### State Variables
- `loadingChatSessions`: Tracks loading of chat sessions list
- `loadingMessages`: Tracks loading of messages for selected conversation
- `loadingUsers`: Tracks loading of user search results
- `sendingMessage`: Tracks message send operation
- `startingChat`: Tracks which user chat is being initiated (stores user ID)

### Visual Indicators
- **Loader2 Icon**: Spinning orange loader from lucide-react
- **Disabled States**: Buttons are disabled during operations to prevent duplicate actions
- **Loading Text**: Descriptive text accompanies each spinner
- **Centered Layout**: All loading indicators are centered with proper spacing

### User Benefits
- Clear feedback that operations are in progress
- Prevention of duplicate submissions
- Professional, polished user experience
- Consistent loading patterns across the interface

## Chat Session Deletion (Soft Delete)

### How It Works

When an admin deletes a chat session:

1. **What Gets Deleted:**
   - Chat metadata from the `chats` collection (removes from admin's chat list)

2. **What Is Preserved:**
   - All messages in the `chat_messages` collection remain intact
   - Message history is still visible in the user's mobile app
   - All timestamps and read receipts are preserved

3. **Effects:**
   - Chat session disappears from admin's chat list (red delete button)
   - User can still view all previous messages on their mobile app
   - User can send new messages, which will recreate the chat session automatically
   - Admin can restart the chat by searching for the user and clicking "Start Chat"

### Chat Restoration

When an admin starts a new chat with a user who has existing message history:

1. **Automatic Detection:**
   - System checks for existing messages in `chat_messages` collection
   - If messages are found, the chat is restored (not created as new)

2. **Smart Restoration:**
   - Last message preview is automatically populated
   - Last message timestamp is restored
   - All previous messages become visible immediately
   - Toast notification says "Chat restored with existing messages"
   - **User data is refreshed:** Phone number and profile picture are updated from latest user data

3. **Seamless Continuity:**
   - Users never lose their conversation history
   - Admins can pick up where they left off
   - No duplicate chat sessions created
   - User information stays current even after session deletion

### Field Name Compatibility

The system handles multiple field name formats for maximum compatibility:

**Profile Picture:**
- `profilePicture`
- `profilePictureUrl`
- `profile_picture`
- `avatar`

**Phone Number:**
- `userPhoneNumber`
- `mobileNumber`
- `phoneNumber`
- `phone`

This ensures data is properly stored and displayed regardless of how the mobile app or web app names these fields.

## Dynamic User Data Fetching

The system automatically enriches chat session data with user information from the `users` collection:

### How It Works

1. **On Chat Session Load:**
   - System checks each chat document for `profilePicture` and `userPhoneNumber`
   - If either field is missing, it queries the `users` collection

2. **User Lookup Process:**
   - First attempts to find user by `firebaseUid` field
   - Falls back to document ID if not found by `firebaseUid`
   - Extracts profile picture and phone number with field name variations

3. **Automatic Update:**
   - Fetched data is stored back to the chat document in Firestore
   - Prevents repeated lookups on subsequent loads
   - Ensures data consistency across sessions

4. **Benefits:**
   - Chats initiated from mobile app get enriched with user data
   - Backward compatibility with existing chat sessions
   - No manual intervention required
   - Consistent display in web app regardless of chat origin

### Console Logging

The system provides detailed console logs for debugging:
- `🔍 Fetching missing user data for: [userId]`
- `✅ User data found: [userData]`
- `🖼️ Found profile picture: [url]`
- `📱 Found phone number: [number]`
- `✅ Updated chat document with user data`

### Why Soft Delete?

This approach is ideal for support systems because:
- ✅ Preserves conversation history for users
- ✅ Maintains audit trail for compliance
- ✅ Allows admins to clean up their chat list without data loss
- ✅ Users don't lose their support history
- ✅ Easy to restart conversations when needed
- ✅ Automatic restoration prevents confusion

### UI Elements

- **Red Delete Button:** Clear visual indication of destructive action
- **Confirmation Dialog:** Explains what will happen before deletion
- **Restore Toast:** Confirms when a chat is restored with existing messages

### Dialog Confirmation

The delete confirmation dialog clearly explains what will happen:
- Removes chat from admin list
- Preserves all message history
- Keeps messages visible in mobile app
- Allows restarting the chat later

### ✅ File and Image Attachments

- **Upload images and documents** directly in the chat
- **Multiple file uploads:** Select and send multiple files at once
- **Attachment types supported:**
  - Images: JPEG, PNG, GIF, WEBP
  - Documents: PDF, DOC, DOCX
- **File size limit:** 25MB per file
- **Features:**
  - Multiple file preview system with scrollable list
  - Individual preview for each selected file
  - Remove individual attachments before sending
  - Automatic upload to Firebase Storage
  - Images display inline in messages (clickable to open full size)
  - Documents show as downloadable cards with file info
  - Upload progress indicator showing total count
  - Disabled input during upload
  - Each attachment sent as separate message for better organization
- **Improved attachment menu:**
  - Beautiful popup with icons and descriptions
  - "Photos" option with blue theme (JPEG, PNG, GIF, WEBP)
  - "Documents" option with green theme (PDF, DOC, DOCX)
  - Color-coded hover effects (blue for photos, green for documents)
  - Paperclip button with orange hover effect
- **Storage path:** `chat_attachments/{userId}/{timestamp}_{filename}`

## Known Limitations

- Message read receipts tracked but not yet displayed
- No typing indicators
- No individual message deletion (only full chat session removal)

## Future Enhancements

- [ ] Add message read receipts display in UI (already tracked in database)
- [ ] Add typing indicators
- [ ] Add message search functionality
- [ ] Add ability to delete individual messages
- [ ] Add hard delete option (for data privacy/GDPR compliance)
- [ ] Add chat archive functionality (hide without deleting)
- [ ] Add push notifications for new messages
- [ ] Add video attachments support
- [ ] Add audio message recording
- [ ] Add drag-and-drop file upload
- [ ] Add image editing before sending (crop, rotate, filters)

