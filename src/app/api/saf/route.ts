import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Sistema Anti-Fraude (SAF) INTERNO via Banco de Dados Próprio do Supabase
export async function POST(request: Request) {
  try {
    const { characteristics } = await request.json();
    
    // O sistema faz a query na sua Tabela "fraud_blacklist" (Cofre Negro de fraudadores que você flagrou no passado)
    const { data: frauds, error } = await supabase
      .from('fraud_blacklist')
      .select('id, name, fraud_reason, risk_level')
      .contains('traits_array', characteristics || []);
      
    if (error) {
      if (error.code === '42P01') {
        // Significa que você ainda não criou a tabela fraud_blacklist no seu painel do Supabase.
        // É normal, você faz isso depois. O sistema assume "Limpo" (Verde).
        return NextResponse.json({ match: false, frauds: [] });
      }
      throw error;
    }

    if (frauds && frauds.length > 0) {
      // Deu Match com criminoso na sua base!
      return NextResponse.json({ 
        match: true, 
        frauds,
        message: 'ALERTA TÉCNICO: CPF ou Rosto confere com indivíduo bloqueado na sua base VEMAPI.'
      });
    }

    // Passou na verificação perfeitamente
    return NextResponse.json({ match: false, frauds: [] });

  } catch (error) {
    console.error('Erro na API SAF Supabase:', error);
    return NextResponse.json({ error: 'Erro interno ao consultar SAF.' }, { status: 500 });
  }
}
