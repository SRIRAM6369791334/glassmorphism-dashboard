Write-Host "==============================================================================" -ForegroundColor Red
Write-Host "             STOPPING GLASSMORPHISM AUTH DASHBOARD SERVICES                   " -ForegroundColor Red
Write-Host "==============================================================================" -ForegroundColor Red
Write-Host ""

Write-Host "[*] Terminating all Glassmorphism project Node.js processes..." -ForegroundColor Yellow

$procs = Get-CimInstance Win32_Process -Filter "name = 'node.exe'" | Where-Object { $_.CommandLine -like '*MY Dashborad Glass morfisam*' }
if ($procs) {
    foreach ($p in $procs) {
        Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "[x] Stopped Process ID: $($p.ProcessId)" -ForegroundColor Gray
    }
} else {
    Write-Host "[i] No active project processes found." -ForegroundColor Gray
}

Write-Host ""
Write-Host "[v] All dashboard services stopped successfully!" -ForegroundColor Green
Start-Sleep -Seconds 2
