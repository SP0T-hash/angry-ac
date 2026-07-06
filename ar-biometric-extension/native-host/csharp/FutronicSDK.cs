// FutronicSDK.cs
// Implementação do SDK Futronic FS80/FS90 para captura de impressão digital.
//
// Dependência NuGet: Futronic.SDK.FS80 (ou Futronic.SDK.FS90)
// https://www.nuget.org/packages/Futronic.SDK.FS80
//
// Documentação: Futronic SDK Developer Guide (ANSI 378 / ISO 19794-2)
//
// PONTO DE INTEGRAÇÃO:
//   Substituir as chamadas mock pelas chamadas reais do SDK Futronic.
//   O SDK Futronic expõe:
//     - FutronicBase.Capture(out byte[] rawImage, out byte[] template)
//     - FutronicBase.GetImageQuality() → NFIQ score
//     - FutronicBase.GetDeviceInfo() → deviceId, firmware version
//
//   Para liveness (PAD):
//     - FutronicBase.GetLivenessScore() → 0.0..1.0 (se disponível no modelo)
//     - Ou integrar com biblioteca de PAD terceira

namespace ArBiometricHost;

internal sealed class FutronicSDK : IScannerSDK
{
    public string ScannerName => "Futronic FS80/FS90";
    public ScannerType Type => ScannerType.Futronic;

    private bool _initialized;
    private string _deviceId = "UNKNOWN";

    // ─────────────────────────────────────────────────────────────────────────
    // SDK Futronic: referências para os objetos reais
    // ─────────────────────────────────────────────────────────────────────────
    // private FutronicBase _scanner;  // Substituir pelo tipo real do SDK

    public Task<bool> InitializeAsync(CancellationToken ct = default)
    {
        try
        {
            // ──────────────────────────────────────────────────────────────
            // CÓDIGO REAL (descomentar quando o SDK estiver disponível):
            // ──────────────────────────────────────────────────────────────
            // _scanner = new FutronicBase();
            // bool opened = _scanner.OpenDevice(0); // primeira unidade
            // if (!opened) {
            //     Log("Nenhum dispositivo Futronic encontrado.");
            //     return Task.FromResult(false);
            // }
            // var info = _scanner.GetDeviceInfo();
            // _deviceId = $"FS80-{info.SerialNumber}";
            // Log($"Futronic inicializado: {_deviceId}, firmware {info.FirmwareVersion}");
            // _initialized = true;
            // return Task.FromResult(true);

            // ──────────────────────────────────────────────────────────────
            // MOCK (remover em produção):
            // ──────────────────────────────────────────────────────────────
            Log("⚠️  Usando MOCK FutronicSDK — substituir por SDK real no hardware de produção.");
            _deviceId = "FS80-MOCK-001";
            _initialized = true;
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            Log($"Falha ao inicializar Futronic: {ex.Message}");
            return Task.FromResult(false);
        }
    }

    public Task<CaptureResult> CaptureFingerprintAsync(CancellationToken ct = default)
    {
        ValidateInitialized();

        try
        {
            // ──────────────────────────────────────────────────────────────
            // CÓDIGO REAL (descomentar quando o SDK estiver disponível):
            // ──────────────────────────────────────────────────────────────
            // byte[] rawImage;
            // byte[] template;
            // bool captured = _scanner.Capture(out rawImage, out template, 5000); // 5s timeout
            // if (!captured) {
            //     return Task.FromResult(new CaptureResult {
            //         Success = false, ErrorCode = "CAPTURE_TIMEOUT"
            //     });
            // }
            // int nfiq = _scanner.GetImageQuality();
            // double liveness = _scanner.GetLivenessScore(); // se disponível
            // return Task.FromResult(new CaptureResult {
            //     Success = true,
            //     TemplateBytes = template,
            //     Quality = nfiq,
            //     LivenessScore = liveness,
            //     DeviceId = _deviceId,
            //     DeviceModel = "Futronic FS80",
            // });

            // ──────────────────────────────────────────────────────────────
            // MOCK (remover em produção):
            // ──────────────────────────────────────────────────────────────
            Thread.Sleep(200);
            var template = new byte[512];
            for (int i = 0; i < template.Length; i++)
                template[i] = (byte)((i * 31 + 7) % 256);

            return Task.FromResult(new CaptureResult
            {
                Success       = true,
                TemplateBytes = template,
                Quality       = 78,
                LivenessScore = 0.95,
                DeviceId      = _deviceId,
                DeviceModel   = "Futronic FS80",
            });
        }
        catch (Exception ex)
        {
            Log($"Erro na captura Futronic: {ex.Message}");
            return Task.FromResult(new CaptureResult { Success = false, ErrorCode = "SDK_EXCEPTION" });
        }
    }

    public Task<CaptureResult> CaptureFaceAsync(CancellationToken ct = default)
    {
        // Futronic é apenas digital. Para facial, usa-se outra câmera/SDK.
        Log("Futronic não suporta captura facial.");
        return Task.FromResult(new CaptureResult { Success = false, ErrorCode = "UNSUPPORTED_MODALITY" });
    }

    public void Shutdown()
    {
        if (_initialized)
        {
            // _scanner?.CloseDevice();
            // _scanner?.Dispose();
            _initialized = false;
            Log("FutronicSDK desligado.");
        }
    }

    public void Dispose() => Shutdown();

    private void ValidateInitialized()
    {
        if (!_initialized)
            throw new InvalidOperationException("Futronic não inicializado.");
    }

    private static void Log(string message) =>
        Console.Error.WriteLine($"[{DateTime.UtcNow:O}] [AR-Futronic] {message}");
}
