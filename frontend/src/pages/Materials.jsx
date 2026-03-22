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
import MaterialDrawer from "@/components/materials/MaterialDrawer";
import AddMaterialModal from "@/components/materials/AddMaterialModal";
import { getMaterials, createMaterial } from "@/services/inventoryService";

function normalizeMaterial(material) {
  return {
    ...material,
    type: material.type || (material.category === "FILAMENT" ? "Filament" : material.category || "Other"),
    supplier: material.supplier || "—",
    reorder_point: typeof material.reorder_point === "number" ? material.reorder_point : 0,
    is_listed: material.is_listed ?? true,
    quantity_on_hand: Number(material.quantity_on_hand ?? 0),
    cost_per_unit: Number(material.cost_per_unit ?? material.unit_cost ?? 0),
    unit_cost: Number(material.cost_per_unit ?? material.unit_cost ?? 0),
  };
}

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);

  // Drawer state
  const [drawer, setDrawer] = useState(null); // { material, mode }

  useEffect(() => {
    getMaterials().then((items) => setMaterials((items || []).map(normalizeMaterial)));
  }, []);

  const types = useMemo(
    () => [...new Set(materials.map((m) => m.type))].sort(),
    [materials]
  );

  const filtered = useMemo(() => {
    let result = [...materials];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q) ||
          m.color.toLowerCase().includes(q) ||
          m.supplier.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") result = result.filter((m) => m.type === typeFilter);
    return result;
  }, [materials, search, typeFilter]);

  function handleAdd(newMaterial) {
    setMaterials((prev) => [...prev, newMaterial]);
  }

  function handleSave(updated) {
    setMaterials((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  function handleDelete(id) {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }

  const columns = [
    { key: "name", label: "Material Name" },
    { key: "type", label: "Type" },
    { key: "color", label: "Color" },
    {
      key: "quantity_on_hand",
      label: "On Hand",
      render: (row) => {
        const isLow = row.quantity_on_hand <= row.reorder_point;
        return (
          <span className={isLow ? "font-medium text-destructive" : ""}>
            {row.quantity_on_hand} {row.unit}
          </span>
        );
      },
    },
    { key: "unit_cost", label: "Unit Cost", render: (row) => `$${row.unit_cost.toFixed(2)}` },
    { key: "supplier", label: "Supplier" },
    {
      key: "reorder_point",
      label: "Reorder Pt",
      render: (row) => `${row.reorder_point} ${row.unit}`,
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
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Material
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, type, color, supplier..." />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || typeFilter !== "all") && (
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setTypeFilter("all"); }}>
            <X className="mr-1.5 h-3.5 w-3.5" /> Reset Filters
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={filtered} />

      {showAddModal && (
        <AddMaterialModal
          onClose={() => setShowAddModal(false)}
          onCreate={async (payload) => {
            await createMaterial(payload);
            const refreshed = await getMaterials();
            setMaterials((refreshed || []).map(normalizeMaterial));
          }}
        />
      )}

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
      onClick={(e) => { e.stopPropagation(); onClick(); }}
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