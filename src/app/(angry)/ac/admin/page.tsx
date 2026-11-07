import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SessionManager } from '@/lib/ac-angry/security';
import AgenteMonitor from "@/components/ac-angry/admin/AgenteMonitor";
import KpiGrid from "@/components/ac-angry/admin/KpiGrid";
import SecurityAuditTable from "@/components/ac-angry/admin/SecurityAuditTable";

export default async function AdminPortalPage() {
  const token = (await cookies()).get('ac_angry_session')?.value;
  if (!token) redirect('/auth/login');
  try {
    await SessionManager.validatePageJWT(token, 'ADMIN');
  } catch {
    redirect('/auth/login');
  }
  return (
    <div className="min-h-screen bg-slate-50 p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Portal Admin · AC ANGRY</h1>
        <p className="text-sm text-slate-400 mt-0.5">Supervisão de agentes, indicadores e auditoria de segurança</p>
      </div>

      <KpiGrid />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <AgenteMonitor />
        <SecurityAuditTable />
      </div>
    </div>
  );
}
