# Script para desplegar los cambios a GitHub y Firebase
# Automatizacion para LABMETAL SAC

Write-Host "LABMETAL SAC - Script de Despliegue" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Verificar si estamos en un repositorio Git
if (-not (Test-Path ".git")) {
    Write-Host "No se encontro un repositorio Git. Inicializando..." -ForegroundColor Red
    git init
    git remote add origin https://github.com/diegoarmando211/Zapata321.git
}

# Mostrar estado actual
Write-Host "Estado actual del repositorio:" -ForegroundColor Yellow
git status

# Agregar todos los archivos
Write-Host "Agregando archivos al staging..." -ForegroundColor Blue
git add .

# Crear commit con timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$commitMessage = "Actualizacion certificados LABMETAL SAC - $timestamp"

Write-Host "Creando commit: $commitMessage" -ForegroundColor Blue
git commit -m $commitMessage

# Push a GitHub
Write-Host "Subiendo cambios a GitHub..." -ForegroundColor Magenta
git push origin main

# Verificar si Firebase CLI esta instalado
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseInstalled) {
    Write-Host "Firebase CLI no esta instalado." -ForegroundColor Red
    Write-Host "Para instalarlo, ejecuta: npm install -g firebase-tools" -ForegroundColor Yellow
} else {
    Write-Host "Desplegando en Firebase..." -ForegroundColor Red
    firebase deploy
}

Write-Host "Despliegue completado!" -ForegroundColor Green
Write-Host "Tu aplicacion deberia estar disponible en:" -ForegroundColor Cyan
Write-Host "- GitHub: https://github.com/diegoarmando211/Zapata321" -ForegroundColor Cyan
Write-Host "- Firebase: https://certificados-a7d6f.web.app" -ForegroundColor Cyan

# Pausa para ver los resultados
Read-Host "Presiona Enter para continuar"