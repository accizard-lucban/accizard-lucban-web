# Mobile App Push Notification Setup Guide

## 📱 Overview

Your web app is already configured to send push notifications via **Firebase Cloud Functions**. Here's what your mobile app needs to do to receive them.

---

## ✅ What's Already Done (Web App)

### **1. Firebase Cloud Functions**
Three Cloud Functions automatically send notifications:

| Function | Trigger | Collection | Purpose |
|----------|---------|------------|---------|
| `sendChatNotification` | New chat message | `chat_messages` | Sends notification to the specific user involved in the chat |
| `sendAnnouncementNotification` | New announcement | `announcements` | Broadcasts to **ALL users** with FCM tokens |
| `sendReportStatusNotification` | Report status updated | `reports` | Sends notification to the user who submitted the report when admin updates the status |

### **2. FCM Token Storage**
- FCM tokens are stored in the `users` collection
- Field name: `fcmToken`
- One token per user (updated each time the user logs in from their device)

---

## 📋 What Your Mobile App Must Do

### **Step 1: Initialize Firebase Cloud Messaging (FCM)**

**Flutter Example:**
```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class NotificationService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  
  Future<void> initialize() async {
    // Request permission (iOS)
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
    
    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ User granted permission');
    }
    
    // Get FCM token
    String? token = await _firebaseMessaging.getToken();
    if (token != null) {
      await saveFCMToken(token);
    }
    
    // Listen for token refresh
    _firebaseMessaging.onTokenRefresh.listen(saveFCMToken);
  }
  
  Future<void> saveFCMToken(String token) async {
    // Get current user ID (Firebase Auth UID)
    String? userId = FirebaseAuth.instance.currentUser?.uid;
    
    if (userId != null) {
      await FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .update({'fcmToken': token});
          
      print('✅ FCM token saved: $token');
    }
  }
}
```

**React Native Example:**
```javascript
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export const initializeNotifications = async () => {
  // Request permission
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('✅ Authorization status:', authStatus);
  }

  // Get FCM token
  const token = await messaging().getToken();
  await saveFCMToken(token);

  // Listen for token refresh
  messaging().onTokenRefresh(saveFCMToken);
};

const saveFCMToken = async (token) => {
  const userId = auth().currentUser?.uid;
  
  if (userId) {
    await firestore()
      .collection('users')
      .doc(userId)
      .update({ fcmToken: token });
      
    console.log('✅ FCM token saved:', token);
  }
};
```

---

### **Step 2: Create Notification Channels (Android Only)**

Android requires notification channels for different priority levels.

**Flutter Example:**
```dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationChannels {
  static final FlutterLocalNotificationsPlugin _notifications = 
      FlutterLocalNotificationsPlugin();
  
  static Future<void> createChannels() async {
    // High priority channel for report status updates
    const AndroidNotificationChannel reportUpdatesChannel = AndroidNotificationChannel(
      'report_updates', // Must match channelId in Cloud Function
      'Report Status Updates',
      description: 'Status updates on your submitted reports',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );
    
    // High priority channel for announcements
    const AndroidNotificationChannel highPriorityAnnouncementsChannel = AndroidNotificationChannel(
      'high_priority_announcements',
      'Important Announcements',
      description: 'High priority announcements from AcciZard',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
    );
    
    // Normal priority channel for announcements
    const AndroidNotificationChannel announcementsChannel = AndroidNotificationChannel(
      'announcements',
      'Announcements',
      description: 'General announcements from AcciZard',
      importance: Importance.defaultImportance,
    );
    
    // Chat messages channel
    const AndroidNotificationChannel chatChannel = AndroidNotificationChannel(
      'chat_messages',
      'Chat Messages',
      description: 'Messages from AcciZard Support',
      importance: Importance.high,
      playSound: true,
    );
    
    await _notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(reportUpdatesChannel);
    
    await _notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(highPriorityAnnouncementsChannel);
    
    await _notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(announcementsChannel);
    
    await _notifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(chatChannel);
  }
}
```

**React Native Example:**
```javascript
import notifee from '@notifee/react-native';

export const createNotificationChannels = async () => {
  // Report status updates channel
  await notifee.createChannel({
    id: 'report_updates',
    name: 'Report Status Updates',
    description: 'Status updates on your submitted reports',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    badge: true,
  });

  // High priority announcements channel
  await notifee.createChannel({
    id: 'high_priority_announcements',
    name: 'Important Announcements',
    description: 'High priority announcements from AcciZard',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  // Normal announcements channel
  await notifee.createChannel({
    id: 'announcements',
    name: 'Announcements',
    description: 'General announcements from AcciZard',
    importance: AndroidImportance.DEFAULT,
  });

  // Chat messages channel
  await notifee.createChannel({
    id: 'chat_messages',
    name: 'Chat Messages',
    description: 'Messages from AcciZard Support',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });

  console.log('✅ Notification channels created');
};
```

