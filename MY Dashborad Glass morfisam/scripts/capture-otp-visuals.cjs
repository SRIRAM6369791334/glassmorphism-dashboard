const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BRAIN_DIR = 'C:/Users/srira/.gemini/antigravity/brain/94a42bb1-96df-4cee-9fcd-fb62ded16869'
const PREVIEW_DIR = path.resolve(__dirname, '../artifacts/preview')

if (!fs.existsSync(PREVIEW_DIR)) {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true })
}

async function capture() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()

  await page.route('**/api/v1/auth/forgot-password', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { message: 'Reset OTP sent.' } }),
    })
  })

  await page.route('**/api/v1/auth/verify-reset-otp', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { resetToken: 'demo-token-123' } }),
    })
  })

  await page.route('**/api/v1/auth/signup', async route => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { message: 'Verification code sent.' } }),
    })
  })

  await page.route('**/api/v1/auth/verify-email', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { message: 'Email verified successfully.' } }),
    })
  })

  await page.route('**/dev-mail', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          to: 'sriram@example.com',
          subject: 'Reset Password Code',
          text: 'Your password reset verification code is: 849201',
          created_at: new Date().toISOString(),
        },
      ]),
    })
  })

  console.log('Navigating to http://127.0.0.1:5173 ...')
  await page.goto('http://127.0.0.1:5173')
  await page.waitForLoadState('networkidle')

  // 1. Open Forgot Password Modal
  await page.getByRole('button', { name: 'Forgot Password?', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor({ state: 'visible' })

  // Fill email and request OTP
  await dialog.getByLabel('Registered Email', { exact: true }).fill('sriram@example.com')
  await dialog.getByRole('button', { name: 'Send OTP Code', exact: true }).click()

  // Wait for OTP step
  await page.waitForSelector('input[aria-label="Digit 1"]')
  await page.waitForTimeout(600)

  // Capture Screenshot 1: OTP Entry Step
  const screenOtp = path.join(PREVIEW_DIR, 'otp-verify-step.png')
  await page.screenshot({ path: screenOtp, fullPage: false })
  console.log('Captured:', screenOtp)

  // Auto-fill dev code or type 6 digits
  const fillButton = dialog.getByRole('button', { name: /Code received:/i })
  if (await fillButton.isVisible()) {
    await fillButton.click()
  } else {
    for (let i = 1; i <= 6; i++) {
      await dialog.getByLabel(`Digit ${i}`).fill(String(i))
    }
  }
  await page.waitForTimeout(300)

  // Submit OTP to verify
  await dialog.getByRole('button', { name: 'Verify Code', exact: true }).click()

  // Wait for step === 'new-password' with verified banner
  await dialog.getByRole('heading', { name: 'Set New Password', exact: true }).waitFor({ state: 'visible' })
  await page.waitForTimeout(500)

  // Capture Screenshot 2: OTP Verified with glowing badge and reset password
  const screenVerified = path.join(PREVIEW_DIR, 'otp-verified-step.png')
  await page.screenshot({ path: screenVerified, fullPage: false })
  console.log('Captured:', screenVerified)

  // Close modal
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  await page.waitForTimeout(300)

  // 3. Test Signup Verification Flow
  // Switch to sign up via welcome panel
  await page.getByRole('button', { name: 'Create Account', exact: true }).click()
  await page.waitForTimeout(600)

  // Fill signup form
  await page.getByLabel('Full Name', { exact: true }).fill('Sriram Kumar')
  await page.getByLabel('Work Email', { exact: true }).fill('sriram@example.com')
  await page.getByLabel('Create Password', { exact: true }).fill('SecurePass123!@#')

  // Submit signup
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await dialog.waitFor({ state: 'visible' })
  await page.waitForSelector('input[aria-label="Digit 1"]')
  await page.waitForTimeout(400)

  // Fill 6 digits
  for (let i = 1; i <= 6; i++) {
    await dialog.getByLabel(`Digit ${i}`).fill(String(i))
  }
  await page.waitForTimeout(300)

  // Submit Verify Code for signup
  await dialog.getByRole('button', { name: 'Verify Code', exact: true }).click()

  // Wait for step === 'success' ("Email Verified!")
  await dialog.getByRole('heading', { name: 'Email Verified!', exact: true }).waitFor({ state: 'visible' })
  await page.waitForTimeout(500)

  // Capture Screenshot 3: Email Verified Success Screen
  const screenSuccess = path.join(PREVIEW_DIR, 'email-verified-success.png')
  await page.screenshot({ path: screenSuccess, fullPage: false })
  console.log('Captured:', screenSuccess)

  // Copy to brain artifacts dir
  if (fs.existsSync(BRAIN_DIR)) {
    fs.copyFileSync(screenOtp, path.join(BRAIN_DIR, 'otp-verify-step.png'))
    fs.copyFileSync(screenVerified, path.join(BRAIN_DIR, 'otp-verified-step.png'))
    fs.copyFileSync(screenSuccess, path.join(BRAIN_DIR, 'email-verified-success.png'))
    console.log('Copied screenshots to brain artifacts directory.')
  }

  await browser.close()
  console.log('All screenshots captured successfully!')
}

capture().catch(err => {
  console.error('Capture failed:', err)
  process.exit(1)
})
