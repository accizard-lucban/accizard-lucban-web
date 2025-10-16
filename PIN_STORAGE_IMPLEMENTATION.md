# Pin Storage Implementation Guide

## ✅ Implementation Complete

This document describes the pin storage system implemented for the AcciZard Risk Map.

---

## 📋 Overview

Pins are map markers that can be created by admins and displayed on both the web app and mobile app. They represent:
- **Accidents/Hazards**: Road crashes, fires, medical emergencies, natural disasters, etc.
- **Emergency Facilities**: Evacuation centers, hospitals, police stations, fire stations, government offices

---

## 🗄️ Database Schema

### Collection: `pins`

Each pin document contains:

```typescript
{
  // Firestore auto-generated ID
  
  type: string,              // "Road Crash", "Fire", "Evacuation Centers", etc.
  category: string,          // "accident" or "facility"
  title: string,             // Max 60 characters, user-provided
  
  latitude: number,          // Geographic coordinate
  longitude: number,         // Geographic coordinate
  locationName: string,      // Geocoded address
  
  reportId: string | null,   // Optional link to reports collection
  
  createdAt: Timestamp,      // Server timestamp
  updatedAt: Timestamp,      // Server timestamp
  createdBy: string,         // Admin user ID
  createdByName: string,     // Admin display name
  
  searchTerms: string[]      // Array of search keywords
}
```

---

## 🔒 Security Rules

### Firestore Rules (`firestore.rules`)

```javascript
match /pins/{pinId} {
  // Public read access (anyone can view pins - mobile app + web app)
  allow read: if true;
  
  // Only admins (Super Admin or LDRRMO Admin) can create, update, or delete
  allow create, update, delete: if isAdmin();
}
```

**Key Points:**
- ✅ Super admins have full access (via `isAdmin()` function)
- ✅ Mobile app can read all pins without authentication
- ✅ Regular users cannot modify pins
- ✅ Hard delete (permanent deletion, no soft delete)

---

## 📱 Mobile App Integration

### Fetching All Pins

```typescript
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

// Fetch all pins
const pinsRef = collection(db, "pins");
const snapshot = await getDocs(pinsRef);

const pins = snapshot.docs.map(doc => ({
  id: doc.id,
  ...doc.data()
}));

// Display on map
pins.forEach(pin => {
  addMarker({
    latitude: pin.latitude,
    longitude: pin.longitude,
    title: pin.title,
    type: pin.type,
    locationName: pin.locationName
  });
});
```

### Filtering by Type

```typescript
// Get only accident pins
const accidentPins = pins.filter(pin => pin.category === 'accident');

// Get specific type
const roadCrashPins = pins.filter(pin => pin.type === 'Road Crash');

// Get facility pins
const facilityPins = pins.filter(pin => pin.category === 'facility');
```

### Real-time Updates

```typescript
import { onSnapshot } from 'firebase/firestore';

const unsubscribe = onSnapshot(collection(db, "pins"), (snapshot) => {
  const pins = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Update map markers
  updateMapMarkers(pins);
});

// Don't forget to unsubscribe when component unmounts
return () => unsubscribe();
```

---

## 🎯 Web App Features

### RiskMapPage

1. **Create Pins**
   - Select pin type (accident or facility)
   - Enter title (max 60 characters) with helpful tooltip
   - Click on map to set coordinates
   - Location name auto-filled via geocoding
   - Optional: Link to a report
   - Click "Add Pin to Map" to save

2. **View Pins**
   - All pins from database displayed automatically
   - Real-time updates (new pins appear instantly)
   - Click pin to see popup with details

3. **Filter Pins**
   - By accident/hazard type (Road Crash, Fire, etc.)
   - By facility type (Evacuation Centers, Health Facilities, etc.)
   - By date range (creation date)
   - By search query (title, location name, type)

4. **Preview Pin**
   - Before saving, see temporary marker on map
   - Shows exactly where pin will be placed
   - Can adjust coordinates before saving

---

## 🛠️ Implementation Files

### New Files Created

1. **`src/types/pin.ts`**
   - TypeScript interfaces for Pin data
   - Helper functions for category determination
   - Search term generation

2. **`src/hooks/usePins.ts`**
   - `createPin()` - Create new pin in database
   - `updatePin()` - Update existing pin
   - `deletePin()` - Permanently delete pin
   - `getPinById()` - Fetch single pin
   - `subscribeToPins()` - Real-time pin subscription with filters
   - `fetchPins()` - One-time fetch

### Updated Files

1. **`firestore.rules`**
   - Added security rules for pins collection

2. **`src/components/RiskMapPage.tsx`**
   - Integrated usePins hook
   - Real-time pin fetching with filters
   - Database-backed pin creation
   - Toast notifications
   - Loading states
   - Title field with tooltip and 60-char limit

3. **`src/components/MapboxMap.tsx`**
   - Added `pins` prop
   - Renders database pins as markers
   - Supports both temporary preview and saved pins

---

## 🧪 Testing Guide

### Web App Testing

1. **Create a Pin**
   ```
   1. Go to Risk Map page
   2. Click "Add Pin" tab
   3. Select type: "Road Crash"
   4. Enter title: "Highway Junction Accident"
   5. Click anywhere on map
   6. Verify coordinates auto-fill
   7. Verify location name auto-fills
   8. Click "Add Pin to Map"
   9. See success toast notification
   10. Pin should appear on map immediately
   ```

