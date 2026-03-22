import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultForm = {
  name: "",
  department: "",
  sku: "",
  sell_price: "",
  is_listed: true,
};

function Field({ label, children }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function AddProductModal({
  departments,
  materials,
  onCreateDepartment,
  onDeleteDepartment,
  onClose,
  onAdd,
}) {
  const [form, setForm] = useState(defaultForm);
  const [addingDept, setAddingDept] = useState(false);
  const [managingDepts, setManagingDepts] = useState(false);
  const [newDept, setNewDept] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [newQtyPerUnit, setNewQtyPerUnit] = useState(0);
  const [materialsUsed, setMaterialsUsed] = useState([]);
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

  async function confirmNewDept() {
    const trimmed = newDept.trim();
    if (!trimmed) return;

    const exists = (departments || []).some(
      (d) => d.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      setErrorMessage("That department already exists.");
      return;
    }

    try {
      setErrorMessage("");
      await onCreateDepartment(trimmed);
      set("department", trimmed);
      setNewDept("");
      setAddingDept(false);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not add that department right now.")
      );
    }
  }

  async function removeDept(dept) {
    if (!dept?.id) return;

    try {
      setErrorMessage("");
      await onDeleteDepartment(dept.id);
      if (form.department === dept.name) set("department", "");
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not delete that department right now.")
      );
    }
  }

  function addMaterialLine() {
    if (!selectedMaterialId) return;
    if (Number(newQtyPerUnit) <= 0) {
      setErrorMessage("Qty per unit must be greater than 0.");
      return;
    }

    const materialId = Number(selectedMaterialId);
    const material = (materials || []).find((m) => m.id === materialId);
    if (!material) return;

    const exists = materialsUsed.some((item) => item.material_id === materialId);
    if (exists) return;

    setErrorMessage("");
    setMaterialsUsed((prev) => [
      ...prev,
      {
        material_id: material.id,
        name: material.name,
        type: material.type,
        color: material.color,
        unit: material.unit,
        qty_per_unit: Number(newQtyPerUnit || 0),
      },
    ]);

    setSelectedMaterialId("");
    setNewQtyPerUnit(0);
  }

  function removeMaterialLine(materialId) {
    setMaterialsUsed((prev) => prev.filter((item) => item.material_id !== materialId));
  }

  async function handleSubmit() {
    const trimmedName = form.name.trim();
    const trimmedSku = form.sku.trim();
    const sellPrice = parseFloat(form.sell_price || "0");

    if (!trimmedName) {
      setErrorMessage("Product name is required.");
      return;
    }

    if (!trimmedSku) {
      setErrorMessage("Product SKU is required.");
      return;
    }

    if (!form.department.trim()) {
      setErrorMessage("Product department is required.");
      return;
    }

    if (Number.isNaN(sellPrice) || sellPrice < 0) {
      setErrorMessage("Sell price cannot be negative.");
      return;
    }

    try {
      setErrorMessage("");
      setIsSubmitting(true);
      await onAdd({
        ...form,
        id: Date.now(),
        name: trimmedName,
        sku: trimmedSku,
        sell_price: sellPrice,
        materials_used: materialsUsed.map((item) => ({
          material_id: item.material_id,
          qty_per_unit: Number(item.qty_per_unit || 0),
        })),
      });
      onClose();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, "Could not add product right now.")
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
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 50, width: "28rem", maxHeight: "90vh" }}
        className="flex flex-col bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Add New Product</span>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {errorMessage && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          <Field label="Item Name *">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-9 text-sm" placeholder="e.g. Wall-Mount Hook" />
          </Field>

          <Field label="Department">
            <div className="flex gap-2">
              <Select value={form.department} onValueChange={(v) => set("department", v)}>
                <SelectTrigger className="h-9 text-sm flex-1">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {(departments || []).map((d) => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => { setAddingDept(true); setManagingDepts(false); }}
                className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                title="Add new department"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => { setManagingDepts((v) => !v); setAddingDept(false); }}
                className="h-9 w-9 flex items-center justify-center rounded-md border border-input bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                title="Manage departments"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            {addingDept && (
              <div className="flex gap-2 mt-2">
                <Input
                  autoFocus
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmNewDept(); if (e.key === "Escape") setAddingDept(false); }}
                  className="h-8 text-sm flex-1"
                  placeholder="New department name"
                />
                <Button size="sm" onClick={confirmNewDept} className="h-8 px-3">Add</Button>
                <Button size="sm" variant="outline" onClick={() => setAddingDept(false)} className="h-8 px-3">Cancel</Button>
              </div>
            )}
            {managingDepts && (
              <div className="mt-2 rounded-md border border-border bg-muted/30 p-2 space-y-1">
                <p className="text-xs text-muted-foreground mb-1">Click × to remove a department</p>
                {(departments || []).map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted text-sm">
                    <span className="text-foreground">{d.name}</span>
                    <button onClick={() => removeDept(d)} className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full h-7 mt-1 text-xs" onClick={() => setManagingDepts(false)}>Done</Button>
              </div>
            )}
          </Field>

          <Field label="SKU">
            <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} className="h-9 text-sm" placeholder="MNT-XXXX-000" />
          </Field>

          <Field label="Sell Price ($)">
            <Input type="number" min="0" step="0.01" value={form.sell_price} onChange={(e) => set("sell_price", e.target.value)} className="h-9 text-sm" placeholder="0.00" />
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <Switch checked={form.is_listed} onCheckedChange={(v) => set("is_listed", v)} />
            <Label className="text-sm text-foreground">Listed</Label>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Materials Input
            </p>

            {materialsUsed.length > 0 ? (
              <div className="space-y-2 mb-4">
                {materialsUsed.map((item) => (
                  <div
                    key={item.material_id}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm gap-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.type || "Material"} · {item.color || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-muted-foreground">
                        {Number(item.qty_per_unit || 0)} {item.unit || ""}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => removeMaterialLine(item.material_id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">
                No linked material inputs available yet.
              </p>
            )}

            <div className="grid gap-3">
              <Field label="Add Material">
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select material</option>
                  {(materials || [])
                    .filter((material) => !materialsUsed.some((item) => item.material_id === material.id))
                    .map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} · {material.type || "—"} · {material.color || "—"}
                      </option>
                    ))}
                </select>
              </Field>

              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                <Field label="Qty Per Unit">
                  <Input
                    type="number"
                    value={newQtyPerUnit}
                    onChange={(e) => setNewQtyPerUnit(parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm"
                  />
                </Field>
                <Button size="sm" type="button" disabled={!selectedMaterialId} onClick={addMaterialLine}>
                  Add BOM Line
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-2">
          <Button size="sm" className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
            <Check className="mr-1.5 h-3.5 w-3.5" /> {isSubmitting ? "Adding..." : "Add Product"}
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>,
    document.body
  );
}