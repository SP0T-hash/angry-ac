@echo off
title CoreAr + AC ANGRY - Setup do Ambiente
echo ============================================
echo  CoreAr + AC ANGRY - Setup do Ambiente
echo ============================================
echo.
echo PASSO 1: Execute o schema no Supabase
echo -------------------------------------
echo 1. Acesse: https://supabase.com/dashboard
echo 2. Crie um projeto ou use um existente
echo 3. Va em SQL Editor -^> New Query
echo 4. Cole o conteudo de SUPABASE_SCHEMA.sql e execute
echo 5. (Opcional) Execute SUPABASE_SEED.sql para dados de teste
echo.
echo Depois de criar o projeto, voce precisara das credenciais:
echo - Project URL: Settings -^> API -^> Project URL
echo - anon key: Settings -^> API -^> anon/public
echo - service_role key: Settings -^> API -^> service_role
echo.
echo PASSO 2: Configure o .env.local
echo --------------------------------
echo Edite o arquivo .env.local em gs.vemapi\frontend\ com:
echo - NEXT_PUBLIC_SUPABASE_URL=(sua URL do Supabase)
echo - NEXT_PUBLIC_SUPABASE_ANON_KEY=(sua anon key)
echo - SUPABASE_SERVICE_ROLE_KEY=(sua service role key)
echo - PKI_NONCE_SECRET ja foi gerado!
echo - AUTH_JWT_SECRET ja foi gerado!
echo.
echo PASSO 3: Inicie o frontend
echo ----------------------------
echo cd gs.vemapi\frontend
echo npm install
echo npm run dev
echo.
echo PASSO 4: Teste a autenticacao
echo ------------------------------
echo curl -X POST http://localhost:3000/api/ac/login ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"email\":\"admin@angry.ac.br\",\"password\":\"00000000000\"}"
echo.
echo ============================================
echo  Secrets ja gerados via Node.js crypto
echo ============================================
echo.
pause
