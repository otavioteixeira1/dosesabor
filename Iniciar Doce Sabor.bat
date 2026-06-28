@echo off
setlocal

cd /d "%~dp0"

if not exist node_modules (
  echo Instalando dependencias...
  call npm install
  if errorlevel 1 goto :error
)

if not exist .env if exist .env.example (
  copy /Y .env.example .env >nul
  echo Arquivo .env criado a partir de .env.example.
  echo Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de usar o painel completo.
)

echo Iniciando Doce Sabor...
start "Doce Sabor Dev Server" cmd /k "cd /d ""%~dp0"" && npm run dev:local"

timeout /t 5 /nobreak >nul
start "" http://127.0.0.1:4173

echo.
echo Loja aberta em: http://127.0.0.1:4173
echo Painel admin: http://127.0.0.1:4173/admin/login
echo.
exit /b 0

:error
echo Falha ao iniciar o projeto.
exit /b 1
