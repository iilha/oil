# Taiwan Oil Prices Design Document

## Architecture Overview

Taiwan Oil Prices is a Progressive Web App (PWA) that displays CPC (Taiwan's state-owned oil company) gasoline and diesel prices, along with a map of nearby gas stations. Built with vanilla JavaScript, HTML5, and Leaflet maps, the app features two tabs: Price Info (with predictions and history) and Nearby Stations (with interactive map).

The app fetches oil price data from CPC via a Cloudflare Worker proxy and queries gas station locations from the Overpass API (OpenStreetMap). It can be served via HTTP (GitHub Pages), loaded in native WebView wrappers, or installed as a PWA with smart caching.

## Data Flow

### Data Sources
- **CPC Oil Price API** (via Cloudflare Worker): `https://www.cpc.com.tw/GetOilPriceJson.aspx`
  - Current week prices: 92/95/98 unleaded, diesel (NT$/liter)
  - Next week predictions (calculated by Worker based on crude oil trends)
  - Last 8 weeks price history
  - Worker at `workers/oil-price-proxy.js` handles CORS and authentication
- **Overpass API**: `https://overpass-api.de/api/interpreter`
  - Gas station POIs within 5km radius of user location
  - Query: `node["amenity"="fuel"](around:5000,{lat},{lng})`
  - Returns station name, brand (CPC, Formosa, Shell, etc.), coordinates

### Fetch-Render Cycle
1. **Price Info Tab**: Fetch CPC prices on page load, parse JSON, render price cards with change indicators
2. **Nearby Stations Tab**: Get user GPS → fetch gas stations from Overpass API → render Leaflet markers
3. Demo data fallback: Embedded static prices if Worker unavailable
4. Auto-refresh: Price data refreshes every 24 hours (weekly update cycle)
5. Station cache: Overpass results cached 24 hours (stations rarely change)

### Price Prediction Logic
- Cloudflare Worker fetches Brent crude oil prices from financial API
- Calculates 7-day moving average of crude price change
- Applies CPC's pricing formula: domestic price ≈ crude price + taxes + margin
- Returns predicted change: ▲ (increase), ▼ (decrease), or - (no change)
- Prediction shown in red (up) or green (down)

## UI Components

### Navigation Header
- Language toggle button (EN/中文)
- Note: Oil link NOT in nav header on other pages (only as card on index.html)

### Tab Navigation
- **Price Info Tab** (default): CPC prices, predictions, history, share button
- **Nearby Stations Tab**: Map with gas station markers, distance-sorted list

### Price Info Tab
- **Current Prices Card**:
  - 92/95/98 unleaded (NT$/L)
  - Diesel (NT$/L)
  - Effective date (e.g., "Week of Apr 7, 2026")
- **Next Week Predictions Card**:
  - Predicted price change per fuel type (▲/▼ with NT$ amount)
  - Color coded: red (increase), green (decrease), gray (no change)
- **Share Button**: Facebook share + copy to clipboard
- **Price History Chart**:
  - CSS bar chart (no external charting library)
  - Last 8 weeks of 95 unleaded prices
  - Hover shows exact price and week

### Nearby Stations Tab
- **Map View**: Leaflet 1.9.4 map centered on user GPS location
- **Brand-Colored Markers**:
  - CPC (green pin)
  - Formosa (blue pin)
  - Other brands (gray pin)
- **Popup**: Station name, brand, distance, navigation links (Google/Apple Maps)
- **Station List**: Sidebar with distance-sorted stations, click to center map
- **Locate Button**: Bottom-right floating button (📍) to recenter map on user

### Mobile Layout (≤768px)
- Bottom sheet with drag handle
- Snap points: collapsed (56px), half (50vh), full (90vh)
- Summary line: "⛽ 95: NT${price}/L • {stationCount} stations nearby"

## Caching Strategy

### Service Worker (`sw.js`)
| Resource Type | Strategy | TTL |
|---------------|----------|-----|
| Static assets (HTML, CSS, JS) | Cache-first | 24 hours |
| Map tiles (OSM) | Cache-first | 7 days |
| CPC price data (via Worker) | Cache-first | 24 hours |
| Overpass API gas stations | Cache-first | 24 hours |

### Cache-First Logic
1. Check cache first, return immediately if available and within TTL
2. If cache miss or expired: fetch from network
3. Update cache with fresh response
4. On network failure: serve stale cache (up to 7 days old for prices, 30 days for stations)
5. Show "Last updated" timestamp in UI

### Demo Data Fallback
- Embedded static prices: last known CPC prices (updated manually)
- Activated when Cloudflare Worker unavailable or rate-limited
- User sees "Demo Mode" indicator: "Prices may not be current"

## Localization

### Language Toggle
- Default: `navigator.language` (zh-TW/zh-CN → Chinese, else English)
- Persistence: `localStorage.setItem('oil-lang', lang)`
- Text elements: `data-en` and `data-zh` attributes
- Fuel types: Bilingual labels (e.g., "92 無鉛 Unleaded")
- Currency: Always NT$ (Taiwan standard)

### Bilingual Rendering
```javascript
function renderFuelType(type, lang) {
  const labels = {
    '92': {zh: '92 無鉛', en: '92 Unleaded'},
    '95': {zh: '95 無鉛', en: '95 Unleaded'},
    '98': {zh: '98 無鉛', en: '98 Unleaded'},
    'diesel': {zh: '柴油', en: 'Diesel'}
  };
  return labels[type][lang];
}
```

## Native Wrappers

### Android WebView
- Loads `file:///android_asset/index.html` from APK assets
- WebView settings: JavaScript enabled, geolocation permission, DOM storage
- JavaScript bridge: `Android.sharePrices(text)` for native share sheet
- Background sync: Fetch price updates every morning (WorkManager)
- Widget: Home screen widget shows current 95 unleaded price

### iOS WKWebView
- Loads local HTML via `WKWebView.loadFileURL()` from app bundle
- Configuration: `allowsInlineMediaPlayback`, location services entitlements
- Swift bridge: `window.webkit.messageHandlers.sharePrices.postMessage(text)`
- Background fetch: BGTaskScheduler for daily price updates
- Today Widget: Shows current prices (synced via App Groups)

### Asset Sync
- CI/CD: GitHub Actions copies web build to native repos on merge
- Git submodule: `ios/Oil/Resources/` and `android/app/src/main/assets/`
- Build script validates Cloudflare Worker endpoint health

## State Management

### localStorage Keys
| Key | Purpose | Values |
|-----|---------|--------|
| `oil-lang` | Language preference | `'en'` \| `'zh'` |
| `oil-tab` | Active tab | `'price'` \| `'stations'` |
| `oil-last-prices` | Cached price data | JSON: `{prices, predictions, history, timestamp}` |

### In-Memory State
- `priceData`: Current/predicted prices from CPC API
- `priceHistory`: Last 8 weeks of prices for chart
- `nearbyStations`: Array of gas station objects from Overpass API
- `userLocation`: GPS coordinates `{lat, lng}` from Geolocation API
- `markers`: Leaflet marker objects keyed by station ID

### State Persistence
- Language, tab: persisted to localStorage on change
- Price data: cached in localStorage with 24-hour TTL (via service worker)
- User location: ephemeral, re-fetched each session (privacy)
- Station data: cached by service worker (24-hour TTL)

### Cache Invalidation
- Time-based: 24-hour TTL for prices (CPC updates weekly on Sunday midnight)
- Location-based: Station cache cleared when user moves >5km
- Manual refresh: Pull-to-refresh gesture clears price cache, forces fetch
- Version-based: Service worker cache versioned by CACHE_VERSION constant

## Future Plan

### Short-term
- Add price change notification (weekly alert)
- Show fuel efficiency calculator
- Implement gas station reviews/ratings
- Add price comparison between CPC and Formosa

### Medium-term
- Fuel cost trip calculator (distance x consumption x price)
- Price trend prediction using historical data
- Integration with car maintenance schedule
- Nearby station filtering by services (car wash, convenience store)

### Long-term
- EV charging station map integration
- Carbon footprint calculator
- Fleet management features
- Integration with payment apps

## TODO

- [ ] Deploy Cloudflare Worker for live CPC prices
- [ ] Add Formosa Petrochemical price data
- [ ] Implement price change notifications
- [ ] Add fuel cost calculator
- [ ] Show station operating hours
- [ ] Add station services filter
- [ ] Implement dark mode
