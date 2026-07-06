// IScannerSDK.cs
// Interface unificada para leitores biométricos ICP-Brasil.
//
// Cada SDK (Futronic, SecuGen, Suprema) deve implementar esta interface.
// O ArBiometricHost seleciona a implementação via factory pattern.

namespace ArBiometricHost;

/// <summary>
/// Resultado de uma captura biométrica (digital ou facial).
/// </summary>
public sealed class CaptureResult
{
    public bool    Success       { get; init; }
    public string  ErrorCode     { get; init; } = string.Empty;
    public byte[]  TemplateBytes { get; init; } = Array.Empty<byte>();
    public int     Quality       { get; init; }        // NFIQ2 (0-100), mínimo 40
    public double  LivenessScore { get; init; }        // PAD score (0.0-1.0), mínimo 0.85
    public string  DeviceId      { get; init; } = string.Empty;
    public string  DeviceModel   { get; init; } = string.Empty;
}

/// <summary>
/// Tipos de scanner suportados.
/// </summary>
public enum ScannerType
{
    Mock,       // Apenas para desenvolvimento/testes
    Futronic,
    SecuGen,
    Suprema,
}

/// <summary>
/// Interface que todos os SDKs biométricos devem implementar.
/// </summary>
public interface IScannerSDK : IDisposable
{
    /// <summary>
    /// Nome amigável do scanner para logging.
    /// </summary>
    string ScannerName { get; }

    /// <summary>
    /// Tipo do scanner (usado para seleção na factory).
    /// </summary>
    ScannerType Type { get; }

    /// <summary>
    /// Abre conexão com o leitor.
    /// </summary>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>True se o dispositivo foi encontrado e inicializado.</returns>
    Task<bool> InitializeAsync(CancellationToken ct = default);

    /// <summary>
    /// Captura uma impressão digital.
    /// </summary>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Resultado da captura com template, qualidade e liveness.</returns>
    Task<CaptureResult> CaptureFingerprintAsync(CancellationToken ct = default);

    /// <summary>
    /// Captura uma imagem facial (para videoconferência ou liveness passivo).
    /// </summary>
    /// <param name="ct">Token de cancelamento.</param>
    /// <returns>Resultado da captura com template facial, qualidade e liveness.</returns>
    Task<CaptureResult> CaptureFaceAsync(CancellationToken ct = default);

    /// <summary>
    /// Fecha conexão com o leitor e libera recursos.
    /// </summary>
    void Shutdown();
}
