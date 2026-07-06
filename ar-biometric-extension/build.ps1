#!/usr/bin/env pwsh
# build.ps1 -- Build + Package da AR Biometric Extension
# Uso:
#   .\build.ps1                    -> Cria ar-biometric-extension-v1.0.0.zip
#   .\build.ps1 -Version "1.0.1"   -> Versao personalizada
#   .\build.ps1 -SkipNativeHost    -> Pula build do native host C#
# Saida: dist/ar-biometric-extension-v{version}.zip (pronto para upload)

param(
    [Parameter(Mandatory = $false)]
    [string]$Version = "",

    [Parameter(Mandatory = $false)]
    [switch]$SkipNativeHost
)

$ErrorActionPreference = "Stop"
$ExtensionDir = Split-Path -Parent $PSCommandPath
$DistDir = Join-Path $ExtensionDir "dist"
$NativeHostDir = Join-Path $ExtensionDir "native-host\csharp"

# Resolver versao
if (-not $Version) {
    $manifestPath = Join-Path $ExtensionDir "manifest.json"
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
    $Version = $manifest.version
}

Write-Host "AR Biometric Extension Build v$Version" -ForegroundColor Cyan

# 1. Build Native Host (C#)
if (-not $SkipNativeHost) {
    Write-Host ""
    Write-Host "Build Native Host (C#)..." -ForegroundColor Yellow

    $csproj = Join-Path $NativeHostDir "ArBiometricHost.csproj"
    if (Test-Path $csproj) {
        Push-Location $NativeHostDir
        try {
            dotnet publish -c Release -r win-x64 --self-contained true -o "$NativeHostDir\bin\publish" 2>&1 | ForEach-Object { Write-Host "   $_" }
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "Build nativo falhou. Continuando sem ele..."
            } else {
                Write-Host "   Native Host compilado" -ForegroundColor Green
            }
        } finally {
            Pop-Location
        }
    } else {
        Write-Warning "ArBiometricHost.csproj nao encontrado em $NativeHostDir"
    }
} else {
    Write-Host ""
    Write-Host "Native Host skipado (--SkipNativeHost)" -ForegroundColor Yellow
}

# 2. Criar diretorio de distribuicao
if (-not (Test-Path $DistDir)) {
    New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
}

# 3. Criar .zip (extensao pura, sem native host)
Write-Host ""
Write-Host "Empacotando extensao..." -ForegroundColor Yellow

$zipName = "ar-biometric-extension-v${Version}.zip"
$zipPath = Join-Path $DistDir $zipName

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$includeItems = @(
    "manifest.json",
    "src\background",
    "src\content",
    "assets"
)

$tempDir = Join-Path $env:TEMP "ar-extension-build"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

foreach ($item in $includeItems) {
    $sourcePath = Join-Path $ExtensionDir $item
    if (Test-Path $sourcePath) {
        if ((Get-Item $sourcePath).PSIsContainer) {
            Copy-Item -Path $sourcePath -Destination $tempDir -Recurse -Force
        } else {
            $destDir = Split-Path -Parent (Join-Path $tempDir $item)
            if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
            Copy-Item -Path $sourcePath -Destination (Join-Path $tempDir $item) -Force
        }
    } else {
        Write-Warning "Arquivo/pasta nao encontrado: $sourcePath"
    }
}

