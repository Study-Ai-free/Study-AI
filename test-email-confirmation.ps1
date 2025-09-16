# Test Email Confirmation Script
Write-Host "🧪 Setting up email confirmation test..." -ForegroundColor Green
Write-Host ""

# Create public tunnel for backend
Write-Host "🔗 Creating public tunnel for backend..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-Command", "npx localtunnel --port 3001 --subdomain study-ai-api" -WindowStyle Normal

Start-Sleep -Seconds 3

# Create public tunnel for frontend  
Write-Host "🌐 Creating public tunnel for frontend..." -ForegroundColor Cyan
Start-Process -FilePath "powershell" -ArgumentList "-Command", "npx localtunnel --port 3000 --subdomain study-ai-app" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Public tunnels created!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Test URLs:" -ForegroundColor Yellow
Write-Host "Frontend: https://study-ai-app.loca.lt" -ForegroundColor White
Write-Host "Backend API: https://study-ai-api.loca.lt" -ForegroundColor White
Write-Host ""
Write-Host "🧪 To test email confirmation:" -ForegroundColor Green
Write-Host "1. Go to: https://study-ai-app.loca.lt" -ForegroundColor White
Write-Host "2. Create a new account with your real email" -ForegroundColor White
Write-Host "3. Check your email for the confirmation link" -ForegroundColor White
Write-Host "4. Click the confirmation link" -ForegroundColor White
Write-Host "5. You should be redirected back to login with success message" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnels when done testing." -ForegroundColor Yellow