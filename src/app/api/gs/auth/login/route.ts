import { NextRequest, NextResponse } from "next/server";
import { gsLogin, setGSSession } from "@/lib/gs/session";

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
  try {
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
  } catch (e: any) {
    console.error("[gs/auth/login]", e);
    return NextResponse.json(
      { error: "Erro interno no login." },
      { status: 500 },
    );
  }
}
