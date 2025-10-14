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
- `lastMessage`: string - Preview of the last message sent
- `lastMessageTime`: timestamp - When the last message was sent
- `lastMessageSenderName`: string - Name of who sent the last message
- `createdAt`: timestamp - When the chat was created
- `lastAccessTime`: timestamp - Last time the chat was accessed

#### 2. `chat_messages` Collection (Individual Messages)
Document ID: Auto-generated

Fields:
- `userId`: string - The resident's Firebase UID (for querying)
- `senderId`: string - UID of who sent the message (admin or resident)
- `senderName`: string - Name of the sender
- `message`: string - The actual message content
- `timestamp`: timestamp - When the message was sent
- `isRead`: boolean - Whether the message has been read

## Features Implemented

### ✅ Real-time Chat Sessions List
- Automatically fetches and displays all active chat sessions from the `chats` collection
- Shows last message preview, sender name, and timestamp
- Sorts sessions by most recent activity
- Updates in real-time when new messages arrive

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

### ✅ Start New Chat
- Search for residents by name, email, phone, location
- Click "Start Chat" to initiate a conversation
- Creates chat session metadata in `chats` collection

### ✅ User Experience
- **Loading states throughout the UI:**
  - Chat sessions list loading with spinner
  - Messages loading with spinner
  - Send button loading state with spinner
  - Start chat button loading state
  - Search results loading with spinner
- Empty state when no messages exist
- Keyboard support (Enter to send)
- Auto-scroll to bottom on new messages
- Responsive design
- Disabled send button when message is empty or sending
- Visual feedback for all async operations

## Security Rules (Already Configured)

The Firestore security rules are already set up correctly:

```javascript
// Admins can read all messages
match /chat_messages/{messageId} {
  allow read: if isAdmin();
  allow create: if isAdmin();
  allow update: if isAdmin();
}

// Admins can access all chat metadata
match /chats/{chatRoomId} {
  allow read, write: if isAdmin();
}
```

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

## Known Limitations

- File attachments not yet implemented (UI is present but functionality pending)
- Message read receipts tracked but not yet displayed
- No message deletion functionality yet
- No typing indicators

## Future Enhancements

- [ ] Implement file/image attachments
- [ ] Add message read receipts display
- [ ] Add typing indicators
- [ ] Add message search functionality
- [ ] Add ability to delete messages
- [ ] Add chat archive/close functionality
- [ ] Add push notifications for new messages

