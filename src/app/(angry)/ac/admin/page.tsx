import React from 'react';
import AgenteMonitor from "@/components/ac-angry/admin/AgenteMonitor";
import KpiGrid from "@/components/ac-angry/admin/KpiGrid";
import SecurityAuditTable from "@/components/ac-angry/admin/SecurityAuditTable";
import { getSupabaseAdmin } from "@/lib/infra/supabase/client";

export default async function AdminPortalPage() {
  const supabase = getSupabaseAdmin();

  const [auditResult, protocolsTotal, protocolsIssued, agentsActive] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("id, event_type, agr_id, protocol_id, ip_address, severity, hash, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("protocols").select("*", { count: "exact", head: true }),
    supabase.from("protocols").select("*", { count: "exact", head: true }).eq("status", "ISSUED"),
    supabase.from("agr_users").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Portal Admin · AC ANGRY</h1>
        <p className="text-sm text-slate-400 mt-0.5">Supervisão de agentes, indicadores e auditoria de segurança</p>
      </div>

      <KpiGrid data={{
        totalProtocols: protocolsTotal.count ?? 0,
        issuedProtocols: protocolsIssued.count ?? 0,
        activeAgents: agentsActive.count ?? 0,
      }} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <AgenteMonitor />
        <SecurityAuditTable auditLogs={auditResult.data ?? []} />
      </div>
    </div>
  );
}
