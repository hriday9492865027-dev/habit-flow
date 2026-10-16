# FriendFlow — Consent-Based Friend Location Sharing & Distance Tracking

FriendFlow is a modern, privacy-first, consent-based friend location-sharing and distance-tracking platform. It allows registered users to discover each other by unique username, establish mutual friendships, explicitly opt into live location sharing, view authorized friends on an interactive Leaflet map, and calculate straight-line Haversine and driving road distances.

---

## 1. Product Principles & Architecture

- **Explicit Opt-in Consent:** Location sharing is **OFF by default** on all accounts. Coordinates are only broadcast when the user explicitly triggers the sharing toggle and accepts the consent disclosure.
- **Mutual Friendships Only:** Only mutually accepted friends are granted Firestore security rules permission to read live coordinates. User search and public profiles never expose location data or private contact info.
- **Zero Stealth Tracking & No Movement Logs:** FriendFlow maintains only the single most recent coordinate in `/users/{uid}/location/current`. When sharing is turned off, this document is purged and marked inaccessible.
- **Clear Platform Boundaries:**
  - **Native Android Companion (Capacitor):** Employs an ongoing Android Foreground Service notification with `@capgo/background-geolocation` to maintain updates when backgrounded or locked.
  - **Web Application:** Operates in foreground mode while the browser tab is active. Closed browser tabs cannot track GPS.

---

## 2. Technology Stack

- **Frontend:** React 19 + Vite 8 + TypeScript
- **Styling:** Tailwind CSS 3.4 (Design system palette: deep forest `#123B35`, teal `#167D70`, mint `#DDF5E9`, warm off-white `#F7F8F5`, slate text `#2B3441`, danger `#C43D4B`)
- **Icons:** Lucide React
- **Mapping:** Leaflet 1.9 + React Leaflet 5 with OpenStreetMap tiles and visible attribution
- **Backend & Database:** Firebase Authentication + Cloud Firestore
- **Mobile Container:** Capacitor 8
- **Background GPS:** `@capgo/background-geolocation`
- **Distance Calculation:** Spherical Haversine formula (meters/km)
- **Road Distance & ETA:** Open Source Routing Machine (OSRM) driving API with graceful fallback
- **Testing:** Vitest 5
- **Deployment:** Vercel (Web) + Android Studio / Gradle (Android)

---

## 3. Project Directory Structure

```
d:/FT/
├── android/                   # Native Capacitor Android project & Gradle configs
│   └── app/src/main/
│       └── AndroidManifest.xml # Permissions (FINE, BACKGROUND, FOREGROUND_SERVICE)
├── firestore.rules            # Deny-by-default Firestore security rules
├── firestore.indexes.json     # Firestore composite indexes
├── .env.example               # Environment variables template
├── capacitor.config.ts        # Capacitor configuration
├── tailwind.config.js         # Design tokens & color system
├── src/
│   ├── types/index.ts         # User, FriendRequest, Location, Distance models
│   ├── lib/
│   │   ├── distance.ts        # Haversine formula, formatting, freshness logic
│   │   ├── osrm.ts            # OSRM road routing service abstraction & fallback
│   │   ├── validators.ts      # Username/display name/coordinate validators
│   │   └── firebase.ts        # Firebase Auth & Firestore init with fallback
│   ├── services/
│   │   ├── authService.ts     # Register, Login, Logout, Password reset
│   │   ├── profileService.ts  # Public user search (no coordinates leak), deletion
│   │   ├── friendshipService.ts # Requests lifecycle & canonical pair IDs
│   │   ├── locationService.ts # Live coordinate synchronization & stop revocation
│   │   └── backgroundLocationService.ts # Capgo native & web GPS manager
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Authentication provider & profile state
│   │   └── LocationContext.tsx # Location sharing toggle, GPS watcher & permissions
│   ├── hooks/
│   │   ├── useAcceptedFriends.ts
│   │   ├── useFriendRequests.ts
│   │   ├── useAuthorizedFriendLocations.ts
│   │   └── useTwoFriendDistance.ts
│   ├── components/
│   │   ├── Navbar.tsx         # Responsive header with live sharing chip
│   │   ├── MobileBottomNav.tsx# Mobile navigation bar
│   │   ├── MapView.tsx        # Leaflet map with custom SVG beacon markers
│   │   ├── FriendCard.tsx     # Friend listing with freshness and quick actions
│   │   ├── FriendSearch.tsx   # Discovery by username without coordinate exposure
│   │   ├── FriendRequestList.tsx # Sent and received friend requests
│   │   ├── SharingStatus.tsx  # Interactive sharing control chip & card
│   │   ├── SharingConsentDialog.tsx # Transparent opt-in consent modal
│   │   ├── DistanceComparePanel.tsx # Dual-friend distance & ETA calculator
│   │   ├── EmptyState.tsx     # Polished empty states
│   │   └── ErrorBoundary.tsx  # Graceful crash handling
│   ├── pages/
│   │   ├── LandingPage.tsx    # Privacy-first value proposition
│   │   ├── LoginPage.tsx      # Email/password authentication
│   │   ├── RegisterPage.tsx   # Account onboarding (sharing OFF by default)
│   │   ├── DashboardPage.tsx  # Fullscreen map + collapsible friends sidebar
│   │   ├── FriendsPage.tsx    # Manage connections & pending requests
│   │   ├── DistancePage.tsx   # Two-friend comparison & route visualizer
│   │   ├── SettingsPage.tsx   # Profile, sharing toggles, data deletion
│   │   └── PrivacyPage.tsx    # Transparent privacy and OS boundaries
│   └── tests/
│       ├── distance.test.ts   # Haversine math and freshness benchmark tests
│       └── friendship.test.ts # Canonical pair IDs, self-friend prevention, privacy
```

