# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**AcciZard** is an emergency management web application for Lucban, Philippines. It's a React-based single-page application that allows admins and super admins to manage disaster reports, communicate with residents, view risk maps, and monitor system activity.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- UI: shadcn-ui + Tailwind CSS + Radix UI
- Backend: Firebase (Authentication, Firestore, Storage, Cloud Functions)
- Hosting: Firebase Hosting
- Maps: Mapbox GL
- Charts: Recharts, Nivo
- State: React Query

## Common Commands

### Development
```bash
# Install dependencies
npm i

# Start development server (runs on http://[::]:8080)
npm run dev

# Build for production
npm run build

# Build for development mode (includes source maps)
npm run build:dev

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

### Firebase
```bash
# Deploy entire app to Firebase
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only Storage rules
firebase deploy --only storage:rules

# Deploy only Cloud Functions
firebase deploy --only functions

# Start Firebase emulators (hosting on port 5000)
firebase emulators:start

# Start specific emulators
firebase emulators:start --only firestore,storage
```

### Cloud Functions (in `functions/` directory)
```bash
cd functions

# Install dependencies
npm i

# Build TypeScript
npm run build

# Build and watch for changes
npm run build:watch

# Lint (currently disabled for deploy)
npm run lint

# Deploy functions
npm run deploy

# View function logs
npm run logs

# Test functions locally
npm run serve

# Run interactive shell
npm run shell
```

## Environment Setup

1. Copy `.env.example` to `.env` and fill in:
   - Firebase configuration (API key, project ID, etc.)
   - Mapbox access token

2. Required Firebase services must be enabled in Firebase Console:
   - Authentication (Email/Password)
   - Firestore Database
   - Firebase Storage
   - Cloud Functions
   - Firebase Hosting

## Architecture

### Authentication System

**Two User Types:**
1. **Super Admin** - Uses Firebase Authentication (email/password)
   - Stored in `superAdmin` collection in Firestore
   - Full system access with all permissions
   - Can manage both admins and residents

2. **Regular Admin** - Uses custom authentication (username/password)
   - Stored in `admins` collection in Firestore
   - Limited permissions based on role
   - Cannot access Firebase Auth directly

**Session Management:**
- Centralized in `src/lib/sessionManager.ts`
- Sessions persist until manual logout (no timeout)
- Stores user type, username, userId, and metadata
- Legacy session data is auto-migrated on first load

**Key Files:**
- `src/lib/sessionManager.ts` - Session management logic
- `src/hooks/useUserRole.ts` - User role and permissions hook
- `src/components/LoginForm.tsx` - Login implementation
- `src/App.tsx` - Auth context and route protection

### Firestore Data Model

**Main Collections:**
- `users` - Resident profiles (mobile app users)
  - Includes: name, email, phone, location, profile picture
  - Presence fields: `isOnline`, `lastSeen`, `fcmToken`
  
- `admins` - Regular admin accounts
  - Includes: username, name, email, position, permissions, idNumber
  
- `superAdmin` - Super admin accounts (Firebase Auth users)
  - Includes: email, name, position, permissions
  
- `reports` - Disaster/incident reports submitted by residents
  - Includes: type, location, description, status, media attachments
  
- `chats` - Chat session metadata (one per resident)
  - Document ID = userId
  - Includes: last message preview, timestamps, typing indicators, user info
  
- `chat_messages` - Individual chat messages
  - Includes: senderId, message, timestamp, read status, attachments
  
- `announcements` - System-wide announcements
  - Includes: title, content, category, media, timestamps

**Permissions Model:**
- Super admins have `permissions: ["all"]`
- Regular admins have specific permissions like:
  - `view_reports`, `manage_reports`
  - `view_email`, `manage_residents`
  - `manage_admins` (super admin only)

### Firebase Storage Structure

**Storage Paths:**
- `profile-pictures-web/{userId}/` - Admin/super admin profile pictures
- `chat_attachments/{userId}/` - Chat media (images, videos, audio, documents)
- `announcements/` - Announcement media
- `reports/` - Report attachments (images, documents)
- `validIds/{userId}/` - User ID verification documents
- `documents/{userId}/` - Other user documents

**File Restrictions (defined in storage.rules):**
- Max size: 25MB
- Allowed types: Images (JPEG, PNG, GIF, WEBP), PDF, DOC/DOCX
- Authentication required for most paths
- Ownership validation for user-specific paths

### Code Splitting & Performance

**Route-Based Lazy Loading:**
- All page components are lazy-loaded using `React.lazy()`
- Wrapped in `<Suspense>` with branded loading spinner
- Reduces initial bundle from ~800KB to ~300KB (62% reduction)

**Vendor Chunk Splitting (configured in vite.config.ts):**
- `react-vendor` - React core libraries
- `firebase-vendor` - Firebase SDK modules
- `ui-vendor` - Radix UI components
- `chart-vendor` - Chart libraries (Recharts)
- `query-vendor` - TanStack Query

**Route Preloading:**
- Routes preload on hover/focus/touch in navigation (see `src/utils/routePreloader.ts`)
- Provides near-instant navigation feel
- Cached to prevent duplicate loads

### Real-Time Features

**Chat System:**
- Real-time message sync using Firestore listeners
- Online presence tracking (green dot indicators)
- Typing indicators (both admin and user)
- Unread message counters (per-conversation and sidebar badge)
- Media attachments (images, videos, audio, documents)
- Message search with highlighting
- Admin messages branded as "AcciZard Lucban"

**Dashboard:**
- Live report statistics and charts
- Real-time activity logs
- Auto-updating system metrics

**Maps:**
- Mapbox GL integration for risk maps
- Real-time pin markers for incidents
- Custom styling with AcciZard branding

### UI Design System

**Brand Colors:**
- Primary Orange: `#f97316` (orange-500)
- Secondary Red: `#991b1b` (red-800)
- Gradient: `bg-gradient-to-b from-brand-orange to-brand-red` (sidebar/nav)

