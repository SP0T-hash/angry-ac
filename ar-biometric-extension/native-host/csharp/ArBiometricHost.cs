// ArBiometricHost.cs
// Native Messaging Host para a extensão AR Biometric Bridge.
//
// Protocolo: Chrome Native Messaging (stdin/stdout com prefixo de 4 bytes LE)
//
// Compilação:
//   dotnet publish -c Release -r win-x64 --self-contained true
//
// Instalação:
//   1. Compilar o binário
//   2. Copiar com.ar.biometric.host.json para:
//        Windows: %LOCALAPPDATA%\Google\Chrome\User Data\NativeMessagingHosts\
//   3. Atualizar o "path" no JSON para o caminho do .exe compilado
//   4. Atualizar "allowed_origins" com o ID real da extensão Chrome

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
        // ─────────────────────────────────────────────────────────────────────
        // Constantes
        // ─────────────────────────────────────────────────────────────────────

        private const string AllowedExtensionPrefix = "chrome-extension://";

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy        = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition      = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
            WriteIndented               = false,
        };

        // ─────────────────────────────────────────────────────────────────────
        // Estado global
        // ─────────────────────────────────────────────────────────────────────

        private static IScannerSDK? _scanner;
        private static ScannerConfig _config = new();
        private static readonly object _lock = new();

        // ─────────────────────────────────────────────────────────────────────
        // Main
        // ─────────────────────────────────────────────────────────────────────

        static async Task Main(string[] args)
        {
            Log("ArBiometricHost iniciado.");

            // 1. Carregar configuração (de variável de ambiente ou args)
            LoadConfiguration(args);

            // 2. Inicializar scanner biométrico
            _scanner = await ScannerFactory.TryCreateAndInitializeAsync(_config);
            if (_scanner == null)
            {
                Log("⚠️  Nenhum scanner biométrico disponível. Operando em modo limitado.");
                Log("   Para testes, use ScannerType.Mock (padrão).");
            }

            // 3. Loop principal do Native Messaging
            using var stdin  = new BinaryReader(Console.OpenStandardInput(), Encoding.UTF8);
            using var stdout = new BinaryWriter(Console.OpenStandardOutput(), Encoding.UTF8);
            using var cts    = new CancellationTokenSource();

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

                JsonObject response = await ProcessCommandAsync(command, _config, cts.Token);
                WriteMessage(stdout, response);
            }

            // 4. Cleanup
            _scanner?.Shutdown();
            Log("ArBiometricHost encerrado.");
        }

        // ─────────────────────────────────────────────────────────────────────
        // Carregamento de configuração
        // ─────────────────────────────────────────────────────────────────────

        private static void LoadConfiguration(string[] args)
        {
            // Prioridade: 1. Argumentos CLI, 2. Variável de ambiente, 3. Padrão (Mock)
            string? typeStr = null;

            // Tentar dos args: --scanner=Futronic
            foreach (var arg in args)
            {
                if (arg.StartsWith("--scanner=", StringComparison.OrdinalIgnoreCase))
                {
                    typeStr = arg["--scanner=".Length..];
                    break;
                }
            }

            // Tentar de variável de ambiente: AR_SCANNER_TYPE=Futronic
            if (string.IsNullOrEmpty(typeStr))
            {
                typeStr = Environment.GetEnvironmentVariable("AR_SCANNER_TYPE");
            }

            // Aplicar configuração
            if (!string.IsNullOrEmpty(typeStr)
                && Enum.TryParse<ScannerType>(typeStr, ignoreCase: true, out var parsedType))
            {
                _config.Type = parsedType;
            }

            // Timeout por ambiente
            var timeoutStr = Environment.GetEnvironmentVariable("AR_CAPTURE_TIMEOUT_MS");
            if (int.TryParse(timeoutStr, out var timeout) && timeout > 0)
            {
                _config.CaptureTimeoutMs = timeout;
            }

            Log($"Configuração carregada: scanner={_config.Type}, timeout={_config.CaptureTimeoutMs}ms");
        }

        // ─────────────────────────────────────────────────────────────────────
        // Dispatcher de comandos
        // ─────────────────────────────────────────────────────────────────────

        private static async Task<JsonObject> ProcessCommandAsync(
            JsonObject command,
            ScannerConfig config,
            CancellationToken ct)
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

            // Se não há scanner, retorna erro (exceto para comandos de health check)
            if (_scanner == null && cmd != "HEALTH_CHECK")
            {
                return ErrorResponse("NO_SCANNER_AVAILABLE");
            }

            // Usar CancellationToken com timeout da configuração
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeoutCts.CancelAfter(config.CaptureTimeoutMs);

            try
            {
                return cmd switch
                {
                    "CAPTURE_FINGERPRINT" => await CaptureFingerprint(sessionId, timeoutCts.Token),
                    "CAPTURE_FACE"        => await CaptureFace(sessionId, timeoutCts.Token),
                    "HEALTH_CHECK"        => HealthCheck(),
                    _                     => ErrorResponse("UNKNOWN_COMMAND"),
                };
            }
            catch (OperationCanceledException)
            {
                Log($"Comando {cmd} cancelado (timeout={config.CaptureTimeoutMs}ms).");
                return ErrorResponse("CAPTURE_TIMEOUT");
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Handlers de captura
        // ─────────────────────────────────────────────────────────────────────

        private static async Task<JsonObject> CaptureFingerprint(string sessionId, CancellationToken ct)
        {
            if (_scanner == null)
                return ErrorResponse("NO_SCANNER_AVAILABLE");

            var result = await _scanner.CaptureFingerprintAsync(ct);

            if (!result.Success)
            {
                Log($"Captura de digital falhou: {result.ErrorCode}");
                return ErrorResponse(result.ErrorCode);
            }

            // Validação de qualidade mínima (NFIQ2 >= 40 pela ICP-Brasil)
            if (result.Quality < _config.MinQuality)
            {
                Log($"Qualidade insuficiente: {result.Quality} (mínimo: {_config.MinQuality})");
                return ErrorResponse("QUALITY_TOO_LOW");
            }

            // Validação de liveness (PAD)
            if (result.LivenessScore < _config.MinLivenessScore)
            {
                Log($"Liveness insuficiente: {result.LivenessScore:F2} (mínimo: {_config.MinLivenessScore})");
                return ErrorResponse("LIVENESS_FAILED");
            }

            return new JsonObject
            {
                ["ok"]           = true,
                ["templateB64"]  = Convert.ToBase64String(result.TemplateBytes)
                                       .Replace('+', '-').Replace('/', '_').TrimEnd('='),
                ["quality"]      = result.Quality,
                ["livenessScore"]= result.LivenessScore,
                ["deviceId"]     = result.DeviceId,
                ["deviceModel"]  = result.DeviceModel,
            };
        }

        private static async Task<JsonObject> CaptureFace(string sessionId, CancellationToken ct)
        {
            if (_scanner == null)
                return ErrorResponse("NO_SCANNER_AVAILABLE");

            var result = await _scanner.CaptureFaceAsync(ct);

            if (!result.Success)
            {
                Log($"Captura facial falhou: {result.ErrorCode}");
                return ErrorResponse(result.ErrorCode);
            }

            if (result.Quality < _config.MinQuality)
            {
                Log($"Qualidade facial insuficiente: {result.Quality}");
                return ErrorResponse("FACE_QUALITY_TOO_LOW");
            }

            return new JsonObject
            {
                ["ok"]           = true,
                ["templateB64"]  = Convert.ToBase64String(result.TemplateBytes)
                                       .Replace('+', '-').Replace('/', '_').TrimEnd('='),
                ["quality"]      = result.Quality,
                ["livenessScore"]= result.LivenessScore,
                ["deviceId"]     = result.DeviceId,
                ["deviceModel"]  = result.DeviceModel,
            };
        }

        private static JsonObject HealthCheck()
        {
            lock (_lock)
            {
                return new JsonObject
                {
                    ["ok"]           = true,
                    ["scanner"]      = _scanner?.ScannerName ?? "NONE",
                    ["scannerType"]  = _config.Type.ToString(),
                    ["status"]       = _scanner != null ? "READY" : "NO_SCANNER",
                    ["version"]      = "1.0.0",
                    ["os"]           = Environment.OSVersion.ToString(),
                };
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // Protocolo Chrome Native Messaging
        // ─────────────────────────────────────────────────────────────────────

        private static JsonObject ReadMessage(BinaryReader reader)
        {
            byte[] lenBytes = reader.ReadBytes(4);
            if (lenBytes.Length < 4) throw new EndOfStreamException();

            int length = BitConverter.ToInt32(lenBytes, 0);

            if (length <= 0 || length > 1_048_576)
                throw new InvalidDataException($"Comprimento inválido: {length}");

            byte[] msgBytes = reader.ReadBytes(length);
            string json     = Encoding.UTF8.GetString(msgBytes);

            return JsonNode.Parse(json)?.AsObject()
                ?? throw new InvalidDataException("JSON inválido.");
        }

        private static void WriteMessage(BinaryWriter writer, JsonObject response)
        {
            string json     = JsonSerializer.Serialize(response, JsonOptions);
            byte[] encoded  = Encoding.UTF8.GetBytes(json);
            byte[] lenBytes = BitConverter.GetBytes(encoded.Length);

            writer.Write(lenBytes);
            writer.Write(encoded);
            writer.Flush();
        }

        // ─────────────────────────────────────────────────────────────────────
        // Helpers
        // ─────────────────────────────────────────────────────────────────────

        private static JsonObject ErrorResponse(string errorCode) => new()
        {
            ["ok"]    = false,
            ["error"] = errorCode,
        };

        private static void Log(string message) =>
            Console.Error.WriteLine($"[{DateTime.UtcNow:O}] [AR-Host] {message}");
    }
}
