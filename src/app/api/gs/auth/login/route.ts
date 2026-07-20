import { NextRequest, NextResponse } from "next/server";
import { gsLogin, setGSSession } from "@/lib/gs/session";

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();
    if (!email || !senha) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 },
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
