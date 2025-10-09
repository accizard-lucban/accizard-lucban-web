# Quick Deployment Guide - Firebase Auth & Firestore Sync

## What Was Changed

### 1. Cloud Functions (`functions/src/index.ts`)
Added 2 new functions for resident user sync:
- ✅ `deleteResidentUser` - Callable function to delete residents from both Auth & Firestore
- ✅ `deleteAuthUserOnFirestoreDelete` - Auto-delete Auth when Firestore user deleted

**Note**: Admin accounts are Firestore-only (no Auth sync needed)

### 2. Frontend (`src/lib/firebase.ts`)
- ✅ Added Cloud Functions SDK
- ✅ Exported `deleteResidentUserFunction` for frontend use

### 3. User Management Page (`src/components/ManageUsersPage.tsx`)
- ✅ Updated `handleDeleteAdmin` for direct Firestore deletion (admins only)
- ✅ Updated `handleDeleteResident` to use Cloud Function (both Auth & Firestore)
- ✅ Updated `executeBatchAction` for batch deletions
- ✅ Added error handling and toast notifications

## Deployment Commands

### Step 1: Deploy Cloud Functions

```bash
# Navigate to functions directory
cd functions

# Install dependencies (if needed)
npm install

# Build TypeScript
npm run build

# Deploy all functions
firebase deploy --only functions

# OR deploy specific functions
firebase deploy --only functions:deleteResidentUser,functions:deleteAuthUserOnFirestoreDelete
```

### Step 2: Deploy Frontend (if needed)

```bash
# Return to project root
cd ..

# Build frontend
npm run build

# Deploy to hosting
firebase deploy --only hosting

# OR deploy everything
firebase deploy
```

## Testing Checklist

- [ ] Delete a resident from web app → Verify removed from both Auth & Firestore
- [ ] Delete an admin from web app → Verify removed from Firestore only (no Auth)
- [ ] Batch delete residents → Verify all removed from both Auth & Firestore
- [ ] Batch delete admins → Verify all removed from Firestore only
- [ ] Delete Firestore user document manually → Verify Auth user auto-deleted
- [ ] Check Cloud Functions logs for errors

## Important Notes

⚠️ **Resident Email Field Required**: All resident documents in `users` collection must have an `email` field that matches Firebase Auth email.

⚠️ **Admin Accounts**: Admins are Firestore-only (no Firebase Auth). They use username-based authentication.

⚠️ **Billing**: Cloud Functions require Firebase Blaze (pay-as-you-go) plan, but includes generous free tier.

⚠️ **Firestore Triggers**: The background function (deleteAuthUserOnFirestoreDelete) may have a slight delay (typically < 1 second) but prevents orphaned Auth accounts.

## Verification

After deployment, verify in Firebase Console:

1. **Functions Tab**: Both functions (`deleteResidentUser` and `deleteAuthUserOnFirestoreDelete`) should be listed as "Active"
2. **Functions Logs**: Check for deployment success messages
3. **Test deletion**: Delete a test resident and check logs (Admin deletion won't show in Cloud Function logs)

## Rollback (if needed)

If something goes wrong:

```bash
# Deploy previous version of functions
firebase deploy --only functions

# OR restore from git
git checkout HEAD~1 functions/src/index.ts
npm run build
firebase deploy --only functions
```

## Support

For issues or questions:
- Check `docs/FIREBASE_AUTH_SYNC_SETUP.md` for detailed documentation
- Review Cloud Functions logs: `firebase functions:log`
- Check Firebase Console → Functions for error details

