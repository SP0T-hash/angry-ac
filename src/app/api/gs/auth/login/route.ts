import { NextRequest, NextResponse } from "next/server";
import { gsLogin, setGSSession } from "@/lib/gs/session";
import { RateLimiter, RateLimitError } from "@/lib/ac-angry/security";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

async function verificarRecaptcha(token: string | undefined): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // reCAPTCHA não configurado: não bloquear
  if (!token) return false;
  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
  });
  const data = await res.json();
  return data.success === true;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  try {
    // Rate limiting por IP (anti força bruta) — mesmas buckets do AC
    try {
      await RateLimiter.check(`gs-login:${ip}`, "LOGIN");
    } catch (e) {
      if (e instanceof RateLimitError) {
        return NextResponse.json(
          { error: e.message, retryAfter: e.retryAfterSeconds },
          { status: 429, headers: { "Retry-After": String(e.retryAfterSeconds) } },
        );
      }
      throw e;
    }

    const { email, senha, recaptcha } = await req.json();
    if (!email || !senha) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 },
      );
    }
    const okCaptcha = await verificarRecaptcha(recaptcha);
    if (!okCaptcha) {
      return NextResponse.json(
        { error: "Verificação de segurança falhou. Tente novamente." },
        { status: 403 },
      );
    }
    const sess = await gsLogin(String(email), String(senha));
    if (!sess) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou usuário inativo." },
        { status: 401 },
      );
    }
    await setGSSession(sess);
    return NextResponse.json({
      usuario: sess.usuario,
      redirect: "/gs/dashboard",
    });
  } catch (e) {
    console.error("[gs/auth/login]", e);
    return NextResponse.json(
      { error: "Erro interno no login." },
      { status: 500 },
    );
  }
}