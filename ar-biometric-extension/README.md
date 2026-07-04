# AR Biometric Bridge — Extensão Chrome (Manifest V3)

Ponte de comunicação segura entre a aplicação web da Autoridade de Registro
e hardware biométrico local, conformante com requisitos da ICP-Brasil.

---

## Arquitetura de Segurança

### Fluxo de Dados (ponta a ponta)

```
Web App (AR)
  │  CustomEvent "AR_BRIDGE:REQUEST"
  ▼
Content Script (ISOLATED world)
  │  Validação de schema + sanitização
  │  chrome.runtime.sendMessage
  ▼
Service Worker (background)
  │  Verificação de origem + nonce + timestamp
  │  chrome.runtime.connectNative()
  ▼
Native Messaging Host (C# / Java)
  │  stdin/stdout (protocolo Chrome NM)
  │  Validação de timestamp no host nativo
  ▼
SDK do Leitor Biométrico
  │  Captura + PAD (Liveness Detection)
  │
  ◀─── Retorno: template ISO 19794-2 + liveness score
  ▲
Service Worker
  │  Criptografia AES-GCM 256-bit (WebCrypto)
  │  Assinatura ECDSA P-256 + nonce
  │  chrome.tabs.sendMessage
  ▼
Content Script
  │  CustomEvent "AR_BRIDGE:RESPONSE"
  ▼
Web App (AR)
  │  POST /api/certificado/validar-biometria
  ▼
Backend da AR
```

---

## Estrutura de Arquivos

```
ar-biometric-extension/
├── manifest.json                          # Manifest V3
├── assets/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── src/
│   ├── background/
│   │   ├── service-worker.js              # Orquestrador principal
│   │   ├── crypto-utils.js                # WebCrypto: ECDH, AES-GCM, ECDSA
│   │   └── session-store.js               # Gerenciamento de sessões em memória
│   └── content/
│       └── content-script.js              # Ponte page ↔ extension (ISOLATED)
├── native-host/
│   ├── manifest/
│   │   └── com.ar.biometric.host.json     # Registro do Native Messaging Host
│   └── csharp/
│       └── ArBiometricHost.cs             # Host nativo (C#) com SDK biométrico
└── docs/
    └── web-app-integration.js             # Exemplo de uso na aplicação web
```

---

## Instalação do Native Messaging Host

### Windows

```batch
:: Compilar o host nativo
dotnet publish ArBiometricHost.csproj -c Release -r win-x64 --self-contained true

:: Registrar no Windows Registry (HKCU para usuário, HKLM para sistema)
REG ADD "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.ar.biometric.host" ^
    /ve /t REG_SZ /d "C:\Program Files\AR Biometric Host\com.ar.biometric.host.json" /f
```

### Linux / macOS

```bash
# Copiar o manifesto
cp com.ar.biometric.host.json ~/.config/google-chrome/NativeMessagingHosts/

# Tornar o executável executável
chmod +x /opt/ar-biometric-host/ArBiometricHost
```

---

## Medidas de Segurança

### 1. Isolamento de Contexto
- Content script executa em `world: "ISOLATED"` — sem acesso ao contexto JS da página.
- Comunicação página ↔ extensão apenas via CustomEvents (nunca window.postMessage).
- O manifest não declara `web_accessible_resources`, impedindo fingerprinting.

### 2. Criptografia de Ponta a Ponta
- Template biométrico **nunca trafega em texto claro** fora do service worker.
- Cifrado com AES-GCM 256-bit; IV único por operação.
- Assinado com ECDSA P-256 para garantir autenticidade e integridade.
- Algoritmos: ECDH P-256, AES-GCM 256-bit, ECDSA P-256/SHA-256 — compatíveis com DOC-ICP-01.01.

### 3. Anti-Replay
- **Nonce UUID v4**: gerado no cliente, validado (uso único) no service worker e no host nativo.
- **Timestamp TTL**: janela de ±30 s no service worker; ±35 s no host nativo (margem de latência).
- **Sessão one-shot**: a sessão é destruída imediatamente após a captura bem-sucedida.
- **Tabela de nonces usados**: mantida em memória no service worker; purga automática acima de 10.000 entradas.

### 4. Liveness Detection (PAD — Presentation Attack Detection)
- `livenessScore >= 0.85` exigido antes de qualquer processamento do template.
- Score fornecido pelo SDK do hardware (exigir conformidade com ISO/IEC 30107-3).
- Rejeição no host nativo antes mesmo de transmitir ao service worker.

### 5. Mínimo Privilégio
- Permissões declaradas: apenas `nativeMessaging` e `storage`.
- `host_permissions` restritas aos domínios da AR e ICP-Brasil.
- Nenhuma chave privada é exportável além da necessidade de troca.
- `web_accessible_resources` vazio.

### 6. Validação de Origem em Camadas
- **Manifest**: `host_permissions` limita os domínios que podem ativar o content-script.
- **Service Worker**: `isSenderTrusted()` valida `sender.tab.url` a cada mensagem.
- **Content Script**: allowlist de `ALLOWED_ACTIONS` + schema validation.
- **Native Host JSON**: `allowed_origins` com o ID exato da extensão.
- **Native Host C#**: validação de timestamp dentro do executável (defesa em profundidade).

---

## Integração com WebAuthn/FIDO2 (Alternativa)

Se o hardware biométrico suportar FIDO2 (ex: YubiKey Bio, Feitian BioPass),
a extensão pode dispensar o Native Messaging e usar diretamente:

```javascript
// No service worker ou no content script
const credential = await navigator.credentials.create({
  publicKey: {
    challenge:   cryptoRandomBytes(32),
    rp:          { name: "AR Empresa", id: "ar.sua-empresa.com.br" },
    user:        { id: userId, name: userEmail, displayName: userName },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }], // ECDSA P-256
    authenticatorSelection: {
      authenticatorAttachment: "cross-platform",
      userVerification: "required",  // exige biometria local no autenticador
    },
    timeout: 60_000,
  },
});
```

Vantagens: sem host nativo, integração nativa ao SO, portabilidade.
Desvantagens: nem todos os leitores biométricos de AR suportam FIDO2;
templates no formato ISO 19794-2 não são acessíveis via WebAuthn API.

**Recomendação**: Implementar ambas as estratégias. Detectar suporte FIDO2
e usar WebAuthn quando disponível; cair para Native Messaging como fallback.

---

## Conformidade ICP-Brasil

| Requisito                      | Implementação                                        |
|--------------------------------|------------------------------------------------------|
| Algoritmo de assimetria        | ECDSA P-256 (DOC-ICP-01.01)                          |
| Algoritmo de hash              | SHA-256 (DOC-ICP-01.01)                              |
| Cifragem simétrica             | AES-GCM 256-bit                                      |
| Template de impressão digital  | ISO/IEC 19794-2 (via SDK do hardware)                |
| Detecção de vivacidade (PAD)   | ISO/IEC 30107-3 (via SDK + livenessScore >= 0.85)    |
| Qualidade mínima de captura    | NFIQ2 >= 40 (validado no host nativo)                |
| Rastreabilidade                | deviceId + sessionId + timestamp em cada pacote      |
| Proteção do template           | AES-GCM (nunca em texto claro fora do SW)            |
