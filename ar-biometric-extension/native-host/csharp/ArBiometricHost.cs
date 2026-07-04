// ArBiometricHost.cs
// Native Messaging Host para a extensão AR Biometric Bridge.
//
// Protocolo: Chrome Native Messaging
//   - Cada mensagem é prefixada por 4 bytes (little-endian) contendo o comprimento
//     do payload JSON que se segue.
//   - Stdin para leitura, stdout para escrita.
//   - Stderr é reservado para logging interno (não interfere no protocolo).
//
// Compilação: dotnet publish -c Release -r win-x64 --self-contained true
//
// Dependências (NuGet):
//   - Futronic.SDK.FS80  (substituir pelo pacote do SDK do hardware real)
//   - System.Text.Json   (incluso no .NET 6+)

using System;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;

namespace ArBiometricHost
{
    internal static class Program
    {
        // ID da extensão Chrome autorizada — validação dupla (além do manifesto JSON).
        // Obtenha em chrome://extensions após instalar a extensão em modo desenvolvedor.
        private const string AllowedExtensionOrigin = "chrome-extension://SUBSTITUA_PELO_ID_REAL/";

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy        = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition      = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
            WriteIndented               = false,
        };

        static async Task Main(string[] args)
        {
            // Stderr para diagnóstico — nunca use stdout para logs
            Log("ArBiometricHost iniciado.");

            using var stdin  = new BinaryReader(Console.OpenStandardInput(),  Encoding.UTF8);
            using var stdout = new BinaryWriter(Console.OpenStandardOutput(), Encoding.UTF8);
            using var cts    = new CancellationTokenSource();

            // Encerra limpo ao receber SIGTERM / CTRL+C
            Console.CancelKeyPress += (_, e) => { e.Cancel = true; cts.Cancel(); };

            while (!cts.Token.IsCancellationRequested)
            {
                JsonObject? command = null;
                try
                {
                    command = ReadMessage(stdin);
                }
                catch (EndOfStreamException)
                {
                    Log("Chrome fechou a conexão. Encerrando.");
                    break;
                }
                catch (Exception ex)
                {
                    Log($"Erro ao ler mensagem: {ex.Message}");
                    break;
                }

                if (command is null) break;

                JsonObject response = await ProcessCommandAsync(command, cts.Token);
                WriteMessage(stdout, response);
            }

            Log("ArBiometricHost encerrado.");
        }

        // ─────────────────────────────────────────────────────────────────────
        // Dispatcher de comandos
        // ─────────────────────────────────────────────────────────────────────

        private static async Task<JsonObject> ProcessCommandAsync(JsonObject command, CancellationToken ct)
        {
            string? cmd       = command["command"]?.GetValue<string>();
            string? sessionId = command["sessionId"]?.GetValue<string>();
            string? nonce     = command["nonce"]?.GetValue<string>();
            long?   issuedAt  = command["issuedAt"]?.GetValue<long>();

            Log($"Comando recebido: {cmd} | sessão: {sessionId}");

            // Validação mínima dos campos obrigatórios
            if (string.IsNullOrWhiteSpace(cmd) || string.IsNullOrWhiteSpace(sessionId)
                || string.IsNullOrWhiteSpace(nonce) || issuedAt is null)
            {
                return ErrorResponse("INVALID_COMMAND_PAYLOAD");
            }

            // Janela de tempo — proteção contra replay no lado do host nativo
            long nowMs  = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            long deltaMs = Math.Abs(nowMs - issuedAt.Value);
            if (deltaMs > 35_000) // 35 s de margem (5 s de folga sobre os 30 s do SW)
            {
                Log($"Timestamp expirado: delta={deltaMs}ms");
                return ErrorResponse("TIMESTAMP_EXPIRED");
            }

            return cmd switch
            {
                "CAPTURE_FINGERPRINT" => await CaptureFingerprint(sessionId, ct),
                "CAPTURE_FACE"        => await CaptureFace(sessionId, ct),
                _                     => ErrorResponse("UNKNOWN_COMMAND"),
            };
        }

        // ─────────────────────────────────────────────────────────────────────
        // Captura de impressão digital
        // ─────────────────────────────────────────────────────────────────────