2. **Filter Pins**
   ```
   1. Click "Filters" tab
   2. Check "Road Crash"
   3. Map should show only Road Crash pins
   4. Uncheck "Road Crash", check "Fire"
   5. Map should update to show only Fire pins
   6. Check multiple types
   7. Map should show all checked types
   ```

3. **Search Pins**
   ```
   1. Use search bar at top of map
   2. Type part of a pin title
   3. Map should filter to matching pins
   4. Clear search to show all pins again
   ```

4. **Date Range Filter**
   ```
   1. Go to Filters tab
   2. Select date range
   3. Map shows only pins created in that range
   ```

5. **Link Pin to Report**
   ```
   1. Go to Manage Reports
   2. Click MapPin icon on a report
   3. Navigate to Risk Map
   4. Form pre-fills with report data
   5. Add title and click "Add Pin to Map"
   6. Pin saved with reportId link
   ```

### Mobile App Testing

1. **Fetch All Pins**
   ```dart
   // Example Flutter/Dart code
   final pinsSnapshot = await FirebaseFirestore.instance
     .collection('pins')
     .get();
   
   final pins = pinsSnapshot.docs.map((doc) => {
     return {
       'id': doc.id,
       ...doc.data()
     };
   }).toList();
   
   print('Total pins: ${pins.length}');
   ```

2. **Display on Map**
   ```dart
   // Add markers to map
   for (var pin in pins) {
     addMarker(
       LatLng(pin['latitude'], pin['longitude']),
       title: pin['title'],
       snippet: pin['locationName'],
       icon: getMarkerIconForType(pin['type'])
     );
   }
   ```

3. **Real-time Updates**
   ```dart
   FirebaseFirestore.instance
     .collection('pins')
     .snapshots()
     .listen((snapshot) {
       final pins = snapshot.docs.map((doc) => doc.data()).toList();
       updateMapMarkers(pins);
     });
   ```

---

## 🎨 Custom Marker Images (Optional)

To use custom marker images instead of emoji fallbacks:

1. **Create marker images** (32x32 or 64x64 pixels, PNG or SVG)
2. **Upload to** `public/markers/` folder:
   ```
   public/markers/
     ├── road-crash.svg
     ├── fire.svg
     ├── medical.svg
     ├── flooding.svg
     ├── volcano.svg
     ├── landslide.svg
     ├── earthquake.svg
     ├── civil.svg
     ├── conflict.svg
     ├── disease.svg
     ├── evacuation.svg
     ├── health.svg
     ├── police.svg
     ├── fire-station.svg
     ├── government.svg
     └── default.svg
   ```
3. **Images automatically used** when available
4. **Fallback to emoji** if image fails to load

---

## 📊 Data Flow

```
Admin creates pin in RiskMapPage
    ↓
usePins.createPin() validates data
    ↓
Saves to Firestore pins collection
    ↓
Real-time listener updates pins state
    ↓
RiskMapPage re-renders with new pin
    ↓
MapboxMap displays new marker
    ↓
Mobile app receives update via real-time listener
    ↓
Mobile app displays marker on map
```

---

## 🔧 Troubleshooting

### Pin Not Appearing on Map

1. Check browser console for errors
2. Verify Firestore rules deployed (`firebase deploy --only firestore:rules`)
3. Check admin authentication
4. Verify coordinates are valid numbers
5. Check filters - pin type might be filtered out

### Mobile App Can't Fetch Pins

1. Verify Firestore rules allow public read
2. Check Firebase initialization in mobile app
3. Verify collection name is exactly `"pins"`
4. Check internet connection

### Pin Coordinates Wrong

1. Verify coordinate order: `[longitude, latitude]`
2. Check coordinate validation (lat: -90 to 90, lng: -180 to 180)
3. Test with known coordinates (e.g., Lucban: 121.5556, 14.1139)

---

## 🚀 Next Steps (Optional Enhancements)

- [ ] **Pin editing UI** - Allow admins to edit existing pins
- [ ] **Pin deletion UI** - Add delete button to pin popups
- [ ] **Pin categories management** - Add custom pin categories
- [ ] **Pin clustering** - Group nearby pins when zoomed out
- [ ] **Pin import/export** - Bulk import pins from CSV
- [ ] **Pin analytics** - Track most viewed pins, etc.

---

## 📝 Summary

✅ **Firestore schema designed** with all required fields  
✅ **Security rules configured** (super admin has full access, public read)  
✅ **usePins hook created** with full CRUD operations  
✅ **Real-time pin fetching** with type, date, and search filters  
✅ **Database-backed pin creation** with validation  
✅ **MapboxMap updated** to display database pins  
✅ **Toast notifications** for all operations  
✅ **Title field enhanced** with tooltip and 60-char limit  
✅ **Loading states** added to prevent duplicate submissions  
✅ **Mobile app compatible** - can fetch and display pins  
✅ **Hard delete** - pins permanently removed  
✅ **Auto-generated IDs** - using Firestore document IDs  
✅ **No auto-pin from mobile** - admin-only pin creation  
✅ **All pins public** - no visibility restrictions  

**The implementation is complete and ready for testing!** 🎉

