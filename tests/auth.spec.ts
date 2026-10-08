import { expect, test, type Page, type TestInfo } from '@playwright/test'

const authenticationNotice = 'This is a UI preview. Authentication is not connected.'
const recoveryNotice = 'Password recovery is not connected in this preview.'
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
    await control.scrollIntoViewIfNeeded()
    await expect(control).toBeInViewport()
  }
  await page.evaluate(() => window.scrollTo(0, 0))
}

test.beforeEach(async ({ page }) => {
  const browserErrors: string[] = []
  browserFailures.set(page, browserErrors)
  page.on('pageerror', error => browserErrors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('response', response => {
    if (response.status() >= 400) browserErrors.push(`${response.status()} ${response.url()}`)
  })
  page.on('requestfailed', request => browserErrors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`))
  await page.goto('/')
  await expectSettled(page, 'login')
})

test.afterEach(async ({ page }) => {
  expect(browserFailures.get(page), 'Browser console, runtime, and asset loading must remain error-free').toEqual([])
})

test('starts with an empty, accessible Login form', async ({ page }) => {
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByLabel('Username', { exact: true })).toHaveValue('')
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
  await expect(page.getByLabel('Username', { exact: true })).toHaveCount(0)
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

test('submission and recovery announce preview notices without credential transport or storage', async ({ page, context }) => {
  const requests: { method: string; url: string; body: string | null }[] = []
  const initialUrl = page.url()
  page.on('request', request => requests.push({ method: request.method(), url: request.url(), body: request.postData() }))
  const samples = ['preview_user', 'Preview-only-password-1', 'Preview Person', 'preview@example.test']

  await page.getByLabel('Username', { exact: true }).fill(samples[0])
  await page.getByLabel('Password', { exact: true }).fill(samples[1])
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText(authenticationNotice)
  await page.getByRole('button', { name: 'Forgot Password?', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText(recoveryNotice)

  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expectSettled(page, 'register')
  await page.getByLabel('Full Name', { exact: true }).fill(samples[2])
  await page.getByLabel('Work Email', { exact: true }).fill(samples[3])
  await page.getByLabel('Create Password', { exact: true }).fill(samples[1])
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText(authenticationNotice)
  await expect(page).toHaveURL(initialUrl)

  expect(requests.filter(request => !['GET', 'HEAD'].includes(request.method))).toEqual([])
  for (const request of requests) {
    const transport = decodeURIComponent(`${request.url} ${request.body ?? ''}`)
    for (const sample of samples) expect(transport).not.toContain(sample)
  }
  expect(await context.cookies()).toEqual([])
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 })
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([])
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
  const outgoingCanFocus = await page.locator('input[name="username"]').evaluate(input => {
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
