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
import ProductDrawer from "@/components/products/ProductDrawer";
import AddProductModal from "@/components/products/AddProductModal";
import { getProducts } from "@/services/inventoryService";


const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A→Z" },
  { value: "name_desc", label: "Name Z→A" },
  { value: "price_asc", label: "Price Low→High" },
  { value: "price_desc", label: "Price High→Low" },
  { value: "listed_first", label: "Listed First" },
  { value: "unlisted_first", label: "Unlisted First" },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [sort, setSort] = useState("name_asc");

  const [showAddModal, setShowAddModal] = useState(false);

  // Drawer state
  const [drawer, setDrawer] = useState(null); // { product, mode: 'view' | 'edit' }

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const departments = useMemo(
    () => [...new Set(products.map((p) => p.department))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.upc.includes(q)
      );
    }
    if (department !== "all") result = result.filter((p) => p.department === department);
    switch (sort) {
      case "name_asc":    result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name_desc":   result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "price_asc":   result.sort((a, b) => a.price - b.price); break;
      case "price_desc":  result.sort((a, b) => b.price - a.price); break;
      case "listed_first":    result.sort((a, b) => Number(b.is_listed) - Number(a.is_listed)); break;
      case "unlisted_first":  result.sort((a, b) => Number(a.is_listed) - Number(b.is_listed)); break;
    }
    return result;
  }, [products, search, department, sort]);

  function handleAdd(newProduct) {
    setProducts((prev) => [...prev, newProduct]);
  }

  function handleSave(updated) {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  function handleDelete(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  const columns = [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Item Name" },
    { key: "department", label: "Department" },
    { key: "unit_cost", label: "Unit Cost", render: (row) => `$${row.unit_cost.toFixed(2)}` },
    { key: "price", label: "Sell Price", render: (row) => `$${row.price.toFixed(2)}` },
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
            onClick={() => setDrawer({ product: row, mode: "view" })}
          />
          <ActionBtn
            icon={Pencil}
            title="Edit product"
            onClick={() => setDrawer({ product: row, mode: "edit" })}
          />
          <ActionBtn
            icon={Trash2}
            title="Delete product"
            danger
            onClick={() => handleDelete(row.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Products" subtitle={`${products.length} total products`}>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Product
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, SKU, or UPC..." />
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-48 h-9 text-sm">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || department !== "all" || sort !== "name_asc") && (
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setDepartment("all"); setSort("name_asc"); }}>
            <X className="mr-1.5 h-3.5 w-3.5" /> Reset Filters
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={filtered} />

      {showAddModal && (
        <AddProductModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />
      )}

      {drawer && (
        <ProductDrawer
          product={drawer.product}
          bom={drawer.product.materials_input || []}
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