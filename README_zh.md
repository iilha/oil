[English](README.md) | 繁體中文

# 台灣油價

漸進式網頁應用程式，展示台灣中油汽油價格與附近加油站的互動式地圖。

**線上網址：** https://oouyang.github.io/oil/

## 功能特色

### 價格資訊
- **本週油價**：92/95/98 無鉛汽油與柴油（新台幣/公升）
- **下週預測**：價格預測與變動指示器（紅色上箭頭/綠色下箭頭）
- **8 週價格歷史**：視覺化圖表顯示近期價格趨勢
- **分享功能**：Facebook 分享按鈕與複製到剪貼簿支援

### 附近加油站
- **互動式地圖**：以使用者位置為中心的 Leaflet 地圖
- **加油站標記**：依品牌以顏色區分（中油綠色、台塑藍色、其他灰色）
- **加油站詳細資訊**：彈出視窗顯示名稱、品牌與導航連結（Google/Apple Maps）
- **定位服務**：地理定位與定位按鈕，用於地圖置中

### 使用者介面/體驗
- **分頁導覽**：在價格資訊與附近加油站之間切換
- **行動裝置底部面板**：可拖曳的面板，具有吸附點（收合/一半/全開）
- **雙語支援**：英文/中文切換
- **響應式設計**：行動優先的版面配置
- **PWA 功能**：可安裝、離線準備、service worker 快取

## 技術堆疊

### 核心技術
- **HTML5/CSS3/JavaScript (ES6+)**：內嵌樣式、async/await、模板字串
- **Leaflet 1.9.4**：互動式地圖函式庫
- **OpenStreetMap**：免費地圖圖磚（無需 API 金鑰）

### 外部依賴
- `js/bottom-sheet.js` - 行動裝置底部面板元件
- Leaflet CDN (unpkg.com)

### APIs
- **中油油價**：透過 Cloudflare Worker 代理（`workers/oil-price-proxy.js`）
- **Overpass API**：OpenStreetMap 查詢附近加油站（`overpass-api.de/api/interpreter`）

### 瀏覽器 APIs
- Geolocation API 用於使用者定位
- localStorage 用於語言偏好設定
- Service Worker 用於 PWA 功能

## 快速開始

```bash
# Clone 或導覽至目錄
cd /Users/oouyang/ws/oil

# 本地伺服（Python 3）
python3 -m http.server 8008

# 或使用 Node.js
npx serve . -p 8008

# 或使用 PHP
php -S localhost:8008
```

在瀏覽器開啟 `http://localhost:8008`。無需建置系統，無需 npm install。

## 檔案結構

```
oil/
├── index.html              # 主要 PWA 頁面
├── manifest.webapp         # PWA 資訊清單
├── sw.js                   # Service worker
├── favicon.ico             # 應用程式圖示
├── js/
│   └── bottom-sheet.js     # 行動裝置底部面板元件
├── img/                    # PWA 圖示（32-512px）
├── android/                # Android 原生建置（tw.pwa.oil）
│   ├── app/
│   ├── build.gradle
│   ├── gradlew
│   └── sync-web.sh
├── ios/                    # iOS 原生建置（tw.pwa.oil）
│   ├── Oil/
│   └── sync-web.sh
├── tests/                  # Playwright 測試
│   └── app.spec.js
├── package.json            # 測試依賴
└── playwright.config.js    # 測試設定
```

## 原生建置

此專案包含應用程式商店發布的原生包裝器：

### Android
- **Package ID**：`tw.pwa.oil`
- **Build**：`cd android && ./gradlew assembleRelease`
- **Sync Web**：`./android/sync-web.sh`（將網頁資源複製到 app/src/main/assets/）

### iOS
- **Bundle ID**：`tw.pwa.oil`
- **Build**：在 Xcode 開啟 `ios/Oil/Oil.xcodeproj`
- **Sync Web**：`./ios/sync-web.sh`（將網頁資源複製到 Oil/ 目錄）

兩個包裝器都使用 WebView 載入 PWA，具有原生外觀與應用程式商店存在。

## 測試

Playwright 測試驗證核心功能：

```bash
# 安裝依賴（僅第一次）
npm install

# 執行測試（headless）
npm test

# 執行測試（headed，顯示瀏覽器）
npm run test:headed
```

`tests/app.spec.js` 中的測試覆蓋範圍：
- 頁面載入與標題驗證
- 分頁切換（價格資訊 / 附近加油站）
- 語言切換
- 價格顯示與歷史圖表
- 地圖渲染與標記
- 定位服務

## 開發

這是一個無建置流程的靜態單頁應用程式。除了底部面板元件外，所有 JavaScript 都內嵌在 `index.html` 中。開發方式：

1. 直接編輯 `index.html`
2. 重新整理瀏覽器查看變更
3. 使用瀏覽器開發者工具除錯
4. 在 Chrome DevTools > Application 分頁測試 PWA 功能

### Service Worker 快取
- **靜態資源**（HTML、JS、CSS）：Cache-first，24 小時 TTL
- **地圖圖磚**：Cache-first，7 天 TTL
- **油價 API**：Stale-while-revalidate，5 分鐘 TTL
- **Overpass API**：Cache-first，24 小時 TTL

### localStorage 鍵值
- `oil-lang` - 語言偏好設定（'en' | 'zh'）

## PWA Manifest

- **Name**：Taiwan Oil Prices
- **Short Name**：Oil
- **Theme Color**：#795548（棕色）
- **Display**：Standalone
- **Icons**：32px 至 512px，可遮罩以支援自適應圖示

## API 整合

### 中油油價
透過 Cloudflare Worker 代理處理 CORS：
- **Worker**：`workers/oil-price-proxy.js`
- **Endpoint**：中油的 GetOilPriceJson.aspx
- **Response**：本週價格、下週預測、8 週歷史

### Overpass API（加油站）
直接查詢 OSM 資料庫：
- **Query**：使用者位置半徑內的 `[amenity=fuel]`
- **Data**：加油站名稱、品牌、座標
- **Response**：GeoJSON features

## 瀏覽器支援

- 支援 ES6+ 的現代瀏覽器（Chrome 60+、Firefox 55+、Safari 11+、Edge 79+）
- 定位功能需要 Geolocation API
- PWA 安裝需要 Service Worker 支援

## 授權

標準開源授權（詳細資訊請查看儲存庫）。
