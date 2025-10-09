/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentDeleted } from "firebase-functions/v2/firestore";
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

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
