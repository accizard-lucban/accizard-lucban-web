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
- `userTyping`: boolean - Whether the user is currently typing
- `userTypingTimestamp`: timestamp - When user started typing (for timeout)
- `adminTyping`: boolean - Whether admin is currently typing
- `adminTypingTimestamp`: timestamp - When admin started typing (for timeout)

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
- `videoUrl`: string (optional) - URL to video attachment in Firebase Storage
- `audioUrl`: string (optional) - URL to audio attachment in Firebase Storage
- `fileUrl`: string (optional) - URL to file attachment in Firebase Storage
- `fileName`: string (optional) - Original file name
- `fileSize`: number (optional) - File size in bytes
- `fileType`: string (optional) - MIME type of the file

#### 3. `users` Collection (Presence & Notification Fields)

**Additional fields for online status and push notifications:**
- `isOnline`: boolean - Whether the user is currently active on the mobile app
- `lastSeen`: timestamp - Last time the user was active
- `fcmToken`: string - Firebase Cloud Messaging token for push notifications

**Note:** These fields are managed by the mobile app. The web app reads them in real-time to display online status and last seen timestamps. The Cloud Function uses `fcmToken` to send push notifications.

## Features Implemented

### ✅ Real-time Chat Sessions List
- Automatically fetches and displays all active chat sessions from the `chats` collection
- Shows last message preview, sender name, and timestamp
- Sorts sessions by most recent activity
- Updates in real-time when new messages arrive
- **Online Status Indicators:**
  - **Green dot indicator** on profile pictures for online users
  - **"Online" text** displayed in chat sessions list and chat header
  - **Last seen timestamp** shown for offline users (e.g., "Active 5m ago")
  - Real-time presence tracking with 2-minute timeout
  - Monitors `isOnline` and `lastSeen` fields in users collection
  - Visual feedback: green dot badge on avatar
- **Unread Message Badges:**
  - **Per-conversation badges:** Orange badge on each chat session showing unread count
  - **Sidebar badge:** Orange badge on "Chat Support" tab showing total unread messages across all conversations
  - Real-time updates as messages are sent/received
  - Only counts messages from users (not admin messages)
  - Automatically cleared when messages are read
- **Smart Last Message Sync:**
  - Automatically syncs last message preview with actual latest message
  - Works regardless of whether message was sent from web app or mobile app
  - Updates preview when viewing a conversation to ensure accuracy
  - Shows sender name (admin or resident) for the actual last message
  - Handles text messages, photos, and file attachments in preview
- **Dynamic Data Fetching:**
  - Automatically fetches missing profile pictures from `users` collection
  - Automatically fetches missing phone numbers from `users` collection
  - Updates chat documents with fetched data for future use
  - Ensures consistent display regardless of chat origin (web or mobile)

### ✅ Real-time Message Display
- Fetches all messages for the selected user from `chat_messages` collection
- Messages update in real-time as they're sent/received
- **Beautiful chat UI:**
  - Chat background: Soft orange (orange-100)
  - Admin messages: Orange bubbles, right-aligned
  - Resident messages: White bubbles, left-aligned
  - Profile pictures for resident messages (only on text messages)
- **Media attachments:** All displayed without message bubble containers
  - **Images:** Standalone images with click to open full size
  - **Videos:** Embedded video players with full controls
  - **Audio:** Embedded audio players with playback controls
  - **Documents:** Standalone file cards with download button
  - Hover to see timestamp overlay with read receipts (black semi-transparent)
  - Clean, minimal presentation for all media types
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
- **Message Search:**
  - Real-time search through conversation messages
  - Yellow highlighting of matching text
  - Instant results with count display
  - Up/Down arrow navigation between search results
  - Auto-scroll to matched messages with visual feedback
  - Easy clear button to reset search
- **Beautiful UI Design:**
  - Chat background: Warm orange-100 for pleasant visual experience
  - Message bubbles: Orange (admin) and white (resident) with shadows
  - Clean, modern Instagram-style image display
  - Timestamp overlays on hover for images
