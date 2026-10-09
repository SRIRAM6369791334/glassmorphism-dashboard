import { expect, test } from '@playwright/test'

test('sign-out retains the session on uncertain failure and exits an already-revoked session', async ({ page }, testInfo) => {
  let logouts = 0
  await page.route('**/api/v1/auth/**', async route => {
    if (route.request().url().endsWith('/refresh')) {
      await route.fulfill({ json: { success: true, data: { accessToken: 'test-only-token', expiresIn: 900, user: { id: 'test-user', email: 'session@example.test', displayName: 'Session test' } } } })
    } else {
      logouts++
      await route.fulfill({ status: logouts === 1 ? 503 : 401, json: { success: false, code: logouts === 1 ? 'SERVICE_UNAVAILABLE' : 'UNAUTHORIZED', requestId: 'test-request' } })
    }
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Signed in', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('may have completed')
  await expect(page.getByRole('heading', { name: 'Signed in', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Login', exact: true })).toBeVisible()
  expect(logouts).toBe(2)
  await page.screenshot({ path: testInfo.outputPath('revoked-session-login.png') })
})
