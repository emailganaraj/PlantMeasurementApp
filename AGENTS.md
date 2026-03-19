# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

**Start Metro bundler:**
```sh
npm start
```

**Run on Android:**
```sh
npm run android
```

**Run on iOS (after `bundle install` and `bundle exec pod install`):**
```sh
npm run ios
```

**Lint:**
```sh
npm run lint
```

**Run all tests:**
```sh
npm test
```

**Run a single test file:**
```sh
npx jest __tests__/App.test.tsx
```

**Run tests matching a pattern:**
```sh
npx jest --testNamePattern="renders correctly"
```

## Architecture

### Entry Point & App Shell

`index.js` registers `AppWithLogin` (from `AppWithLogin.tsx`) as the root component. `App.tsx` is a standalone legacy version that does not use authentication or navigation — it is no longer the active entry point.

`AppWithLogin.tsx` handles:
- Session persistence via `AsyncStorage` (`user_id`, `username`, `is_logged_in`)
- A `LoginScreen` component that posts credentials as `FormData` to `POST /login`
- Once authenticated, renders a top user-header bar + `AppWithNavigationTabs`

### Navigation

`src/AppWithNavigationTabs.tsx` sets up a `NavigationContainer` with a bottom tab navigator containing two tabs:
1. **New Analysis** → renders `src/AppContent.tsx`
2. **History** → a stack navigator with `AnalysisHistoryScreen` → `AnalysisDetailScreen`

Both tabs receive `userId` and `apiUrl` as props propagated from `AppWithLogin`.

### Core Analysis Flow (`src/AppContent.tsx`)

This is the main feature screen. The flow is:
1. User captures/uploads an image → `ImageCropperModal` opens for optional cropping
2. Optional: user taps "Remove Background" → `POST /remove-background` (returns base64 PNG)
3. Optional: user selects a background color from the palette (applied client-side only; the selected color is sent to the backend at analysis time)
4. User taps "Analyze Image" → `AnalysisMetadataModal` opens to collect `analysis_name`, `total_seeds_kept`, `total_seeds_germinated`, `germination_percentage`
5. `POST /analyze` is called with the original image file, optional `background_color`, optional `rotation`, and metadata fields
6. The API response's `per_plant` array is mapped to a plants list using `biggest_*_length_cm` fields with fallback to `*_length_cm`
7. `comprehensive_annotation` is sourced from `result.debug_images.comprehensive_annotation` (a URL path relative to `API_URL`)
8. SVI (Seed Vigour Index) = `(avg_root + avg_shoot) × germination_percentage`

### History Flow (`src/screens/`)

- `AnalysisHistoryScreen` fetches `GET /user-analyses/{userId}` and renders a `FlatList`. It refreshes on every tab focus via `useFocusEffect`.
- `AnalysisDetailScreen` receives the full analysis object via navigation params. It also fetches/saves/deletes manual measurements via `GET|POST|DELETE /manual-measurements/{analysisId}?user_id=...`. Manual measurements are displayed alongside AI measurements in a side-by-side table.

### API Configuration (`src/config.ts`)

The app uses a dual-config pattern: `src/config.ts` tries to `require('./config.local')` first; if that fails it falls back to the production URL (`http://yuvasankalpa.in:8000`).

For local development, create/edit `src/config.local.ts`:
```ts
export const API_CONFIG = {
  BASE_URL: 'http://<YOUR_LOCAL_IP>:8002',
  ENDPOINTS: { ANALYZE: '/analyze', HEALTH: '/health', CALIBRATION: '/calibration/current' },
};
```
`config.local.ts` is gitignored. Use the "Test Connection" button in the app (calls `GET /health`) to verify connectivity.

### Key Backend API Endpoints

All requests are `multipart/form-data` unless noted.

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Health check — returns `{service, version}` |
| `/login` | POST | Auth — form fields: `username`, `password`; returns `{user_id}` |
| `/analyze` | POST | Main analysis — fields: `file`, optional `background_color`, `rotation`, `user_id`, `analysis_name`, `total_seeds_kept`, `total_seeds_germinated`, `germination_percentage`, `save_debug=true` |
| `/remove-background` | POST | BG removal — fields: `file`, optional `rotation`, `background_color`, `user_id`; returns `{image_data}` (base64 PNG) |
| `/user-analyses/{userId}` | GET | Returns `{analyses: [...]}` |
| `/manual-measurements/{analysisId}` | GET/POST/DELETE | Manual measurement CRUD with `?user_id=` query param |

### Components (`src/components/`)

- `AnalysisMetadataModal` — modal form collecting experiment metadata before analysis
- `ImageCropperModal` — crop/rotate modal triggered after image selection
- `ManualMeasurementModal` — used in `AnalysisDetailScreen` to submit/update manual per-plant measurements

### Shared Utilities

- `src/ZoomableImageModal.tsx` and `src/screens/ZoomableImageModal.tsx` — pinch-to-zoom full-screen image viewer (note: there are two copies; `src/ZoomableImageModal.tsx` is the one used by `AppContent`)
- `ZoomableImageModal.tsx` (root level) — appears to be an older copy; not imported anywhere active
