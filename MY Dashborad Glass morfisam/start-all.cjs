const { spawn, execSync } = require('child_process');
const net = require('net');
const path = require('path');

const FRONTEND_DIR = 'D:\\UI Project\\MY Dashborad Glass morfisam';
const BACKEND_DIR = 'D:\\UI Project\\MY Dashborad Glass morfisam api';

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function ensureInfrastructure() {
  console.log('\x1b[36m[*] Checking Database & Cache infrastructure...\x1b[0m');

  const mysqlReady = await isPortOpen(3307);
  if (!mysqlReady) {
    console.log('\x1b[33m[>] Starting local MySQL 8.4 on port 3307...\x1b[0m');
    const mysqlExe = path.join(BACKEND_DIR, '.local', 'mysql-8.4.10-winx64', 'bin', 'mysqld.exe');
    const myIni = path.join(BACKEND_DIR, '.local', 'my.ini');
    try {
      spawn(mysqlExe, [`--defaults-file=${myIni}`], { detached: true, stdio: 'ignore' }).unref();
      await new Promise((r) => setTimeout(r, 2000));
    } catch (e) {
      console.error('Failed to start MySQL:', e.message);
    }
  } else {
    console.log('\x1b[32m[v] MySQL 8.4 is ready on port 3307.\x1b[0m');
  }

  const redisReady = await isPortOpen(6380);
  if (!redisReady) {
    console.log('\x1b[33m[>] Starting local Redis on port 6380 via WSL...\x1b[0m');
    try {
      execSync('wsl -d kali-linux -u root -- sh -lc "mkdir -p /tmp/glass-auth-redis; redis-server --bind 127.0.0.1 --port 6380 --protected-mode yes --daemonize yes --dir /tmp/glass-auth-redis --pidfile /tmp/glass-auth-redis/redis.pid --logfile /tmp/glass-auth-redis/redis.log --appendonly yes"');
    } catch (e) {
      console.warn('Could not start Redis via WSL automatically:', e.message);
    }
  } else {
    console.log('\x1b[32m[v] Redis is ready on port 6380.\x1b[0m');
  }
}

async function main() {
  console.clear();
  console.log('\x1b[35m==============================================================================\x1b[0m');
  console.log('\x1b[35m        GLASSMORPHISM AUTH DASHBOARD - ALL-IN-ONE SYSTEM LAUNCHER             \x1b[0m');
  console.log('\x1b[35m==============================================================================\x1b[0m\n');

  await ensureInfrastructure();

  console.log('\n\x1b[36m[*] Launching Backend API, Email Worker, and Frontend...\x1b[0m\n');

  const children = [];

  // 1. Backend API Server
  console.log('\x1b[32m[1/3] Starting Backend API (Port 3000)...\x1b[0m');
  const apiProc = spawn('node', ['dist/main.js'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true,
  });
  children.push(apiProc);

  // 2. Email Worker
  console.log('\x1b[32m[2/3] Starting Email Worker with Gmail SMTP...\x1b[0m');
  const workerProc = spawn('node', ['dist/worker.js'], {
    cwd: BACKEND_DIR,
    stdio: 'inherit',
    shell: true,
  });
  children.push(workerProc);

  // 3. Frontend Dev Server
  console.log('\x1b[32m[3/3] Starting Frontend Dev Server (Port 5173)...\x1b[0m');
  const frontendProc = spawn('npm.cmd', ['run', 'dev'], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    shell: true,
  });
  children.push(frontendProc);

  // Open Browser after 3 seconds
  setTimeout(() => {
    console.log('\n\x1b[36m[*] Opening browser at http://127.0.0.1:5173 ...\x1b[0m');
    spawn('cmd.exe', ['/c', 'start', 'http://127.0.0.1:5173'], { stdio: 'ignore', shell: true });
  }, 3000);

  // Graceful shutdown on Ctrl+C or kill
  const cleanup = () => {
    console.log('\n\x1b[31m[*] Stopping all services...\x1b[0m');
    for (const child of children) {
      try {
        if (child.pid) process.kill(child.pid);
      } catch {}
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch(console.error);
