// MockScannerSDK.cs
// SDK mock para desenvolvimento/testes.
// Substituir por implementações reais (FutronicSDK, SecuGenSDK, SupremaSDK)
// quando o hardware estiver disponível.

namespace ArBiometricHost;

internal sealed class MockScannerSDK : IScannerSDK
{
    public string ScannerName => "Mock Scanner (Desenvolvimento)";
    public ScannerType Type => ScannerType.Mock;

    private bool _initialized;
    private int _captureCount;

    public Task<bool> InitializeAsync(CancellationToken ct = default)
    {
        // Simula inicialização de hardware
        _initialized = true;
        _captureCount = 0;
        Log("MockScannerSDK inicializado (modo simulação).");
        return Task.FromResult(true);
    }

    public Task<CaptureResult> CaptureFingerprintAsync(CancellationToken ct = default)
    {
        ValidateInitialized();
        _captureCount++;

        // Simula tempo de captura
        Thread.Sleep(200);

        // Gera template deterministico para testes
        var template = GenerateMockTemplate(512);

        var result = new CaptureResult
        {
            Success       = true,
            TemplateBytes = template,
            Quality       = 82,
            LivenessScore = 0.97,
            DeviceId      = "MOCK-FS80-001",
            DeviceModel   = "Futronic FS80 (Mock)",
        };

        Log($"Mock captura #{_captureCount}: qualidade={result.Quality}, liveness={result.LivenessScore:F2}");
        return Task.FromResult(result);
    }

    public Task<CaptureResult> CaptureFaceAsync(CancellationToken ct = default)
    {
        ValidateInitialized();
        _captureCount++;

        Thread.Sleep(300);

        var template = GenerateMockTemplate(1024);

        var result = new CaptureResult
        {
            Success       = true,
            TemplateBytes = template,
            Quality       = 90,
            LivenessScore = 0.99,
            DeviceId      = "MOCK-CAM-001",
            DeviceModel   = "Mock Webcam",
        };

        Log($"Mock captura facial #{_captureCount}: qualidade={result.Quality}, liveness={result.LivenessScore:F2}");
        return Task.FromResult(result);
    }

    public void Shutdown()
    {
        _initialized = false;
        Log("MockScannerSDK desligado.");
    }

    public void Dispose()
    {
        Shutdown();
    }

    private void ValidateInitialized()
    {
        if (!_initialized)
            throw new InvalidOperationException("Scanner não inicializado. Chame InitializeAsync() primeiro.");
    }

    private static byte[] GenerateMockTemplate(int size)
    {
        // Template pseudo-aleatório deterministico para testes
        var bytes = new byte[size];
        for (int i = 0; i < size; i++)
            bytes[i] = (byte)((i * 37 + 13) % 256);
        bytes[0] = 0x00; // ISO/IEC 19794-2 marker
        bytes[1] = 0x01;
        return bytes;
    }

    private static void Log(string message) =>
        Console.Error.WriteLine($"[{DateTime.UtcNow:O}] [AR-MockSDK] {message}");
}
