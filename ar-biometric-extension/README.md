# AR Biometric Bridge — Extensão Chrome 🛡️

Ponte segura entre a aplicação web da Autoridade de Registro (ANGRY) e hardware biométrico local.

## Funcionalidades

- **Captura biométrica** (5 dedos) com guia visual
- **Detecção de vivacidade** (liveness / anti-spoofing)
- **Assinatura AGR** via HMAC-SHA256 com senha do token A3
- **Integração ANGRY**: login, aprovação de pedido, revogação de certificado
- **Criptografia ponta-a-ponta** (ECDH + AES-GCM)
- **Anti-replay** via nonces + carimbo de tempo

## Arquitetura

```
Página Web (ANGRY)
    ↕ CustomEvent
Content Script (ISOLATED world)
    ↕ chrome.runtime.sendMessage
Service Worker (background)
    ↕ Native Messaging (stdin/stdout)
Native Host (C# .NET 8)
    ↕ USB/Driver
Scanner Biométrico (Futronic / SecuGen / Suprema)
```

## Instalação Rápida

### 1. Carregar a extensão

1. Abra `chrome://extensions`
2. Ative **"Modo do desenvolvedor"** (canto superior direito)
3. Clique **"Carregar sem compactação"**
4. Selecione a pasta `ar-biometric-extension/`

### 2. Instalar o Native Host

```powershell
# Compilar (requer .NET 8 SDK)
cd native-host\csharp
dotnet publish -c Release -r win-x64 --self-contained true

# Instalar
.\install.ps1 -BinPath ".\bin\Release\net8.0\win-x64\publish"
```

> Se não tiver .NET 8 SDK, o DevKit inclui o binário pré-compilado.

### 3. Configurar o ID da extensão

Após carregar a extensão, copie o ID em `chrome://extensions`:

```powershell
.\install.ps1 -ExtensionId "SEU_ID_AQUI"
```

Ou edite manualmente:
- Arquivo: `%LOCALAPPDATA%\Google\Chrome\User Data\NativeMessagingHosts\com.ar.biometric.host.json`
- Campo `allowed_origins`: troque `SUBSTITUA_PELO_ID_REAL_DA_EXTENSAO` pelo ID real

## URLs Permitidas

| Ambiente | URL |
|----------|-----|
| Desenvolvimento | `http://localhost:3000` / `http://localhost:3001` |
| Preview Vercel | `https://*.vercel.app` |
| Produção | `https://vemapi.com.br` / `https://*.vemapi.com.br` |
| ANGRY | `https://angry.ac.br` / `https://*.angry.ac.br` |
| ICP-Brasil | `https://*.icp-brasil.gov.br` |

## Build para Distribuição

```powershell
.\build.ps1
```

Gera em `dist/`:
- `ar-biometric-extension-v1.0.0.zip` — extensão pura (para Chrome Web Store)
- `ar-biometric-native-host-v1.0.0.zip` — binário nativo (para instalação silenciosa)
- `ar-biometric-devkit-v1.0.0.zip` — pacote completo (extensão + instalador)

## Segurança

- ✅ Biometria nunca sai do service worker sem criptografia
- ✅ Senha AGR nunca trafega em texto plano (apenas HMAC)
- ✅ Nonce + timestamp previnem replay
- ✅ Content script roda em `world: "ISOLATED"` (sem acesso ao DOM da página)
- ✅ Chaves efêmeras ECDH por sessão
- ✅ Manifest V3 (sem eval(), sem inline script)

## Troubleshooting

**Native Host não conecta:**
1. Verifique se o binário existe em `C:\Program Files\AR Biometric Host\`
2. Verifique o manifesto em `%LOCALAPPDATA%\Google\Chrome\User Data\NativeMessagingHosts\`
3. Abra `chrome://extensions` → extensão → "Inspect views background" → console

**Scanner não encontrado:**
- Configure `AR_SCANNER_TYPE` como variável de ambiente: `MOCK`, `FUTRONIC`, `SECUGEN`, `SUPREMA`
- O driver do scanner deve estar instalado separadamente

## Licença

Propriedade da VEMAPI Tecnologia Ltda. — Uso interno autorizado.
