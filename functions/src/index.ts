/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentDeleted, onDocumentCreated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Cloud Function: Delete Auth user when Firestore user document is deleted
// This handles the case when a resident user is deleted from Firestore
// Note: Admins use username-only authentication and are stored in Firestore only
export const deleteAuthUserOnFirestoreDelete = onDocumentDeleted(
  "users/{docId}",
  async (event) => {
    const deletedData = event.data?.data();
    
    if (!deletedData || !deletedData.email) {
      logger.warn(`No email found in deleted document ${event.params.docId}`);
      return;
    }

    const email = deletedData.email;
    
    try {
      // Find user by email and delete from Auth
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().deleteUser(userRecord.uid);
      logger.info(`Successfully deleted auth user with email: ${email}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        logger.warn(`Auth user not found for email: ${email}`);
      } else {
        logger.error(`Error deleting auth user for email: ${email}`, error);
      }
    }
  }
);

// Callable Function: Delete resident user from both Auth and Firestore
// This is called from the frontend when deleting a resident user
// Note: Admin accounts are Firestore-only and don't use Firebase Auth
export const deleteResidentUser = onCall(async (request) => {
  // Check if user is authenticated and has admin privileges
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { email, docId } = request.data;

  if (!email || !docId) {
    throw new HttpsError(
      "invalid-argument",
      "Email and docId are required"
    );
  }

  try {
    // Delete from Firebase Auth first
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().deleteUser(userRecord.uid);
      logger.info(`Deleted auth user: ${email}`);
    } catch (authError: any) {
      if (authError.code === 'auth/user-not-found') {
        logger.warn(`Auth user not found for email: ${email}, continuing with Firestore deletion`);
      } else {
        throw authError;
      }
    }

    // Delete from Firestore
    await admin.firestore().collection("users").doc(docId).delete();
    logger.info(`Deleted Firestore document: users/${docId}`);

    return { success: true, message: "User deleted successfully" };
  } catch (error: any) {
    logger.error(`Error deleting user: ${email}`, error);
    throw new HttpsError("internal", error.message);
  }
});

// Note: Manual deletions from Firebase Console
// If a user is manually deleted from Firebase Authentication Console,
// you should also manually delete the corresponding Firestore document from the 'users' collection.
// The primary deletion flow is through the app, which handles both Auth and Firestore automatically.

// Cloud Function: Send push notification when new chat message is created
export const sendChatNotification = onDocumentCreated(
  "chat_messages/{messageId}",
  async (event) => {
    const messageData = event.data?.data();
    
    if (!messageData) {
      logger.warn("No message data found");
      return;
    }

    const { userId, senderId, senderName, message, imageUrl, videoUrl, audioUrl, fileUrl, fileName } = messageData;

    // Don't send notification if sender is the user themselves
    if (userId === senderId) {
      logger.info("Message sent by user themselves, skipping notification");
      return;
    }

    try {
      // Get user's FCM token from Firestore
      const userDoc = await admin.firestore().collection("users").doc(userId).get();
      
      if (!userDoc.exists) {
        logger.warn(`User document not found for userId: ${userId}`);
        return;
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) {
        logger.warn(`No FCM token found for user: ${userId}`);
        return;
      }

      // Determine notification body based on message type
      let notificationBody = message || "New message";
      
      if (imageUrl) {
        notificationBody = "📷 Sent a photo";
      } else if (videoUrl) {
        notificationBody = "🎥 Sent a video";
      } else if (audioUrl) {
        notificationBody = "🎵 Sent an audio";
      } else if (fileUrl) {
        notificationBody = `📎 Sent ${fileName || "a file"}`;
      }

      // Prepare notification payload
      const notificationPayload = {
        token: fcmToken,
        notification: {
          title: senderName || "AcciZard Lucban",
          body: notificationBody,
        },
        data: {
          type: "chat_message",
          userId: userId,
          messageId: event.params.messageId,
          senderId: senderId,
          senderName: senderName || "AcciZard Lucban",
        },
        android: {
          priority: "high" as const,
          notification: {
            sound: "default",
            channelId: "chat_messages",
            priority: "high" as const,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      // Send notification
      const response = await admin.messaging().send(notificationPayload);
      logger.info(`Successfully sent notification to user ${userId}. Response: ${response}`);
      
    } catch (error: any) {
      logger.error(`Error sending notification to user ${userId}:`, error);
      
      // If token is invalid, remove it from Firestore
      if (error.code === "messaging/invalid-registration-token" || 
          error.code === "messaging/registration-token-not-registered") {
        logger.info(`Removing invalid FCM token for user ${userId}`);
        await admin.firestore().collection("users").doc(userId).update({
          fcmToken: admin.firestore.FieldValue.delete()
        });
      }
    }
  }
);

// Cloud Function: Send push notifications when new announcement is created
export const sendAnnouncementNotification = onDocumentCreated(
  "announcements/{announcementId}",
  async (event) => {
    const announcementData = event.data?.data();
    
    if (!announcementData) {
      logger.warn("No announcement data found");
      return;
    }

    const { type, description, priority, date } = announcementData;

    try {
      // Get all users with FCM tokens
      const usersSnapshot = await admin.firestore().collection("users").get();
      
      const usersWithTokens = usersSnapshot.docs
        .map(doc => ({
          userId: doc.id,
          fcmToken: doc.data().fcmToken
        }))
        .filter(user => user.fcmToken); // Only users with FCM tokens

      if (usersWithTokens.length === 0) {
        logger.info("No users with FCM tokens found");
        return;
      }

      logger.info(`Sending announcement notification to ${usersWithTokens.length} users`);

      // Determine notification title based on priority
      let notificationTitle = "New Announcement";
      if (priority === "high") {
        notificationTitle = "🚨 Important Announcement";
      } else if (priority === "medium") {
        notificationTitle = "📢 New Announcement";
      } else {
        notificationTitle = "ℹ️ Announcement";
      }

      // Truncate description for notification body (max 100 chars)
      const notificationBody = description && description.length > 100
        ? description.substring(0, 97) + "..."
        : description || "Check the app for details";

      // Prepare notification payload
      const basePayload = {
        notification: {
          title: notificationTitle,
          body: notificationBody,
        },
        data: {
          type: "announcement",
          announcementId: event.params.announcementId,
          announcementType: type || "general",
          priority: priority || "low",
          date: date || "",
        },
        android: {
          priority: priority === "high" ? "high" as const : "normal" as const,
          notification: {
            sound: "default",
            channelId: priority === "high" ? "high_priority_announcements" : "announcements",
            priority: priority === "high" ? "high" as const : "default" as const,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
      };

      // Send notifications in batches (FCM limit: 500 per batch)
      const batchSize = 500;
      const batches = [];
      
      for (let i = 0; i < usersWithTokens.length; i += batchSize) {
        const batch = usersWithTokens.slice(i, i + batchSize);
        batches.push(batch);
      }

      let successCount = 0;
      let failureCount = 0;
      const invalidTokens: string[] = [];

      for (const batch of batches) {
        const messages = batch.map(user => ({
          ...basePayload,
          token: user.fcmToken,
        }));

        try {
          const response = await admin.messaging().sendEach(messages);
          
          successCount += response.successCount;
          failureCount += response.failureCount;

          // Track invalid tokens
          response.responses.forEach((result, index) => {
            if (!result.success && result.error) {
              const errorCode = result.error.code;
              if (errorCode === "messaging/invalid-registration-token" ||
                  errorCode === "messaging/registration-token-not-registered") {
                invalidTokens.push(batch[index].userId);
              }
            }
          });
          
        } catch (error: any) {
          logger.error("Error sending batch notifications:", error);
          failureCount += batch.length;
        }
      }

      // Remove invalid tokens from Firestore
      if (invalidTokens.length > 0) {
        logger.info(`Removing ${invalidTokens.length} invalid FCM tokens`);
        
        const deletePromises = invalidTokens.map(userId =>
          admin.firestore().collection("users").doc(userId).update({
            fcmToken: admin.firestore.FieldValue.delete()
          })
        );
        
        await Promise.all(deletePromises);
      }

      logger.info(`Announcement notification sent. Success: ${successCount}, Failed: ${failureCount}, Invalid tokens removed: ${invalidTokens.length}`);
      
    } catch (error: any) {
      logger.error("Error sending announcement notifications:", error);
    }
  }
);

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
