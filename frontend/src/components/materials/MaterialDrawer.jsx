import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Pencil, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/shared/StatusBadge";


function buildInitialMaterial(material) {
  if (material) {
    return {
      ...material,
      cost_per_unit: Number(material.cost_per_unit ?? material.unit_cost ?? 0),
      quantity_on_hand: Number(material.quantity_on_hand ?? 0),
      reorder_point:
        typeof material.reorder_point === "number" ? material.reorder_point : 0,
      color: material.color || "N/A",
      brand: material.brand || "",
      type: material.type || "",
      finish: material.finish || "",
      supplier: material.supplier || "",
      unit: material.unit || "",
    };
  }

  return {
    name: "",
    type: "",
    color: "N/A",
    quantity_on_hand: 0,
    cost_per_unit: 0,
    brand: "",
    supplier: "",
    unit: "",
    finish: "",
    reorder_point: 0,
  };
}

function ViewPanel({ material, onEdit }) {
  const reorderPoint =
    typeof material.reorder_point === "number" ? material.reorder_point : 0;

  const stockRatio =
    reorderPoint > 0 ? Number(material.quantity_on_hand || 0) / reorderPoint : null;

  let stockStatus = "healthy";
  let stockLabel = "Healthy";

  if (reorderPoint > 0) {
    if (Number(material.quantity_on_hand || 0) === 0 || stockRatio < 1) {
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
  const onHand = Number(material.quantity_on_hand || 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">{material.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {material.brand || "—"} · {material.type || "Material"}
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
            <InfoRow label="Color" value={material.color || "—"} />
            <InfoRow label="Brand" value={material.brand || "—"} />
            <InfoRow label="Finish" value={material.finish || "—"} />
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
              value={`$${(unitCost * onHand).toFixed(2)}`}
            />
          </div>
        </section>

        <Separator />

        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Stock Thresholds
          </p>
          <div className="grid grid-cols-3 gap-3">
            <ThresholdCard label="Min" value={0} color="text-destructive" />
            <ThresholdCard
              label="Reorder"
              value={reorderPoint}
              color="text-yellow-400"
            />
            <ThresholdCard
              label="Overstock"
              value={reorderPoint > 0 ? reorderPoint * 5 : "—"}
              color="text-blue-400"
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
            <span className="text-xs text-muted-foreground">Currently on hand</span>
            <span className="text-sm font-semibold text-foreground">
              {onHand} {material.unit || ""}
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

function EditPanel({ material, mode, units, onCreateUnit, onDeleteUnit, onSave, onCancel }) {
  const [form, setForm] = useState(buildInitialMaterial(material));
  const [addingUnit, setAddingUnit] = useState(false);
  const [managingUnits, setManagingUnits] = useState(false);
  const [newUnit, setNewUnit] = useState("");

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function removeUnit(unit) {
    if (!unit?.id) return;
    await onDeleteUnit(unit.id);
    if (form.unit === unit.name) set("unit", "");
  }

  async function confirmNewUnit() {
    const trimmed = newUnit.trim();
    if (!trimmed) return;

    const exists = (units || []).some(
      (u) => u.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (!exists) {
      await onCreateUnit(trimmed);
      set("unit", trimmed);
    }

    setNewUnit("");
    setAddingUnit(false);
  }

  const heading = mode === "create" ? "Add Material" : "Edit Material";

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-base font-semibold text-foreground mb-6">{heading}</h2>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <Field label="Name">
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="h-9 text-sm"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Input
              value={form.type || ""}
              onChange={(e) => set("type", e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Color">
            <Input
              value={form.color || ""}
              onChange={(e) => set("color", e.target.value)}
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
          <Field label="Finish">
            <Input
              value={form.finish || ""}
              onChange={(e) => set("finish", e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Supplier">
            <Input
              value={form.supplier || ""}
              onChange={(e) => set("supplier", e.target.value)}
              className="h-9 text-sm"
            />
          </Field>

          <Field label="Unit Cost ($)">
            <Input
              type="number"
              value={form.cost_per_unit ?? 0}
              onChange={(e) => set("cost_per_unit", parseFloat(e.target.value) || 0)}
              className="h-9 text-sm"
            />
          </Field>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reorder Pt">
              <Input
                type="number"
                value={form.reorder_point ?? 0}
                onChange={(e) => set("reorder_point", parseFloat(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </Field>
            <Field label="On Hand">
              <Input
                type="number"
                value={form.quantity_on_hand ?? 0}
                onChange={(e) => set("quantity_on_hand", parseFloat(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </Field>
          </div>

          <Field label="Unit">
            <div className="flex flex-wrap gap-2">
              <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                <SelectTrigger className="h-9 text-sm flex-1 min-w-[70px]">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {(units || []).map((u) => (
                    <SelectItem key={u.id} value={u.name}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <button
                type="button"
                onClick={() => {
                  setAddingUnit(true);
                  setManagingUnits(false);
                }}
                className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                title="Add new unit"
              >
                <Plus className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setManagingUnits((v) => !v);
                  setAddingUnit(false);
                }}
                className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                title="Manage units"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {addingUnit && (
              <div className="flex gap-2 mt-2">
                <Input
                  autoFocus
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmNewUnit();
                    if (e.key === "Escape") setAddingUnit(false);
                  }}
                  className="h-8 text-sm flex-1"
                  placeholder="New unit (e.g. boxes)"
                />
                <Button size="sm" onClick={confirmNewUnit} className="h-8 px-3">
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddingUnit(false)}
                  className="h-8 px-3"
                >
                  Cancel
                </Button>
              </div>
            )}

            {managingUnits && (
              <div className="mt-2 rounded-md border border-border bg-muted/30 p-2 space-y-1">
                <p className="text-xs text-muted-foreground mb-1">Click × to remove a unit</p>
                {(units || []).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted text-sm"
                  >
                    <span className="text-foreground">{u.name}</span>
                    <button
                      type="button"
                      onClick={() => removeUnit(u)}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 mt-1 text-xs"
                  onClick={() => setManagingUnits(false)}
                >
                  Done
                </Button>
              </div>
            )}
          </Field>
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

function ThresholdCard({ label, value, color }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2 text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
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

export default function MaterialDrawer({ material, mode, units, onCreateUnit, onDeleteUnit, onClose, onSave, onEdit }) {
  const panel = useMemo(() => {
    if (mode === "create") return "create";
    return mode || "view";
  }, [mode]);

  if (!material && panel !== "create") return null;

  return createPortal(
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        onClick={onClose}
      />
      <div
        style={{ position: "fixed", inset: "0 0 0 auto", width: "24rem", zIndex: 50 }}
        className="flex flex-col bg-card border-l border-border shadow-2xl"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {panel === "view"
              ? "Material Details"
              : panel === "create"
              ? "Add Material"
              : "Edit Material"}
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
            <ViewPanel material={material} onEdit={onEdit} />
          ) : (
            <EditPanel
              material={material}
              mode={panel}
              units={units}
              onCreateUnit={onCreateUnit}
              onDeleteUnit={onDeleteUnit}
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