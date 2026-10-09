Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "        GLASSMORPHISM AUTH DASHBOARD - ONE-CLICK SYSTEM LAUNCHER             " -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

$frontendDir = "D:\UI Project\MY Dashborad Glass morfisam"
$backendDir = "D:\UI Project\MY Dashborad Glass morfisam api"

# 1. Check MySQL
$mysqlActive = Get-NetTCPConnection -LocalPort 3307 -ErrorAction SilentlyContinue
if (-not $mysqlActive) {
    Write-Host "[*] Starting local MySQL 8.4 on port 3307..." -ForegroundColor Yellow
    $mysqlExe = Join-Path $backendDir ".local\mysql-8.4.10-winx64\bin\mysqld.exe"
    $mysqlConfig = Join-Path $backendDir ".local\my.ini"
    Start-Process -FilePath $mysqlExe -ArgumentList ("--defaults-file=`"$mysqlConfig`"") -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "[v] MySQL 8.4 is ready on port 3307." -ForegroundColor Green
}

# 2. Check Redis
$redisActive = Get-NetTCPConnection -LocalPort 6380 -ErrorAction SilentlyContinue
if (-not $redisActive) {
    Write-Host "[*] Starting local Redis on port 6380 via WSL..." -ForegroundColor Yellow
    wsl -d kali-linux -u root -- sh -lc "mkdir -p /tmp/glass-auth-redis; redis-server --bind 127.0.0.1 --port 6380 --protected-mode yes --daemonize yes --dir /tmp/glass-auth-redis --pidfile /tmp/glass-auth-redis/redis.pid --logfile /tmp/glass-auth-redis/redis.log --appendonly yes"
    Start-Sleep -Seconds 1
} else {
    Write-Host "[v] Redis is ready on port 6380." -ForegroundColor Green
}

Write-Host ""
Write-Host "[*] Launching Backend Services and Frontend..." -ForegroundColor Cyan

# 3. Start Backend API
Write-Host "[1/3] Starting Backend API (Port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; node dist/main.js"

# 4. Start Email Worker
Write-Host "[2/3] Starting Email Worker with Gmail SMTP..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; node dist/worker.js"

# 5. Start Frontend
Write-Host "[3/3] Starting Frontend Dev Server (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendDir'; npm run dev"

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host " [+] All 3 services launched successfully!" -ForegroundColor Green
Write-Host "     - Frontend UI:  http://127.0.0.1:5173" -ForegroundColor White
Write-Host "     - Backend API:  http://127.0.0.1:3000" -ForegroundColor White
Write-Host "     - Email Worker: Active (Gmail SMTP: sriramsri1234321@gmail.com)" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "[*] Opening browser in 3 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Start-Process "http://127.0.0.1:5173"
