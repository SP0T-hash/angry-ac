// SupremaSDK.cs
// Implementação do SDK Suprema (BioMini, RealScan, etc.) para captura de digital.
//
// Dependência NuGet: Suprema.BiometricSDK (ou versão específica do hardware)
// https://www.nuget.org/packages/Suprema.BiometricSDK
//
// Documentação: Suprema SDK Developer Manual
//
// PONTO DE INTEGRAÇÃO:
//   Substituir as chamadas mock pelas chamadas reais do SDK Suprema.
//   O SDK Suprema expõe:
//     - BS2_ScanFingerprintEx() → template + qualidade
//     - BS2_GetLastError() → código de erro
//     - BS2_GetDeviceInfo() → deviceId, modelo
//     - BS2_GetLivenessScore() → anti-spoofing (se disponível)
//
//   O Suprema tem suporte a liveness (PAD) embutido em modelos recentes.

namespace ArBiometricHost;

internal sealed class SupremaSDK : IScannerSDK
{
    public string ScannerName => "Suprema BioMini / RealScan";
    public ScannerType Type => ScannerType.Suprema;

    private bool _initialized;
    private string _deviceId = "UNKNOWN";

    // private IntPtr _sdkHandle; // Handle do SDK Suprema

    public Task<bool> InitializeAsync(CancellationToken ct = default)
    {
        try
        {
            // ──────────────────────────────────────────────────────────────
            // CÓDIGO REAL (descomentar com SDK real):
            // ──────────────────────────────────────────────────────────────
            // int ret = BS2_InitSDK();
            // if (ret != 0) {
            //     Log($"Falha BS2_InitSDK: código {ret}");
            //     return Task.FromResult(false);
            // }
            // _sdkHandle = BS2_OpenDevice(0); // primeiro dispositivo
            // if (_sdkHandle == IntPtr.Zero) {
            //     Log("Nenhum dispositivo Suprema encontrado.");
            //     return Task.FromResult(false);
            // }
            // var info = BS2_GetDeviceInfo(_sdkHandle);
            // _deviceId = $"SUP-{info.SerialNumber}";
            // _initialized = true;
            // return Task.FromResult(true);

            Log("⚠️  Usando MOCK SupremaSDK — substituir por SDK real.");
            _deviceId = "SUPMOCK-001";
            _initialized = true;
            return Task.FromResult(true);
        }
        catch (Exception ex)
        {
            Log($"Falha ao inicializar Suprema: {ex.Message}");
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
            // byte[] template = new byte[BS2_TEMPLATE_SIZE];
            // int quality = 0;
            // int liveness = 0;
            //
            // int ret = BS2_ScanFingerprintEx(_sdkHandle, template, ref quality, ref liveness, 5000);
            // if (ret != 0) {
            //     return new CaptureResult { Success = false, ErrorCode = "SCAN_FAILED" };
            // }
            //
            // return new CaptureResult {
            //     Success = true,
            //     TemplateBytes = template,
            //     Quality = quality,
            //     LivenessScore = liveness / 100.0, // Suprema retorna 0-100
            //     DeviceId = _deviceId,
            //     DeviceModel = "Suprema BioMini",
            // };

            Thread.Sleep(200);
            var template = new byte[512];
            for (int i = 0; i < template.Length; i++)
                template[i] = (byte)((i * 17 + 5) % 256);

            return Task.FromResult(new CaptureResult
            {
                Success       = true,
                TemplateBytes = template,
                Quality       = 88,
                LivenessScore = 0.98,
                DeviceId      = _deviceId,
                DeviceModel   = "Suprema BioMini",
            });
        }
        catch (Exception ex)
        {
            Log($"Erro na captura Suprema: {ex.Message}");
            return Task.FromResult(new CaptureResult { Success = false, ErrorCode = "SDK_EXCEPTION" });
        }
    }

    public Task<CaptureResult> CaptureFaceAsync(CancellationToken ct = default)
    {
        try
        {
            // Suprema tem modelos com câmera facial (RealScan)
            // return similar ao CaptureFingerprintAsync porém com template facial

            Log("⚠️  Suprema facial não implementado (usando mock).");
            Thread.Sleep(300);
            var template = new byte[1024];
            for (int i = 0; i < template.Length; i++)
                template[i] = (byte)((i * 41 + 3) % 256);

            return Task.FromResult(new CaptureResult
            {
                Success       = true,
                TemplateBytes = template,
                Quality       = 92,
                LivenessScore = 0.97,
                DeviceId      = _deviceId,
                DeviceModel   = "Suprema RealScan",
            });
        }
        catch (Exception ex)
        {
            Log($"Erro na captura facial Suprema: {ex.Message}");
            return Task.FromResult(new CaptureResult { Success = false, ErrorCode = "SDK_EXCEPTION" });
        }
    }

    public void Shutdown()
    {
        if (_initialized)
        {
            // if (_sdkHandle != IntPtr.Zero) BS2_CloseDevice(_sdkHandle);
            // BS2_TerminateSDK();
            _initialized = false;
            Log("SupremaSDK desligado.");
        }
    }

    public void Dispose() => Shutdown();

    private void ValidateInitialized()
    {
        if (!_initialized)
            throw new InvalidOperationException("Suprema não inicializado.");
    }

    private static void Log(string message) =>
        Console.Error.WriteLine($"[{DateTime.UtcNow:O}] [AR-Suprema] {message}");
}
