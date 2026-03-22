import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, Pencil, Check, Plus, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/shared/StatusBadge";

function ViewPanel({ product, bom, onEdit }) {
  const margin =
    Number(product.sell_price ?? 0) > 0
      ? ((((Number(product.sell_price ?? 0) - Number(product.unit_cost ?? 0)) / Number(product.sell_price ?? 0)) * 100)).toFixed(1)
      : "0.0";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-foreground">{product.name}</h2>
        </div>
        <StatusBadge variant={product.is_listed ? "listed" : "unlisted"}>
          {product.is_listed ? "Listed" : "Not Listed"}
        </StatusBadge>
      </div>

      <div className="space-y-5 flex-1 overflow-y-auto pr-1">
        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Product Info
          </p>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="SKU" value={product.sku} />
            <InfoRow label="Department" value={product.department || "Unassigned"} />
          </div>
        </section>

        <Separator />

        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Pricing
          </p>
          <div className="grid grid-cols-3 gap-3">
            <InfoRow label="Unit Cost" value={`$${Number(product.unit_cost ?? 0).toFixed(2)}`} />
            <InfoRow label="Sell Price" value={`$${Number(product.sell_price ?? 0).toFixed(2)}`} />
            <InfoRow
              label="Profit Margin"
              value={
                <span className={Number(margin) >= 50 ? "text-green-400" : "text-yellow-400"}>
                  {margin}%
                </span>
              }
            />
          </div>
        </section>

        <Separator />

        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Materials Input
          </p>
          {bom && bom.length > 0 ? (
            <ul className="space-y-2">
              {bom.map((item, index) => (
                <li
                  key={`${item.material_id || item.name || "material"}-${index}`}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {item.name || "Linked Material"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.type || "Material"} · {item.color || "—"}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0 ml-4">
                    {Number(item.qty_per_unit ?? 0)} {item.unit || ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No linked material inputs available yet.
            </p>
          )}
        </section>
      </div>

      <div className="pt-4 border-t border-border mt-4">
        <Button size="sm" variant="outline" className="w-full" onClick={onEdit}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Product
        </Button>
      </div>
    </div>
  );
}

function EditPanel({ product, bom, materials, departments, onCreateDepartment, onDeleteDepartment, onSaveBomLine, onRemoveBomLine, onSave, onCancel }) {
  const [form, setForm] = useState({ ...product });
  const [draftBom, setDraftBom] = useState((bom || []).map((item) => ({ ...item })));
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [newQtyPerUnit, setNewQtyPerUnit] = useState(0);
  const [savingBom, setSavingBom] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addingDept, setAddingDept] = useState(false);
  const [managingDepts, setManagingDepts] = useState(false);
  const [newDept, setNewDept] = useState("");

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

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

  const availableMaterials = useMemo(() => {
    const usedIds = new Set((draftBom || []).map((item) => item.material_id));
    return (materials || []).filter((material) => !usedIds.has(material.id));
  }, [draftBom, materials]);

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

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-base font-semibold text-foreground mb-6">Edit Product</h2>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {errorMessage && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        )}
        <Field label="Item Name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-9 text-sm" />
        </Field>

        <Field label="Department">
          <div className="flex gap-2">
            <select
              value={form.department || ""}
              onChange={(e) => set("department", e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm flex-1"
            >
              <option value="">Select department</option>
              {(departments || []).map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmNewDept();
                  if (e.key === "Escape") setAddingDept(false);
                }}
                className="h-8 text-sm flex-1"
                placeholder="New department"
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
                  <button type="button" onClick={() => removeDept(d)} className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full h-7 mt-1 text-xs" onClick={() => setManagingDepts(false)}>Done</Button>
            </div>
          )}
        </Field>

        <Field label="SKU">
          <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} className="h-9 text-sm" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit Cost ($)">
            <Input
              type="number"
              value={form.unit_cost ?? 0}
              readOnly
              className="h-9 text-sm bg-muted/50"
            />
          </Field>
          <Field label="Sell Price ($)">
            <Input
              type="number"
              value={form.sell_price ?? 0}
              onChange={(e) => set("sell_price", parseFloat(e.target.value) || 0)}
              className="h-9 text-sm"
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Switch checked={!!form.is_listed} onCheckedChange={(value) => set("is_listed", value)} />
          <Label className="text-sm text-foreground">Listed</Label>
        </div>

        <Separator />

        <section>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Materials Input
          </p>

          {draftBom && draftBom.length > 0 ? (
            <div className="space-y-2 mb-4">
              {draftBom.map((item, index) => (
                <div
                  key={`${item.material_id || item.name || "material"}-${index}`}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm gap-3"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.name || "Linked Material"}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type || "Material"} · {item.color || "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-muted-foreground">
                      {Number(item.qty_per_unit ?? 0)} {item.unit || ""}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setErrorMessage("");
                        setDraftBom((current) =>
                          current.filter((bomItem) => bomItem.material_id !== item.material_id)
                        );
                      }}
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
                {availableMaterials.map((material) => (
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
              <Button
                size="sm"
                disabled={!selectedMaterialId || savingBom}
                onClick={() => {
                  if (Number(newQtyPerUnit) <= 0) {
                    setErrorMessage("Qty per unit must be greater than 0.");
                    return;
                  }

                  const materialId = Number(selectedMaterialId);
                  const material = (materials || []).find((m) => m.id === materialId);
                  if (!material) return;

                  setErrorMessage("");
                  setDraftBom((current) => [
                    ...current,
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
                }}
              >
                {savingBom ? "Saving..." : "Add BOM Line"}
              </Button>
            </div>
          </div>
        </section>
      </div>

      <div className="pt-4 border-t border-border mt-4 flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          disabled={isSubmitting}
          onClick={async () => {
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

            if (!form.department?.trim()) {
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
              const originalBom = (bom || []).map((item) => ({
                material_id: item.material_id,
                qty_per_unit: Number(item.qty_per_unit ?? 0),
              }));
              const nextBom = (draftBom || []).map((item) => ({
                material_id: item.material_id,
                qty_per_unit: Number(item.qty_per_unit ?? 0),
              }));

              const originalMap = new Map(originalBom.map((item) => [item.material_id, item.qty_per_unit]));
              const nextMap = new Map(nextBom.map((item) => [item.material_id, item.qty_per_unit]));

              for (const [materialId] of originalMap) {
                if (!nextMap.has(materialId)) {
                  await onRemoveBomLine(product.id, materialId);
                }
              }

              for (const [materialId, qtyPerUnit] of nextMap) {
                if (!originalMap.has(materialId) || originalMap.get(materialId) !== qtyPerUnit) {
                  await onSaveBomLine(product.id, materialId, qtyPerUnit);
                }
              }
              await onSave({
                ...form,
                name: trimmedName,
                sku: trimmedSku,
                sell_price: sellPrice,
              });
            } catch (error) {
              setErrorMessage(
                getErrorMessage(error, "Could not save product right now.")
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <Check className="mr-1.5 h-3.5 w-3.5" /> {isSubmitting ? "Saving..." : "Save Changes"}
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
      <p className="text-sm font-medium text-foreground">{value}</p>
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

export default function ProductDrawer({ product, bom, materials, departments, mode, onClose, onSave, onSaveBomLine, onRemoveBomLine, onCreateDepartment, onDeleteDepartment }) {
  const [panel, setPanel] = useState(mode || "view");

  React.useEffect(() => {
    setPanel(mode || "view");
  }, [mode]);

  if (!product) return null;

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
            {panel === "view" ? "Product Details" : "Edit Product"}
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
            <ViewPanel product={product} bom={bom} onEdit={() => setPanel("edit")} />
          ) : (
            <EditPanel
              product={product}
              bom={bom}
              materials={materials}
              departments={departments}
              onCreateDepartment={onCreateDepartment}
              onDeleteDepartment={onDeleteDepartment}
              onSaveBomLine={onSaveBomLine}
              onRemoveBomLine={onRemoveBomLine}
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