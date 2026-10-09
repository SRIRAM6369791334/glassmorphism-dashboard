import { expect, test, type Page, type TestInfo } from '@playwright/test'

const sessionData = { accessToken: 'test-access-token', expiresIn: 900, user: { id: '1', email: 'preview@example.test', displayName: 'Preview Person' } }

const browserFailures = new WeakMap<Page, string[]>()

async function expectSettled(page: Page, mode: 'login' | 'register') {
  await expect(page.getByRole('article')).toHaveAttribute('data-mode', mode)
  await expect(page.getByRole('article')).toHaveAttribute('data-phase', 'idle')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(mode === 'login' ? 'Login' : 'Create Account')
}

async function capture(page: Page, testInfo: TestInfo, name: string) {
  const path = testInfo.outputPath(`${name}.png`)
  await page.mouse.move(0, 0)
  await page.screenshot({ path, fullPage: true, scale: 'css' })
  await testInfo.attach(name, { path, contentType: 'image/png' })
}

async function expectControlsFit(page: Page) {
  const viewport = page.viewportSize()!
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(metrics.content).toBeLessThanOrEqual(metrics.viewport + 1)
  for (const control of await page.locator('input, button').all()) {
    await expect(control).toBeVisible()
    const box = await control.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1)
    await control.scrollIntoViewIfNeeded({ timeout: 4000 }).catch(() => {})
    await expect(control).toBeInViewport()
  }
  await page.evaluate(() => window.scrollTo(0, 0))
}

