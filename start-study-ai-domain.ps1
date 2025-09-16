# StudyAI Platform - Custom Domain Script
Write-Host "🚀 Starting StudyAI Platform with study-ai.io-style URL..." -ForegroundColor Green
Write-Host ""

# Kill existing processes
taskkill /f /im node.exe 2>$null | Out-Null
Start-Sleep -Seconds 2

# Start backend
Write-Host "🔧 Starting backend server..." -ForegroundColor Green
$backendPath = "$PSScriptRoot\backend"
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$backendPath'; npm start" -WindowStyle Normal

# Start frontend  
Write-Host "🎨 Starting frontend server..." -ForegroundColor Green
$frontendPath = "$PSScriptRoot\frontend"
Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$frontendPath'; npm start" -WindowStyle Normal

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Create custom tunnels
Write-Host "🌍 Creating custom study-ai URLs..." -ForegroundColor Green

Write-Host "📡 Creating main site tunnel..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-Command", "npx localtunnel --port 3000 --subdomain study-ai" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "📊 Creating API tunnel..." -ForegroundColor Cyan  
Start-Process -FilePath "powershell" -ArgumentList "-Command", "npx localtunnel --port 3001 --subdomain study-ai-api" -WindowStyle Normal

Write-Host ""
Write-Host "✅ StudyAI Platform is now live with custom URLs!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Your Custom URLs:" -ForegroundColor Yellow
Write-Host "👉 Main Site: https://study-ai.loca.lt" -ForegroundColor Cyan
Write-Host "👉 API: https://study-ai-api.loca.lt" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Share https://study-ai.loca.lt with anyone!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To get the actual study-ai.io domain:" -ForegroundColor Yellow
Write-Host "   1. Purchase study-ai.io from a domain registrar" -ForegroundColor White
Write-Host "   2. Deploy to hosting (Vercel, Netlify, etc.)" -ForegroundColor White
Write-Host "   3. Point domain to your hosting" -ForegroundColor White
Write-Host ""