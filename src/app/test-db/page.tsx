"use client";
import { useState, useEffect } from 'react';
import { testSupabaseConnection, createLeadsTableSQL } from '@/lib/test-supabase';

export default function TestDBPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    const result = await testSupabaseConnection();
    setTestResult(result);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Teste de Conexão Supabase</h1>
        
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

        <div className="mt-8 p-6 bg-gray-800 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Instruções para configurar o banco:</h3>
          <ol className="list-decimal list-inside space-y-2">
            <li>Acesse o painel do Supabase: https://supabase.com/dashboard</li>
            <li>Vá para o seu projeto</li>
            <li>Clique em "SQL Editor" no menu lateral</li>
            <li>Cole e execute o seguinte SQL:</li>
          </ol>
          <pre className="mt-4 p-4 bg-black rounded text-sm overflow-x-auto">
            {createLeadsTableSQL}
          </pre>
        </div>
      </div>
    </div>
  );
}