test.beforeEach(async ({ page }) => {
  const browserErrors: string[] = []
  browserFailures.set(page, browserErrors)
  page.on('pageerror', error => browserErrors.push(error.message))
  page.on('console', message => {
    const text = message.text()
    if (message.type() === 'error' && !message.location().url.includes('/api/v1/auth/') && !text.includes('/api/v1/auth/') && !text.includes('access control checks.') && !text.includes('the server responded with a status of')) browserErrors.push(text)
  })
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('/api/v1/auth/')) browserErrors.push(`${response.status()} ${response.url()}`)
  })
  page.on('requestfailed', request => {
    if (!request.url().includes('/api/v1/auth/')) browserErrors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`)
  })
  let authenticated = false
  await page.route(url => url.pathname.includes('/api/v1/auth/'), async route => {
    const corsHeaders = {
      'access-control-allow-origin': route.request().headers().origin ?? 'http://127.0.0.1:4173',
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'Content-Type, Authorization, Idempotency-Key',
    }
    const endpoint = new URL(route.request().url()).pathname.split('/').at(-1)
    if (endpoint === 'refresh' && !authenticated) {
      await route.fulfill({ status: 401, headers: corsHeaders, json: { success: false, code: 'UNAUTHORIZED', message: 'Sign in required.', requestId: 'test-request' } })
      return
    }
    if (endpoint === 'login') authenticated = true
    if (endpoint === 'logout' || endpoint === 'logout-all') authenticated = false
    const data = endpoint === 'login' || endpoint === 'refresh' ? sessionData
      : endpoint === 'verify-reset-otp' ? { resetToken: 'test-reset-token', expiresIn: 600 }
      : { message: 'Request completed.' }
    await route.fulfill({ headers: corsHeaders, json: { success: true, data } })
  })
  await page.goto('/')
  await expectSettled(page, 'login')
})

test.afterEach(async ({ page }) => {
  expect(browserFailures.get(page), 'Browser console, runtime, and asset loading must remain error-free').toEqual([])
})

test('starts with an empty, accessible Login form', async ({ page }) => {
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password')
  await expect(page.getByLabel('Full Name', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Work Email', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'HELLO, FRIEND!' })).toBeVisible()
})

test('both welcome buttons and inline links switch modes and move heading focus', async ({ page }) => {
  await page.getByRole('button', { name: 'Create Account', exact: true }).click()
  await expectSettled(page, 'register')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await expect(page.getByLabel('Email', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'WELCOME BACK!' })).toBeVisible()

  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expectSettled(page, 'login')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()

  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expectSettled(page, 'register')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expectSettled(page, 'login')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await expect(page.getByLabel('Work Email', { exact: true })).toHaveCount(0)
})

test('password controls work with the keyboard in both forms', async ({ page }) => {
  const password = page.getByLabel('Password', { exact: true })
  await password.fill('Preview-only-password-1')
  await password.focus()
  await page.keyboard.press('Tab')
  const reveal = page.getByRole('button', { name: 'Show password', exact: true })
  await expect(reveal).toBeFocused()
  await expect(reveal).toHaveCSS('outline-style', 'solid')
  await page.keyboard.press('Space')
  await expect(password).toHaveAttribute('type', 'text')
  await expect(page.getByRole('button', { name: 'Hide password', exact: true })).toBeFocused()
  await page.keyboard.press('Space')
  await expect(password).toHaveAttribute('type', 'password')

  await page.getByRole('button', { name: 'Create Account', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expectSettled(page, 'register')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Full Name', { exact: true })).toBeFocused()
  const registrationPassword = page.getByLabel('Create Password', { exact: true })
  await registrationPassword.fill('Another-preview-password-2')
  await page.getByRole('button', { name: 'Show password', exact: true }).click()
  await expect(registrationPassword).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Hide password', exact: true }).click()
  await expect(registrationPassword).toHaveAttribute('type', 'password')
})

test('signup verifies email before login and keeps credentials out of browser storage', async ({ page, context }) => {
  const requests: { path: string; body: unknown; key: string | undefined }[] = []
  page.on('request', request => {
    if (request.url().includes('/api/v1/auth/')) requests.push({ path: new URL(request.url()).pathname, body: request.postDataJSON(), key: request.headers()['idempotency-key'] })
  })
  await page.getByRole('button', { name: 'Create Account', exact: true }).click()
  await expectSettled(page, 'register')
  await page.getByLabel('Full Name', { exact: true }).fill('Preview Person')
  await page.getByLabel('Work Email', { exact: true }).fill('preview@example.test')
  await page.getByLabel('Create Password', { exact: true }).fill('  Exact Password 123  ')
  expect(await page.locator('form').evaluate(form => (form as HTMLFormElement).checkValidity())).toBe(true)
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Enter Email OTP' })).toBeVisible()
  for (let index = 1; index <= 6; index++) await dialog.getByLabel(`Digit ${index}`).fill(String(index))
  await dialog.getByRole('button', { name: 'Verify Code', exact: true }).click()
  await expect(dialog.getByRole('heading', { name: 'Email Verified!' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Back to Login', exact: true }).click()
  await expectSettled(page, 'login')
  await page.getByLabel('Email', { exact: true }).fill('preview@example.test')
  await page.getByLabel('Password', { exact: true }).fill('  Exact Password 123  ')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Signed in', exact: true })).toBeVisible()
  expect(requests.find(request => request.path.endsWith('/signup'))?.body).toEqual({ email: 'preview@example.test', password: '  Exact Password 123  ', firstName: 'Preview', lastName: 'Person' })
  expect(requests.find(request => request.path.endsWith('/verify-email'))?.body).toEqual({ email: 'preview@example.test', otp: '123456' })
  for (const request of requests.filter(request => /signup|verify-email/.test(request.path))) expect(request.key).toMatch(/^[0-9a-f-]{36}$/)
  expect(await context.cookies()).toEqual([])
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 })
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([])
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expectSettled(page, 'login')
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
})
test('rapid clicks settle consistently with one active form', async ({ page }) => {
  await page.getByRole('button', { name: 'Create Account', exact: true }).click({ clickCount: 3, delay: 20 })
  await expectSettled(page, 'register')
  await expect(page.locator('form')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()

  await page.getByRole('button', { name: 'Sign in', exact: true }).click({ clickCount: 3, delay: 20 })
  await expectSettled(page, 'login')
  await expect(page.locator('form')).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
})

test('reduced motion preserves switching and removes running motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Create Account', exact: true }).click()
  await expectSettled(page, 'register')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expectSettled(page, 'login')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
})

const viewports = [
  { name: 'reference-desktop', width: 1128, height: 778 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1366, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'below-tablet', width: 767, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'small-mobile', width: 320, height: 740 },
]

for (const viewport of viewports) {
  test(`both forms remain usable at ${viewport.name} (${viewport.width} × ${viewport.height})`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await expectControlsFit(page)
    await capture(page, testInfo, `${viewport.name}-login`)
    await page.getByRole('button', { name: 'Create Account', exact: true }).click()
    await expectSettled(page, 'register')
    await expectControlsFit(page)

    if (viewport.width < 768) {
      const form = await page.locator('form').boundingBox()
      const welcome = await page.getByRole('heading', { name: 'WELCOME BACK!' }).boundingBox()
      expect(form).not.toBeNull()
      expect(welcome!.y).toBeGreaterThan(form!.y + form!.height)
      for (const input of await page.locator('input').all()) {
        const fontSize = await input.evaluate(element => Number.parseFloat(getComputedStyle(element).fontSize))
        expect(fontSize).toBeGreaterThanOrEqual(16)
      }
    }
    await capture(page, testInfo, `${viewport.name}-register`)
  })
}

test('captures desktop transition phases while the outer card stays fixed', async ({ page }, testInfo) => {
  // Hold application timers so screenshot capture cannot miss a short phase on a busy runner.
  // Other interaction tests exercise the complete transition with real browser time.
  await page.clock.install({ time: new Date('2026-10-08T09:00:00Z') })
  await page.clock.pauseAt(new Date('2026-10-08T09:01:00Z'))
  const card = page.getByRole('article')
  async function sampleAnimation(milliseconds: number) {
    await card.evaluate((element, time) => {
      for (const animation of element.getAnimations({ subtree: true })) {
        animation.pause()
        animation.currentTime = time
      }
    }, milliseconds)
  }
  const before = await card.boundingBox()
  await page.getByRole('button', { name: 'Create Account', exact: true }).click()
  await expect(card).toHaveAttribute('data-phase', 'exiting')
  const outgoingCanFocus = await page.locator('input[name="email"]').evaluate(input => {
    input.focus()
    return document.activeElement === input
  })
  expect(outgoingCanFocus, 'Outgoing fields must be excluded from keyboard interaction').toBe(false)
  await sampleAnimation(100)
  await capture(page, testInfo, 'login-to-register-outgoing')
  await page.clock.runFor(200)
  await expect(card).toHaveAttribute('data-mode', 'register')
  const incomingCanFocus = await page.locator('input[name="fullName"]').evaluate(input => {
    input.focus()
    return document.activeElement === input
  })
  expect(incomingCanFocus, 'Incoming fields become interactive when the transition completes').toBe(false)
  await sampleAnimation(200)
  await capture(page, testInfo, 'login-to-register-incoming')
  await page.clock.runFor(400)
  await expectSettled(page, 'register')
  expect(await card.boundingBox()).toEqual(before)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(card).toHaveAttribute('data-phase', 'exiting')
  await sampleAnimation(100)
  await capture(page, testInfo, 'register-to-login-outgoing')
  await page.clock.runFor(200)
  await expect(card).toHaveAttribute('data-mode', 'login')
  await sampleAnimation(200)
  await capture(page, testInfo, 'register-to-login-incoming')
  await page.clock.runFor(400)
  await expectSettled(page, 'login')
  expect(await card.boundingBox()).toEqual(before)
})

test('password recovery popup modal supports email OTP verification and password reset', async ({ page }) => {
  await page.goto('/')
  const forgotBtn = page.getByRole('button', { name: 'Forgot Password?', exact: true })
  await expect(forgotBtn).toBeVisible()
  await forgotBtn.click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Forgot Password?' })).toBeVisible()

  // Step 1: Submit email
  const emailField = dialog.locator('input[name="recoveryEmail"]')
  await expect(emailField).toBeVisible()
  await emailField.fill('user@glassmorphism.io')
  await dialog.getByRole('button', { name: 'Send OTP Code' }).click()

  // Step 2: Fill 6-digit OTP
  await expect(dialog.getByRole('heading', { name: 'Enter Email OTP' })).toBeVisible()
  for (let i = 1; i <= 6; i++) {
    await dialog.getByLabel(`Digit ${i}`).fill(String(i))
  }
  await dialog.getByRole('button', { name: 'Verify Code' }).click()

  // Step 3: Enter new password
  await expect(dialog.getByRole('heading', { name: 'Set New Password' })).toBeVisible()
  await dialog.locator('input[name="newPassword"]').fill('NewSecretPass#123')
  await dialog.locator('input[name="confirmPassword"]').fill('NewSecretPass#123')
  await dialog.getByRole('button', { name: 'Update Password' }).click()

  // Step 4: Success confirmation
  await expect(dialog.getByRole('heading', { name: 'Password Updated!' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Back to Login' }).click()
  await expect(dialog).toHaveCount(0)
})

test('invalid credentials show a safe message and do not invent a session', async ({ page }) => {
  await page.route('**/api/v1/auth/login', route => route.fulfill({ status: 401, json: { success: false, code: 'INVALID_CREDENTIALS', message: 'Sensitive server detail must never appear', requestId: 'test-request' } }))
  await page.getByLabel('Email', { exact: true }).fill('preview@example.test')
  await page.getByLabel('Password', { exact: true }).fill('incorrect-password')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Email or password is incorrect.')
  await expect(page.getByText('Sensitive server detail must never appear')).toHaveCount(0)
  await expectSettled(page, 'login')
})

test('reload restores a session once under StrictMode and supports logout-all', async ({ page }) => {
  let refreshCount = 0
  await page.route('**/api/v1/auth/refresh', async route => {
    refreshCount++
    await route.fulfill({ json: { success: true, data: sessionData } })
  })
  await expect(page.getByRole('status')).not.toContainText('Checking your session')
  refreshCount = 0
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Signed in', exact: true })).toBeVisible()
  expect(refreshCount).toBe(1)
  const logoutRequest = page.waitForRequest('**/api/v1/auth/logout-all')
  await page.getByRole('button', { name: 'Sign out all devices', exact: true }).click()
  expect((await logoutRequest).headers().authorization).toBe('Bearer test-access-token')
  await expectSettled(page, 'login')
})

test('uncertain signup retries reuse the idempotency key without automatic retries', async ({ page }) => {
  const keys: string[] = []
  await page.route('**/api/v1/auth/signup', async route => {
    keys.push(route.request().headers()['idempotency-key'])
    if (keys.length === 1) await route.abort('failed')
    else await route.fulfill({ json: { success: true, data: { message: 'Verification required.' } } })
  })
  await page.getByRole('button', { name: 'Create Account', exact: true }).click()
  await expectSettled(page, 'register')
  await page.getByLabel('Full Name', { exact: true }).fill('Preview Person')
  await page.getByLabel('Work Email', { exact: true }).fill('preview@example.test')
  await page.getByLabel('Create Password', { exact: true }).fill('NewSecretPass#123')
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('The request may have completed')
  expect(keys).toHaveLength(1)
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(keys).toHaveLength(2)
  expect(keys[1]).toBe(keys[0])
})

test('OTP rejects invalid codes, resends repeatedly, and recovery closes with focus restored', async ({ page }) => {
  let attempts = 0
  await page.route('**/api/v1/auth/verify-reset-otp', async route => {
    attempts++
    await route.fulfill({ status: 400, json: { success: false, code: 'INVALID_OTP', message: 'Invalid.', requestId: 'test-request' } })
  })
  await page.clock.install()
  const opener = page.getByRole('button', { name: 'Forgot Password?', exact: true })
  await opener.click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Registered Email', { exact: true }).fill('preview@example.test')
  await dialog.getByRole('button', { name: 'Send OTP Code', exact: true }).click()
  await dialog.getByLabel('Digit 1', { exact: true }).focus()
  await dialog.getByLabel('Digit 1', { exact: true }).evaluate(input => {
    const clipboard = new DataTransfer()
    clipboard.setData('text/plain', '123456')
    // Firefox strips constructor-supplied clipboardData from untrusted events.
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', { value: clipboard })
    input.dispatchEvent(event)
  })
  await expect(dialog.getByLabel('Digit 6', { exact: true })).toHaveValue('6')
  await dialog.getByRole('button', { name: 'Verify Code', exact: true }).click()
  await expect(dialog.getByRole('status')).toContainText('invalid or expired')
  expect(attempts).toBe(1)
  await expect(dialog.getByRole('heading', { name: 'Enter Email OTP' })).toBeVisible()
  for (let repeat = 0; repeat < 2; repeat++) {
    await page.clock.fastForward(61_000)
    await dialog.getByRole('button', { name: 'Resend OTP Code', exact: true }).click()
    await expect(dialog.getByText('Resend code in 60s')).toBeVisible()
    await expect(dialog.getByLabel('Digit 1', { exact: true })).toHaveValue('')
  }
  await dialog.getByRole('button', { name: 'Close recovery dialog' }).focus()
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.getByRole('button', { name: 'Change Email Address' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
  await opener.click()
  await expect(dialog.getByRole('heading', { name: 'Forgot Password?', exact: true })).toBeVisible()
  await expect(dialog.getByLabel('Registered Email', { exact: true })).toHaveValue('')
})

test('recovery preserves password whitespace and only advances after server confirmation', async ({ page }) => {
  let resetBody: unknown
  await page.route('**/api/v1/auth/reset-password', async route => {
    resetBody = route.request().postDataJSON()
    await route.fulfill({ json: { success: true, data: { message: 'Password reset.' } } })
  })
  await page.getByRole('button', { name: 'Forgot Password?', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Registered Email', { exact: true }).fill('preview@example.test')
  await dialog.getByRole('button', { name: 'Send OTP Code', exact: true }).click()
  for (let index = 1; index <= 6; index++) await dialog.getByLabel(`Digit ${index}`).fill(String(index))
  await dialog.getByRole('button', { name: 'Verify Code', exact: true }).click()
  await dialog.getByLabel('New Password', { exact: true }).fill('  Strong Password 123  ')
  await dialog.getByLabel('Confirm Password', { exact: true }).fill('Different Password123')
  await dialog.getByRole('button', { name: 'Update Password', exact: true }).click()
  await expect(dialog.getByRole('status')).toHaveText('Passwords do not match.')
  expect(resetBody).toBeUndefined()
  await dialog.getByLabel('Confirm Password', { exact: true }).fill('  Strong Password 123  ')
  await dialog.getByRole('button', { name: 'Update Password', exact: true }).click()
  await expect(dialog.getByRole('heading', { name: 'Password Updated!' })).toBeVisible()
  expect(resetBody).toEqual({ resetToken: 'test-reset-token', newPassword: '  Strong Password 123  ' })
})
