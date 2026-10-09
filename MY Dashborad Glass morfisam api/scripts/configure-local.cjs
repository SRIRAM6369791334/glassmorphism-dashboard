// Optional native development setup. Does not download software or start services.
const { existsSync, mkdirSync, writeFileSync } = require('node:fs');
const { randomBytes } = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const local = path.join(root, '.local');
if (existsSync(path.join(root, '.env'))) throw new Error('.env already exists; preserve it and configure services manually.');
mkdirSync(local, { recursive: true });
const secret = () => randomBytes(32).toString('hex');
const admin = secret(); const password = secret();
const url = `mysql://glass_auth:${password}@127.0.0.1:3307/glass_auth?connection_limit=10&pool_timeout=10`;
writeFileSync(path.join(root, '.env'), [
  'NODE_ENV=development', 'PORT=3000', 'HOST=127.0.0.1', `DATABASE_URL=${url}`,
  `TEST_DATABASE_URL=${url.replace('/glass_auth?', '/glass_auth_test?')}`, 'REDIS_URL=redis://127.0.0.1:6380/0',
  `JWT_ACCESS_SECRET=${secret()}`, `TOKEN_HASH_SECRET=${secret()}`, `OTP_SECRET=${secret()}`, `RECEIPT_SECRET=${secret()}`,
  'CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173', 'EMAIL_PROVIDER=smtp',
  'SMTP_HOST=127.0.0.1', 'SMTP_PORT=1025', 'SMTP_FROM=Glass Auth <no-reply@localhost>', '',
].join('\n'), { mode: 0o600 });
writeFileSync(path.join(local, 'mysql-init.sql'), [
  `ALTER USER 'root'@'localhost' IDENTIFIED BY '${admin}';`,
  'CREATE DATABASE IF NOT EXISTS glass_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
  'CREATE DATABASE IF NOT EXISTS glass_auth_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
  `CREATE USER IF NOT EXISTS 'glass_auth'@'localhost' IDENTIFIED BY '${password}';`,
  "GRANT ALL PRIVILEGES ON glass_auth.* TO 'glass_auth'@'localhost';",
  "GRANT ALL PRIVILEGES ON glass_auth_test.* TO 'glass_auth'@'localhost';", '',
].join('\n'), { mode: 0o600 });
writeFileSync(path.join(local, 'mysql-admin.cnf'), `[client]\nuser=root\npassword=${admin}\nhost=127.0.0.1\nport=3307\n`, { mode: 0o600 });
const nativePath = root.replace(/\\/g, '/');
writeFileSync(path.join(local, 'my.ini'), `[mysqld]\nbasedir="${nativePath}/.local/mysql-8.4.10-winx64"\ndatadir="${nativePath}/.local/mysql-data"\nport=3307\nbind-address=127.0.0.1\nmysqlx=OFF\ncharacter-set-server=utf8mb4\ncollation-server=utf8mb4_unicode_ci\ndefault-time-zone=+00:00\ndefault-storage-engine=InnoDB\nmax_connections=100\n`);
console.log('Created ignored local configuration and native MySQL initialization files; secrets were not printed.');
