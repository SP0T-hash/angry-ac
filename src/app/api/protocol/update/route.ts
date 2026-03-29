import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'ID e Dados são obrigatórios' }, { status: 400 });
    }

    // Na vida real, atualizaríamos a tabela 'protocols' ou 'titulares'
    // const { data, error } = await supabase
    //   .from('protocols')
    //   .update(updates)
    //   .eq('id', id);

    // if (error) throw error;

    console.log(`[SUPABASE] Atualizando protocolo ${id}:`, updates);

    return NextResponse.json({ success: true, message: 'Protocolo atualizado com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
