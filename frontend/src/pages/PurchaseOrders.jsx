import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import CreateOrderModal from "@/components/purchase-orders/CreateOrderModal";
import { getPurchaseOrders } from "@/services/inventoryService";

const STATUS_OPTIONS = ["Draft", "Ordered", "Shipped", "Received"];

const statusMap = {
  Received: "received",
  Shipped: "shipped",
  Ordered: "ordered",
  Draft: "draft",
};

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    getPurchaseOrders().then(setOrders);
  }, []);

  function handleDelete(id) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  function handleStatusChange(id, newStatus) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: newStatus } : o));
  }

  const columns = [
    { key: "id", label: "PO ID" },
    { key: "supplier", label: "Supplier" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <Select value={row.status} onValueChange={(v) => handleStatusChange(row.id, v)}>
          <SelectTrigger className="h-7 text-xs w-28 border-0 bg-transparent p-0 focus:ring-0 shadow-none">
            <StatusBadge variant={statusMap[row.status] || "draft"}>{row.status}</StatusBadge>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                <StatusBadge variant={statusMap[s] || "draft"}>{s}</StatusBadge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    { key: "created", label: "Created" },
    { key: "expected", label: "Expected", render: (row) => row.expected || "—" },
    { key: "items", label: "Items" },
    { key: "total", label: "Total Cost", render: (row) => `$${row.total.toFixed(2)}` },
    {
      key: "actions",
      label: "",
      width: "50px",
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
          className="rounded p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete order"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Orders" subtitle={`${orders.length} total orders`}>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Order
        </Button>
      </PageHeader>

      <DataTable columns={columns} data={orders} />

      {showCreateModal && (
        <CreateOrderModal
          onClose={() => setShowCreateModal(false)}
          onAdd={(order) => setOrders((prev) => [...prev, order])}
        />
      )}
    </div>
  );
}