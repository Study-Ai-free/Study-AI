# StudyAI Production Server Start Script
Write-Host "🚀 Starting StudyAI Platform for Study-AI.io..." -ForegroundColor Green
Write-Host ""

# Set production environment
$env:NODE_ENV = "production"
$env:PORT = "3001"
$env:HOST = "0.0.0.0"

Write-Host "🌍 Environment: Production (Study-AI.io)" -ForegroundColor Green
Write-Host "🚀 Domain: study-ai.io" -ForegroundColor Cyan
Write-Host "📡 Backend API: api.study-ai.io" -ForegroundColor Cyan
Write-Host ""

# Start backend in production mode
Write-Host "🔧 Starting backend server..." -ForegroundColor Green
cd backend
npm start

Write-Host ""
Write-Host "✅ StudyAI Platform running in production mode!" -ForegroundColor Green
Write-Host "🌐 Configured for: https://study-ai.io" -ForegroundColor Cyan
Write-Host "📊 API endpoint: https://api.study-ai.io" -ForegroundColor Cyan