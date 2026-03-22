import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DEPARTMENTS = [
  "Home & Organization",
  "Home & Garden",
  "Office & Desk",
  "Gifts & Custom",
  "3D Printing Accessories",
  "Tech Accessories",
];

const defaultForm = {
  name: "",
  department: "",
  sku: "",
  upc: "",
  unit_cost: "",
  price: "",
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

export default function AddProductModal({ onClose, onAdd }) {
  const [form, setForm] = useState(defaultForm);
  const [departments, setDepartments] = useState(DEPARTMENTS);
  const [addingDept, setAddingDept] = useState(false);
  const [managingDepts, setManagingDepts] = useState(false);
  const [newDept, setNewDept] = useState("");
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  function confirmNewDept() {
    const trimmed = newDept.trim();
    if (trimmed && !departments.includes(trimmed)) {
      setDepartments((prev) => [...prev, trimmed]);
      set("department", trimmed);
    }
    setNewDept("");
    setAddingDept(false);
  }

  function removeDept(dept) {
    setDepartments((prev) => prev.filter((d) => d !== dept));
    if (form.department === dept) set("department", "");
  }

  function handleSubmit() {
    if (!form.name.trim()) return;
    onAdd({
      ...form,
      id: Date.now(),
      unit_cost: parseFloat(form.unit_cost) || 0,
      price: parseFloat(form.price) || 0,
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
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
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
                {departments.map((d) => (
                  <div key={d} className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted text-sm">
                    <span className="text-foreground">{d}</span>
                    <button onClick={() => removeDept(d)} className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="w-full h-7 mt-1 text-xs" onClick={() => setManagingDepts(false)}>Done</Button>
              </div>
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="SKU">
              <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} className="h-9 text-sm" placeholder="MNT-XXXX-000" />
            </Field>
            <Field label="UPC">
              <Input value={form.upc} onChange={(e) => set("upc", e.target.value)} className="h-9 text-sm" placeholder="860012345000" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit Cost ($)">
              <Input type="number" min="0" step="0.01" value={form.unit_cost} onChange={(e) => set("unit_cost", e.target.value)} className="h-9 text-sm" placeholder="0.00" />
            </Field>
            <Field label="Sell Price ($)">
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className="h-9 text-sm" placeholder="0.00" />
            </Field>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Switch checked={form.is_listed} onCheckedChange={(v) => set("is_listed", v)} />
            <Label className="text-sm text-foreground">Listed</Label>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-2">
          <Button size="sm" className="flex-1" onClick={handleSubmit} disabled={!form.name.trim()}>
            <Check className="mr-1.5 h-3.5 w-3.5" /> Add Product
          </Button>
          <Button size="sm" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </>,
    document.body
  );
}