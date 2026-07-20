"use client";
import { useState } from 'react';
import { getSupabaseBrowser } from '@/lib/infra/supabase/client';

export default function TestDBPage() {
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    try {
      const client = getSupabaseBrowser();
      const { error } = await client.from('agr_users').select('count').limit(1).maybeSingle();
      setTestResult({ success: !error, error: error?.message });
    } catch (e) {
      setTestResult({ success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Teste de Conexão Supabase (Infra)</h1>

        <button
          onClick={runTest}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg mb-8 disabled:opacity-50"
        >
          {loading ? 'Testando...' : 'Testar Conexão'}
        </button>

        {testResult && (
          <div className={`p-6 rounded-lg ${testResult.success ? 'bg-green-900' : 'bg-red-900'}`}>
            <h2 className="text-xl font-bold mb-4">
              {testResult.success ? '✅ Conexão Sucesso' : '❌ Erro na Conexão'}
            </h2>
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
