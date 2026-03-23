import React, { useState, useEffect } from "react";
import { AlertTriangle, AlertCircle, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { getMaterials } from "@/services/inventoryService";

function classifyMaterials(materials) {
  const low = [];
  const near = [];
  const over = [];
  const healthy = [];

  materials.forEach((m) => {
    const ratio = m.reorder_point > 0 ? m.quantity_on_hand / m.reorder_point : 999;
    if (m.quantity_on_hand === 0 || ratio < 1) {
      low.push(m);
    } else if (ratio <= 1.5) {
      near.push(m);
    } else if (ratio > 5) {
      over.push(m);
    } else {
      healthy.push(m);
    }
  });

  return { low, near, over, healthy };
}

function InsightSection({ title, badge, badgeVariant, items, emptyMsg }) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <StatusBadge variant={badgeVariant}>{badge}</StatusBadge>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
          {emptyMsg}
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {m.type} · {m.supplier}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-sm font-medium text-foreground">
                  {m.quantity_on_hand} {m.unit}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reorder at {m.reorder_point}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Insights() {
  const [classified, setClassified] = useState({
    low: [],
    near: [],
    over: [],
    healthy: [],
  });

  useEffect(() => {
    getMaterials().then((mats) => setClassified(classifyMaterials(mats)));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Insights"
        subtitle="Inventory health & stock analysis"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Low Stock" value={classified.low.length} icon={AlertTriangle} />
        <StatCard label="Near Reorder" value={classified.near.length} icon={AlertCircle} />
        <StatCard label="Overstocked" value={classified.over.length} icon={TrendingUp} />
        <StatCard label="Healthy" value={classified.healthy.length} icon={CheckCircle2} />
      </div>

      {/* Detail sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <InsightSection
          title="Low Stock"
          badge={`${classified.low.length} materials`}
          badgeVariant="low"
          items={classified.low}
          emptyMsg="No materials are critically low"
        />
        <InsightSection
          title="Near Reorder"
          badge={`${classified.near.length} materials`}
          badgeVariant="near"
          items={classified.near}
          emptyMsg="No materials approaching reorder"
        />
        <InsightSection
          title="Overstocked"
          badge={`${classified.over.length} materials`}
          badgeVariant="over"
          items={classified.over}
          emptyMsg="No overstocked materials"
        />
        <InsightSection
          title="Healthy"
          badge={`${classified.healthy.length} materials`}
          badgeVariant="healthy"
          items={classified.healthy}
          emptyMsg="No materials in healthy range"
        />
      </div>
    </div>
  );
}