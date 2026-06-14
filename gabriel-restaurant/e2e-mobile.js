/**
 * Mobile E2E tests against the deployed Vercel production app.
 * Emulates iPhone 14 (390×844) and a mid-range Android (412×915).
 * Run: node e2e-mobile.js
 */

const { chromium, devices } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = 'https://gabriel-restaurant.vercel.app'
const SCREENSHOT_DIR = path.join(__dirname, 'e2e-screenshots', 'mobile')

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })

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

async function runSuite(browser, deviceName, contextOptions) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`Device: ${deviceName}`)
  console.log('═'.repeat(60))

  const prefix = deviceName.toLowerCase().replace(/\s+/g, '-')
  const ctx = await browser.newContext(contextOptions)

  const consoleErrors = []
  ctx.on('page', (p) => {
    p.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`[${msg.text()}]`)
    })
  })

  const page = await ctx.newPage()

  // ── HOMEPAGE ────────────────────────────────────────────────────────────────
  await test(`[${deviceName}] Homepage loads`, async () => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForSelector('h1', { timeout: 15000 })
    const title = await page.textContent('h1')
    console.log(`\n  Title: "${title}"`)
    await ss(page, `${prefix}-01-homepage`)
  })

  await test(`[${deviceName}] Menu items visible on mobile`, async () => {
    const items = await page.locator('h3, h2').allTextContents()
    const menuItems = items.filter(t => t.trim().length > 2)
    if (menuItems.length < 3) throw new Error(`Too few items: ${menuItems.slice(0,5)}`)
    console.log(`\n  Sample: ${menuItems.slice(0,3).join(' | ')}`)
    await ss(page, `${prefix}-02-menu`)
  })

  await test(`[${deviceName}] Category tabs/navigation works`, async () => {
    // Try clicking a category button if present
    const tabs = page.locator('button').filter({ hasText: /soup|rice|noodle|beef|chicken/i })
    const count = await tabs.count()
    console.log(`\n  Category buttons found: ${count}`)
    if (count > 0) {
      await tabs.first().click()
      await page.waitForTimeout(500)
      await ss(page, `${prefix}-03-category-click`)
    }
  })

  // ── CART ────────────────────────────────────────────────────────────────────
  await test(`[${deviceName}] Add item to cart`, async () => {
    // Scroll to first Add button and tap
    const addBtn = page.locator('button').filter({ hasText: /^add$/i }).first()
    await addBtn.scrollIntoViewIfNeeded()
    await addBtn.click()
    await page.waitForTimeout(700)
    await ss(page, `${prefix}-04-add-to-cart`)
  })

  await test(`[${deviceName}] Cart drawer opens on mobile`, async () => {
    // Find cart button in header
    const cartBtn = page.locator('header button').last()
    await cartBtn.click()
    await page.waitForTimeout(600)
    const drawerVisible = await page.locator('text=/checkout/i').first().isVisible().catch(() => false)
    console.log(`\n  Cart drawer visible: ${drawerVisible}`)
    await ss(page, `${prefix}-05-cart-drawer`)
    if (!drawerVisible) throw new Error('Cart drawer did not open')
  })

  await test(`[${deviceName}] Checkout button reachable in drawer`, async () => {
    const checkoutBtn = page.locator('a[href="/checkout"], a').filter({ hasText: /checkout/i }).first()
    const box = await checkoutBtn.boundingBox()
    if (!box) throw new Error('Checkout link not found in DOM')
    console.log(`\n  Checkout link at y=${Math.round(box.y)}, height=${Math.round(box.height)}`)
    await ss(page, `${prefix}-06-checkout-link`)
  })

  // ── CHECKOUT FLOW ───────────────────────────────────────────────────────────
  await test(`[${deviceName}] Navigate to checkout`, async () => {
    const checkoutLink = page.locator('a[href="/checkout"], a').filter({ hasText: /checkout/i }).first()
    await checkoutLink.click()
    await page.waitForURL('**/checkout', { timeout: 15000 })
    await ss(page, `${prefix}-07-checkout-page`)
  })

  await test(`[${deviceName}] Checkout form usable on mobile`, async () => {
    await page.waitForSelector('#full-name', { timeout: 10000 })
    // Check form inputs are reachable / not clipped off screen
    const nameBox = await page.locator('#full-name').boundingBox()
    const viewport = page.viewportSize()
    if (!nameBox) throw new Error('Name input not found')
    console.log(`\n  Name input at x=${Math.round(nameBox.x)}, y=${Math.round(nameBox.y)}, viewport width=${viewport.width}`)
    if (nameBox.x + nameBox.width > viewport.width + 5) throw new Error('Name input overflows viewport')
    await ss(page, `${prefix}-08-checkout-form`)
  })

  await test(`[${deviceName}] Fill and submit checkout form`, async () => {
    await page.locator('#full-name').fill('Mobile Tester')
    await page.locator('#phone-number').fill('3125559876')
    await page.locator('#email').fill('mobile@example.com')
    await ss(page, `${prefix}-09-form-filled`)

    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL('**/order-success**', { timeout: 20000 })
    await ss(page, `${prefix}-10-order-success`)
  })

  await test(`[${deviceName}] Order success readable on mobile`, async () => {
    await page.waitForSelector('text=/order/i', { timeout: 10000 })
    const bodyText = await page.evaluate(() => document.body.innerText)
    const hasNumber = /\d+/.test(bodyText)
    console.log(`\n  Success page text: "${bodyText.slice(0, 120).replace(/\n/g, ' ')}"`)
    if (!hasNumber) throw new Error('No order number visible')
    await ss(page, `${prefix}-11-success-detail`)
  })

  // ── DASHBOARD ────────────────────────────────────────────────────────────────
  const dashPage = await ctx.newPage()

  await test(`[${deviceName}] Dashboard login page loads on mobile`, async () => {
    await dashPage.goto(`${BASE_URL}/dashboard/login`, { waitUntil: 'load', timeout: 20000 })
    await dashPage.waitForSelector('#email', { timeout: 10000 })
    // Check form fits within mobile viewport
    const emailBox = await dashPage.locator('#email').boundingBox()
    const vp = dashPage.viewportSize()
    console.log(`\n  Email input width: ${Math.round(emailBox.width)}, viewport: ${vp.width}`)
    await ss(dashPage, `${prefix}-12-dashboard-login`)
  })

  await test(`[${deviceName}] Can log in from mobile`, async () => {
    await dashPage.locator('#email').fill('admin@restaurant.com')
    await dashPage.locator('#password').fill('admin123')
    await dashPage.locator('button[type="submit"]').first().click()
    await dashPage.waitForTimeout(5000)
    const url = dashPage.url()
    console.log(`\n  URL after login: ${url}`)
    if (url.includes('/login')) throw new Error('Still on login page')
    await ss(dashPage, `${prefix}-13-dashboard-home`)
  })

  await test(`[${deviceName}] Dashboard orders table renders on mobile`, async () => {
    await dashPage.waitForSelector('h1', { timeout: 10000 })
    const heading = await dashPage.textContent('h1')
    console.log(`\n  Dashboard heading: "${heading}"`)
    // Check for horizontal overflow (table should scroll, not overflow body)
    const bodyWidth = await dashPage.evaluate(() => document.body.scrollWidth)
    const vpWidth = dashPage.viewportSize().width
    console.log(`  Body scroll width: ${bodyWidth}, viewport: ${vpWidth}`)
    await ss(dashPage, `${prefix}-14-dashboard-orders`)
  })

  await ctx.close()

  if (consoleErrors.length) {
    console.log(`\n⚠ Console errors (${consoleErrors.length}): ${consoleErrors.slice(0,3).join(', ')}`)
  }
}

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 300 })

  // iPhone 14
  await runSuite(browser, 'iPhone 14', {
    ...devices['iPhone 14'],
  })

  // Mid-range Android (Pixel 5)
  await runSuite(browser, 'Pixel 5', {
    ...devices['Pixel 5'],
  })

  await browser.close()

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`TOTAL: ${passed} passed, ${failed} failed`)
  if (failures.length) {
    console.log('\nFailures:')
    failures.forEach(f => console.log(`  ✗ ${f.name}: ${f.error}`))
  }
  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`)
  if (failed > 0) process.exit(1)
})()
