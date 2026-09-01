// Gerenciamento de sessão do módulo GS (server-side, cookies httpOnly)
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/infra/supabase/client";
import type { GSUsuario, GSSessao } from "./types";

const COOKIE = "gs_session";
const MAX_AGE = 60 * 60 * 8; // 8h

function mapUsuario(row: any): GSUsuario {
  return {
    id: row.id,
    email: row.email,
    nome: row.nome ?? row.email,
    cpf: row.cpf ?? null,
    nivel: row.nivel,
    ar_id: row.ar_id ?? null,
    unidade_id: row.unidade_id ?? null,
    ponto_id: row.ponto_id ?? null,
    ativo: row.is_active ?? true,
    criado_em: row.created_at,
  };
}

export async function gsLogin(
  email: string,
  senha: string,
): Promise<GSSessao | null> {
  const admin = await getSupabaseAdmin();
  const { data: user, error } = await admin
    .from("gs_usuarios")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("is_active", true)
    .maybeSingle();

  if (error || !user) return null;

  // Validar senha: apenas bcrypt (sem fallback de texto puro)
  const ok = await verificarSenha(senha, user.password_hash);
  if (!ok) return null;

  const token = gerarToken();
  const expira = new Date(Date.now() + MAX_AGE * 1000).toISOString();

  await admin.from("gs_sessoes").insert({
    usuario_id: user.id,
    token,
    expires_at: expira,
  });

  return { usuario: mapUsuario(user), token, expira_em: expira };
}

async function verificarSenha(
  senha: string,
  hash: string | null,
): Promise<boolean> {
  if (!hash || !hash.startsWith("$2")) return false;
  try {
    const bcrypt = await import("bcryptjs");
    return bcrypt.compareSync(senha, hash);
  } catch {
    return false;
  }
}

function gerarToken(): string {
  return randomBytes(32).toString("hex");
}

export async function getGSSession(): Promise<GSSessao | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  const admin = await getSupabaseAdmin();
  const { data: sess, error } = await admin
    .from("gs_sessoes")
    .select("*, usuario:gs_usuarios(*)")
    .eq("token", token)
    .eq("is_active", true)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !sess || !sess.usuario) return null;

  await admin
    .from("gs_sessoes")
    .update({ last_activity: new Date().toISOString() })
    .eq("token", token);

  return {
    usuario: mapUsuario(sess.usuario),
    token,
    expira_em: sess.expires_at,
  };
}

export async function setGSSession(sess: GSSessao) {
  const store = await cookies();
  store.set(COOKIE, sess.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearGSSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) {
    const admin = await getSupabaseAdmin();
    await admin.from("gs_sessoes").delete().eq("token", token);
  }
  store.delete(COOKIE);
}
