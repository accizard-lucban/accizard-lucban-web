# Security Rules Implementation Checklist

## 🔒 Always Check When Implementing Features

### Before Writing Code
- [ ] What data will this feature access?
- [ ] What data will this feature create/modify/delete?
- [ ] Who should have permission to perform these actions?
- [ ] What files/media will be uploaded or accessed?

### During Implementation
- [ ] **Firestore Rules:** Does this feature need new collection rules?
- [ ] **Storage Rules:** Does this feature upload/download files?
- [ ] **Authentication:** What user roles need access?
- [ ] **Validation:** What data validation is needed?

### After Implementation
- [ ] Update `firestore.rules` if needed
- [ ] Update `storage.rules` if needed
- [ ] Document the security model in feature docs
- [ ] Test with different user roles (admin, super admin, regular user, unauthenticated)
- [ ] Deploy rules to Firebase: `firebase deploy --only firestore:rules,storage:rules`

---

## 📋 Current Security Model

### Firestore Collections

| Collection | Read | Write | Notes |
|------------|------|-------|-------|
| `users` | Public | Authenticated (own data) or Admin | Profile data |
| `chats` | Public | Admin or Owner | Chat metadata |
| `chat_messages` | Public | Public | Messages (validated by app) |
| `reports` | Public | Public | Reports management |
| `announcements` | Public | Public | Public announcements |
| `superAdmin` | Authenticated | Super Admin only | Admin verification |
| `admins` | Public | Admin only | Admin list |

### Storage Paths

| Path | Read | Write | File Types | Size Limit |
|------|------|-------|------------|------------|
| `profile-pictures-web/` | Public | Owner only | Images | 25MB |
| `chat_attachments/` | Authenticated | Authenticated | Images, PDF, DOC | 25MB |
| `announcements/` | Public | Authenticated | Images, PDF, DOC | 25MB |
| `reports/` | Authenticated | Authenticated | Images, PDF, DOC | 25MB |
| `validIds/` | Authenticated | Owner only | Images | 25MB |
| `documents/` | Authenticated | Owner only | PDF, DOC | 25MB |

---

## 🚨 Common Security Pitfalls

### ❌ Don't Do This:
```javascript
// Firestore Rules
match /{document=**} {
  allow read, write: if true; // TOO PERMISSIVE!
}

// Storage Rules
match /{allPaths=**} {
  allow read, write: if true; // DANGEROUS!
}
```

### ✅ Do This Instead:
```javascript
// Firestore Rules
match /chat_messages/{messageId} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated() && isValidMessage();
}

// Storage Rules
match /chat_attachments/{userId}/{fileName} {
  allow read: if isAuthenticated();
  allow write: if isAuthenticated() && isValidSize() && isValidFileType();
}
```

---

## 🧪 Testing Security Rules

### Firestore Rules Testing
```bash
# In firebase.json, add:
"firestore": {
  "rules": "firestore.rules"
}

# Test locally
firebase emulators:start --only firestore

# Deploy to production
firebase deploy --only firestore:rules
```

### Storage Rules Testing
```bash
# In firebase.json, add:
"storage": {
  "rules": "storage.rules"
}

# Test locally
firebase emulators:start --only storage

# Deploy to production
firebase deploy --only storage:rules
```

---

## 📝 Feature-Specific Security Notes

### Chat Attachments Feature
- **Files stored in:** `chat_attachments/{userId}/`
- **Who can upload:** Any authenticated user (admins and residents)
- **Who can read:** Any authenticated user
- **File types:** Images (JPEG, PNG, GIF, WEBP) and Documents (PDF, DOC, DOCX)
- **Size limit:** 25MB per file
- **Validation:** Done in storage rules (`isImage()` or `isDocument()` and `isValidSize()`)

### Profile Pictures
- **Files stored in:** `profile-pictures-web/{userId}/`
- **Who can upload:** Owner only
- **Who can read:** Public (for display)
- **File types:** Images only
- **Size limit:** 10MB

---

## 🔄 Deployment Process

### 1. Test Locally First
```bash
firebase emulators:start --only firestore,storage
```

### 2. Deploy Rules
```bash
# Deploy both at once
firebase deploy --only firestore:rules,storage:rules

# Or deploy individually
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### 3. Verify in Firebase Console
- Go to Firebase Console → Firestore → Rules
- Go to Firebase Console → Storage → Rules
- Check that rules are updated

---

## 💡 Remember

1. **Default to restrictive** - Start with deny-all, then allow specific access
2. **Validate data** - Check file types, sizes, content types
3. **Use helper functions** - Keep rules DRY and readable
4. **Document changes** - Update this checklist when adding features
5. **Test thoroughly** - Test with different user types before deploying
6. **Deploy together** - Deploy rules along with code changes

---

## 📚 Resources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Storage Security Rules Documentation](https://firebase.google.com/docs/storage/security/start)
- [Rules Testing Documentation](https://firebase.google.com/docs/rules/unit-tests)

