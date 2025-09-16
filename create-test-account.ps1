# StudyAI - Test Account Creation Script
Write-Host "🧪 Creating test account for StudyAI Platform..." -ForegroundColor Green
Write-Host ""

# Wait for servers to be ready
Write-Host "⏳ Waiting for servers to start..." -ForegroundColor Yellow
Start-Sleep 5

try {
    # Create test account
    Write-Host "👤 Creating test user account..." -ForegroundColor Cyan
    $createBody = @{
        email = "testuser@studyai.dev"
        password = "testpass123"
        full_name = "Test User"
    } | ConvertTo-Json

    $createResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/signup" -Method POST -ContentType "application/json" -Body $createBody -UseBasicParsing
    Write-Host "✅ Account created successfully!" -ForegroundColor Green
    Write-Host "Response: $($createResponse.Content)" -ForegroundColor Gray
    Write-Host ""

    # Test login
    Write-Host "🔐 Testing login..." -ForegroundColor Cyan
    $loginBody = @{
        email = "testuser@studyai.dev"
        password = "testpass123"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/signin" -Method POST -ContentType "application/json" -Body $loginBody -UseBasicParsing
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "Response: $($loginResponse.Content)" -ForegroundColor Gray
    Write-Host ""

    Write-Host "🎉 Test account ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Test Credentials:" -ForegroundColor Yellow
    Write-Host "Email: testuser@studyai.dev" -ForegroundColor White
    Write-Host "Password: testpass123" -ForegroundColor White
    Write-Host ""
    Write-Host "🌐 Access your app at: http://localhost:3000" -ForegroundColor Yellow

} catch {
    Write-Host "❌ Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Gray
    }
}