---

### **Step 3: Handle Foreground Notifications**

Handle notifications when the app is open (foreground).

**Flutter Example:**
```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class ForegroundNotificationHandler {
  static final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();
  
  static void initialize() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('📩 Foreground notification received: ${message.data}');
      
      RemoteNotification? notification = message.notification;
      AndroidNotification? android = message.notification?.android;
      
      if (notification != null && android != null) {
        _localNotifications.show(
          notification.hashCode,
          notification.title,
          notification.body,
          NotificationDetails(
            android: AndroidNotificationDetails(
              // Use the channel ID from the notification data
              message.data['type'] == 'report_update' 
                  ? 'report_updates'
                  : message.data['type'] == 'announcement'
                      ? (message.data['priority'] == 'high' 
                          ? 'high_priority_announcements' 
                          : 'announcements')
                      : 'chat_messages',
              'AcciZard',
              importance: Importance.high,
              priority: Priority.high,
            ),
          ),
        );
      }
    });
  }
}
```

**React Native Example:**
```javascript
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';

export const setupForegroundHandler = () => {
  messaging().onMessage(async (remoteMessage) => {
    console.log('📩 Foreground notification:', remoteMessage.data);
    
    // Determine channel ID
    let channelId = 'chat_messages';
    if (remoteMessage.data.type === 'report_update') {
      channelId = 'report_updates';
    } else if (remoteMessage.data.type === 'announcement') {
      channelId = remoteMessage.data.priority === 'high' 
        ? 'high_priority_announcements' 
        : 'announcements';
    }
    
    // Display notification
    await notifee.displayNotification({
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      android: {
        channelId,
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
      },
      data: remoteMessage.data,
    });
  });
};
```

---

### **Step 4: Handle Background Notifications**

Handle notifications when the app is closed or in the background.

**Flutter Example:**
```dart
import 'package:firebase_messaging/firebase_messaging.dart';

// This must be a top-level function
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('📩 Background notification: ${message.data}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Register background handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  runApp(MyApp());
}
```

**React Native Example:**
```javascript
import messaging from '@react-native-firebase/messaging';

// Register background handler (in index.js, before AppRegistry)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('📩 Background notification:', remoteMessage.data);
});
```

---

### **Step 5: Handle Notification Taps**

Navigate to the appropriate screen when a user taps a notification.

**Flutter Example:**
```dart
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationTapHandler {
  static void initialize(BuildContext context) {
    // Handle notification tap when app is in background
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      _handleNotificationTap(context, message.data);
    });
    
    // Check if app was opened from a notification (terminated state)
    FirebaseMessaging.instance.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        _handleNotificationTap(context, message.data);
      }
    });
  }
  
  static void _handleNotificationTap(BuildContext context, Map<String, dynamic> data) {
    print('📱 Notification tapped: $data');
    
    switch (data['type']) {
      case 'report_update':
        // Navigate to user's reports screen (My Reports)
        Navigator.pushNamed(context, '/my-reports', arguments: {
          'reportId': data['reportId'],
          'highlightReport': true, // Optional: to highlight the updated report
        });
        break;
        
      case 'announcement':
        // Navigate to announcements screen
        Navigator.pushNamed(context, '/announcements', arguments: {
          'announcementId': data['announcementId'],
        });
        break;
        
      case 'chat_message':
        // Navigate to chat screen
        Navigator.pushNamed(context, '/chat');
        break;
    }
  }
}
```

**React Native Example:**
```javascript
import messaging from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';

export const setupNotificationTapHandler = () => {
  const navigation = useNavigation();

  // Handle notification tap when app is in background
  messaging().onNotificationOpenedApp((remoteMessage) => {
    handleNotificationTap(navigation, remoteMessage.data);
  });

  // Check if app was opened from a notification (terminated state)
  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        handleNotificationTap(navigation, remoteMessage.data);
      }
    });
};

const handleNotificationTap = (navigation, data) => {
  console.log('📱 Notification tapped:', data);

  switch (data.type) {
    case 'report_update':
      // Navigate to user's reports screen (My Reports)
      navigation.navigate('MyReports', { 
        reportId: data.reportId,
        highlightReport: true, // Optional: to highlight the updated report
      });
      break;
      
    case 'announcement':
      navigation.navigate('Announcements', { announcementId: data.announcementId });
      break;
      
    case 'chat_message':
      navigation.navigate('Chat');
      break;
  }
};
```

---

## 📊 Notification Data Structure

Each notification contains specific data fields you can use for navigation and display:

