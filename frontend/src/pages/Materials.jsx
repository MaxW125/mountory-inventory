import React, { useState, useEffect, useMemo } from "react";
import { Plus, Eye, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/layout/PageHeader";
import SearchInput from "@/components/shared/SearchInput";
import DataTable from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import MaterialDrawer from "@/components/materials/MaterialDrawer";
import { getMaterials } from "@/services/inventoryService";

function normalizeMaterial(material) {
  const derivedType =
    material.type ||
    (material.category === "FILAMENT" ? "Filament" : material.category || "Other");

  return {
    ...material,
    type: derivedType,
    supplier: material.supplier ?? "—",
    reorder_point:
      typeof material.reorder_point === "number" ? material.reorder_point : null,
    is_listed: material.is_listed ?? true,
    quantity_on_hand: Number(material.quantity_on_hand ?? 0),
    cost_per_unit: Number(material.cost_per_unit ?? material.unit_cost ?? 0),
  };
}

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [drawer, setDrawer] = useState(null);

  useEffect(() => {
    getMaterials().then((data) => {
      setMaterials((data || []).map(normalizeMaterial));
    });
  }, []);

  const types = useMemo(
    () => [...new Set(materials.map((material) => material.type).filter(Boolean))].sort(),
    [materials]
  );

  const filtered = useMemo(() => {
    let result = [...materials];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((material) => {
        const nameMatch = (material.name || "").toLowerCase().includes(q);
        const typeMatch = (material.type || "").toLowerCase().includes(q);
        const colorMatch = (material.color || "").toLowerCase().includes(q);
        const supplierMatch = (material.supplier || "").toLowerCase().includes(q);
        return nameMatch || typeMatch || colorMatch || supplierMatch;
      });
    }

    if (typeFilter !== "all") {
      result = result.filter((material) => material.type === typeFilter);
    }

    return result;
  }, [materials, search, typeFilter]);

  function handleSave(updated) {
    const normalized = normalizeMaterial(updated);
    setMaterials((prev) =>
      prev.map((material) => (material.id === normalized.id ? normalized : material))
    );
  }

  function handleDelete(id) {
    setMaterials((prev) => prev.filter((material) => material.id !== id));
  }

  const columns = [
    { key: "name", label: "Material Name" },
    { key: "type", label: "Type" },
    { key: "color", label: "Color" },
    {
      key: "quantity_on_hand",
      label: "On Hand",
      render: (row) => {
        const isLow =
          typeof row.reorder_point === "number" &&
          row.quantity_on_hand <= row.reorder_point;

        return (
          <span className={isLow ? "font-medium text-destructive" : ""}>
            {row.quantity_on_hand} {row.unit}
          </span>
        );
      },
    },
    {
      key: "cost_per_unit",
      label: "Unit Cost",
      render: (row) => `$${Number(row.cost_per_unit ?? 0).toFixed(2)}`,
    },
    {
      key: "supplier",
      label: "Supplier",
      render: (row) => row.supplier || "—",
    },
    {
      key: "reorder_point",
      label: "Reorder Pt",
      render: (row) =>
        typeof row.reorder_point === "number" ? `${row.reorder_point} ${row.unit}` : "—",
    },
    {
      key: "is_listed",
      label: "Status",
      render: (row) =>
        row.is_listed ? (
          <StatusBadge variant="listed">Listed</StatusBadge>
        ) : (
          <StatusBadge variant="unlisted">Not Listed</StatusBadge>
        ),
    },
    {
      key: "actions",
      label: "",
      width: "100px",
      render: (row) => (
        <div className="flex items-center gap-1">
          <ActionBtn
            icon={Eye}
            title="View details"
            onClick={() => setDrawer({ material: row, mode: "view" })}
          />
          <ActionBtn
            icon={Pencil}
            title="Edit material"
            onClick={() => setDrawer({ material: row, mode: "edit" })}
          />
          <ActionBtn
            icon={Trash2}
            title="Delete material"
            danger
            onClick={() => handleDelete(row.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Materials" subtitle={`${materials.length} total materials`}>
        <Button size="sm">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Material
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, type, color, supplier..."
        />

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(search || typeFilter !== "all") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
            }}
          >
            <X className="mr-1.5 h-3.5 w-3.5" /> Reset Filters
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={filtered} />

      {drawer && (
        <MaterialDrawer
          material={drawer.material}
          mode={drawer.mode}
          onClose={() => setDrawer(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, title, onClick, danger }) {
  return (
    <button
      title={title}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`rounded p-1.5 transition-colors ${
        danger
          ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}