# Railway Login Script - Ejecuta esto en PowerShell interactivo
Write-Host "=== Iniciando sesion en Railway ===" -ForegroundColor Cyan
Write-Host "Se va a abrir tu navegador. Inicia sesion ahi y volve aca." -ForegroundColor Yellow
Write-Host ""
railway login
Write-Host ""
Write-Host "=== Login completado! ===" -ForegroundColor Green
Write-Host "Ahora ejecutando 'railway list'..." -ForegroundColor Cyan
railway list
Write-Host ""
Write-Host "=== Listo! Volve al chat de Antigravity ===" -ForegroundColor Green
pause
