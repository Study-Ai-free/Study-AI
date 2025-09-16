# StudyAI Production Deployment Script
Write-Host "🚀 Building StudyAI Platform for Study-AI.io domain..." -ForegroundColor Green
Write-Host ""

# Build frontend for production
Write-Host "🏗️ Building frontend for production..." -ForegroundColor Green
cd frontend
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Frontend build completed successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

# Create production start script
Write-Host "📦 Creating production startup configuration..." -ForegroundColor Green
cd ..

# Copy production environment
Copy-Item "backend\.env" "backend\.env.backup" -Force
Copy-Item "frontend\.env.production" "frontend\.env" -Force

Write-Host ""
Write-Host "🌍 Production Build Complete!" -ForegroundColor Green
Write-Host "📁 Frontend build available in: frontend/build/" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Next Steps for Study-AI.io deployment:" -ForegroundColor Yellow
Write-Host "1. Purchase and configure Study-AI.io domain" -ForegroundColor White
Write-Host "2. Set up hosting (Vercel, Netlify, AWS, etc.)" -ForegroundColor White
Write-Host "3. Deploy frontend build to hosting provider" -ForegroundColor White
Write-Host "4. Deploy backend to cloud server (AWS, DigitalOcean, etc.)" -ForegroundColor White
Write-Host "5. Configure DNS records to point to your hosting" -ForegroundColor White
Write-Host ""
Write-Host "💡 Recommended hosting options:" -ForegroundColor Cyan
Write-Host "Frontend: Vercel, Netlify, or GitHub Pages" -ForegroundColor White
Write-Host "Backend: Railway, Heroku, DigitalOcean, or AWS" -ForegroundColor White
Write-Host ""