        private static async Task<JsonObject> CaptureFingerprint(string sessionId, CancellationToken ct)
        {
            try
            {
                // ──────────────────────────────────────────────────────────────
                // PONTO DE INTEGRAÇÃO: substitua pelo SDK real do leitor.
                // Exemplos de SDKs:
                //   Futronic:  FutronicBase.Capture()
                //   SecuGen:   SGFingerPrintManager.GetImageEx()
                //   Suprema:   BS2_ScanFingerprintEx()
                //
                // O SDK deve retornar:
                //   templateBytes — template ISO/IEC 19794-2 ou ANSI 378
                //   quality       — 0..100 (NFIQ2 ou equivalente)
                //   livenessScore — 0.0..1.0 (PAD score)
                //   deviceId      — identificador único do leitor
                // ──────────────────────────────────────────────────────────────

                using var sdk = new MockFingerprintSDK();  // substituir pelo SDK real
                var result    = await sdk.CaptureAsync(ct);

                if (!result.Success)
                {
                    Log($"Captura de digital falhou: {result.ErrorCode}");
                    return ErrorResponse(result.ErrorCode);
                }

                // Validação de qualidade mínima (NFIQ2 >= 40 recomendado pela ICP-Brasil)
                if (result.Quality < 40)
                {
                    Log($"Qualidade insuficiente: {result.Quality}");
                    return ErrorResponse("QUALITY_TOO_LOW");
                }

                return new JsonObject
                {
                    ["ok"]           = true,
                    ["templateB64"]  = Convert.ToBase64String(result.TemplateBytes)
                                           .Replace('+', '-').Replace('/', '_').TrimEnd('='),
                    ["quality"]      = result.Quality,
                    ["livenessScore"]= result.LivenessScore,
                    ["deviceId"]     = result.DeviceId,
                };
            }
            catch (OperationCanceledException)
            {
                return ErrorResponse("CAPTURE_CANCELLED");
            }
            catch (Exception ex)
            {
                Log($"Exceção na captura: {ex}");
                return ErrorResponse("SDK_EXCEPTION");
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Captura facial (WebAuthn/FIDO2 ou câmera local com PAD)
        // ─────────────────────────────────────────────────────────────────────

        private static async Task<JsonObject> CaptureFace(string sessionId, CancellationToken ct)
        {
            try
            {
                // ──────────────────────────────────────────────────────────────
                // PONTO DE INTEGRAÇÃO: substitua pelo SDK de biometria facial.
                // O score de liveness (PAD) é MANDATÓRIO para conformidade
                // com ITI/ICP-Brasil e ISO/IEC 30107-3.
                //
                // SDKs recomendados:
                //   - iProov (cloud liveness)
                //   - FaceTec (on-device 3D liveness)
                //   - Idemia BioSig
                // ──────────────────────────────────────────────────────────────

                using var sdk = new MockFacialSDK();  // substituir pelo SDK real
                var result    = await sdk.CaptureAsync(ct);

                if (!result.Success) return ErrorResponse(result.ErrorCode);

                return new JsonObject
                {
                    ["ok"]           = true,
                    ["templateB64"]  = Convert.ToBase64String(result.TemplateBytes)
                                           .Replace('+', '-').Replace('/', '_').TrimEnd('='),
                    ["quality"]      = result.Quality,
                    ["livenessScore"]= result.LivenessScore,
                    ["deviceId"]     = result.DeviceId,
                };
            }
            catch (OperationCanceledException)
            {
                return ErrorResponse("CAPTURE_CANCELLED");
            }
            catch (Exception ex)
            {
                Log($"Exceção na captura facial: {ex}");
                return ErrorResponse("SDK_EXCEPTION");
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Protocolo Chrome Native Messaging
        // ─────────────────────────────────────────────────────────────────────

        private static JsonObject ReadMessage(BinaryReader reader)
        {
            // Lê os 4 bytes de comprimento (little-endian)
            byte[] lenBytes = reader.ReadBytes(4);
            if (lenBytes.Length < 4) throw new EndOfStreamException();

            int length = BitConverter.ToInt32(lenBytes, 0);

            if (length <= 0 || length > 1_048_576) // sanity check: max 1 MB
                throw new InvalidDataException($"Comprimento de mensagem inválido: {length}");

            byte[] msgBytes = reader.ReadBytes(length);
            string json     = Encoding.UTF8.GetString(msgBytes);

            return JsonNode.Parse(json)?.AsObject()
                ?? throw new InvalidDataException("JSON inválido recebido.");
        }

        private static void WriteMessage(BinaryWriter writer, JsonObject response)
        {
            string json    = JsonSerializer.Serialize(response, JsonOptions);
            byte[] encoded = Encoding.UTF8.GetBytes(json);
            byte[] lenBytes = BitConverter.GetBytes(encoded.Length);

            writer.Write(lenBytes);
            writer.Write(encoded);
            writer.Flush();
        }

        private static JsonObject ErrorResponse(string errorCode) => new()
        {
            ["ok"]    = false,
            ["error"] = errorCode,
        };

        private static void Log(string message) =>
            Console.Error.WriteLine($"[{DateTime.UtcNow:O}] [AR-Host] {message}");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Mocks (substituir pelos SDKs reais do hardware)
    // ─────────────────────────────────────────────────────────────────────────

    internal sealed class CaptureResult
    {
        public bool    Success       { get; init; }
        public string  ErrorCode     { get; init; } = string.Empty;
        public byte[]  TemplateBytes { get; init; } = Array.Empty<byte>();
        public int     Quality       { get; init; }
        public double  LivenessScore { get; init; }
        public string  DeviceId      { get; init; } = string.Empty;
    }

    internal sealed class MockFingerprintSDK : IDisposable
    {
        public async Task<CaptureResult> CaptureAsync(CancellationToken ct)
        {
            await Task.Delay(1_500, ct); // Simula tempo de captura
            return new CaptureResult
            {
                Success       = true,
                TemplateBytes = new byte[512], // Template ISO 19794-2 real aqui
                Quality       = 82,
                LivenessScore = 0.97,
                DeviceId      = "MOCK-FS80-001",
            };
        }
        public void Dispose() { }
    }

    internal sealed class MockFacialSDK : IDisposable
    {
        public async Task<CaptureResult> CaptureAsync(CancellationToken ct)
        {
            await Task.Delay(2_000, ct); // Simula processamento de liveness
            return new CaptureResult
            {
                Success       = true,
                TemplateBytes = new byte[1024], // Template facial real aqui
                Quality       = 90,
                LivenessScore = 0.99,
                DeviceId      = "MOCK-CAM-001",
            };
        }
        public void Dispose() { }
    }
}
