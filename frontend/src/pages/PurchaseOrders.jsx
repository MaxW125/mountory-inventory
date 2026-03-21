import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import { getPurchaseOrders } from "@/services/inventoryService";

const statusMap = {
  Received: "received",
  Shipped: "shipped",
  Ordered: "ordered",
  Draft: "draft",
};

const columns = [
  { key: "id", label: "PO ID" },
  { key: "supplier", label: "Supplier" },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <StatusBadge variant={statusMap[row.status] || "draft"}>
        {row.status || "Draft"}
      </StatusBadge>
    ),
  },
  { key: "created", label: "Created" },
  {
    key: "expected",
    label: "Expected",
    render: (row) => row.expected || "—",
  },
  {
    key: "items",
    label: "Items",
    render: (row) => row.items ?? row.item_count ?? "—",
  },
  {
    key: "total",
    label: "Total Cost",
    render: (row) => `$${Number(row.total ?? 0).toFixed(2)}`,
  },
];

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getPurchaseOrders().then((data) => setOrders(data || []));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        subtitle={`${orders.length} total orders`}
      >
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Order
        </Button>
      </PageHeader>

      {orders.length > 0 ? (
        <DataTable columns={columns} data={orders} />
      ) : (
        <Card className="p-10 text-center">
          <p className="text-sm font-medium text-foreground">No purchase orders yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Purchase order tracking has not been connected to the backend yet.
          </p>
        </Card>
      )}
    </div>
  );
}