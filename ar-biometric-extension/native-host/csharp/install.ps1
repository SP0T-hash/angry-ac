#!/usr/bin/env pwsh
# install.ps1
# Script de instalação do Native Messaging Host para AR Biometric Bridge.
#
# Uso:
#   .\install.ps1 -BinPath ".\bin\Release\net8.0\win-x64\publish"
#
# O que faz:
#   1. Copia o binário compilado para Program Files
#   2. Cria o manifesto JSON no diretório do Chrome
#   3. Valida a instalação

param(
    [Parameter(Mandatory = $false)]
    [string]$BinPath = "",
    
    [Parameter(Mandatory = $false)]
    [string]$ExtensionId = "",

    [Parameter(Mandatory = $false)]
    [switch]$Uninstall
)

$ErrorActionPreference = "Stop"
$HostName = "com.ar.biometric.host"

# ─────────────────────────────────────────────────────────────────────────────
# Diretórios
# ─────────────────────────────────────────────────────────────────────────────

$ProgramDir = "${env:ProgramFiles}\AR Biometric Host"
$ChromeManifestDir = "${env:LOCALAPPDATA}\Google\Chrome\User Data\NativeMessagingHosts"
$EdgeManifestDir = "${env:LOCALAPPDATA}\Microsoft\Edge\User Data\NativeMessagingHosts"
$ManifestSource = Join-Path $PSScriptRoot "..\manifest\com.ar.biometric.host.json"

# ─────────────────────────────────────────────────────────────────────────────
# Uninstall
# ─────────────────────────────────────────────────────────────────────────────

if ($Uninstall) {
    Write-Host "🗑️  Removendo AR Biometric Host..."

    @($ChromeManifestDir, $EdgeManifestDir) | ForEach-Object {
        $manifestPath = Join-Path $_ "${HostName}.json"
        if (Test-Path $manifestPath) {
            Remove-Item $manifestPath -Force
            Write-Host "   Removido: $manifestPath"
        }
    }

    if (Test-Path $ProgramDir) {
        Remove-Item $ProgramDir -Recurse -Force
        Write-Host "   Removido: $ProgramDir"
    }

    Write-Host "✅ Desinstalação concluída."
    return
}

# ─────────────────────────────────────────────────────────────────────────────
# Install
# ─────────────────────────────────────────────────────────────────────────────

Write-Host "🚀 Instalando AR Biometric Host..."
Write-Host ""

# 1. Resolver binário
if (-not $BinPath -or -not (Test-Path $BinPath)) {
    # Tentar encontrar no diretório de build padrão
    $projectRoot = Split-Path $PSScriptRoot -Parent
    $defaultPath = Join-Path $projectRoot "csharp\bin\Release\net8.0\win-x64\publish"
    
    if (Test-Path $defaultPath) {
        $BinPath = $defaultPath
    } else {
        Write-Warning "Binário não encontrado. Execute 'dotnet publish -c Release' primeiro."
        Write-Warning "Ou especifique -BinPath <caminho>"
        
        # Verificar se pelo menos o diretório existe
        $buildPath = Join-Path $projectRoot "csharp\bin\Debug\net8.0\win-x64"
        if (Test-Path $buildPath) {
            $BinPath = $buildPath
            Write-Warning "Usando build Debug: $BinPath"
        } else {
            throw "Nenhum binário encontrado. Compile o projeto primeiro."
        }
    }
}

$exeSource = Join-Path $BinPath "ArBiometricHost.exe"
if (-not (Test-Path $exeSource)) {
    throw "ArBiometricHost.exe não encontrado em: $BinPath"
}

# 2. Copiar binário para Program Files
if (-not (Test-Path $ProgramDir)) {
    New-Item -ItemType Directory -Path $ProgramDir -Force | Out-Null
}

$exeDest = Join-Path $ProgramDir "ArBiometricHost.exe"
Copy-Item $exeSource $exeDest -Force
Write-Host "✅ Binário copiado: $exeDest"

# 3. Criar manifesto para Chrome
if (-not (Test-Path $ChromeManifestDir)) {
    New-Item -ItemType Directory -Path $ChromeManifestDir -Force | Out-Null
}

# Carregar template e substituir placeholders
$manifest = Get-Content $ManifestSource -Raw
$manifest = $manifest -replace '"path": ".*"', '"path": "' + $exeDest.Replace('\', '\\') + '"'

if ($ExtensionId) {
    $manifest = $manifest -replace 'chrome-extension://.*/', "chrome-extension://${ExtensionId}/"
} else {
    Write-Warning "⚠️  ExtensionId não especificado. Edite o manifesto manualmente."
    Write-Warning "   Arquivo: $ChromeManifestDir\${HostName}.json"
}

$chromeManifestDest = Join-Path $ChromeManifestDir "${HostName}.json"
Set-Content -Path $chromeManifestDest -Value $manifest -Encoding UTF8
Write-Host "✅ Manifesto Chrome: $chromeManifestDest"

# 4. Criar manifesto para Edge (mesmo conteúdo)
if (Test-Path $EdgeManifestDir) {
    $edgeManifestDest = Join-Path $EdgeManifestDir "${HostName}.json"
    Copy-Item $chromeManifestDest $edgeManifestDest -Force
    Write-Host "✅ Manifesto Edge: $edgeManifestDest"
}

# 5. Validar
Write-Host ""
Write-Host "🔍 Validando instalação..."

if (Test-Path $exeDest) {
    $version = (Get-Item $exeDest).VersionInfo.FileVersion
    Write-Host "   ✅ Binário: $exeDest (versão $version)"
} else {
    Write-Error "   ❌ Binário não encontrado!"
}

if (Test-Path $chromeManifestDest) {
    $manifestContent = Get-Content $chromeManifestDest -Raw | ConvertFrom-Json
    Write-Host "   ✅ Manifesto Chrome: origem permitida = $($manifestContent.allowed_origins)"
} else {
    Write-Error "   ❌ Manifesto não encontrado!"
}

Write-Host ""
Write-Host "🎯 Instalação concluída!"
Write-Host ""
Write-Host "Próximos passos:"
Write-Host "  1. Abra chrome://extensions"
Write-Host "  2. Ative o 'Modo do desenvolvedor'"
Write-Host "  3. Carregue a extensão sem compactação"
Write-Host "  4. Copie o ID da extensão"
Write-Host "  5. Edite o manifesto em:"
Write-Host "     $chromeManifestDest"
Write-Host "     Substitua allowed_origins pelo ID real da extensão"
