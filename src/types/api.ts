/**
 * Tipos compartilhados para API responses
 */

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface AuthToken {
  token: string;
  session_token: string;
  expires_at: string;
}

export interface AgrProfile {
  id: string;
  name: string;
  cpf: string;
  role: string;
  is_active: boolean;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  session_token: string;
  agent: AgrProfile;
}

// ============================================================================
// Certificate Types
// ============================================================================

export interface Certificate {
  id: string;
  serial_number: string;
  pem: string;
  ca_chain_pem: string;
  titular_name: string;
  titular_cpf: string | null;
  titular_cnpj: string | null;
  titular_email: string | null;
  product: string;
  validity_not_before: string;
  validity_not_after: string;
  agr_id: string;
  protocol_id: string | null;
  status: 'active' | 'revoked' | 'expired';
  created_at: string;
}

export interface CertificateSigningRequest {
  csrPem: string;
  titularData: {
    name: string;
    cpf?: string;
    cnpj?: string;
    email?: string;
  };
  product: string;
  nonce: string;
}

export interface CertificateSigningResponse {
  success: boolean;
  certificatePem: string;
  caChainPem: string;
  serialNumber: string;
  validUntil: string;
  issuer: string;
}

// ============================================================================
// Protocol Types
// ============================================================================

export interface Protocol {
  id: string;
  agr_id: string;
  titular_name: string;
  titular_cpf: string | null;
  titular_cnpj: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  is_locked: boolean;
  locked_by: string | null;
  locked_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ProtocolDocument {
  id: string;
  protocol_id: string;
  name: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  url: string;
  created_at: string;
}

// ============================================================================
// Audit Types
// ============================================================================

export type AuditSeverity = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface AuditLogEntry {
  id: string;
  event_type: string;
  agr_id: string | null;
  protocol_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  payload: Record<string, unknown> | null;
  severity: AuditSeverity;
  created_at: string;
}

// ============================================================================
// Rate Limit Types
// ============================================================================

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  blocked_until: string | null;
}

// ============================================================================
// Nonce Types
// ============================================================================

export type NonceScope = 'AUTH' | 'SIGN' | 'BIOMETRY' | 'EMIT';

export interface Nonce {
  id: string;
  nonce: string;
  scope: NonceScope;
  protocol_id: string | null;
  agr_id: string | null;
  expires_at: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
}
