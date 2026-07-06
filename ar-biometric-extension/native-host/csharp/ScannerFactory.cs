// ScannerFactory.cs
// Factory para criar instâncias do SDK biométrico baseado em configuração.
// Suporta: Mock (dev), Futronic, SecuGen, Suprema.

namespace ArBiometricHost;

/// <summary>
/// Configuração do scanner biométrico.
/// </summary>
public sealed class ScannerConfig
{
    /// <summary>Tipo de scanner a ser instanciado.</summary>
    public ScannerType Type { get; set; } = ScannerType.Mock;

    /// <summary>
    /// Timeout em milissegundos para cada captura (padrão: 10s).
    /// </summary>
    public int CaptureTimeoutMs { get; set; } = 10_000;

    /// <summary>
    /// Qualidade mínima NFIQ2 para aceitar uma captura (padrão: 40 - ICP-Brasil).
    /// </summary>
    public int MinQuality { get; set; } = 40;

    /// <summary>
    /// Score mínimo de liveness (PAD) para aceitar captura (padrão: 0.85).
    /// </summary>
    public double MinLivenessScore { get; set; } = 0.85;

    /// <summary>
    /// Índice do dispositivo (0 = primeiro). Útil quando há múltiplos leitores.
    /// </summary>
    public int DeviceIndex { get; set; } = 0;
}

/// <summary>
/// Factory thread-safe para criação de SDKs biométricos.
/// </summary>
public static class ScannerFactory
{
    /// <summary>
    /// Cria uma instância do SDK baseado no tipo especificado.
    /// </summary>
    /// <param name="config">Configuração do scanner.</param>
    /// <returns>Instância do SDK configurada.</returns>
    /// <exception cref="ArgumentException">Se o tipo não for suportado.</exception>
    public static IScannerSDK Create(ScannerConfig config)
    {
        ArgumentNullException.ThrowIfNull(config);

        Log($"Criando scanner: {config.Type} (deviceIndex={config.DeviceIndex})");

        return config.Type switch
        {
            ScannerType.Mock      => new MockScannerSDK(),
            ScannerType.Futronic  => new FutronicSDK(),
            ScannerType.SecuGen   => new SecuGenSDK(),
            ScannerType.Suprema   => new SupremaSDK(),
            _ => throw new ArgumentException($"Tipo de scanner não suportado: {config.Type}"),
        };
    }

    /// <summary>
    /// Tenta criar e inicializar o scanner. Retorna null se falhar.
    /// </summary>
    /// <param name="config">Configuração do scanner.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Scanner inicializado, ou null se falha.</returns>
    public static async Task<IScannerSDK?> TryCreateAndInitializeAsync(
        ScannerConfig config,
        CancellationToken ct = default)
    {
        try
        {
            var scanner = Create(config);
            bool initialized = await scanner.InitializeAsync(ct);

            if (!initialized)
            {
                Log($"Falha ao inicializar scanner {config.Type}. Liberando recursos.");
                scanner.Dispose();
                return null;
            }

            Log($"Scanner {scanner.ScannerName} inicializado com sucesso.");
            return scanner;
        }
        catch (Exception ex)
        {
            Log($"Exceção ao criar/inicializar scanner {config.Type}: {ex.Message}");
            return null;
        }
    }

    private static void Log(string message) =>
        Console.Error.WriteLine($"[{DateTime.UtcNow:O}] [AR-ScannerFactory] {message}");
}
