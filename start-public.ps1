# StudyAI Public Access Startup Script
Write-Host "🚀 Starting StudyAI Platform in Public Access Mode..." -ForegroundColor Green
Write-Host ""
Write-Host "📡 Backend will be available at: http://10.5.182.25:3001" -ForegroundColor Cyan
Write-Host "🌐 Frontend will be available at: http://10.5.182.25:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Configuring Windows Firewall for public access..." -ForegroundColor Yellow

# Configure Windows Firewall rules for public access
try {
    Write-Host "🔓 Adding firewall rules for ports 3000 and 3001..." -ForegroundColor Green
    netsh advfirewall firewall add rule name="StudyAI Backend Port 3001" dir=in action=allow protocol=TCP localport=3001 2>$null
    netsh advfirewall firewall add rule name="StudyAI Frontend Port 3000" dir=in action=allow protocol=TCP localport=3000 2>$null
    Write-Host "✅ Firewall rules added successfully" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  Note: You may need to run this script as Administrator to configure firewall" -ForegroundColor Yellow
    Write-Host "   Or manually allow ports 3000 and 3001 in Windows Firewall" -ForegroundColor Yellow
}

Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Function to check if port is available
function Test-Port {
    param($Port)
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    }
    catch {
        return $false
    }
}

# Check if ports are available
if (-not (Test-Port 3001)) {
    Write-Host "❌ Port 3001 is already in use. Attempting to kill existing processes..." -ForegroundColor Red
    try {
        taskkill /f /im node.exe 2>$null
        Start-Sleep -Seconds 2
    }
    catch {
        Write-Host "Could not kill existing Node.js processes" -ForegroundColor Yellow
    }
}

if (-not (Test-Port 3000)) {
    Write-Host "❌ Port 3000 is already in use. You may need to manually stop existing React apps." -ForegroundColor Red
}

# Start backend
Write-Host "🔧 Starting backend server..." -ForegroundColor Green
$backendPath = Join-Path $scriptDir "backend"
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Starting backend on 0.0.0.0:3001...'; node src/app.js" -WindowStyle Normal

# Wait for backend to start
Start-Sleep -Seconds 5

# Test backend connectivity
Write-Host "🧪 Testing backend connectivity..." -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Backend is responding on localhost" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend not responding on localhost" -ForegroundColor Red
    Write-Host "   This might be a firewall or configuration issue" -ForegroundColor Yellow
}

# Start frontend with public host
Write-Host "🎨 Starting frontend server..." -ForegroundColor Green
$frontendPath = Join-Path $scriptDir "frontend"
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "`$env:HOST='0.0.0.0'; cd '$frontendPath'; Write-Host 'Starting frontend on 0.0.0.0:3000...'; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both services are starting..." -ForegroundColor Green
Write-Host "📊 Backend: http://10.5.182.25:3001" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://10.5.182.25:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 You can now access the site from other devices on your network!" -ForegroundColor Green
Write-Host "💡 Tip: Share the frontend URL (http://10.5.182.25:3000) with others on your network" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔍 Troubleshooting:" -ForegroundColor Cyan
Write-Host "   - If external devices can't connect, check Windows Firewall settings" -ForegroundColor White
Write-Host "   - Make sure both devices are on the same network" -ForegroundColor White
Write-Host "   - Try accessing http://localhost:3000 first to verify local functionality" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")