# Incluir docs
$docsSource = Join-Path $ExtensionDir "docs\web-app-integration.js"
if (Test-Path $docsSource) {
    $docsDest = Join-Path $tempDir "docs"
    if (-not (Test-Path $docsDest)) { New-Item -ItemType Directory -Path $docsDest -Force | Out-Null }
    Copy-Item $docsSource -Destination $docsDest -Force
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
Remove-Item $tempDir -Recurse -Force

Write-Host "   Extensao: $zipPath ($((Get-Item $zipPath).Length / 1KB -as [int]) KB)" -ForegroundColor Green

# 4. Se Native Host foi compilado, criar sub-zip
$publishDir = Join-Path $NativeHostDir "bin\publish"
if (Test-Path $publishDir) {
    Write-Host ""
    Write-Host "Empacotando Native Host..." -ForegroundColor Yellow

    $nativeZipName = "ar-biometric-native-host-v${Version}.zip"
    $nativeZipPath = Join-Path $DistDir $nativeZipName

    if (Test-Path $nativeZipPath) { Remove-Item $nativeZipPath -Force }
    Compress-Archive -Path "$publishDir\*" -DestinationPath $nativeZipPath -Force
    Write-Host "   Native Host: $nativeZipPath ($((Get-Item $nativeZipPath).Length / 1MB -as [int]) MB)" -ForegroundColor Green
}

# 5. Criar DevKit completo
Write-Host ""
Write-Host "Criando DevKit (extensao + instalador)..." -ForegroundColor Yellow

$devZipName = "ar-biometric-devkit-v${Version}.zip"
$devZipPath = Join-Path $DistDir $devZipName

$devTempDir = Join-Path $env:TEMP "ar-devkit-build"
if (Test-Path $devTempDir) { Remove-Item $devTempDir -Recurse -Force }
New-Item -ItemType Directory -Path $devTempDir -Force | Out-Null

# Copiar extensao para subpasta
foreach ($item in $includeItems) {
    $sourcePath = Join-Path $ExtensionDir $item
    if (Test-Path $sourcePath) {
        if ((Get-Item $sourcePath).PSIsContainer) {
            Copy-Item -Path $sourcePath -Destination (Join-Path $devTempDir "extension") -Recurse -Force
        } else {
            $destDir = Join-Path $devTempDir "extension"
            if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
            Copy-Item -Path $sourcePath -Destination "$destDir\$item" -Force
        }
    }
}

# Copiar native host
if (Test-Path $publishDir) {
    Copy-Item -Path $publishDir -Destination (Join-Path $devTempDir "native-host") -Recurse -Force
}

# Copiar manifest do native host
$nativeManifestDir = Join-Path $ExtensionDir "native-host\manifest"
if (Test-Path $nativeManifestDir) {
    Copy-Item -Path $nativeManifestDir -Destination (Join-Path $devTempDir "native-host-manifest") -Recurse -Force
}

# Copiar install.ps1
$installScript = Join-Path $NativeHostDir "install.ps1"
if (Test-Path $installScript) {
    Copy-Item $installScript -Destination (Join-Path $devTempDir "install.ps1") -Force
}

$readmeContent = @"
AR Biometric Extension v${Version} -- Developer Kit
===================================================

Instalacao:
  1. Abra chrome://extensions
  2. Ative "Modo do desenvolvedor"
  3. Clique "Carregar sem compactacao" e selecione a pasta "extension"
  4. Copie o ID da extensao gerado
  5. Edite native-host-manifest/com.ar.biometric.host.json:
     - Substitua SUBSTITUA_PELO_ID_REAL_DA_EXTENSAO pelo ID real
     - Ajuste o caminho "path" para apontar para native-host/ArBiometricHost.exe
  6. Execute .\install.ps1 para registrar o native host

Native Host:
  - Requer .NET 8 Runtime instalado
  - Baixe em: https://dotnet.microsoft.com/download/dotnet/8.0
"@
$readmeContent | Out-File -FilePath (Join-Path $devTempDir "README.txt") -Encoding UTF8

Compress-Archive -Path "$devTempDir\*" -DestinationPath $devZipPath -Force
Remove-Item $devTempDir -Recurse -Force

Write-Host "   DevKit: $devZipPath ($((Get-Item $devZipPath).Length / 1MB -as [int]) MB)" -ForegroundColor Green

# Resumo Final
Write-Host ""
Write-Host "Build concluido!" -ForegroundColor Green
Get-ChildItem $DistDir | ForEach-Object {
    Write-Host "   $($_.Name) -- $($_.Length / 1KB -as [int]) KB" -ForegroundColor White
}
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Yellow
Write-Host "  1. Faca upload do .zip no Chrome Web Store" -ForegroundColor Gray
Write-Host "     Ou carregue sem compactacao em chrome://extensions" -ForegroundColor Gray
Write-Host "  2. Instale o Native Host via .\native-host\csharp\install.ps1" -ForegroundColor Gray
Write-Host "  3. Configure as URLs permitidas no manifest.json" -ForegroundColor Gray
