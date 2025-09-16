# StudyAI Simple Startup Script
Write-Host "🚀 Starting StudyAI Platform..." -ForegroundColor Green

# Kill existing processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start backend in new window
Write-Host "📡 Starting Backend..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm start" -WindowStyle Normal

# Wait for backend
Start-Sleep -Seconds 5

# Start frontend in new window  
Write-Host "🌐 Starting Frontend..." -ForegroundColor Blue
Start-Process -FilePath "powershell" -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "✅ StudyAI Platform Started!" -ForegroundColor Green
Write-Host ""
Write-Host "🌍 Access Points:" -ForegroundColor Yellow
Write-Host "• Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "• Backend:  http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Development Login:" -ForegroundColor Yellow
Write-Host "• Email:    test@dev.local" -ForegroundColor White
Write-Host "• Password: test123" -ForegroundColor White
Write-Host ""
Write-Host "💡 Both servers will run in separate windows." -ForegroundColor Gray
Write-Host "💡 Close those windows to stop the servers." -ForegroundColor Gray