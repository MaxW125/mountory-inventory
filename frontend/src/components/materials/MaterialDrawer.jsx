import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/shared/StatusBadge";

function buildInitialMaterial(material) {
  if (material) {
    return {
      ...material,
      cost_per_unit: Number(material.cost_per_unit ?? material.unit_cost ?? 0),
      quantity_on_hand: Number(material.quantity_on_hand ?? 0),
      reorder_point:
        typeof material.reorder_point === "number" ? material.reorder_point : null,
      is_listed: material.is_listed ?? true,
      category: material.category || "OTHER",
      unit: material.unit || "pcs",
      color: material.color || "N/A",
      brand: material.brand || "",
      type: material.type || "",
      finish: material.finish || "",
      supplier: material.supplier || "",
    };
  }

  return {
    name: "",
    category: "OTHER",
    type: "",
    color: "N/A",
    quantity_on_hand: 0,
    cost_per_unit: 0,
    unit: "pcs",
    brand: "",
    supplier: "",
    finish: "",
    reorder_point: null,
    is_listed: true,
  };
}

function ViewPanel({ material, onEdit }) {
  const reorderPoint =
    typeof material.reorder_point === "number" ? material.reorder_point : null;
  const stockRatio =
    reorderPoint && reorderPoint > 0 ? material.quantity_on_hand / reorderPoint : null;

  let stockStatus = "healthy";
  let stockLabel = "Healthy";

  if (reorderPoint !== null) {
    if (material.quantity_on_hand === 0 || stockRatio < 1) {
      stockStatus = "low";
      stockLabel = "Low Stock";
    } else if (stockRatio <= 1.5) {
      stockStatus = "near";
      stockLabel = "Near Reorder";
    } else if (stockRatio > 5) {
      stockStatus = "over";
      stockLabel = "Overstocked";
    }
  }

  const unitCost = Number(material.cost_per_unit ?? material.unit_cost ?? 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">{material.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {material.brand || "—"} · {material.type || material.category || "Material"}
          </p>
        </div>
        <StatusBadge variant={stockStatus}>{stockLabel}</StatusBadge>
      </div>

      <div className="space-y-5 flex-1 overflow-y-auto pr-1">
        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Material Info
          </p>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Name" value={material.name} />
            <InfoRow label="Type" value={material.type || "—"} />
            <InfoRow label="Category" value={material.category || "—"} />
            <InfoRow label="Color" value={material.color || "—"} />
            <InfoRow label="Finish" value={material.finish || "—"} />
            <InfoRow label="Brand" value={material.brand || "—"} />
            <InfoRow label="Supplier" value={material.supplier || "—"} />
          </div>
        </section>

        <Separator />

        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Cost
          </p>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Unit Cost" value={`$${unitCost.toFixed(2)}`} />
            <InfoRow label="Unit" value={material.unit || "—"} />
            <InfoRow
              label="On-Hand Value"
              value={`$${(unitCost * Number(material.quantity_on_hand || 0)).toFixed(2)}`}
            />
          </div>
        </section>

        <Separator />

        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Stock Thresholds
          </p>
          <div className="grid grid-cols-3 gap-3">
            <ThresholdCard label="Min" value={0} unit={material.unit || ""} color="text-destructive" />
            <ThresholdCard
              label="Reorder"
              value={reorderPoint ?? "—"}
              unit={reorderPoint !== null ? material.unit || "" : ""}
              color="text-yellow-400"
            />
            <ThresholdCard
              label="Overstock"
              value={reorderPoint !== null ? reorderPoint * 5 : "—"}
              unit={reorderPoint !== null ? material.unit || "" : ""}
              color="text-blue-400"
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">Currently on hand</span>
            <span className="text-sm font-semibold text-foreground">
              {Number(material.quantity_on_hand || 0)} {material.unit || ""}
            </span>
          </div>
        </section>
      </div>

      <div className="pt-4 border-t border-border mt-4">
        <Button size="sm" variant="outline" className="w-full" onClick={onEdit}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Material
        </Button>
      </div>
    </div>
  );
}

function EditPanel({ material, mode, onSave, onCancel }) {
  const [form, setForm] = useState(buildInitialMaterial(material));
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const heading = mode === "create" ? "Add Material" : "Edit Material";

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-base font-semibold text-foreground mb-6">{heading}</h2>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <Field label="Name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-9 text-sm" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Input
              value={form.category || ""}
              onChange={(e) => set("category", e.target.value.toUpperCase())}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Type">
            <Input
              value={form.type || ""}
              onChange={(e) => set("type", e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Color">
            <Input
              value={form.color || ""}
              onChange={(e) => set("color", e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Unit">
            <Input
              value={form.unit || ""}
              onChange={(e) => set("unit", e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Brand">
            <Input
              value={form.brand || ""}
              onChange={(e) => set("brand", e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Supplier">
            <Input
              value={form.supplier || ""}
              onChange={(e) => set("supplier", e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
        </div>

        <Field label="Finish">
          <Input
            value={form.finish || ""}
            onChange={(e) => set("finish", e.target.value)}
            className="h-9 text-sm"
          />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="On Hand">
            <Input
              type="number"
              value={form.quantity_on_hand ?? 0}
              onChange={(e) => set("quantity_on_hand", parseFloat(e.target.value) || 0)}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Unit Cost ($)">
            <Input
              type="number"
              value={form.cost_per_unit ?? form.unit_cost ?? 0}
              onChange={(e) => set("cost_per_unit", parseFloat(e.target.value) || 0)}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Reorder Pt">
            <Input
              type="number"
              value={form.reorder_point ?? ""}
              onChange={(e) =>
                set("reorder_point", e.target.value === "" ? null : parseFloat(e.target.value) || 0)
              }
              className="h-9 text-sm"
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Switch checked={!!form.is_listed} onCheckedChange={(value) => set("is_listed", value)} />
          <Label className="text-sm text-foreground">Listed</Label>
        </div>
      </div>

      <div className="pt-4 border-t border-border mt-4 flex gap-2">
        <Button size="sm" className="flex-1" onClick={() => onSave(form)}>
          <Check className="mr-1.5 h-3.5 w-3.5" />
          {mode === "create" ? "Create Material" : "Save Changes"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-medium text-foreground break-words">{value}</p>
    </div>
  );
}

function ThresholdCard({ label, value, unit, color }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{unit}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function MaterialDrawer({ material, mode, onClose, onSave }) {
  const panel = useMemo(() => {
    if (mode === "create") return "create";
    return mode || "view";
  }, [mode]);

  if (!material && panel !== "create") return null;

  return createPortal(
    <>
      <div
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />
      <div
        style={{ position: "fixed", inset: "0 0 0 auto", width: "24rem", zIndex: 50 }}
        className="flex flex-col bg-card border-l border-border shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {panel === "view" ? "Material Details" : panel === "create" ? "Add Material" : "Edit Material"}
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {panel === "view" ? (
            <ViewPanel material={material} onEdit={() => window.location.reload()} />
          ) : (
            <EditPanel
              material={material}
              mode={panel}
              onSave={async (updated) => {
                await onSave(updated);
                onClose();
              }}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </>,
    document.body
  );
}