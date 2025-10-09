# Firebase Authentication and Firestore Sync

This document explains how the Firebase Authentication and Firestore synchronization works in the AcciZard application.

## Overview

The application maintains synchronization between Firebase Authentication and Firestore for **resident users only**. Admin accounts use username-based authentication and are stored exclusively in Firestore.

## Account Types

### Resident Users
- **Authentication**: Firebase Authentication (email/password)
- **Storage**: Both Firebase Auth AND Firestore (`users` collection)
- **Deletion**: Requires deletion from both systems

### Admin Users
- **Authentication**: Username/password (Firestore only)
- **Storage**: Firestore only (`admins` collection)
- **Deletion**: Firestore only - no Firebase Auth involvement

## Key Features

1. **Resident User Sync**: User deletions are synchronized between Auth and Firestore
   - When a resident is deleted from the web app → deleted from both Firestore and Firebase Auth
   - When a Firestore user document is deleted → corresponding Auth user is automatically deleted

2. **Admin Simplicity**: Admin accounts are Firestore-only
   - No Firebase Auth sync needed
   - Faster deletion process
   - Simpler account management

3. **Graceful Fallback**: If the Cloud Function fails, the system falls back to Firestore-only deletion

## Implementation Details

### Cloud Functions

The following Cloud Functions are deployed to handle synchronization for resident users:

#### 1. `deleteResidentUser` (Callable Function)
- **Purpose**: Called from the frontend to delete a resident from both Auth and Firestore
- **Parameters**:
  - `email`: Resident's email address
  - `docId`: Firestore document ID in `users` collection
- **Process**:
  1. Deletes user from Firebase Auth using email
  2. Deletes corresponding Firestore document from `users` collection
  3. Returns success/error status
- **Note**: Only for residents; admins are deleted directly from Firestore

#### 2. `deleteAuthUserOnFirestoreDelete` (Background Trigger)
- **Purpose**: Automatically deletes Firebase Auth user when Firestore resident document is deleted
- **Trigger**: Firestore document deletion in `users/{docId}`
- **Process**:
  1. Retrieves email from deleted document
  2. Finds and deletes corresponding Firebase Auth user
- **Note**: Only applies to `users` collection, not `admins`

### Frontend Implementation

The `ManageUsersPage.tsx` component handles deletions differently for admins and residents:

**For Resident Users:**
- **Single Deletion**: `handleDeleteResident` calls the `deleteResidentUser` Cloud Function
- **Batch Deletion**: `executeBatchAction` calls the Cloud Function for each selected resident
- **Fallback**: If Cloud Function fails, falls back to direct Firestore deletion
- **User Feedback**: Toast notifications inform admins of success/failure

**For Admin Users:**
- **Direct Firestore Deletion**: `handleDeleteAdmin` directly deletes from Firestore
- **No Auth Sync**: Admins don't use Firebase Auth, so no sync needed
- **Simpler Process**: Faster deletion with fewer potential failure points

## Deployment Instructions

### Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Authenticated with Firebase: `firebase login`
3. Firebase project initialized

### Deploy Cloud Functions

1. Navigate to the functions directory:
   ```bash
   cd functions
   ```

2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Deploy the functions:
   ```bash
   firebase deploy --only functions
   ```

   Or deploy specific functions:
   ```bash
   firebase deploy --only functions:deleteUser,functions:deleteAuthUserOnFirestoreDelete,functions:deleteAuthAdminOnFirestoreDelete,functions:onAuthUserDeleted
   ```

5. Verify deployment in Firebase Console → Functions

