require('dotenv/config');
const { spawnSync } = require('node:child_process');
if (!process.env.TEST_DATABASE_URL || !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith('_test')) {
  throw new Error('Set TEST_DATABASE_URL to an isolated MySQL database ending in _test.');
}
const result = spawnSync(process.execPath, ['--test', '--test-concurrency=1', 'artifacts/test-build/test/integration/*.test.js'], {
  stdio: 'inherit', env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL, RUN_INTEGRATION: '1' },
});
process.exitCode = result.status ?? 1;