**Typography:**
- Font: Poppins (defined in tailwind.config.ts)
- Page titles: `text-2xl sm:text-3xl font-bold`
- Section headers: `text-lg font-semibold`
- Body text: `text-sm text-gray-600`
- Form labels: `text-sm sm:text-base font-medium`
- Stat numbers: `text-2xl font-bold text-brand-orange`

**Components:**
- Flat design with strategic gradients
- High contrast for accessibility (4.5:1 minimum)
- Responsive sizing (`text-sm sm:text-base` pattern)
- Consistent spacing scale (p-4, p-6, gap-4, gap-6)
- Shadow system: `shadow-sm` (cards), `shadow-lg` (modals, emergency buttons)

## Development Workflow

### Adding New Features

1. **Check Security Rules** - Review `SECURITY_RULES_CHECKLIST.md`
   - Determine Firestore/Storage access requirements
   - Update `firestore.rules` and `storage.rules` if needed
   - Deploy rules: `firebase deploy --only firestore:rules,storage:rules`

2. **Follow UI Standards** - Review `UI_DESIGN_GUIDE.md`
   - Use brand colors and typography scale
   - Ensure responsive design (`sm:`, `md:`, `lg:` breakpoints)
   - Maintain high contrast and accessibility
   - Test on mobile and desktop

3. **Use Existing Patterns**
   - Check similar components for consistency
   - Use `useUserRole()` hook for permissions
   - Use `SessionManager` for auth state
   - Follow lazy-loading pattern for new routes

4. **Lint Before Commit**
   ```bash
   npm run lint
   ```

### Modifying Chat Features

**Key Considerations:**
- Chat sessions use `userId` as document ID
- Admin messages always show as "AcciZard Lucban"
- Attachments stored in `chat_attachments/{userId}/`
- Real-time listeners clean up on unmount
- Typing indicators timeout after 3 seconds
- See `CHAT_IMPLEMENTATION_GUIDE.md` for details

