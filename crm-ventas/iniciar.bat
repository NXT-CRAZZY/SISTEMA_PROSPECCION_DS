@echo off
chcp 65001 >nul
title CRM Ventas - Inicio Rapido

echo ==========================================
echo   CRM Ventas - Sistema de Rastreo
echo ==========================================
echo.

REM Verificar si Node.js esta instalado
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js no esta instalado.
    echo Descargalo de: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar si MySQL esta corriendo
echo Verificando MySQL...
mysql --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ADVERTENCIA: comando mysql no encontrado.
    echo Asegurate de que MySQL este instalado y en PATH.
)

echo.
echo 1. Instalar dependencias del backend...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR al instalar dependencias del backend
    pause
    exit /b 1
)
cd ..

echo.
echo 2. Instalar dependencias del frontend...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR al instalar dependencias del frontend
    pause
    exit /b 1
)
cd ..

echo.
echo ==========================================
echo   Instrucciones:
echo ==========================================
echo.
echo 1. Asegurate de tener MySQL corriendo y la base
echo    de datos 'crm_ventas' creada.
echo.
echo 2. Ejecuta el script schema.sql en MySQL:
echo    mysql -u root -p crm_ventas ^< backend\scripts\schema.sql
echo.
echo 3. (Opcional) Poblar datos de prueba:
echo    cd backend ^&^& npm run seed ^&^& cd ..
echo.
echo 4. Iniciar backend (en otra terminal):
echo    cd backend ^&^& npm run dev
echo.
echo 5. Iniciar frontend (en otra terminal):
echo    cd frontend ^&^& npm run dev
echo.
echo 6. Abrir http://localhost:5173
echo.
echo Credenciales: admin@crm.com / password123
echo ==========================================

pause
