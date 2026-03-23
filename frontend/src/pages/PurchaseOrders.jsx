import React, { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, Eye, X, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import CreateOrderModal from "@/components/purchase-orders/CreateOrderModal";
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getPurchaseOrderItems,
  savePurchaseOrderItem,
  removePurchaseOrderItem,
  getMaterials,
} from "@/services/inventoryService";

const STATUS_OPTIONS = ["Draft", "Ordered", "Received", "Cancelled"];

const statusMap = {
  Received: "received",
  Ordered: "ordered",
  Draft: "draft",
  Cancelled: "destructive",
};

function normalizePurchaseOrder(order) {
  return {
    ...order,
    total_cost: Number(order.total_cost ?? 0),
    ordered_date: order.ordered_date || null,
    received_date: order.received_date || null,
  };
}

function normalizePurchaseOrderItem(item) {
  return {
    ...item,
    quantity_ordered: Number(item.quantity_ordered ?? 0),
    unit_cost: Number(item.unit_cost ?? 0),
  };
}

function Field({ label, children }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function PurchaseOrderDrawer({ order, items, materials, mode, onClose, onEdit, onSaveOrder, onSaveItem, onRemoveItem }) {
  const [form, setForm] = useState({
    po_number: order.po_number || "",
    supplier: order.supplier || "",
    status: order.status || "Draft",
    ordered_date: order.ordered_date || "",
    received_date: order.received_date || "",
  });
  const [draftItems, setDraftItems] = useState((items || []).map((item) => ({ ...item })));
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [quantityOrdered, setQuantityOrdered] = useState(0);
  const [unitCost, setUnitCost] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const availableMaterials = useMemo(() => {
    const usedIds = new Set((draftItems || []).map((item) => item.material_id));
    return (materials || []).filter((material) => !usedIds.has(material.id));
  }, [draftItems, materials]);

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

  const isEditMode = mode === "edit";

  return (
    <>
      <div
        style={{ position: "fixed", inset: 0, zIndex: 40, backgroundColor: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />
      <div
        style={{ position: "fixed", top: 0, right: 0, height: "100vh", width: "36rem", maxWidth: "100vw", zIndex: 50 }}
        className="bg-card border-l border-border shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">{isEditMode ? "Edit Purchase Order" : "Purchase Order Details"}</h2>
            <p className="text-sm text-muted-foreground">{isEditMode ? "Update order details and line items" : `${order.po_number} · ${order.supplier}`}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {errorMessage && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          <section className="grid grid-cols-2 gap-3">
            <Field label="PO Number">
              <Input
                value={isEditMode ? form.po_number : (form.po_number || "—")}
                readOnly={!isEditMode}
                onChange={(e) => set("po_number", e.target.value)}
                className={`h-9 text-sm ${!isEditMode ? "bg-muted/50" : ""}`}
              />
            </Field>
            <Field label="Supplier">
              <Input
                value={isEditMode ? form.supplier : (form.supplier || "—")}
                readOnly={!isEditMode}
                onChange={(e) => set("supplier", e.target.value)}
                className={`h-9 text-sm ${!isEditMode ? "bg-muted/50" : ""}`}
              />
            </Field>
            <Field label="Status">
              {isEditMode ? (
                <Select value={form.status} onValueChange={(value) => set("status", value)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 flex items-center">
                  {form.status === "Cancelled" ? (
                    <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
                      {form.status}
                    </span>
                  ) : (
                    <StatusBadge variant={statusMap[form.status] || "draft"}>{form.status}</StatusBadge>
                  )}
                </div>
              )}
            </Field>
            <div />
            <Field label="Ordered Date">
              <Input
                type={isEditMode ? "date" : "text"}
                value={form.ordered_date || (isEditMode ? "" : "—")}
                readOnly={!isEditMode}
                onChange={(e) => set("ordered_date", e.target.value)}
                className={`h-9 text-sm ${!isEditMode ? "bg-muted/50" : ""}`}
              />
            </Field>
            <Field label="Received Date">
              <Input
                type={isEditMode ? "date" : "text"}
                value={form.received_date || (isEditMode ? "" : "—")}
                readOnly={!isEditMode}
                onChange={(e) => set("received_date", e.target.value)}
                className={`h-9 text-sm ${!isEditMode ? "bg-muted/50" : ""}`}
              />
            </Field>
          </section>

          {isEditMode ? (
            <div className="pt-4 border-t border-border flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                disabled={isSavingOrder}
                onClick={async () => {
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
                    setErrorMessage("");
                    setIsSavingOrder(true);
                    const originalItems = (items || []).map((item) => ({
                      material_id: item.material_id,
                      quantity_ordered: Number(item.quantity_ordered ?? 0),
                      unit_cost: Number(item.unit_cost ?? 0),
                    }));
                    const nextItems = (draftItems || []).map((item) => ({
                      material_id: item.material_id,
                      quantity_ordered: Number(item.quantity_ordered ?? 0),
                      unit_cost: Number(item.unit_cost ?? 0),
                    }));

                    const originalMap = new Map(originalItems.map((item) => [item.material_id, item]));
                    const nextMap = new Map(nextItems.map((item) => [item.material_id, item]));

                    for (const [materialId] of originalMap) {
                      if (!nextMap.has(materialId)) {
                        await onRemoveItem(order.id, materialId);
                      }
                    }

                    for (const [materialId, nextItem] of nextMap) {
                      const originalItem = originalMap.get(materialId);
                      if (
                        !originalItem ||
                        originalItem.quantity_ordered !== nextItem.quantity_ordered ||
                        originalItem.unit_cost !== nextItem.unit_cost
                      ) {
                        await onSaveItem(order.id, materialId, nextItem.quantity_ordered, nextItem.unit_cost);
                      }
                    }
                    await onSaveOrder(order.id, {
                      ...order,
                      po_number: trimmedPoNumber || null,
                      supplier: trimmedSupplier || null,
                      status: form.status,
                      ordered_date: form.ordered_date || null,
                      received_date:
                        order.status === "Received" && form.status === "Ordered"
                          ? null
                          : (form.received_date || null),
                    });
                    onClose();
                  } catch (error) {
                    setErrorMessage(
                      getErrorMessage(error, "Could not save purchase order right now.")
                    );
                  } finally {
                    setIsSavingOrder(false);
                  }
                }}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" /> {isSavingOrder ? "Saving..." : "Save Changes"}
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="pt-4 border-t border-border flex gap-2">
              <Button size="sm" className="flex-1" onClick={onEdit}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Purchase Order
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )}

          <section className="pt-4 border-t border-border">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Line Items
            </p>

            {draftItems.length > 0 ? (
              <div className="space-y-2 mb-4">
                {draftItems.map((item) => (
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
                      {isEditMode && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSubmitting}
                          onClick={() => {
                            setErrorMessage("");
                            setDraftItems((current) =>
                              current.filter((draftItem) => draftItem.material_id !== item.material_id)
                            );
                          }}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">No line items added yet.</p>
            )}
            {isEditMode && (
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
                  <Button
                    size="sm"
                    disabled={!selectedMaterialId || isSubmitting}
                    onClick={() => {
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
                      if (!material) return;

                      setErrorMessage("");
                      setDraftItems((current) => [
                        ...current,
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
                    }}
                  >
                    Add Line Item
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [drawer, setDrawer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function refreshOrders() {
    const refreshed = await getPurchaseOrders();
    const normalized = (refreshed || []).map(normalizePurchaseOrder);
    setOrders(normalized);
    return normalized;
  }

  useEffect(() => {
    async function loadData() {
      const [orderItems, materialItems] = await Promise.all([
        getPurchaseOrders(),
        getMaterials(),
      ]);

      setOrders((orderItems || []).map(normalizePurchaseOrder));
      setMaterials(materialItems || []);
    }

    loadData();
  }, []);

  async function openDrawer(order, mode = "view") {
    const items = await getPurchaseOrderItems(order.id);
    setDrawer({ order, items: (items || []).map(normalizePurchaseOrderItem), mode });
  }

  function handleDelete(id) {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    setDeleteTarget(order);
  }

  async function confirmDeletePurchaseOrder() {
    if (!deleteTarget) return;

    await deletePurchaseOrder(deleteTarget.id);
    await refreshOrders();

    if (drawer && drawer.order?.id === deleteTarget.id) {
      setDrawer(null);
    }

    setDeleteTarget(null);
  }

  async function handleSaveOrder(id, updatedOrder) {
    await updatePurchaseOrder(id, updatedOrder);

    const refreshedOrders = await refreshOrders();
    const refreshedOrder = refreshedOrders.find((o) => o.id === id);

    if (drawer && refreshedOrder) {
      const refreshedItems = await getPurchaseOrderItems(id);
      setDrawer({
        order: refreshedOrder,
        items: (refreshedItems || []).map(normalizePurchaseOrderItem),
      });
    }
  }

  async function handleSaveItem(poId, materialId, quantityOrdered, unitCost) {
    await savePurchaseOrderItem(poId, materialId, quantityOrdered, unitCost);

    const [refreshedOrders, refreshedItems] = await Promise.all([
      refreshOrders(),
      getPurchaseOrderItems(poId),
    ]);

    const refreshedOrder = refreshedOrders.find((o) => o.id === poId);

    if (refreshedOrder) {
      setDrawer({
        order: refreshedOrder,
        items: (refreshedItems || []).map(normalizePurchaseOrderItem),
      });
    }
  }

  async function handleRemoveItem(poId, materialId) {
    await removePurchaseOrderItem(poId, materialId);

    const [refreshedOrders, refreshedItems] = await Promise.all([
      refreshOrders(),
      getPurchaseOrderItems(poId),
    ]);

    const refreshedOrder = refreshedOrders.find((o) => o.id === poId);

    if (refreshedOrder) {
      setDrawer({
        order: refreshedOrder,
        items: (refreshedItems || []).map(normalizePurchaseOrderItem),
      });
    }
  }

  const columns = [
    { key: "po_number", label: "PO ID", render: (row) => row.po_number || "—" },
    { key: "supplier", label: "Supplier", render: (row) => row.supplier || "—" },
    {
      key: "status",
      label: "Status",
      render: (row) =>
        row.status === "Cancelled" ? (
          <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">
            {row.status}
          </span>
        ) : (
          <StatusBadge variant={statusMap[row.status] || "draft"}>{row.status}</StatusBadge>
        ),
    },
    { key: "ordered_date", label: "Ordered Date", render: (row) => row.ordered_date || "—" },
    { key: "received_date", label: "Received Date", render: (row) => row.received_date || "—" },
    { key: "total_cost", label: "Total Cost", render: (row) => `$${row.total_cost.toFixed(2)}` },
    {
      key: "actions",
      label: "",
      width: "80px",
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDrawer(row, "view");
            }}
            className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="View order details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openDrawer(row, "edit");
            }}
            className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Edit order"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete order"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Orders" subtitle={`${orders.length} total purchase orders`}>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Order
        </Button>
      </PageHeader>

      <DataTable columns={columns} data={orders} />

      {showCreateModal && (
        <CreateOrderModal
          materials={materials}
          onClose={() => setShowCreateModal(false)}
          onAdd={async (order) => {
            const created = await createPurchaseOrder(order);
            const poId = created?.id;

            if (poId && Array.isArray(order.line_items) && order.line_items.length > 0) {
              await Promise.all(
                order.line_items.map((item) =>
                  savePurchaseOrderItem(poId, item.material_id, item.quantity_ordered, item.unit_cost)
                )
              );
            }

            await refreshOrders();
          }}
        />
      )}

      {drawer && (
        <PurchaseOrderDrawer
          order={drawer.order}
          items={drawer.items || []}
          materials={materials}
          mode={drawer.mode || "view"}
          onClose={() => setDrawer(null)}
          onEdit={() => setDrawer((current) => current ? { ...current, mode: "edit" } : current)}
          onSaveOrder={handleSaveOrder}
          onSaveItem={handleSaveItem}
          onRemoveItem={handleRemoveItem}
        />
      )}
      {deleteTarget && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 40, backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setDeleteTarget(null)}
          />
          <div
            style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 50, width: "26rem", maxWidth: "calc(100vw - 2rem)" }}
            className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Delete Purchase Order</h2>
            </div>
            <div className="px-5 py-4 space-y-2">
              <p className="text-sm text-foreground">
                Are you sure you want to delete <span className="font-medium">{deleteTarget.po_number || "—"}</span>?
              </p>
              <p className="text-sm text-muted-foreground">
                This will also remove any linked line items for this purchase order.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-border flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={confirmDeletePurchaseOrder}>
                Delete Purchase Order
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}