- **User Information Display:**
  - Chat sessions list shows: Username and Phone Number (below name)
  - Chat window header shows: Username and Phone Number (below name)
  - Profile pictures displayed throughout (with fallback icon)
  - **Online status:** Green dot indicator on avatars for online users
  - **Last seen:** Displays when user was last active (for offline users)
  - Handles multiple field name formats (profilePicture, profilePictureUrl, etc.)
- Empty state when no messages exist
- Keyboard support (Enter to send)
- Auto-scroll to bottom on new messages
- Responsive design
- Disabled send button when message is empty or sending
- Visual feedback for all async operations
- No intrusive toast notifications after sending messages

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
              (isImage() || isDocument() || isVideo() || isAudio()) && 
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

function isVideo() {
  return request.resource.contentType.matches('video/.*');
}

function isAudio() {
  return request.resource.contentType.matches('audio/.*');
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

### Presence Tracking (Mobile App Responsibility)

**For online status to work, the mobile app must:**

1. **Update presence on app state changes:**
   ```javascript
   // When app becomes active/foreground
   await updateDoc(doc(db, "users", userId), {
     isOnline: true,
     lastSeen: serverTimestamp()
   });
   
   // When app goes to background/inactive
   await updateDoc(doc(db, "users", userId), {
     isOnline: false,
     lastSeen: serverTimestamp()
   });
   ```

2. **Set up Firebase onDisconnect:**
   ```javascript
   // Using Firebase Realtime Database for reliable disconnect detection
   const presenceRef = ref(realtimeDb, `presence/${userId}`);
   onDisconnect(presenceRef).set({
     isOnline: false,
     lastSeen: serverTimestamp()
   });
   ```

3. **Heartbeat mechanism:**
   - Update `lastSeen` every 30-60 seconds while app is active
   - This ensures accurate online detection with 2-minute timeout

**Web app automatically:**
- Monitors these fields in real-time
- Shows green dot for users online within last 2 minutes
- Displays formatted "last seen" for offline users

### Push Notifications Setup (Mobile App Implementation)

**For push notifications to work, the mobile app must implement the following:**

#### 1. **Firebase Cloud Messaging Setup**

**Install FCM package:**
```bash
# For React Native
npm install @react-native-firebase/messaging

# For Flutter
flutter pub add firebase_messaging
```

**Configure Firebase project:**
- Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
- Enable Firebase Cloud Messaging in Firebase Console
- Configure APNs certificates for iOS

#### 2. **Request Notification Permissions**

```javascript
// React Native example
import messaging from '@react-native-firebase/messaging';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    return true;
  }
  return false;
}

// Call on app launch
await requestUserPermission();
```

#### 3. **Get and Store FCM Token**

```javascript
// Get FCM token and store in Firestore
async function getFCMToken(userId) {
  try {
    const token = await messaging().getToken();
    
    // Store token in Firestore users collection
    await updateDoc(doc(db, "users", userId), {
      fcmToken: token,
      fcmTokenUpdatedAt: serverTimestamp()
    });
    
    console.log('FCM Token stored:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
}

// Call after user logs in
await getFCMToken(currentUser.uid);
```

#### 4. **Listen for Token Refresh**

```javascript
// Listen for token changes and update Firestore
messaging().onTokenRefresh(async (newToken) => {
  console.log('FCM token refreshed:', newToken);
  
  const userId = auth.currentUser?.uid;
  if (userId) {
    await updateDoc(doc(db, "users", userId), {
      fcmToken: newToken,
      fcmTokenUpdatedAt: serverTimestamp()
    });
  }
});
```

#### 5. **Handle Foreground Notifications**

```javascript
// Handle notifications when app is in foreground
messaging().onMessage(async (remoteMessage) => {
  console.log('Foreground notification received:', remoteMessage);
  
  // Show local notification or update UI
  if (remoteMessage.notification) {
    // Display in-app notification banner
    showInAppNotification({
      title: remoteMessage.notification.title,
      body: remoteMessage.notification.body,
      onPress: () => {
        // Navigate to chat screen
        navigation.navigate('Chat', {
          userId: remoteMessage.data?.userId
        });
      }
    });
  }
});
```

#### 6. **Handle Background/Quit Notifications**

```javascript
// Handle notification when app is in background or quit
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background notification received:', remoteMessage);
  
  // Process notification data
  const { type, userId, messageId } = remoteMessage.data || {};
  
  if (type === 'chat_message' && userId) {
    // Update local state or cache
    // The notification will be shown automatically by the system
  }
});

// Handle notification tap when app is opened from quit state
messaging().getInitialNotification().then((remoteMessage) => {
  if (remoteMessage) {
    console.log('App opened from notification:', remoteMessage);
    
    // Navigate to chat screen
    const userId = remoteMessage.data?.userId;
    if (userId) {
      navigation.navigate('Chat', { userId });
    }
  }
});

// Handle notification tap when app is in background
messaging().onNotificationOpenedApp((remoteMessage) => {
  console.log('Notification opened app:', remoteMessage);
  
  const userId = remoteMessage.data?.userId;
  if (userId) {
    navigation.navigate('Chat', { userId });
  }
});
```

#### 7. **Android Notification Channel**

```javascript
// Create notification channel for Android (required for Android 8.0+)
import notifee from '@notifee/react-native';

async function createNotificationChannel() {
  await notifee.createChannel({
    id: 'chat_messages',
    name: 'Chat Messages',
    description: 'Notifications for new chat messages',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

// Call on app initialization
await createNotificationChannel();
```

#### 8. **Clear Token on Logout**

```javascript
// Remove FCM token when user logs out
async function clearFCMToken(userId) {
  try {
    // Delete token from Firestore
    await updateDoc(doc(db, "users", userId), {
      fcmToken: deleteField(),
      isOnline: false,
      lastSeen: serverTimestamp()
    });
    
    // Delete token from device
    await messaging().deleteToken();
    
    console.log('FCM token cleared');
  } catch (error) {
    console.error('Error clearing FCM token:', error);
  }
}

// Call when user signs out
await clearFCMToken(currentUser.uid);
```

#### 9. **Test Notifications**

```javascript
// Test notification delivery (for debugging)
async function testNotification() {
  const token = await messaging().getToken();
  console.log('Current FCM token:', token);
  
  // You can test by sending a notification manually from Firebase Console
  // Cloud Messaging > Send test message
  // Or use the Admin SDK from a test script
}
```

### Cloud Function Details

**Function:** `sendChatNotification`
- **Trigger:** `onDocumentCreated` on `chat_messages/{messageId}`
- **Location:** `functions/src/index.ts`
- **What it does:**
  1. Extracts message data (sender, content, attachments)
  2. Checks if message is from admin to user (not user to themselves)
  3. Retrieves user's FCM token from Firestore
  4. Sends notification with appropriate title and body
  5. Handles errors and removes invalid tokens
- **Features:**
  - Smart content detection (text, images, videos, audio, files)
  - Platform-specific payload (Android & iOS)
  - Automatic token cleanup on errors
  - Detailed logging for debugging

### Deploying the Cloud Function

**To deploy the push notification function:**

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:sendChatNotification
```

**After deployment:**
- Function will automatically trigger on new messages
- Check Firebase Console > Functions to verify deployment
- Monitor Cloud Function logs for debugging
- Test by sending a message from web app to mobile user

**Required Firebase services:**
- ✅ Firebase Cloud Messaging (FCM) enabled
- ✅ Cloud Functions enabled (Blaze plan required)
- ✅ Admin SDK initialized in functions

### ✅ Online Status & Presence System

- **Real-time presence tracking** shows when residents are currently using the app
- **How it works:**
  - Monitors `isOnline` and `lastSeen` fields in `users` collection
  - Real-time listener updates status instantly
  - 2-minute timeout for determining online status
  - Considers user online if last activity was within 2 minutes
- **Visual indicators:**
  - **Green dot badge** on profile pictures (bottom-right corner)
  - **"Online" text** in green color with dot indicator
  - **Last seen timestamp** for offline users (e.g., "Active 5m ago", "Active 2h ago")
  - Consistent display in both chat sessions list and chat header
- **Display locations:**
  - **Chat sessions list:** Green dot on avatar, "Online" text next to phone number
  - **Chat header:** Green dot on avatar, "Online" text next to name
  - **Offline users:** Show last seen time instead of "Online"
- **Smart formatting:**
  - Recent: "Active now", "Active 5m ago"
  - Hours: "Active 2h ago"
  - Days: "Active 3d ago"
  - Older: Shows full date
- **Mobile app compatibility:**
  - Mobile app updates `isOnline` and `lastSeen` fields
  - Web app reads these fields in real-time
  - Cross-platform presence synchronization

## Benefits of This Architecture

✅ **Full Message History**: All messages are preserved in `chat_messages`
✅ **Fast Previews**: `chats` collection provides quick last-message preview
✅ **Real-time Updates**: Uses Firestore's onSnapshot for instant updates
✅ **Scalable**: Efficient queries using indexed `userId` field
✅ **Secure**: Proper security rules prevent unauthorized access
✅ **Session Persistence**: Messages survive app restarts
✅ **Consistent Branding**: All admin messages show as "AcciZard Lucban" for professional identity
✅ **Push Notifications**: Instant alerts when users receive new messages
✅ **Online Status**: Real-time presence tracking for better communication

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
   - For videos: `videoUrl` field contains the storage URL
   - For audio: `audioUrl` field contains the storage URL
   - For documents: `fileUrl`, `fileName`, `fileSize`, `fileType` fields populated
   - Text message can accompany attachments
   - Smart last message preview: "📷 2 photos", "🎥 1 video", "🎵 1 audio", "📎 3 files", etc.

5. **Display in Chat:**
   - **Images:** Displayed as standalone images without message bubble containers
     - Clean, minimal presentation with just the image
     - Hover to show timestamp overlay (bottom-right corner)
     - Click to open full size in new tab
     - Read receipts shown in timestamp overlay for admin messages
   - **Videos:** Displayed with embedded HTML5 video player
     - Full playback controls (play, pause, volume, fullscreen)
     - Max height of 300px with responsive width
     - Rounded corners for consistency
     - Hover to show timestamp overlay with read receipts
   - **Audio:** Displayed with embedded HTML5 audio player
     - Full playback controls (play, pause, volume, timeline)
     - Compact design fitting message layout
     - Hover to show timestamp overlay with read receipts
   - **Documents:** Displayed as standalone file cards without message bubble containers
     - File icon, name, size, and download button
     - White background with hover effect (changes to light gray)
     - Hover to show timestamp overlay (bottom-right corner)
     - Read receipts shown in timestamp overlay for admin messages
     - Consistent styling regardless of sender
   - Multiple attachments appear as separate standalone cards

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
- **Allowed video types:** MP4, AVI, MOV, WMV, QuickTime
- **Allowed audio types:** MP3, WAV, OGG, M4A, AAC
- **Allowed document types:** PDF, DOC, DOCX
- **Maximum file size:** 25MB per file
- **Automatic image compression:** Images are compressed before upload for optimal storage
- **Native HTML5 players:** Videos and audio use browser's native media players

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

### ✅ File, Image, Video, and Audio Attachments

- **Upload multiple media types** directly in the chat
- **Multiple file uploads:** Select and send multiple files at once
- **Attachment types supported:**
  - Images: JPEG, PNG, GIF, WEBP
  - Videos: MP4, AVI, MOV, WMV
  - Audio: MP3, WAV, OGG, M4A, AAC
  - Documents: PDF, DOC, DOCX
- **File size limit:** 25MB per file
- **Features:**
  - Multiple file preview system with scrollable list
  - Individual preview for each selected file with type-specific icons
  - Remove individual attachments before sending
  - Automatic upload to Firebase Storage
  - **Images:** Display as standalone images without message bubbles (clickable to open full size)
  - **Videos:** Display with embedded video player with playback controls
  - **Audio:** Display with embedded audio player with playback controls
  - **Documents:** Display as standalone file cards with download button
  - Hover over attachments to see timestamp and read receipts
  - Upload progress indicator showing total count
  - Disabled input during upload
  - Each attachment sent as separate message for better organization
- **Improved attachment menu:**
  - Beautiful popup with icons and descriptions
  - "Photos" option with blue theme (JPEG, PNG, GIF, WEBP)
  - "Videos" option with purple theme (MP4, AVI, MOV, WMV)
  - "Audio" option with orange theme (MP3, WAV, OGG, M4A)
  - "Documents" option with green theme (PDF, DOC, DOCX)
  - Color-coded hover effects and preview icons
  - Paperclip button with orange hover effect
- **Storage path:** `chat_attachments/{userId}/{timestamp}_{filename}`

### ✅ Message Read Receipts

- **Visual indicators on admin messages** to show delivery and read status
- **Two states:**
  - **Single check (✓):** Message delivered but not yet read by user
  - **Double check (✓✓):** Message read by user
- **Display locations:**
  - **Text messages:** Read receipt icons appear next to timestamp in message bubble
  - **Image attachments:** Read receipts shown in hover overlay along with timestamp
  - **File attachments:** Read receipts appear with message timestamp
- **Visual design:**
  - Single check icon: lighter orange color (message delivered)
  - Double check icon: orange color (message read)
  - Tooltip on hover shows "Delivered" or "Read" status
- **Real-time updates:** Read status updates instantly when user opens the message
- **Admin-only feature:** Read receipts only shown on messages sent by admins, not on user messages

### ✅ Typing Indicators

- **Real-time typing status** shows when the other person is composing a message
- **How it works:**
  - **Admin typing:** When admin types in the message input, typing status is broadcast to user's mobile app
  - **User typing:** When user types on mobile app, typing indicator appears in web admin chat
- **Visual design:**
  - Animated three-dot indicator (bouncing dots)
  - Shows user's profile picture next to typing indicator
  - Appears in white bubble similar to user messages
  - Smooth animations with staggered bounce effect
- **Smart timeout mechanism:**
  - Typing status automatically clears after 3 seconds of inactivity
  - Immediately cleared when message is sent
  - Timeout prevents stale "typing" indicators
- **Performance optimized:**
  - Debounced updates to prevent excessive Firestore writes
  - Real-time listener for instant updates
- **Cross-platform:** Works between web admin and mobile user seamlessly

### ✅ Push Notifications for New Messages

- **Automatic notifications** sent to users when they receive new chat messages
- **Firebase Cloud Messaging (FCM)** integration for reliable delivery
- **How it works:**
  - Cloud Function triggers when new message is created in `chat_messages` collection
  - Retrieves user's FCM token from `users` collection
  - Sends notification to user's mobile device
  - Only sends if message is from admin (not user themselves)
- **Smart notification content:**
  - **Title:** Sender name (e.g., "AcciZard Lucban")
  - **Body:** Message preview or attachment type
    - Text messages: Shows actual message content
    - Photos: "📷 Sent a photo"
    - Videos: "🎥 Sent a video"
    - Audio: "🎵 Sent an audio"
    - Files: "📎 Sent [filename]"
- **Notification data payload:**
  - Message ID for direct navigation
  - Sender information
  - User ID for conversation context
  - Type indicator for handling
- **Platform-specific features:**
  - **Android:** High priority, custom sound, notification channel
  - **iOS:** Sound, badge counter, APNs payload
- **Token management:**
  - Invalid tokens automatically removed from database
  - Failed delivery logged for debugging
  - Supports token refresh on mobile app
- **Mobile app requirements:**
  - Store FCM token in `users` collection under `fcmToken` field
  - Request notification permissions on app launch
  - Update token when it changes
  - Handle notification taps to open chat
- **Error handling:**
  - Logs all notification failures
  - Removes invalid/expired tokens
  - Continues silently if token not found
  - No disruption to message delivery

### ✅ Online Status & Presence System

- **Real-time presence tracking** shows when residents are currently using the app
- **How it works:**
  - Monitors `isOnline` and `lastSeen` fields in `users` collection
  - Real-time listener updates status instantly
  - 2-minute timeout for determining online status
  - Considers user online if last activity was within 2 minutes
- **Visual indicators:**
  - **Green dot badge** on profile pictures (bottom-right corner)
  - **"Online" text** in green color with dot indicator
  - **Last seen timestamp** for offline users (e.g., "Active 5m ago", "Active 2h ago")
  - Consistent display in both chat sessions list and chat header
- **Display locations:**
  - **Chat sessions list:** Green dot on avatar, "Online" text next to phone number
  - **Chat header:** Green dot on avatar, "Online" text next to name
  - **Offline users:** Show last seen time instead of "Online"
- **Smart formatting:**
  - Recent: "Active now", "Active 5m ago"
  - Hours: "Active 2h ago"
  - Days: "Active 3d ago"
  - Older: Shows full date
- **Mobile app compatibility:**
  - Mobile app updates `isOnline` and `lastSeen` fields
  - Web app reads these fields in real-time
  - Cross-platform presence synchronization

### ✅ Message Search Functionality

- **Powerful search** to find specific messages in conversations
- **Search location:**
  - Search input located in chat header (top-right)
  - Available when a conversation is selected
- **Search capabilities:**
  - Search through message text content
  - Search through file names (attachments)
  - Search through sender names
  - Case-insensitive matching
- **Visual features:**
  - Real-time filtering as you type
  - **Yellow highlighting** of matching text in messages
  - Search results count display ("Found X message(s)")
  - Clear button (X) to quickly reset search
  - "No messages found" message when no matches
- **Navigation controls:**
  - **Up/Down arrow buttons** to navigate between search results
  - **Position indicator** showing "1 / 5" (current result / total results)
  - **Auto-scroll** to the matched message when navigating
  - **Smooth scrolling** to center the matched message in view
  - Navigation arrows appear next to search input when results found
- **User experience:**
  - Instant results - no need to press Enter
  - All messages remain visible (not filtered out)
  - Matching text highlighted in yellow
  - File names also highlighted if they match
  - Navigate through results one by one with arrows
  - Automatically scrolls to first match when searching
  - Easy to clear and return to full conversation view
- **Performance:**
  - Client-side filtering for instant results
  - No additional database queries needed
  - Works with all message types (text, images, files)
  - Smooth animations and transitions

## Known Limitations

- No individual message deletion (only full chat session removal)

## Future Enhancements

- [ ] Add ability to delete individual messages
- [ ] Add hard delete option (for data privacy/GDPR compliance)
- [ ] Add chat archive functionality (hide without deleting)
- [ ] Add drag-and-drop file upload
- [ ] Add image editing before sending (crop, rotate, filters)
- [ ] Add voice message recording with one-tap functionality
- [ ] **Add Admin/LDRRMO Staff Group Chat Room** (see implementation guide below)

---

## Admin/LDRRMO Staff Group Chat Room - Implementation Guide

### Overview

A dedicated group chat room where all Super Admins and LDRRMO Admins can communicate with each other in real-time. Unlike the current resident chat system which uses individual chat sessions, this will be a single shared conversation space for all admin staff members.

### Use Cases

- **Internal coordination** during emergency response
- **Quick updates** between team members
- **Sharing information** without leaving the admin panel
- **Team announcements** and status updates
- **Collaborative decision making** in real-time

### Database Structure

#### Collection: `admin_group_chat`

**Document ID:** Auto-generated for each message

**Fields:**
- `messageId`: string - Auto-generated unique ID
- `senderId`: string - Firebase UID of admin who sent the message
- `senderName`: string - Full name of the admin
- `senderRole`: string - "Super Admin" or "Admin"
- `message`: string - The message content
- `timestamp`: timestamp - When message was sent
- `imageUrl`: string (optional) - URL to image attachment
- `videoUrl`: string (optional) - URL to video attachment
- `audioUrl`: string (optional) - URL to audio attachment
- `fileUrl`: string (optional) - URL to file attachment
- `fileName`: string (optional) - Original file name
- `fileSize`: number (optional) - File size in bytes
- `fileType`: string (optional) - MIME type
- `isEdited`: boolean - Whether message was edited
- `editedAt`: timestamp (optional) - When message was last edited
- `replyTo`: string (optional) - Message ID being replied to
- `reactions`: map (optional) - Emoji reactions {emoji: [userIds]}

#### Collection: `admin_group_chat_metadata`

**Document ID:** `group_chat_info` (single document)

**Fields:**
- `lastMessage`: string - Preview of last message
- `lastMessageTime`: timestamp - When last message was sent
- `lastMessageSenderName`: string - Who sent the last message
- `totalMessages`: number - Total message count
- `activeAdmins`: array - List of admin IDs currently viewing the chat
- `typingAdmins`: map - {adminId: timestamp} for typing indicators

### Features to Implement

#### 1. **Real-time Group Messages**
- All messages visible to all admins
- Real-time updates using Firestore `onSnapshot`
- Auto-scroll to latest message
- Timestamp display with relative time (e.g., "2m ago")

#### 2. **Typing Indicators**
- Show "John is typing..." when admins type
- Support multiple simultaneous typers: "John and Mary are typing..."
- Auto-clear after 3 seconds of inactivity
- Display at bottom of message list

#### 3. **Message Reactions**
- Quick emoji reactions (👍 ❤️ 😂 😮 😢 🙏)
- Click emoji to add/remove reaction
- Show reaction count and who reacted
- Hover to see list of admins who reacted

#### 4. **Reply to Messages**
- Click reply icon on any message
- Shows quoted message preview in input area
- Click X to cancel reply
- Displays reply context in message thread

#### 5. **Message Editing**
- Edit own messages within 15 minutes of sending
- Shows "edited" indicator on edited messages
- Hover to see original timestamp and edit time

#### 6. **Online Status**
- Green dot indicator for online admins
- "Last seen" timestamp for offline admins
- Update presence on page load/unload
- Auto-detect idle state after 5 minutes

#### 7. **Attachments Support**
- All media types: images, videos, audio, documents
- Same attachment system as resident chat
- Preview before sending
- Multiple attachments in single message

#### 8. **Message Read Receipts**
- Show who has read each message
- "Read by 3 admins" indicator
- Expandable list showing names
- Different from resident chat (group-aware)

#### 9. **Pinned Messages**
- Admins can pin important messages
- Pinned messages shown at top
- Click to jump to original message
- Unpin option for message owner or Super Admin

#### 10. **Search Messages**
- Search through entire group chat history
- Filter by sender, date range, or attachment type
- Yellow highlighting of matches
- Navigate through search results with arrows

### UI/UX Design

#### Layout Options

**Option A: Sidebar Tab**
- Add "Team Chat" tab in sidebar
- Opens dedicated page like Chat Support
- Full-screen chat interface
- Best for extended conversations

**Option B: Floating Chat Window**
- Floating bubble icon in bottom-right corner
- Click to expand/collapse chat window
- Minimizable for multitasking
- Best for quick updates while working

**Option C: Split View in Chat Support**
- Add tab in Chat Support page: "Residents" | "Team Chat"
- Switch between resident chats and team chat
- Reuses existing chat UI components
- Best for unified messaging experience

**Recommended: Option A** (Dedicated Page) for better focus and features

#### Visual Design
- **Message bubbles:** 
  - Different colors per admin (auto-assigned pastel colors)
  - Or single color with prominent sender names
- **Profile pictures:** Show admin avatars
- **Timestamps:** Show on hover or every 5 minutes
- **System messages:** Gray background for joins/leaves/pins
- **Attachment display:** Same style as resident chat

### Technical Implementation

#### Firestore Rules

```javascript
// Admin group chat messages
match /admin_group_chat/{messageId} {
  // Only authenticated admins can read
  allow read: if isAdmin();
  
  // Only admins can create messages
  allow create: if isAdmin() && 
                   request.resource.data.senderId == request.auth.uid;
  
  // Only message owner can update (for editing)
  allow update: if isAdmin() && 
                   resource.data.senderId == request.auth.uid;
  
  // Only message owner or Super Admin can delete
  allow delete: if isSuperAdmin() || 
                   (isAdmin() && resource.data.senderId == request.auth.uid);
}

// Admin group chat metadata
match /admin_group_chat_metadata/{docId} {
  allow read: if isAdmin();
  allow write: if isAdmin();
}
```

#### Storage Rules

```javascript
// Admin group chat attachments
match /admin_chat_attachments/{messageId}/{fileName} {
  allow read: if isAdmin();
  allow write: if isAdmin() && 
                  (isImage() || isDocument() || isVideo() || isAudio()) && 
                  isValidSize();
  allow delete: if isAdmin();
}
```

#### Real-time Listeners

```typescript
// Listen for new messages
useEffect(() => {
  const messagesRef = collection(db, "admin_group_chat");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messagesData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setMessages(messagesData);
  });
  
  return () => unsubscribe();
}, []);