### **Chat Message Notification**
```json
{
  "notification": {
    "title": "AcciZard Lucban",
    "body": "Thank you for reaching out..."
  },
  "data": {
    "type": "chat_message",
    "userId": "user123",
    "messageId": "msg456",
    "senderId": "admin789",
    "senderName": "AcciZard Lucban"
  }
}
```

### **Announcement Notification**
```json
{
  "notification": {
    "title": "🚨 Important Announcement",
    "body": "Typhoon warning in effect for Lucban..."
  },
  "data": {
    "type": "announcement",
    "announcementId": "ann123",
    "announcementType": "Emergency Alert",
    "priority": "high",
    "date": "10/16/2024"
  }
}
```

### **Report Status Update Notification**
```json
{
  "notification": {
    "title": "🚨 Responders Dispatched",
    "body": "Your Fire report is being responded to at Barangay Ayuti"
  },
  "data": {
    "type": "report_update",
    "reportId": "rpt789",
    "reportNumber": "RPT-2024-001",
    "reportType": "Fire",
    "oldStatus": "Pending",
    "newStatus": "Responding",
    "barangay": "Barangay Ayuti",
    "location": "123 Main St"
  }
}
```

**Status Change Notification Titles:**
- `Responding` / `In Progress` → "🚨 Responders Dispatched"
- `Resolved` / `Completed` → "✅ Report Resolved"
- `Cancelled` / `Rejected` → "❌ Report Cancelled"
- `Pending` → "⏳ Report Pending"
- Other statuses → "📋 Report Status Updated"

---

## 🔔 Notification Channels Summary

| Channel ID | Name | Importance | Use Case |
|------------|------|------------|----------|
| `report_updates` | Report Status Updates | HIGH | Status updates on user's submitted reports |
| `high_priority_announcements` | Important Announcements | HIGH | Critical announcements (typhoon warnings, evacuations) |
| `announcements` | Announcements | DEFAULT | General announcements (events, updates) |
| `chat_messages` | Chat Messages | HIGH | Messages from AcciZard Support |

---

## 🚀 Complete Setup Checklist

### **Mobile App Setup:**
- [ ] Initialize FCM and request permissions
- [ ] Get FCM token and save to Firestore (`users/{userId}/fcmToken`)
- [ ] Listen for token refresh and update Firestore
- [ ] Create notification channels (Android)
- [ ] Handle foreground notifications
- [ ] Handle background notifications
- [ ] Handle notification taps and navigation
- [ ] Test notifications for all three types (chat, announcements, reports)

### **Web App Setup:**
- [x] Firebase Cloud Functions initialized
- [x] `sendChatNotification` function created (new chat messages)
- [x] `sendAnnouncementNotification` function created (new announcements)
- [x] `sendReportStatusNotification` function created (report status updates) ✅
- [ ] Deploy Cloud Functions to Firebase

---

## 🛠️ Deploy Cloud Functions

After adding the new report notification function, deploy it:

```bash
# Navigate to functions directory
cd functions

# Install dependencies (if needed)
npm install

# Build TypeScript
npm run build

# Deploy to Firebase
firebase deploy --only functions
```

---

## 🧪 Testing

### **Test 1: Chat Notification**
1. Open mobile app and login
2. From web app, send a chat message to the user
3. Verify notification appears on mobile

### **Test 2: Announcement Notification**
1. Ensure mobile app is logged in
2. From web app, create a new announcement
3. Verify notification appears on mobile
4. Test with different priorities (high, medium, low)

### **Test 3: Report Status Update Notification**
1. From mobile app, submit a test report as a resident user
2. From web app (admin), update the status of that report (e.g., from "Pending" to "Responding")
3. Verify notification appears on the mobile app for that specific user
4. Verify it uses the `report_updates` channel
5. Test different status changes:
   - Pending → Responding (should show "🚨 Responders Dispatched")
   - Responding → Resolved (should show "✅ Report Resolved")
   - Any status → Cancelled (should show "❌ Report Cancelled")

---

## 📞 Support

If you encounter issues:
1. Check Firebase Console > Cloud Functions for errors
2. Verify FCM token is saved in Firestore
3. Check notification channels are created (Android)
4. Review logs in the mobile app console

---

## 🎯 Summary

Your web app automatically sends push notifications via Cloud Functions:
- **Chat messages** → Sent to the specific user when admin sends a message
- **Announcements** → Broadcast to ALL users when a new announcement is created
- **Report status updates** → Sent to the user who submitted the report when admin changes the status

Your mobile app just needs to:
1. **Get and save FCM token** to Firestore
2. **Create 4 notification channels** (Android): `report_updates`, `high_priority_announcements`, `announcements`, `chat_messages`
3. **Handle incoming notifications** (foreground, background, terminated)
4. **Navigate to the correct screen** when tapped (My Reports, Announcements, Chat)

All the heavy lifting (sending notifications, managing tokens, batching) is already done by your Cloud Functions! 🎉

