import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultForm = {
  name: "",
  type: "",
  color: "",
  finish: "",
  brand: "",
  supplier: "",
  unit: "",
  unit_cost: "",
  quantity_on_hand: "",
  reorder_point: "",
};

function Field({ label, children }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function AddMaterialModal({
  units,
  onCreateUnit,
  onDeleteUnit,
  onClose,
  onAdd,
  onCreate,
}) {
  const [form, setForm] = useState(defaultForm);
  const [addingUnit, setAddingUnit] = useState(false);
  const [managingUnits, setManagingUnits] = useState(false);
  const [newUnit, setNewUnit] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  function getErrorMessage(error, fallbackMessage) {
    const detail = error?.response?.data?.detail ?? error?.detail;

    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }

    if (detail && typeof detail === "object" && typeof detail.message === "string") {
      return detail.message;
    }

    if (error instanceof Error && error.message?.trim()) {
      return error.message;
    }

    return fallbackMessage;
  }

  async function removeUnit(unit) {
    if (!unit?.id) return;

    try {
      setErrorMessage("");
      await onDeleteUnit(unit.id);
      if (form.unit === unit.name) set("unit", "");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not delete that unit right now.")
      );
    }
  }

  async function confirmNewUnit() {
    const trimmed = newUnit.trim();
    if (!trimmed) return;

    const exists = (units || []).some(
      (u) => u.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setErrorMessage("That unit already exists.");
      return;
    }

    try {
      setErrorMessage("");
      await onCreateUnit(trimmed);
      set("unit", trimmed);
      setNewUnit("");
      setAddingUnit(false);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not add that unit right now.")
      );
    }
  }

  async function handleSubmit() {
    const trimmedName = form.name.trim();
    const quantityOnHand = parseFloat(form.quantity_on_hand || "0");
    const unitCost = parseFloat(form.unit_cost || "0");
    const reorderPoint = parseFloat(form.reorder_point || "0");

    if (!trimmedName) {
      setErrorMessage("Material name is required.");
      return;
    }

    if (Number.isNaN(quantityOnHand) || quantityOnHand < 0) {
      setErrorMessage("On hand quantity cannot be negative.");
      return;
    }

    if (Number.isNaN(unitCost) || unitCost < 0) {
      setErrorMessage("Unit cost cannot be negative.");
      return;
    }

    if (Number.isNaN(reorderPoint) || reorderPoint < 0) {
      setErrorMessage("Reorder point cannot be negative.");
      return;
    }

    const payload = {
      name: trimmedName,
      color: form.color?.trim() || "N/A",
      quantity_on_hand: quantityOnHand,
      unit: form.unit?.trim() || "",
      cost_per_unit: unitCost,
      brand: form.brand?.trim() || "",
      type: form.type?.trim() || "",
      finish: form.finish?.trim() || "",
      supplier: form.supplier?.trim() || "",
      reorder_point: reorderPoint,
    };

    try {
      setErrorMessage("");
      setIsSubmitting(true);

      if (onCreate) {
        await onCreate(payload);
      } else if (onAdd) {
        onAdd({
          ...payload,
          id: Date.now(),
          unit_cost: payload.cost_per_unit,
        });
      }

      onClose();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not add material right now.")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return createPortal(
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 40, backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 50,
          width: "28rem",
          maxHeight: "90vh",
        }}
        className="flex flex-col bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Add New Material</span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {errorMessage && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          <Field label="Material Name *">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="h-9 text-sm"
              placeholder="e.g. PLA Filament – Black"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Input
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className="h-9 text-sm"
                placeholder="e.g. Filament"
              />
            </Field>
            <Field label="Color">
              <Input
                value={form.color}
                onChange={(e) => set("color", e.target.value)}
                className="h-9 text-sm"
                placeholder="e.g. Black"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Brand">
              <Input
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                className="h-9 text-sm"
                placeholder="e.g. eSUN"
              />
            </Field>
            <Field label="Finish">
              <Input
                value={form.finish}
                onChange={(e) => set("finish", e.target.value)}
                className="h-9 text-sm"
                placeholder="e.g. Matte"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Supplier">
              <Input
                value={form.supplier}
                onChange={(e) => set("supplier", e.target.value)}
                className="h-9 text-sm"
                placeholder="e.g. eSUN Direct"
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="On Hand">
              <Input
                type="number"
                min="0"
                value={form.quantity_on_hand}
                onChange={(e) => set("quantity_on_hand", e.target.value)}
                className="h-9 text-sm"
                placeholder="0"
              />
            </Field>
            <Field label="Unit Cost ($)">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.unit_cost}
                onChange={(e) => set("unit_cost", e.target.value)}
                className="h-9 text-sm"
                placeholder="0.00"
              />
            </Field>
            <Field label="Reorder Pt">
              <Input
                type="number"
                min="0"
                value={form.reorder_point}
                onChange={(e) => set("reorder_point", e.target.value)}
                className="h-9 text-sm"
                placeholder="0"
              />
            </Field>
          </div>

          <Field label="Unit">
            <div className="flex gap-2">
              <Select value={form.unit} onValueChange={(v) => set("unit", v)}>
                <SelectTrigger className="h-9 text-sm flex-1">
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

        <div className="px-5 py-4 border-t border-border flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            {isSubmitting ? "Adding..." : "Add Material"}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}