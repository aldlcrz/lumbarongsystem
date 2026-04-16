# Lumbarong System Startup Script
# Run this from the project root (lumbarong-main)

Write-Host "🚀 Starting Lumbarong System Servers..." -ForegroundColor Cyan

# Start Backend
Write-Host "📦 Starting Backend Server (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm.cmd run dev"

# Start Frontend
Write-Host "🖥️ Starting Frontend Next.js Dev Server (Port 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm.cmd run dev"

Write-Host "✅ Both servers are initializing in background windows..." -ForegroundColor White
Write-Host "Backend: http://localhost:5000" -ForegroundColor Gray
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Gray
