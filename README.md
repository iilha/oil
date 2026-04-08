English | [繁體中文](README_zh.md)

# Taiwan Oil Prices

Progressive Web App displaying CPC (Taiwan Chinese Petroleum Corporation) gasoline prices and nearby gas stations on an interactive map.

**Live URL:** https://oouyang.github.io/oil/

## Features

### Price Information
- **Current Week Prices**: 92/95/98 unleaded and diesel (NT$/L)
- **Next Week Predictions**: Price forecasts with change indicators (red up arrow/green down arrow)
- **8-Week Price History**: Visual chart showing recent price trends
- **Share Functionality**: Facebook share button and copy-to-clipboard support

### Nearby Gas Stations
- **Interactive Map**: Leaflet map centered on user location
- **Station Markers**: Color-coded by brand (CPC green, Formosa blue, other gray)
- **Station Details**: Popup with name, brand, and navigation links (Google/Apple Maps)
- **Location Services**: Geolocation with locate button for map centering

### UI/UX
- **Tab Navigation**: Toggle between Price Info and Nearby Stations
- **Mobile Bottom Sheet**: Draggable panel with snap points (collapsed/half/full)
- **Bilingual Support**: English/Chinese toggle
- **Responsive Design**: Mobile-first layout
- **PWA Features**: Installable, offline-ready, service worker caching

## Tech Stack

### Core Technologies
- **HTML5/CSS3/JavaScript (ES6+)**: Inline styles, async/await, template literals
- **Leaflet 1.9.4**: Interactive mapping library
- **OpenStreetMap**: Free map tiles (no API key required)

### External Dependencies
- `js/bottom-sheet.js` - Mobile bottom sheet component
- Leaflet CDN (unpkg.com)

### APIs
- **CPC Oil Prices**: Via Cloudflare Worker proxy (`workers/oil-price-proxy.js`)
- **Overpass API**: OpenStreetMap query for nearby gas stations (`overpass-api.de/api/interpreter`)

### Browser APIs
- Geolocation API for user location
- localStorage for language preferences
- Service Worker for PWA functionality

## Quick Start

```bash
# Clone or navigate to the directory
cd /Users/oouyang/ws/oil

# Serve locally (Python 3)
python3 -m http.server 8008

# Or use Node.js
npx serve . -p 8008

# Or use PHP
php -S localhost:8008
```

Open `http://localhost:8008` in a browser. No build system, no npm install required.

## File Structure

```
oil/
├── index.html              # Main PWA page
├── manifest.webapp         # PWA manifest
├── sw.js                   # Service worker
├── favicon.ico             # App icon
├── js/
│   └── bottom-sheet.js     # Mobile bottom sheet component
├── img/                    # PWA icons (32-512px)
├── android/                # Android native build (tw.pwa.oil)
│   ├── app/
│   ├── build.gradle
│   ├── gradlew
│   └── sync-web.sh
├── ios/                    # iOS native build (tw.pwa.oil)
│   ├── Oil/
│   └── sync-web.sh
├── tests/                  # Playwright tests
│   └── app.spec.js
├── package.json            # Test dependencies
└── playwright.config.js    # Test configuration
```

## Native Builds

The project includes native wrappers for app store distribution:

### Android
- **Package ID**: `tw.pwa.oil`
- **Build**: `cd android && ./gradlew assembleRelease`
- **Sync Web**: `./android/sync-web.sh` (copies web assets to app/src/main/assets/)

### iOS
- **Bundle ID**: `tw.pwa.oil`
- **Build**: Open `ios/Oil/Oil.xcodeproj` in Xcode
- **Sync Web**: `./ios/sync-web.sh` (copies web assets to Oil/ directory)

Both wrappers use WebView to load the PWA with native chrome and app store presence.

## Testing

Playwright tests verify core functionality:

```bash
# Install dependencies (first time only)
npm install

# Run tests (headless)
npm test

# Run tests (headed, see browser)
npm run test:headed
```

Test coverage in `tests/app.spec.js`:
- Page load and title verification
- Tab switching (Price Info / Nearby Stations)
- Language toggle
- Price display and history chart
- Map rendering and markers
- Location services

## Development

This is a static single-page application with no build process. All JavaScript is inline in `index.html` with the exception of the bottom sheet component. To develop:

1. Edit `index.html` directly
2. Refresh browser to see changes
3. Use browser DevTools for debugging
4. Test PWA features in Chrome DevTools > Application tab

### Service Worker Caching
- **Static assets** (HTML, JS, CSS): Cache-first, 24h TTL
- **Map tiles**: Cache-first, 7d TTL
- **Oil price API**: Stale-while-revalidate, 5min TTL
- **Overpass API**: Cache-first, 24h TTL

### localStorage Keys
- `oil-lang` - Language preference ('en' | 'zh')

## PWA Manifest

- **Name**: Taiwan Oil Prices
- **Short Name**: Oil
- **Theme Color**: #795548 (brown)
- **Display**: Standalone
- **Icons**: 32px to 512px, maskable for adaptive icons

## API Integration

### CPC Oil Prices
Proxied through Cloudflare Worker to handle CORS:
- **Worker**: `workers/oil-price-proxy.js`
- **Endpoint**: CPC's GetOilPriceJson.aspx
- **Response**: Current week prices, next week predictions, 8-week history

### Overpass API (Gas Stations)
Direct query to OSM database:
- **Query**: `[amenity=fuel]` within radius of user location
- **Data**: Station name, brand, coordinates
- **Response**: GeoJSON features

## Browser Support

- Modern browsers with ES6+ support (Chrome 60+, Firefox 55+, Safari 11+, Edge 79+)
- Geolocation API required for location features
- Service Worker support for PWA installation

## License

Standard open-source license (check repository for details).