---

## 4. Quickstart: Local Development

### Prerequisites
- Node.js 18+ (tested on Node v24.12.0)
- npm 9+

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate `.env.local` with your Firebase project keys:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
```

> **Note on Resilient Fallback Mode:** If `.env.local` is omitted or contains placeholder values, FriendFlow automatically runs in **Resilient Local Mode** using browser local storage. You can register accounts, search users, establish friendships, test map markers, and test distance calculations right out of the box without any external backend setup!

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Run Unit Tests
```bash
npm test
```
All unit tests for Haversine calculations, coordinate validation, canonical friendship pair IDs, self-friending prevention, and coordinate privacy run and verify via Vitest.

---

## 5. Firebase Setup & Security Rules

### Authentication Setup
1. In the [Firebase Console](https://console.firebase.google.com/), enable **Email/Password** sign-in under **Authentication > Sign-in method**.

### Cloud Firestore Setup
1. Create a Firestore database in your preferred region.
2. Deploy the security rules defined in `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. Deploy indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Security Rule Guarantees:
- **Default Deny:** Unmatched paths are locked (`allow read, write: if false;`).
- **Owner-Only Coordinate Writes:** Users can only write to `/users/{uid}/location/current` matching their authenticated `request.auth.uid`. Coordinates outside latitude `[-90, 90]` or longitude `[-180, 180]` are rejected.
- **Authorization Check on Read:** Friends can only read `/users/{uid}/location/current` if:
  1. The target user has `sharingEnabled == true` on their profile.
  2. A canonical friendship document exists in `/friendships/{pairId}` proving mutual friendship.
- **Privacy Separation:** Public user search never includes coordinate fields.

---

## 6. Native Android Companion & Background GPS

FriendFlow uses Capacitor to package the app for Android with native background geolocation capabilities.

### Android Manifest Permissions Configured
In `android/app/src/main/AndroidManifest.xml`:
- `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION` (Android 10+)
- `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION` (Android 14+)
- `POST_NOTIFICATIONS` (Android 13+)
- Foreground service declaration: `ee.forgr.capacitor_background_geolocation.BackgroundGeolocationService`

### Build and Run on Android:
1. Build the production web bundle:
   ```bash
   npm run build
   ```
2. Synchronize web assets and plugins to Android:
   ```bash
   npx cap sync android
   ```
3. Open in Android Studio:
   ```bash
   npx cap open android
   ```
4. Run on a connected physical device or Android Virtual Device (AVD).

### Real-Device Testing Matrix:
- **Screen Lock:** Enable sharing -> lock device screen -> move 30+ meters -> unlock and verify updated coordinates in Firestore.
- **App Backgrounding:** Press home button -> verify persistent notification: *"FriendFlow Location Sharing — Sharing live location with your accepted friends"* is visible in the status bar.
- **Immediate Stop:** Open app -> tap **Stop Sharing** -> verify the persistent notification disappears immediately and the Firestore location document is deleted.

---

## 7. Vercel Web Deployment

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Initial FriendFlow release"
   git remote add origin https://github.com/your-org/friendflow.git
   git push -u origin main
   ```
2. Import the project into [Vercel](https://vercel.com/).
3. Framework Preset: **Vite**.
4. Set Build Command: `npm run build` and Output Directory: `dist`.
5. Add Environment Variables in the Vercel Project Settings:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_MAP_TILE_URL` (Optional)
   - `VITE_OSRM_ROUTING_URL` (Optional)
6. Click **Deploy**.

---

## 8. Technical Boundaries & OS Limitations

1. **Android Force-Stop:** If the user manually goes to Android Settings and force-stops the app, all background execution stops immediately as per Android OS security design.
2. **Device Shutdown / Reboot:** Tracking halts when the device powers down and resumes upon launching the application.
3. **OS Battery Optimization:** Some device manufacturers (e.g., Xiaomi MIUI, Huawei EMUI, Samsung) aggressively kill background services unless the user disables battery optimization for the app in system settings.
4. **Browser Tabs:** Desktop and mobile web browsers (Chrome, Safari, Firefox) restrict GPS background collection when tabs are backgrounded or closed. Web mode is strictly foreground-only.
5. **OSRM Public Demo Server:** The default routing URL is intended for light development. For high-volume production deployments, use a dedicated hosted service or self-hosted OSRM instance.

---

## 9. License

MIT License &bull; Built with consent and privacy at the core.