### Deploy Frontend

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```

## Testing Guide

### Test 1: Delete Resident from Web App

1. Log in to the admin panel
2. Navigate to "Manage Users" → "Residents"
3. Delete a resident account
4. **Expected Results**:
   - Resident removed from Firestore `users` collection
   - Resident removed from Firebase Authentication
   - Success toast notification displayed

**Verification**:
- Check Firebase Console → Authentication → Users (user should be removed)
- Check Firebase Console → Firestore → users collection (document should be removed)

### Test 1b: Delete Admin from Web App

1. Log in to the admin panel
2. Navigate to "Manage Users" → "Admin Accounts"
3. Delete an admin account
4. **Expected Results**:
   - Admin removed from Firestore `admins` collection
   - No Firebase Auth changes (admins don't use Auth)
   - Success toast notification displayed

**Verification**:
- Check Firebase Console → Firestore → admins collection (document should be removed)

### Test 2: Delete Firestore Document Directly

1. Open Firebase Console → Firestore → users collection
2. Manually delete a user document
3. **Expected Results**:
   - Corresponding Firebase Auth user automatically deleted
   - Check Firebase Console → Authentication (user should be removed)

**Verification**:
- Check Cloud Functions logs for `deleteAuthUserOnFirestoreDelete` execution
- Verify Firebase Auth user is deleted

**Note**: If you manually delete from Firebase Authentication Console, you'll need to manually delete the Firestore document as well, as Auth deletion triggers are not available in Firebase Functions v2.

### Test 3: Batch Delete Residents

1. Log in to the admin panel
2. Navigate to "Manage Users" → "Residents"
3. Select multiple residents using checkboxes
4. Click "Delete Selected"
5. Confirm deletion
6. **Expected Results**:
   - All selected residents removed from both Auth and Firestore
   - Success toast notification displayed

### Test 3b: Batch Delete Admins

1. Log in to the admin panel
2. Navigate to "Manage Users" → "Admin Accounts"
3. Select multiple admins using checkboxes
4. Click "Delete Selected"
5. Confirm deletion
6. **Expected Results**:
   - All selected admins removed from Firestore only
   - Success toast notification displayed

### Test 4: Delete Resident Without Email

1. Create a test resident in Firestore `users` collection without an email field
2. Try to delete from web app
3. **Expected Results**:
   - Resident removed from Firestore
   - Warning logged (Auth user not found)
   - Success toast notification displayed

## Important Notes

### Email Field Requirement

**For Residents** (`users` collection):
- **Required**: All resident documents MUST have an `email` field that matches their Firebase Authentication email
- The `email` field is automatically tracked and saved during registration
- Used for Auth-Firestore synchronization

**For Admins** (`admins` collection):
- **Not Required**: Admins don't need an email field
- Admins use username-based authentication stored in Firestore only
- No Firebase Auth synchronization needed

### Security Rules

Ensure Firebase Security Rules allow authenticated admins to delete users:

```javascript
// Firestore Rules
match /users/{userId} {
  // Allow admins to delete resident accounts
  allow delete: if request.auth != null && 
                   exists(/databases/$(database)/documents/admins/$(request.auth.uid));
}

match /admins/{adminId} {
  // Allow super admins to delete admin accounts
  allow delete: if request.auth != null && 
                   get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'super_admin';
}
```

### Error Handling

The implementation includes comprehensive error handling:

1. **Cloud Function Errors**: Frontend falls back to Firestore-only deletion
2. **Auth User Not Found**: Gracefully continues with Firestore deletion
3. **Network Errors**: Displays error toast notification
4. **Logging**: All errors logged to Firebase Functions logs for debugging

## Monitoring

### View Cloud Function Logs

1. Firebase Console → Functions → Logs
2. Or use CLI: `firebase functions:log`

### Key Log Messages

**For Residents:**
- `Successfully deleted auth user with email: {email}`
- `Auth user not found for email: {email}` (warning)
- `Deleted Firestore document: users/{docId}`
- `Error deleting user: {email}`

**For Admins:**
- No Cloud Function logs (direct Firestore deletion)
- Check application logs for success/error messages

## Troubleshooting

### Issue: Cloud Function not found

**Solution**: Ensure functions are deployed:
```bash
firebase deploy --only functions
```

### Issue: Permission denied

**Solution**: 
1. Check that the user is authenticated
2. Verify Firebase Security Rules allow the operation
3. Ensure the Cloud Function has proper IAM permissions

### Issue: Email not found in Firestore for resident

**Solution**: 
1. Update all existing resident documents in `users` collection to include email field
2. Ensure resident registration forms always save email field
3. Email is required for Auth-Firestore sync to work

### Issue: Sync not working

**Solution**:
1. Check Cloud Functions logs for errors
2. Verify Firestore triggers are enabled
3. Ensure email fields match between Auth and Firestore
4. Check Firebase project billing is enabled (required for Cloud Functions)

## Migration Steps for Existing Data

If you have existing residents without email fields:

1. **Export existing data** from Firestore `users` collection
2. **Update records** to include email field matching Firebase Auth
3. **Re-import data** to Firestore

Example script to verify emails for existing residents:

```javascript
// Run in Firebase Console or as a one-time verification script
const users = await getDocs(collection(db, "users"));
for (const doc of users.docs) {
  const data = doc.data();
  if (!data.email) {
    console.warn(`Missing email for user: ${doc.id}`);
    // Manually add email or update user document
  }
}
```

**Note**: Admins don't need email migration as they don't use Firebase Auth.

## Cost Considerations

- **Cloud Function Invocations**: Each user deletion triggers multiple functions
- **Free Tier**: Includes 2 million invocations/month
- **Pricing**: After free tier, $0.40 per million invocations
- **Optimization**: Consider batching large deletions if needed

## Future Enhancements

1. **Batch Cloud Function**: Single function call for multiple resident deletions
2. **Soft Delete**: Option to suspend accounts instead of permanent deletion
3. **Audit Trail**: Enhanced logging of all sync operations
4. **Auth Deletion Trigger**: Implement Auth deletion monitoring (when available in v2 API)
5. **Automated Cleanup**: Periodic check for orphaned Auth accounts

## References

- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Firebase Auth Triggers](https://firebase.google.com/docs/functions/auth-events)
- [Firestore Triggers](https://firebase.google.com/docs/functions/firestore-events)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

