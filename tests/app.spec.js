const { test, expect } = require('@playwright/test');

test.describe('Oil Prices PWA', () => {
  let consoleErrors = [];

  test.beforeEach(async ({ page }) => {
    // Capture console errors
    consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the app
    await page.goto('/');
  });

  test('page loads with title containing "Oil"', async ({ page }) => {
    await expect(page).toHaveTitle(/Oil/);
  });

  test('has no cross-app navigation links', async ({ page }) => {
    // Check that navigation doesn't include links to other transport apps
    const headerControls = page.locator('.header-controls');

    // Should not have links to ubike, mrt, bus, etc.
    await expect(headerControls.locator('a[href*="ubike"]')).toHaveCount(0);
    await expect(headerControls.locator('a[href*="mrt"]')).toHaveCount(0);
    await expect(headerControls.locator('a[href*="bus"]')).toHaveCount(0);
    await expect(headerControls.locator('a[href*="rail"]')).toHaveCount(0);
    await expect(headerControls.locator('a[href*="thsr"]')).toHaveCount(0);
  });

  test('map container exists and is visible', async ({ page }) => {
    const mapContainer = page.locator('#map-container');
    await expect(mapContainer).toBeVisible();

    const mapCanvas = page.locator('#map-canvas');
    await expect(mapCanvas).toBeVisible();
  });

  test('Leaflet initializes successfully', async ({ page }) => {
    // Wait for Leaflet to load
    await page.waitForFunction(() => window.L !== undefined);

    // Check that map variable exists
    const mapExists = await page.evaluate(() => window.map !== undefined);
    expect(mapExists).toBe(true);

    // Verify Leaflet container has the leaflet-container class
    const hasLeafletClass = await page.locator('#map-canvas').evaluate(
      el => el.classList.contains('leaflet-container')
    );
    expect(hasLeafletClass).toBe(true);
  });

  test('tab buttons exist with correct labels', async ({ page }) => {
    const tabBar = page.locator('.tab-bar');
    await expect(tabBar).toBeVisible();

    // Check Price Info tab
    const pricesTab = page.locator('.tab-btn[data-tab="prices"]');
    await expect(pricesTab).toBeVisible();
    await expect(pricesTab).toHaveAttribute('data-en', 'Price Info');
    await expect(pricesTab).toHaveAttribute('data-zh', '油價資訊');

    // Check Nearby Stations tab
    const stationsTab = page.locator('.tab-btn[data-tab="stations"]');
    await expect(stationsTab).toBeVisible();
    await expect(stationsTab).toHaveAttribute('data-en', 'Nearby Stations');
    await expect(stationsTab).toHaveAttribute('data-zh', '附近加油站');
  });

  test('Price Info tab is active by default', async ({ page }) => {
    const pricesTab = page.locator('.tab-btn[data-tab="prices"]');
    await expect(pricesTab).toHaveClass(/active/);

    const pricesContent = page.locator('#tab-prices-content');
    await expect(pricesContent).toHaveClass(/active/);
  });

  test('tab switching works', async ({ page }) => {
    // Initially Price Info tab should be active
    await expect(page.locator('.tab-btn[data-tab="prices"]')).toHaveClass(/active/);
    await expect(page.locator('#tab-prices-content')).toHaveClass(/active/);

    // Click Nearby Stations tab
    await page.locator('.tab-btn[data-tab="stations"]').click();

    // Wait for tab switch
    await page.waitForTimeout(300);

    // Nearby Stations should now be active
    await expect(page.locator('.tab-btn[data-tab="stations"]')).toHaveClass(/active/);
    await expect(page.locator('#tab-stations-content')).toHaveClass(/active/);

    // Price Info should not be active
    await expect(page.locator('.tab-btn[data-tab="prices"]')).not.toHaveClass(/active/);
    await expect(page.locator('#tab-prices-content')).not.toHaveClass(/active/);

    // Switch back to Price Info
    await page.locator('.tab-btn[data-tab="prices"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('.tab-btn[data-tab="prices"]')).toHaveClass(/active/);
    await expect(page.locator('#tab-prices-content')).toHaveClass(/active/);
  });

  test('price table exists with fuel types', async ({ page }) => {
    const priceTable = page.locator('.price-table').first();
    await expect(priceTable).toBeVisible();

    // Check table headers
    const headers = priceTable.locator('th');
    await expect(headers).toHaveCount(2);

    // Check that tbody is populated with demo data
    const tbody = page.locator('#price-tbody');
    const rows = tbody.locator('tr');
    await expect(rows).toHaveCount(4); // 92, 95, 98, diesel

    // Verify fuel type icons exist
    await expect(page.locator('.fuel-icon.fuel-92')).toBeVisible();
    await expect(page.locator('.fuel-icon.fuel-95')).toBeVisible();
    await expect(page.locator('.fuel-icon.fuel-98')).toBeVisible();
    await expect(page.locator('.fuel-icon.fuel-diesel')).toBeVisible();
  });

  test('price prediction section exists', async ({ page }) => {
    const predictSection = page.locator('#predict-section');
    await expect(predictSection).toBeVisible();

    // Check prediction title
    const predictTitle = page.locator('#predict-title');
    await expect(predictTitle).toBeVisible();
    await expect(predictTitle).toHaveAttribute('data-en', 'Next Week Forecast');
    await expect(predictTitle).toHaveAttribute('data-zh', '下週預測');

    // Check prediction table
    const predictTbody = page.locator('#predict-tbody');
    const predictRows = predictTbody.locator('tr');
    await expect(predictRows).toHaveCount(4); // 92, 95, 98, diesel predictions
  });

  test('demo badge is displayed', async ({ page }) => {
    const demoBadge = page.locator('#demo-badge');
    await expect(demoBadge).toBeVisible();
    await expect(demoBadge).toHaveAttribute('data-en', 'Demo Data');
    await expect(demoBadge).toHaveAttribute('data-zh', '示範資料');
  });

  test('share buttons exist', async ({ page }) => {
    const shareSection = page.locator('.share-section');
    await expect(shareSection).toBeVisible();

    // FB Share button
    const fbButton = page.locator('#share-fb-btn');
    await expect(fbButton).toBeVisible();
    await expect(fbButton).toHaveText(/FB Share/);

    // Copy button
    const copyButton = page.locator('#share-copy-btn');
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toHaveAttribute('data-en', 'Copy');
    await expect(copyButton).toHaveAttribute('data-zh', '複製');
  });

  test('price history chart exists', async ({ page }) => {
    const chartSection = page.locator('.chart-section');
    await expect(chartSection).toBeVisible();

    // Chart title
    const chartTitle = page.locator('#chart-title');
    await expect(chartTitle).toBeVisible();
    await expect(chartTitle).toHaveAttribute('data-en', '95 Unleaded - Last 8 Weeks');
    await expect(chartTitle).toHaveAttribute('data-zh', '95無鉛 - 近8週走勢');

    // Bar chart container
    const barChart = page.locator('#bar-chart');
    await expect(barChart).toBeVisible();

    // Check that bars are rendered
    const bars = barChart.locator('.bar-group');
    await expect(bars).toHaveCount(8); // 8 weeks
  });

  test('language toggle button exists', async ({ page }) => {
    const langBtn = page.locator('#lang-btn');
    await expect(langBtn).toBeVisible();
    await expect(langBtn).toHaveClass(/lang-btn/);

    // Initial language should be either EN or 中文
    const langText = await langBtn.textContent();
    expect(['EN', '中文']).toContain(langText);
  });

  test('language toggle works', async ({ page }) => {
    const langBtn = page.locator('#lang-btn');
    const initialLang = await langBtn.textContent();

    // Click to toggle language
    await langBtn.click();
    await page.waitForTimeout(200);

    // Language should have changed
    const newLang = await langBtn.textContent();
    expect(newLang).not.toBe(initialLang);
    expect(['EN', '中文']).toContain(newLang);

    // Toggle back
    await langBtn.click();
    await page.waitForTimeout(200);

    const finalLang = await langBtn.textContent();
    expect(finalLang).toBe(initialLang);
  });

  test('locate button exists', async ({ page }) => {
    const locateBtn = page.locator('.locate-btn');
    await expect(locateBtn).toBeVisible();
    await expect(locateBtn).toContainText('📍');
  });

  test('manifest.webapp is accessible', async ({ page }) => {
    const response = await page.request.get('/manifest.webapp');
    expect(response.status()).toBe(200);

    const manifest = await response.json();
    expect(manifest.name).toBe('Taiwan Oil Prices');
    expect(manifest.short_name).toBe('Oil');
    expect(manifest.start_url).toBe('/index.html');
  });

  test('service worker file is accessible', async ({ page }) => {
    const response = await page.request.get('/sw.js');
    expect(response.status()).toBe(200);

    const swContent = await response.text();
    expect(swContent).toContain('service worker');
  });

  test('no JavaScript console errors on load', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for console errors
    expect(consoleErrors).toHaveLength(0);
  });

  test('responsive layout adjustments', async ({ page }) => {
    // Desktop view
    await page.setViewportSize({ width: 1024, height: 768 });

    const panel = page.locator('#panel');
    await expect(panel).toBeVisible();

    // Panel should have fixed width on desktop
    const desktopWidth = await panel.evaluate(el => window.getComputedStyle(el).width);
    expect(desktopWidth).toBe('420px');

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    // Bottom sheet should be activated
    const hasBottomSheet = await panel.evaluate(el => el.classList.contains('bottom-sheet'));
    expect(hasBottomSheet).toBe(true);
  });

  test('Nearby Stations tab shows station list', async ({ page }) => {
    // Switch to Nearby Stations tab
    await page.locator('.tab-btn[data-tab="stations"]').click();
    await page.waitForTimeout(500);

    // Check station count element exists
    const stationCount = page.locator('#station-count');
    await expect(stationCount).toBeVisible();

    // Check station list exists
    const stationList = page.locator('#station-list');
    await expect(stationList).toBeVisible();
  });

  test('float button container exists with buttons', async ({ page }) => {
    const floatContainer = page.locator('.float-btn-container');
    await expect(floatContainer).toBeVisible();

    // Should have 2 buttons: language and locate
    const floatButtons = floatContainer.locator('.float-btn');
    await expect(floatButtons).toHaveCount(2);
  });

  test('price values are displayed correctly', async ({ page }) => {
    // Check that price values exist and are numbers
    const priceValues = page.locator('.price-value');
    await expect(priceValues).toHaveCount(4); // 4 fuel types

    // Each price should be a valid number
    const prices = await priceValues.allTextContents();
    prices.forEach(price => {
      const numericPrice = parseFloat(price);
      expect(numericPrice).toBeGreaterThan(0);
      expect(numericPrice).toBeLessThan(100); // Reasonable range for NT$/L
    });
  });

  test('price date is displayed', async ({ page }) => {
    const priceDate = page.locator('#price-date');
    await expect(priceDate).toBeVisible();

    const dateText = await priceDate.textContent();
    expect(dateText).toBeTruthy();
  });

  test('bottom sheet initializes on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for BottomSheet to initialize
    await page.waitForTimeout(500);

    // Check that BottomSheet class is available
    const bottomSheetExists = await page.evaluate(() => window.BottomSheet !== undefined);
    expect(bottomSheetExists).toBe(true);

    // Check that panel has bottom-sheet class
    const panel = page.locator('#panel');
    await expect(panel).toHaveClass(/bottom-sheet/);
  });

  test('search area button exists but hidden by default', async ({ page }) => {
    const searchAreaBtn = page.locator('#search-area-btn');
    await expect(searchAreaBtn).toBeHidden();
  });

  test('sheet summary exists for mobile', async ({ page }) => {
    const sheetSummary = page.locator('#sheet-summary');
    await expect(sheetSummary).toBeAttached();
  });

  test('header has correct title', async ({ page }) => {
    const pageTitle = page.locator('#page-title');
    await expect(pageTitle).toBeVisible();
    await expect(pageTitle).toHaveText('Oil Prices');
  });

  test('PWA meta tags are present', async ({ page }) => {
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('initial-scale=1.0');

    // Check theme color
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBe('#795548');

    // Check apple mobile web app capable
    const appleCapable = await page.locator('meta[name="apple-mobile-web-app-capable"]').getAttribute('content');
    expect(appleCapable).toBe('yes');

    // Check manifest link
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestLink).toBe('manifest.webapp');
  });

  test('Leaflet CSS is loaded', async ({ page }) => {
    const leafletCss = await page.locator('link[href*="leaflet"]').count();
    expect(leafletCss).toBeGreaterThan(0);
  });

  test('icons have correct fuel type classes', async ({ page }) => {
    // Verify each fuel type has a distinct color class
    await expect(page.locator('.fuel-92')).toHaveCSS('background', /rgb\(76, 175, 80\)/);
    await expect(page.locator('.fuel-95')).toHaveCSS('background', /rgb\(33, 150, 243\)/);
    await expect(page.locator('.fuel-98')).toHaveCSS('background', /rgb\(156, 39, 176\)/);
    await expect(page.locator('.fuel-diesel')).toHaveCSS('background', /rgb\(121, 85, 72\)/);
  });
});
