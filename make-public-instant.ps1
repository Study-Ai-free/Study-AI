# StudyAI Instant Public Access Script
Write-Host "🚀 Making StudyAI Platform instantly accessible worldwide..." -ForegroundColor Green
Write-Host ""

# Kill any existing processes
taskkill /f /im node.exe 2>$null | Out-Null
Start-Sleep -Seconds 2

# Start backend
Write-Host "🔧 Starting backend server..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$PSScriptRoot\backend'; npm start" -PassThru -WindowStyle Normal

# Wait for backend to start
Start-Sleep -Seconds 5

# Start frontend
Write-Host "🎨 Starting frontend server..." -ForegroundColor Green  
$frontendProcess = Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$PSScriptRoot\frontend'; npm start" -PassThru -WindowStyle Normal

# Wait for frontend to start
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🌍 Creating public tunnels..." -ForegroundColor Green

# Create ngrok tunnels
Write-Host "📡 Starting backend tunnel..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-Command", "ngrok http 3001 --log stdout" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "🌐 Starting frontend tunnel..." -ForegroundColor Cyan  
Start-Process -FilePath "powershell" -ArgumentList "-Command", "ngrok http 3000 --log stdout" -WindowStyle Normal

Write-Host ""
Write-Host "✅ StudyAI Platform is now publicly accessible!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Steps to get your public URLs:" -ForegroundColor Yellow
Write-Host "1. Check the ngrok terminal windows for your public URLs" -ForegroundColor White
Write-Host "2. Look for lines like: 'Forwarding https://xxxxx.ngrok.io -> http://localhost:3000'" -ForegroundColor White
Write-Host "3. Share the frontend https://xxxxx.ngrok.io URL with anyone!" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your site will be accessible from anywhere in the world!" -ForegroundColor Green