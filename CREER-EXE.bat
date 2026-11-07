@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  === Mes Finances : creation du .exe ===
echo.
where node >nul 2>nul
if errorlevel 1 (
  echo  Node.js n'est pas installe. Installe la version LTS puis relance ce fichier.
  start https://nodejs.org/fr
  pause
  exit /b 1
)
echo  1/2 Installation des outils (une seule fois, ~2 min)...
call npm install --no-fund --no-audit
if errorlevel 1 ( echo Echec de l'installation. & pause & exit /b 1 )
echo  2/2 Construction de MesFinances-Installation.exe...
call npm run dist
if errorlevel 1 ( echo Echec de la construction. & pause & exit /b 1 )
echo.
echo  Termine ! L'installateur : dist\MesFinances-Installation.exe
explorer dist
pause
