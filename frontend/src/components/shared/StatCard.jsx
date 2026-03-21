import React from "react";
import { Card } from "@/components/ui/card";

export default function StatCard({ label, value, icon: Icon, format, iconBg, iconColor }) {
  const displayValue =
    format === "currency"
      ? `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : value;

  return (
    <Card className="relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {displayValue}
          </p>
        </div>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconBg || "bg-primary/15"}`}>
            <Icon className={`h-5 w-5 ${iconColor || "text-primary"}`} />
          </div>
        )}
      </div>
    </Card>
  );
}