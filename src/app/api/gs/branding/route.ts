import { NextRequest, NextResponse } from "next/server";
import { getArBranding, hexToRgbTriplet } from "@/lib/gs/tenantBranding";

// Marca pública por AR (white-label). Sem autenticação: expõe apenas
// logo/nome/cores (dados de marca, não sensíveis). Usado por Landing,
// AC Angry e pelo fluxo RI (cross-repo) para aplicar a marca da AR.
// Query: ?ar=<slug|id>
export async function GET(req: NextRequest) {
  const ar = req.nextUrl.searchParams.get("ar") ?? undefined;
  const branding = await getArBranding(ar);

  const body = {
    ...branding,
    primaryRgb: hexToRgbTriplet(branding.primary),
    verificationRgb: hexToRgbTriplet(branding.verification),
  };

  return NextResponse.json(body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
