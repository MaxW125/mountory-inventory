import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Layers,
  AlertTriangle,
  ClipboardList,
  DollarSign,
  Plus,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  getListedProductCount,
  getMaterialCount,
  getLowStockMaterials,
  getOpenOrderCount,
  getTotalInventoryValue,
  getRecentActivity,
} from "@/services/inventoryService";

function formatActivityTime(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) return "Just now";
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    listedProducts: 0,
    totalMaterials: 0,
    lowStockCount: 0,
    openOrders: 0,
    inventoryValue: 0,
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [activity, setActivity] = useState([]);
  const [, setNowTick] = useState(Date.now());

  useEffect(() => {
    async function load() {
      const [listed, matCount, lowStock, openOrd, invValue, recent] =
        await Promise.all([
          getListedProductCount(),
          getMaterialCount(),
          getLowStockMaterials(),
          getOpenOrderCount(),
          getTotalInventoryValue(),
          getRecentActivity(),
        ]);
      setStats({
        listedProducts: listed,
        totalMaterials: matCount,
        lowStockCount: lowStock.length,
        openOrders: openOrd,
        inventoryValue: invValue,
      });
      setLowStockItems(lowStock);
      setActivity(recent);
    }
    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle="Mountory Inventory overview" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Listed Products" value={stats.listedProducts} icon={Package} iconBg="bg-blue-500/15" iconColor="text-blue-400" />
        <StatCard label="Total Materials" value={stats.totalMaterials} icon={Layers} iconBg="bg-violet-500/15" iconColor="text-violet-400" />
        <StatCard label="Low Stock" value={stats.lowStockCount} icon={AlertTriangle} iconBg="bg-red-500/15" iconColor="text-red-400" />
        <StatCard label="Open Orders" value={stats.openOrders} icon={ClipboardList} iconBg="bg-amber-500/15" iconColor="text-amber-400" />
        <StatCard label="Inventory Value" value={stats.inventoryValue} icon={DollarSign} format="currency" iconBg="bg-green-500/15" iconColor="text-green-400" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            <ul className="divide-y divide-border">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3.5 min-h-[72px]">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary/40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {a.action === "Low stock alert" ? "Current" : formatActivityTime(a.timestamp)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Low Stock Alerts</h2>
            <StatusBadge variant="low">{lowStockItems.length} items</StatusBadge>
          </div>
          {lowStockItems.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              All materials above reorder point
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {lowStockItems.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.quantity_on_hand} / {m.reorder_point} {m.unit}
                    </p>
                  </div>
                  <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="sm">
            <Link to="/products"><Plus className="mr-1.5 h-3.5 w-3.5" /> Add New Listing</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/materials"><Plus className="mr-1.5 h-3.5 w-3.5" /> Add New Material</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/purchase-orders"><ClipboardList className="mr-1.5 h-3.5 w-3.5" /> Create Purchase Order</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/insights"><BarChart3 className="mr-1.5 h-3.5 w-3.5" /> View Insights</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}