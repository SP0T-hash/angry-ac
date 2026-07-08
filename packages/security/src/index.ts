/**
 * @vemapi/security - Módulos de Segurança Compartilhados
 * 
 * Pacote consolidado contendo todos os módulos de segurança do AC ANGRY.
 * Baseado na versão GS (mais completa) com melhorias do Root.
 * 
 * Módulos:
 *  - NonceManager     → Anti-replay / CSRF
 *  - SessionManager   → Sessões AGR autenticadas
 *  - RateLimiter      → Proteção contra força bruta
 *  - AuditLogger      → Trilha de auditoria imutável (hash chain)
 *  - ProtocolLocker   → Controle de concorrência de protocolo
 *  - DataEncryptor    → AES-256-GCM + SHA-256
 *  - CertValidator    → Validação de certificados ICP-Brasil
 */

export {
  NonceManager,
  type NonceScope,
} from './nonce-manager';

export {
  SessionManager,
  type AgrSession,
  type SecureSession,
} from './session-manager';

export {
  RateLimiter,
  RateLimitError,
} from './rate-limiter';

export {
  AuditLogger,
  type AuditEvent,
  type AuditQuery,
  type AuditEntry,
} from './audit-logger';

export {
  ProtocolLocker,
} from './protocol-locker';

export {
  DataEncryptor,
} from './data-encryptor';

export {
  CertValidator,
  type CertValidation,
  type CertInfo,
} from './cert-validator';

export {
  getSupabaseAdmin,
} from './supabase-factory';
