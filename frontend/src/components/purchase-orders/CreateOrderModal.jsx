import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const defaultForm = {
  po_number: "",
  supplier: "",
  status: "Draft",
  ordered_date: "",
  received_date: "",
};

function Field({ label, children }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function CreateOrderModal({ materials, onClose, onAdd }) {
  const [form, setForm] = useState(defaultForm);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantityOrdered, setQuantityOrdered] = useState(0);
  const [unitCost, setUnitCost] = useState(0);
  const [lineItems, setLineItems] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  function addLineItem() {
    setErrorMessage("");
    if (!selectedMaterialId) {
      setErrorMessage("Please select a material before adding a line item.");
      return;
    }
    if (Number(quantityOrdered) <= 0) {
      setErrorMessage("Quantity ordered must be greater than 0.");
      return;
    }
    if (Number(unitCost) < 0) {
      setErrorMessage("Unit cost cannot be negative.");
      return;
    }

    const materialId = Number(selectedMaterialId);
    const material = (materials || []).find((m) => m.id === materialId);
    if (!material) {
      setErrorMessage("That material could not be found.");
      return;
    }

    const exists = lineItems.some((item) => item.material_id === materialId);
    if (exists) {
      setErrorMessage("That material is already on this purchase order.");
      return;
    }

    setLineItems((prev) => [
      ...prev,
      {
        material_id: material.id,
        name: material.name,
        type: material.type,
        color: material.color,
        unit: material.unit,
        quantity_ordered: Number(quantityOrdered || 0),
        unit_cost: Number(unitCost || 0),
      },
    ]);

    setSelectedMaterialId("");
    setQuantityOrdered(0);
    setUnitCost(0);
  }

  function removeLineItem(materialId) {
    setLineItems((prev) => prev.filter((item) => item.material_id !== materialId));
  }

  async function handleSubmit() {
    setErrorMessage("");
    const trimmedPoNumber = form.po_number.trim();
    const trimmedSupplier = form.supplier.trim();

    if (form.status !== "Draft" && !trimmedPoNumber) {
      setErrorMessage("PO number is required unless the order is still in Draft.");
      return;
    }
    if (form.status !== "Draft" && !trimmedSupplier) {
      setErrorMessage("Supplier is required unless the order is still in Draft.");
      return;
    }
    if ((form.status === "Ordered" || form.status === "Received") && !form.ordered_date) {
      setErrorMessage("Ordered date is required once the purchase order is Ordered or Received.");
      return;
    }
    if (form.status === "Received" && !form.received_date) {
      setErrorMessage("Received date is required once the purchase order is Received.");
      return;
    }
    if (form.ordered_date && form.received_date && form.received_date < form.ordered_date) {
      setErrorMessage("Received date cannot be earlier than ordered date.");
      return;
    }

    try {
      await onAdd({
        ...form,
        po_number: trimmedPoNumber || null,
        supplier: trimmedSupplier || null,
        ordered_date: form.ordered_date || null,
        received_date: form.received_date || null,
        line_items: lineItems.map((item) => ({
          material_id: item.material_id,
          quantity_ordered: Number(item.quantity_ordered || 0),
          unit_cost: Number(item.unit_cost || 0),
        })),
      });
      onClose();
    } catch (error) {
      const detail = error?.response?.data?.detail ?? error?.detail;

      if (typeof detail === "string" && detail.trim()) {
        setErrorMessage(detail);
        return;
      }

      if (detail && typeof detail === "object" && typeof detail.message === "string") {
        setErrorMessage(detail.message);
        return;
      }

      if (error instanceof Error && error.message?.trim()) {
        setErrorMessage(error.message);
        return;
      }

      setErrorMessage("Could not create purchase order right now.");
    }
  }

  return createPortal(
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 40, backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />
      <div
        style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 50, width: "26rem", maxHeight: "90vh" }}
        className="flex flex-col bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-sm font-semibold text-foreground">Create Purchase Order</span>
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
          <Field label="PO Number *">
            <Input value={form.po_number} onChange={(e) => set("po_number", e.target.value)} className="h-9 text-sm" placeholder="e.g. PO-1001" />
          </Field>
          <Field label="Supplier *">
            <Input value={form.supplier} onChange={(e) => set("supplier", e.target.value)} className="h-9 text-sm" placeholder="e.g. eSUN Direct" />
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v)}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Ordered">Ordered</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ordered Date">
              <Input type="date" value={form.ordered_date} onChange={(e) => set("ordered_date", e.target.value)} className="h-9 text-sm" />
            </Field>
            <Field label="Received Date">
              <Input type="date" value={form.received_date} onChange={(e) => set("received_date", e.target.value)} className="h-9 text-sm" />
            </Field>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Line Items (Optional)
            </p>

            {lineItems.length > 0 ? (
              <div className="space-y-2 mb-4">
                {lineItems.map((item) => (
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
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-muted-foreground">
                        {item.quantity_ordered} {item.unit || ""} @ ${item.unit_cost.toFixed(4)}
                      </span>
                      <Button size="sm" variant="outline" type="button" onClick={() => removeLineItem(item.material_id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">No line items added yet.</p>
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
                    .filter((material) => !lineItems.some((item) => item.material_id === material.id))
                    .map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.name} · {material.type || "—"} · {material.color || "—"}
                      </option>
                    ))}
                </select>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Quantity Ordered">
                  <Input
                    type="number"
                    value={quantityOrdered}
                    onChange={(e) => setQuantityOrdered(parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm"
                  />
                </Field>
                <Field label="Unit Cost ($)">
                  <Input
                    type="number"
                    value={unitCost}
                    onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
                    className="h-9 text-sm"
                  />
                </Field>
              </div>

              <div>
                <Button size="sm" type="button" disabled={!selectedMaterialId} onClick={addLineItem}>
                  Add Line Item
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={handleSubmit}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" /> Create Order
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>,
    document.body
  );
}