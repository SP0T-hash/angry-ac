import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/ac-angry/api-middleware';

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const cnpjParam = searchParams.get('cnpj');

  if (!cnpjParam) {
    return NextResponse.json({ error: 'Parâmetro CNPJ é obrigatório' }, { status: 400 });
  }

  const cnpj = cnpjParam.replace(/\D/g, '');

  if (cnpj.length !== 14) {
    return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'CNPJ não encontrado na Receita Federal' },
          { status: 404 },
        );
      }
      throw new Error(`BrasilAPI respondeu com status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao consultar CNPJ:', error);
    return NextResponse.json(
      { error: 'Erro interno ao tentar validar o CNPJ' },
      { status: 500 },
    );
  }
});
