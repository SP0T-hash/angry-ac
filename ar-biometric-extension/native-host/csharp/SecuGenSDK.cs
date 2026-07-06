// SecuGenSDK.cs
// Implementação do SDK SecuGen (FDx Pro, Hamster, etc.) para captura de digital.
//
// Dependência NuGet: SecuGen.FDxSDK (versão compatível com o hardware)
// https://www.nuget.org/packages/SecuGen.FDxSDK
//
// Documentação: SecuGen SDK Programmer's Guide
//
// PONTO DE INTEGRAÇÃO:
//   Substituir as chamadas mock pelas chamadas reais do SDK SecuGen.
//   O SDK SecuGen expõe:
//     - SGFingerPrintManager.GetImage(out byte[] buffer)
//     - SGFingerPrintManager.GetTemplate(out byte[] template)
//     - SGFingerPrintManager.GetImageQuality() → NFIQ score
//     - SGFingerPrintManager.GetDeviceID() → identificador único

namespace ArBiometricHost;

internal sealed class SecuGenSDK : IScannerSDK
{
    public string ScannerName => "SecuGen FDx Pro / Hamster";
    public ScannerType Type => ScannerType.SecuGen;

    private bool _initialized;
    private string _deviceId = "UNKNOWN";

    // private SGFingerPrintManager _scanner; // SDK SecuGen real

    public Task<bool> InitializeAsync(CancellationToken ct = default)
    {
        try
        {
            // ──────────────────────────────────────────────────────────────
            // CÓDIGO REAL (descomentar com SDK real):
            // ──────────────────────────────────────────────────────────────
            // _scanner = new SGFingerPrintManager();
            // int result = _scanner.Init();
            // if (result != 0) {
            //     Log($"Falha na inicialização SecuGen: código {result}");
            //     return Task.FromResult(false);
            // }
            // _deviceId = _scanner.GetDeviceID() ?? "SG-UNKNOWN";
            // _initialized = true;
            // return Task.FromResult(true);

            Log("⚠️  Usando MOCK SecuGenSDK — substituir por SDK real.");
            _deviceId = "SGMOCK-001";
            _initialized = true;
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            Log($"Falha ao inicializar SecuGen: {ex.Message}");
            return Task.FromResult(false);
        }
    }

    public Task<CaptureResult> CaptureFingerprintAsync(CancellationToken ct = default)
    {
        ValidateInitialized();

        try
        {
            // ──────────────────────────────────────────────────────────────
            // CÓDIGO REAL:
            // ──────────────────────────────────────────────────────────────
            // byte[] rawImage = new byte[_scanner.GetImageWidth() * _scanner.GetImageHeight()];
            // int result = _scanner.GetImage(out rawImage);
            // if (result != 0) return new CaptureResult { Success = false, ErrorCode = "CAPTURE_FAILED" };
            //
            // byte[] template = _scanner.GetTemplate();
            // int quality = _scanner.GetImageQuality();
            //
            // return new CaptureResult {
            //     Success = true,
            //     TemplateBytes = template,
            //     Quality = quality,
            //     LivenessScore = 0.0, // SecuGen não tem PAD nativo
            //     DeviceId = _deviceId,
            //     DeviceModel = "SecuGen FDx Pro",
            // };

            Thread.Sleep(200);
            var template = new byte[512];
            for (int i = 0; i < template.Length; i++)
                template[i] = (byte)((i * 23 + 11) % 256);

            return Task.FromResult(new CaptureResult
            {
                Success       = true,
                TemplateBytes = template,
                Quality       = 85,
                LivenessScore = 0.93,
                DeviceId      = _deviceId,
                DeviceModel   = "SecuGen FDx Pro",
            });
        }
        catch (Exception ex)
        {
            Log($"Erro na captura SecuGen: {ex.Message}");
            return Task.FromResult(new CaptureResult { Success = false, ErrorCode = "SDK_EXCEPTION" });
        }
    }

    public Task<CaptureResult> CaptureFaceAsync(CancellationToken ct = default)
    {
        Log("SecuGen não suporta captura facial.");
        return Task.FromResult(new CaptureResult { Success = false, ErrorCode = "UNSUPPORTED_MODALITY" });
    }

    public void Shutdown()
    {
        if (_initialized)
        {
            // _scanner?.Close();
            // _scanner?.Terminate();
            _initialized = false;
            Log("SecuGenSDK desligado.");
        }
    }

    public void Dispose() => Shutdown();

    private void ValidateInitialized()
    {
        if (!_initialized)
            throw new InvalidOperationException("SecuGen não inicializado.");
    }

    private static void Log(string message) =>
        Console.Error.WriteLine($"[{DateTime.UtcNow:O}] [AR-SecuGen] {message}");
}
