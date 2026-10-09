import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

async function readCode(request: APIRequestContext, email: string, previous?: string) {
  let code = ''
  await expect.poll(async () => {
    const response = await request.get('http://127.0.0.1:8025/messages')
    const messages = await response.json() as Array<{ to: string; code: string }>
    code = messages.find(message => message.to === email && message.code !== previous)?.code ?? ''
    return code.length
  }, { timeout: 20_000 }).toBe(6)
  return code
}

async function fillCode(page: Page, code: string) {
  for (let i = 0; i < 6; i++) await page.getByRole('dialog').getByLabel(`Digit ${i + 1}`, { exact: true }).fill(code[i])
  await page.getByRole('dialog').getByRole('button', { name: 'Verify Code', exact: true }).click()
}

test('real browser signup, email verification, session restore/logout and password recovery', async ({ page, request }) => {
  expect((await request.get('http://127.0.0.1:3000/health/ready')).ok()).toBe(true)
  const email = `browser-${crypto.randomUUID()}@example.test`
  const password = '  Browser correct horse  '
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Login', exact: true })).toBeEnabled()
  await page.screenshot({ path: 'artifacts/preview/live-login-desktop.png' })
  await page.getByRole('button', { name: 'Create Account', exact: true }).click()
  await expect(page.getByRole('article')).toHaveAttribute('data-phase', 'idle')
  await page.screenshot({ path: 'artifacts/preview/live-register-desktop.png' })
  await page.getByLabel('Full Name', { exact: true }).fill('Browser Test')
  await page.getByLabel('Work Email', { exact: true }).fill(email)
  await page.getByLabel('Create Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  const signupCode = await readCode(request, email)
  await fillCode(page, signupCode)
  await expect(page.getByRole('heading', { name: 'Email Verified!' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to Login', exact: true }).click()
  await expect(page.getByRole('article')).toHaveAttribute('data-mode', 'login')
  await expect(page.getByRole('article')).toHaveAttribute('data-phase', 'idle')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Signed in', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Signed in', exact: true })).toBeVisible()
  await page.screenshot({ path: 'artifacts/preview/live-session-desktop.png' })
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await page.getByRole('button', { name: 'Forgot Password?', exact: true }).click()
  await page.getByLabel('Registered Email', { exact: true }).fill(email)
  await page.getByRole('button', { name: 'Send OTP Code', exact: true }).click()
  await fillCode(page, await readCode(request, email, signupCode))
  await page.getByRole('dialog').locator('input[name="newPassword"]').fill('  Updated browser password  ')
  await page.getByRole('dialog').locator('input[name="confirmPassword"]').fill('  Updated browser password  ')
  await page.getByRole('button', { name: 'Update Password', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Password Updated!' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to Login', exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('  Updated browser password  ')
  await page.getByRole('button', { name: 'Login', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Signed in', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out all devices', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Forgot Password?', exact: true }).click()
  await page.screenshot({ path: 'artifacts/preview/live-recovery-mobile.png', fullPage: true })
  await page.keyboard.press('Escape')
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0])
})
