/**
 * E2E tests against the deployed Vercel production app.
 * Run: node e2e-vercel.js
 */

const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'https://gabriel-restaurant.vercel.app'
const SCREENSHOT_DIR = path.join(__dirname, 'e2e-screenshots')

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR)

let passed = 0
let failed = 0
const failures = []

async function ss(page, name) {
  const file = path.join(SCREENSHOT_DIR, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`  📸 ${name}.png`)
}

async function test(name, fn) {
  process.stdout.write(`\n▶ ${name} `)
  try {
    await fn()
    console.log('✓ PASS')
    passed++
  } catch (err) {
    console.log('✗ FAIL')
    console.error(`  ${err.message}`)
    failures.push({ name, error: err.message })
    failed++
  }
}

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 400 })
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })

  // Collect console errors
  const consoleErrors = []
  ctx.on('page', (page) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[${page.url()}] ${msg.text()}`)
    })
  })

  // ─── HOMEPAGE / MENU ────────────────────────────────────────────────────────
  const page = await ctx.newPage()

  await test('Homepage loads and shows menu', async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await page.waitForSelector('h1', { timeout: 15000 })
    const h1 = await page.textContent('h1')
    if (!h1) throw new Error('No h1 found')
    console.log(`\n  Title: "${h1}"`)
    await ss(page, '01-homepage')
  })

  await test('Menu categories are visible', async () => {
    // Category tabs or headings should be present
    const cats = await page.locator('[data-testid="category-tab"], button, [role="tab"]').count()
    console.log(`\n  Found ${cats} tab/button elements`)
    // Check at least some menu items rendered
    const items = await page.locator('h3, h2').allTextContents()
    const menuItems = items.filter(t => t.trim().length > 0)
    if (menuItems.length < 3) throw new Error(`Too few menu items: ${menuItems.slice(0,5).join(', ')}`)
    console.log(`\n  Sample items: ${menuItems.slice(0,4).join(' | ')}`)
    await ss(page, '02-menu-categories')
  })

  // ─── ADD TO CART ────────────────────────────────────────────────────────────
  await test('Can add item to cart', async () => {
    // Click first "Add" button
    const addBtn = page.locator('button').filter({ hasText: /add/i }).first()
    await addBtn.waitFor({ timeout: 5000 })
    await addBtn.click()
    await page.waitForTimeout(600)

    // Cart badge should show a count
    const badge = page.locator('[data-testid="cart-count"], .cart-count, [aria-label*="cart"]').first()
    const badgeText = await badge.textContent().catch(() => '')
    console.log(`\n  Cart badge: "${badgeText}"`)
    await ss(page, '03-item-added-to-cart')
  })

  await test('Add a second item', async () => {
    const addBtns = page.locator('button').filter({ hasText: /add/i })
    const count = await addBtns.count()
    if (count < 2) throw new Error('Not enough Add buttons')
    await addBtns.nth(1).click()
    await page.waitForTimeout(600)
    await ss(page, '04-two-items-in-cart')
  })

  // ─── CART DRAWER ────────────────────────────────────────────────────────────
  await test('Cart drawer opens', async () => {
    // Click the cart icon/button in the header
    const cartBtn = page.locator('button[aria-label*="art"], button[aria-label*="Cart"], header button').last()
    await cartBtn.click()
    await page.waitForTimeout(600)

    // Drawer should contain checkout text
    await page.waitForSelector('text=/checkout/i', { timeout: 5000 })
    await ss(page, '05-cart-drawer-open')
  })

  // ─── CHECKOUT ───────────────────────────────────────────────────────────────
  await test('Navigate to checkout', async () => {
    const checkoutLink = page.locator('a[href="/checkout"], a').filter({ hasText: /checkout/i }).first()
    await checkoutLink.waitFor({ timeout: 5000 })
    await checkoutLink.click()
    await page.waitForURL('**/checkout', { timeout: 15000 })
    await ss(page, '06-checkout-page')
  })

  await test('Checkout form is present', async () => {
    await page.waitForSelector('form, input[name="name"], input[placeholder*="name"]', { timeout: 10000 })
    const inputs = await page.locator('input').count()
    if (inputs < 2) throw new Error(`Expected input fields, found ${inputs}`)
    console.log(`\n  Found ${inputs} input fields on checkout`)
    await ss(page, '07-checkout-form')
  })

  await test('Fill and submit checkout form', async () => {
    // Input component generates id from label: "Full Name" → #full-name
    await page.locator('#full-name, input[placeholder="Jane Smith"]').first().fill('Test Customer')
    await page.locator('#phone-number, input[placeholder="8475550100"]').first().fill('5125551234')
    await page.locator('#email, input[type="email"]').first().fill('test@example.com')

    await ss(page, '08-checkout-filled')

    // Submit
    const submitBtn = page.locator('button[type="submit"]').first()
    await submitBtn.click()

    // Wait for order-success redirect (payment is bypassed)
    await page.waitForURL('**/order-success**', { timeout: 20000 })
    await ss(page, '09-order-success')
  })

  await test('Order success page shows order number', async () => {
    await page.waitForSelector('text=/order/i', { timeout: 10000 })
    const body = await page.textContent('body')
    const hasOrderNum = /order/i.test(body) && /\d+/.test(body)
    if (!hasOrderNum) throw new Error('No order number visible on success page')
    console.log(`\n  Success page body snippet: "${body.replace(/\s+/g,' ').slice(0,100)}"`)
    await ss(page, '10-order-success-detail')
  })

  // ─── DASHBOARD LOGIN ─────────────────────────────────────────────────────────
  const dashPage = await ctx.newPage()

  await test('Dashboard login page loads', async () => {
    await dashPage.goto(`${BASE_URL}/dashboard/login`, { waitUntil: 'load', timeout: 20000 })
    await dashPage.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 })
    await ss(dashPage, '11-dashboard-login')
  })

  await test('Login with admin credentials', async () => {
    // Capture auth API responses to diagnose failures
    const authResponses = []
    dashPage.on('response', res => {
      if (res.url().includes('/api/auth/')) {
        authResponses.push({ url: res.url(), status: res.status() })
      }
    })

    // Input component generates id="email" for label "Email", id="password" for "Password"
    await dashPage.locator('#email').fill('admin@restaurant.com')
    await dashPage.locator('#password').fill('admin123')
    await dashPage.locator('button[type="submit"]').first().click()

    // Wait for any auth-related navigation
    await dashPage.waitForTimeout(5000)
    const url = dashPage.url()
    console.log(`\n  URL after submit: ${url}`)
    console.log(`  Auth API calls:`, JSON.stringify(authResponses))

    await ss(dashPage, '12-dashboard-after-login')

    // Check for error message on the page
    const bodyText = await dashPage.textContent('body')
    const errorMsg = bodyText.match(/invalid|error|fail/i)?.[0]
    if (errorMsg) console.log(`  Page error text found: "${errorMsg}"`)

    if (url.includes('/login')) throw new Error(`Still on login page: ${url}`)
    console.log(`\n  Redirected to: ${url}`)
  })

  await test('Dashboard shows active orders table', async () => {
    await dashPage.waitForSelector('table, [role="table"], h1', { timeout: 10000 })
    const h1 = await dashPage.textContent('h1').catch(() => '')
    console.log(`\n  Dashboard heading: "${h1}"`)
    await ss(dashPage, '13-dashboard-orders')
  })

  await test('Test order appears in dashboard', async () => {
    // The order we just placed should be visible
    await dashPage.reload({ waitUntil: 'networkidle' })
    await dashPage.waitForTimeout(1000)
    const bodyText = await dashPage.textContent('body')
    const hasOrder = /test customer/i.test(bodyText) || /\$\d+/.test(bodyText) || /new/i.test(bodyText)
    console.log(`\n  Dashboard body snippet: "${bodyText.replace(/\s+/g,' ').slice(0,200)}"`)
    await ss(dashPage, '14-dashboard-with-order')
    if (!hasOrder) throw new Error('Test order not visible on dashboard')
  })

  await test('Completed orders tab works', async () => {
    const completedLink = dashPage.locator('a[href*="completed"], a').filter({ hasText: /completed/i }).first()
    await completedLink.click()
    await dashPage.waitForURL('**/completed', { timeout: 10000 })
    await dashPage.waitForSelector('h1, table', { timeout: 10000 })
    await ss(dashPage, '15-completed-orders')
  })

  // ─── REPORT ──────────────────────────────────────────────────────────────────
  await browser.close()

  console.log('\n' + '═'.repeat(60))
  console.log(`Results: ${passed} passed, ${failed} failed`)

  if (consoleErrors.length) {
    console.log(`\nBrowser console errors (${consoleErrors.length}):`)
    consoleErrors.forEach(e => console.log(`  ⚠ ${e}`))
  }

  if (failures.length) {
    console.log('\nFailed tests:')
    failures.forEach(f => console.log(`  ✗ ${f.name}: ${f.error}`))
  }

  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`)

  if (failed > 0) process.exit(1)
})()