// Listen for typing indicators
useEffect(() => {
  const metadataRef = doc(db, "admin_group_chat_metadata", "group_chat_info");
  
  const unsubscribe = onSnapshot(metadataRef, (doc) => {
    if (doc.exists()) {
      const typingAdmins = doc.data().typingAdmins || {};
      setTypingAdmins(typingAdmins);
    }
  });
  
  return () => unsubscribe();
}, []);
```

#### Presence System

```typescript
// Update presence on mount/unmount
useEffect(() => {
  const updatePresence = async (isOnline: boolean) => {
    const metadataRef = doc(db, "admin_group_chat_metadata", "group_chat_info");
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      await updateDoc(metadataRef, {
        [`activeAdmins.${currentUser.uid}`]: isOnline ? serverTimestamp() : deleteField()
      });
    }
  };
  
  updatePresence(true);
  
  return () => {
    updatePresence(false);
  };
}, []);
```

### Benefits

✅ **Instant coordination** between all admin staff
✅ **No external tools needed** - built into admin panel
✅ **Secure** - Only accessible to authenticated admins
✅ **Rich media support** - Share images, videos, files
✅ **Context awareness** - All admins see same information
✅ **Audit trail** - All messages logged and timestamped
✅ **Scalable** - Real-time updates for any number of admins

### Considerations

⚠️ **Privacy:** Ensure all admins understand messages are visible to entire team
⚠️ **Data retention:** Consider auto-archive/delete after X days
⚠️ **Notifications:** May need push notifications for important messages
⚠️ **Moderation:** Super Admin should have delete/edit permissions
⚠️ **Performance:** Monitor if message count grows large (pagination may be needed)

### Integration with Existing System

- **Reuse components:** Leverage existing chat UI components
- **Shared attachments:** Use same `useFileUpload` hook
- **Consistent design:** Match styling with resident chat
- **Unified navigation:** Add to sidebar menu
- **Badge counter:** Show unread count in sidebar

### Storage Path

```
admin_chat_attachments/
  └── {messageId}/
      └── {timestamp}_{originalFileName}
```

### Example Message Flow

1. **Admin A types message** → Updates `typingAdmins.adminA` in metadata
2. **Admin B sees "Admin A is typing..."** → Real-time from metadata listener
3. **Admin A sends message** → Creates document in `admin_group_chat`
4. **All admins receive message** → Real-time via `onSnapshot` listener
5. **Admin A's typing cleared** → Removed from `typingAdmins` map
6. **Admins read message** → Mark as read, update read receipts

### Mobile App Consideration

If extending to mobile app in the future:
- Same database structure works across platforms
- Mobile admins can participate in group chat
- Push notifications for new messages when app is closed
- Offline message queuing for poor connectivity

---

