import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/shared/StatusBadge";

function ViewPanel({ product, bom, onEdit }) {
  const margin =
    product.price > 0
      ? (((product.price - product.unit_cost) / product.price) * 100).toFixed(1)
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
            <InfoRow label="UPC" value={product.upc || "—"} />
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
            <InfoRow label="Sell Price" value={`$${Number(product.price ?? 0).toFixed(2)}`} />
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
                      {item.material_name || item.name || "Linked Material"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.type || item.category || "Material"}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground shrink-0 ml-4">
                    {item.qty_per_unit ?? item.quantity ?? "—"} {item.unit || ""}
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

function EditPanel({ product, onSave, onCancel }) {
  const [form, setForm] = useState({ ...product });

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-base font-semibold text-foreground mb-6">Edit Product</h2>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <Field label="Item Name">
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="h-9 text-sm" />
        </Field>

        <Field label="Department">
          <Input
            value={form.department || ""}
            onChange={(e) => set("department", e.target.value)}
            className="h-9 text-sm"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU">
            <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} className="h-9 text-sm" />
          </Field>
          <Field label="UPC">
            <Input
              value={form.upc || ""}
              onChange={(e) => set("upc", e.target.value)}
              className="h-9 text-sm"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Unit Cost ($)">
            <Input
              type="number"
              value={form.unit_cost ?? 0}
              onChange={(e) => set("unit_cost", parseFloat(e.target.value) || 0)}
              className="h-9 text-sm"
            />
          </Field>
          <Field label="Sell Price ($)">
            <Input
              type="number"
              value={form.price ?? 0}
              onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
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
          <Check className="mr-1.5 h-3.5 w-3.5" /> Save Changes
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

export default function ProductDrawer({ product, bom, mode, onClose, onSave }) {
  const [panel, setPanel] = useState(mode || "view");

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
              onSave={(updated) => {
                onSave(updated);
                onClose();
              }}
              onCancel={() => setPanel("view")}
            />
          )}
        </div>
      </div>
    </>,
    document.body
  );
}