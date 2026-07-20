import React from 'react';
import AgenteMonitor from "@/components/ac-angry/admin/AgenteMonitor";
import KpiGrid from "@/components/ac-angry/admin/KpiGrid";
import SecurityAuditTable from "@/components/ac-angry/admin/SecurityAuditTable";

export default function AdminPortalPage() {
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
