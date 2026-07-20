'use client';

import React from 'react';
import { Card, Text, Metric, Flex, ProgressBar, BadgeDelta, Grid } from "@tremor/react";
import { Shield, Users, Fingerprint, Activity } from "lucide-react";

const kpiData = [
  {
    title: "Emissões Hoje",
    metric: "128",
    icon: Shield,
    delta: "12%",
    deltaType: "moderateIncrease",
    progress: 72,
    target: "180",
    color: "emerald",
  },
  {
    title: "AGRs Ativos",
    metric: "42",
    icon: Users,
    delta: "4%",
    deltaType: "moderateIncrease",
    progress: 84,
    target: "50",
    color: "indigo",
  },
  {
    title: "Validações PSBIO",
    metric: "98.2%",
    icon: Fingerprint,
    delta: "0.5%",
    deltaType: "moderateIncrease",
    progress: 98,
    target: "100%",
    color: "amber",
  },
  {
    title: "Uptime Hardware",
    metric: "99.9%",
    icon: Activity,
    delta: "Estável",
    deltaType: "unchanged",
    progress: 100,
    target: "99.9%",
    color: "indigo",
  },
];

export default function KpiGrid() {
  return (
    <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
      {kpiData.map((item) => (
        <Card key={item.title} decoration="top" decorationColor={item.color as any} className="bg-[#0f172a]/50 border-white/10 backdrop-blur-xl">
          <Flex alignItems="start">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-${item.color}-500/10 text-${item.color}-500`}>
                <item.icon size={20} />
              </div>
              <Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{item.title}</Text>
            </div>
            {item.deltaType !== "unchanged" && (
                <BadgeDelta deltaType={item.deltaType as any} isIncreasePositive={true} size="xs">
                {item.delta}
                </BadgeDelta>
            )}
          </Flex>
          <Flex justifyContent="start" alignItems="baseline" className="space-x-3 truncate mt-4">
            <Metric className="text-white font-black tracking-tight">{item.metric}</Metric>
            <Text className="text-slate-500 text-xs truncate">meta: {item.target}</Text>
          </Flex>
          <ProgressBar value={item.progress} color={item.color as any} className="mt-4" />
        </Card>
      ))}
    </Grid>
  );
}