### Working with Reports

**Report Types:**
- Road Crash, Fire, Flood, Landslide, Building Collapse, Medical Emergency, etc.
- Status flow: Submitted → Viewed → Resolved
- Media attachments stored in `reports/` in Storage
- See `ManageReportsPage.tsx` for implementation

### Testing Firebase Rules

```bash
# Start emulators
firebase emulators:start --only firestore,storage

# Test with different user types:
# - Unauthenticated
# - Regular admin (localStorage: adminLoggedIn=true)
# - Super admin (Firebase Auth signed in)

# Verify rules in Firebase Console after deploy
```

### Adding New Routes

1. Create component in `src/components/` or `src/pages/`
2. Add lazy import in `src/App.tsx`:
   ```tsx
   const NewPage = lazy(() => import("./components/NewPage").then(module => ({ default: module.NewPage })));
   ```
3. Add route inside `<PrivateRoute>` or public routes
4. Add navigation item in `src/components/Sidebar.tsx` with preload function
5. Update route preloader if needed

### Deployment

**Production Deployment:**
```bash
# Build app
npm run build

# Deploy everything
firebase deploy

# Or deploy selectively
firebase deploy --only hosting
firebase deploy --only functions
```

**Environment Variables:**
- Never commit `.env` file
- Use `.env.example` as template
- Set Firebase env vars in project settings
- Vite variables must be prefixed with `VITE_`

## Key Files and Locations

**Configuration:**
- `vite.config.ts` - Vite build config, chunk splitting
- `tailwind.config.ts` - Tailwind/design tokens
- `firebase.json` - Firebase hosting and emulator config
- `firestore.rules` - Firestore security rules
- `storage.rules` - Firebase Storage security rules
- `tsconfig.json` - TypeScript configuration

**Core Application:**
- `src/App.tsx` - Main app, routing, auth provider
- `src/main.tsx` - Entry point
- `src/lib/firebase.ts` - Firebase initialization
- `src/lib/sessionManager.ts` - Session management
- `src/lib/utils.ts` - Utility functions

**Hooks:**
- `src/hooks/useUserRole.ts` - User permissions and role checking
- `src/hooks/usePins.ts` - Map pins management
- `src/hooks/useFileUpload.ts` - File upload utilities
- `src/hooks/use-toast.ts` - Toast notifications

**Key Components:**
- `src/components/Layout.tsx` - Main layout wrapper
- `src/components/Sidebar.tsx` - Navigation sidebar
- `src/components/LoginForm.tsx` - Authentication
- `src/components/ChatSupportPage.tsx` - Chat system
- `src/components/ManageReportsPage.tsx` - Report management
- `src/components/ManageUsersPage.tsx` - User management
- `src/components/RiskMapPage.tsx` - Mapbox integration

**Cloud Functions:**
- `functions/src/index.ts` - Cloud Functions entry point
- Functions include: deleteResidentUser, PAGASA bulletin scraping, push notifications

## Important Notes

### Windows Development
This project is developed on Windows with PowerShell. File paths use backslashes. When suggesting commands, use Windows-compatible syntax.

### Firebase Security
- Regular admins don't use Firebase Auth - they use custom authentication
- Super admins use Firebase Auth (email/password)
- Storage and Firestore rules accommodate both auth types
- See `SECURITY_RULES_CHECKLIST.md` before modifying security rules

### Performance
- Initial bundle size is critical - use code splitting for new features
- Vendor chunks are cached long-term - minimize changes to dependencies
- Route preloading provides instant navigation feel
- See `CODE_SPLITTING_GUIDE.md` for details

### Branding
- Always use AcciZard brand colors (orange #f97316, red #991b1b)
- Admin chat messages always branded as "AcciZard Lucban"
- Profile pictures, logos, and assets in `/public/accizard-uploads/`
- Maintain high contrast for emergency readability

### No Test Framework
This project currently has no test framework configured. Manual testing is required for all features. When adding new features, test with both admin and super admin accounts.
