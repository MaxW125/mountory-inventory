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
  supplier: "",
  status: "Draft",
  expected: "",
  items: "",
  total: "",
};

function Field({ label, children }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export default function CreateOrderModal({ onClose, onAdd }) {
  const [form, setForm] = useState(defaultForm);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  function handleSubmit() {
    if (!form.supplier.trim()) return;
    const now = new Date();
    const created = now.toISOString().split("T")[0];
    const year = now.getFullYear();
    onAdd({
      ...form,
      id: `PO-${year}-${String(Date.now()).slice(-3)}`,
      created,
      items: parseInt(form.items) || 0,
      total: parseFloat(form.total) || 0,
    });
    onClose();
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
                <SelectItem value="Shipped">Shipped</SelectItem>
                <SelectItem value="Received">Received</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Expected Delivery">
            <Input type="date" value={form.expected} onChange={(e) => set("expected", e.target.value)} className="h-9 text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Number of Items">
              <Input type="number" min="0" value={form.items} onChange={(e) => set("items", e.target.value)} className="h-9 text-sm" placeholder="0" />
            </Field>
            <Field label="Total Cost ($)">
              <Input type="number" min="0" step="0.01" value={form.total} onChange={(e) => set("total", e.target.value)} className="h-9 text-sm" placeholder="0.00" />
            </Field>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-2">
          <Button size="sm" className="flex-1" onClick={handleSubmit} disabled={!form.supplier.trim()}>
            <Check className="mr-1.5 h-3.5 w-3.5" /> Create Order
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>,
    document.body
  );
}