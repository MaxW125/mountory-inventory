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
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductMaterials,
  getMaterials,
  saveProductMaterial,
  removeProductMaterial,
  getProductDepartments,
  createProductDepartment,
  deleteProductDepartment,
} from "@/services/inventoryService";


const SORT_OPTIONS = [
  { value: "name_asc", label: "Name A→Z" },
  { value: "name_desc", label: "Name Z→A" },
  { value: "price_asc", label: "Price Low→High" },
  { value: "price_desc", label: "Price High→Low" },
];

function normalizeProduct(product) {
  return {
    ...product,
    department: product.department || "—",
    unit_cost: Number(product.unit_cost ?? 0),
    sell_price: Number(product.sell_price ?? 0),
  };
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("name_asc");

  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Drawer state
  const [drawer, setDrawer] = useState(null); // { product, mode: 'view' | 'edit' }

  useEffect(() => {
    async function loadData() {
      const [productItems, materialItems, departmentItems] = await Promise.all([
        getProducts(),
        getMaterials(),
        getProductDepartments(),
      ]);

      setProducts((productItems || []).map(normalizeProduct));
      setMaterials(materialItems || []);
      setDepartmentOptions(departmentItems || []);
    }

    loadData();
  }, []);

  const departments = useMemo(
    () => (departmentOptions || []).map((d) => d.name).sort(),
    [departmentOptions]
  );

  const filtered = useMemo(() => {
    let result = [...products];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q)
      );
    }
    if (department !== "all") result = result.filter((p) => p.department === department);
    if (statusFilter === "listed") result = result.filter((p) => p.is_listed);
    if (statusFilter === "unlisted") result = result.filter((p) => !p.is_listed);
    switch (sort) {
      case "name_asc":    result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name_desc":   result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "price_asc":   result.sort((a, b) => a.sell_price - b.sell_price); break;
      case "price_desc":  result.sort((a, b) => b.sell_price - a.sell_price); break;
    }
    return result;
  }, [products, search, department, statusFilter, sort]);

  async function handleAdd(newProduct) {
    const created = await createProduct(newProduct);
    const productId = created?.id;

    if (productId && Array.isArray(newProduct.materials_used) && newProduct.materials_used.length > 0) {
      await Promise.all(
        newProduct.materials_used.map((item) =>
          saveProductMaterial(productId, item.material_id, item.qty_per_unit)
        )
      );
    }

    const refreshed = await getProducts();
    setProducts((refreshed || []).map(normalizeProduct));
  }

  async function handleSave(updated) {
    await updateProduct(updated.id, updated);
    const refreshed = await getProducts();
    setProducts((refreshed || []).map(normalizeProduct));
  }

  async function refreshProducts() {
    const refreshed = await getProducts();
    setProducts((refreshed || []).map(normalizeProduct));
    return refreshed || [];
  }

  async function refreshDepartments() {
    const refreshed = await getProductDepartments();
    setDepartmentOptions(refreshed || []);
    return refreshed || [];
  }

  async function handleCreateDepartment(name) {
    await createProductDepartment(name);
    await refreshDepartments();
  }

  async function handleDeleteDepartment(departmentId) {
    await deleteProductDepartment(departmentId);
    await refreshDepartments();
  }

  async function handleSaveBomLine(productId, materialId, qtyPerUnit) {
    await saveProductMaterial(productId, materialId, qtyPerUnit);

    const [refreshedProducts, refreshedBom] = await Promise.all([
      refreshProducts(),
      getProductMaterials(productId),
    ]);

    const refreshedProduct = (refreshedProducts || [])
      .map(normalizeProduct)
      .find((p) => p.id === productId);

    if (refreshedProduct) {
      setDrawer((current) =>
        current
          ? { ...current, product: refreshedProduct, bom: refreshedBom || [] }
          : current
      );
    }
  }

  async function handleRemoveBomLine(productId, materialId) {
    await removeProductMaterial(productId, materialId);

    const [refreshedProducts, refreshedBom] = await Promise.all([
      refreshProducts(),
      getProductMaterials(productId),
    ]);

    const refreshedProduct = (refreshedProducts || [])
      .map(normalizeProduct)
      .find((p) => p.id === productId);

    if (refreshedProduct) {
      setDrawer((current) =>
        current
          ? { ...current, product: refreshedProduct, bom: refreshedBom || [] }
          : current
      );
    }
  }

  async function openDrawer(product, mode) {
    const bom = await getProductMaterials(product.id);
    setDrawer({ product, mode, bom: bom || [] });
  }

  function handleDelete(id) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setDeleteTarget(product);
  }

  async function confirmDeleteProduct() {
    if (!deleteTarget) return;

    await deleteProduct(deleteTarget.id);
    const refreshed = await getProducts();
    setProducts((refreshed || []).map(normalizeProduct));
    setDeleteTarget(null);
  }

  const columns = [
    { key: "sku", label: "SKU" },
    { key: "name", label: "Item Name" },
    { key: "department", label: "Department" },
    { key: "unit_cost", label: "Unit Cost", render: (row) => `$${row.unit_cost.toFixed(2)}` },
    { key: "sell_price", label: "Sell Price", render: (row) => `$${row.sell_price.toFixed(2)}` },
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
            onClick={() => openDrawer(row, "view")}
          />
          <ActionBtn
            icon={Pencil}
            title="Edit product"
            onClick={() => openDrawer(row, "edit")}
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
        <SearchInput value={search} onChange={setSearch} placeholder="Search by name, SKU, or department..." />
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9 text-sm">
            <SelectValue placeholder="Any Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any Status</SelectItem>
            <SelectItem value="listed">Listed</SelectItem>
            <SelectItem value="unlisted">Unlisted</SelectItem>
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
        {(search || department !== "all" || statusFilter !== "all" || sort !== "name_asc") && (
          <Button size="sm" variant="outline" onClick={() => { setSearch(""); setDepartment("all"); setStatusFilter("all"); setSort("name_asc"); }}>
            <X className="mr-1.5 h-3.5 w-3.5" /> Reset Filters
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={filtered} />

      {showAddModal && (
        <AddProductModal
          departments={departmentOptions}
          materials={materials}
          onCreateDepartment={handleCreateDepartment}
          onDeleteDepartment={handleDeleteDepartment}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}

      {drawer && (
        <ProductDrawer
          product={drawer.product}
          bom={drawer.bom || []}
          materials={materials}
          departments={departmentOptions}
          mode={drawer.mode}
          onClose={() => setDrawer(null)}
          onSave={handleSave}
          onSaveBomLine={handleSaveBomLine}
          onRemoveBomLine={handleRemoveBomLine}
          onCreateDepartment={handleCreateDepartment}
          onDeleteDepartment={handleDeleteDepartment}
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
              <h2 className="text-base font-semibold text-foreground">Delete Product</h2>
            </div>
            <div className="px-5 py-4 space-y-2">
              <p className="text-sm text-foreground">
                Are you sure you want to delete <span className="font-medium">{deleteTarget.name}</span>?
              </p>
              <p className="text-sm text-muted-foreground">
                This will also remove any linked materials for this product.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-border flex gap-2 justify-end">
              <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button size="sm" variant="destructive" onClick={confirmDeleteProduct}>
                Delete Product
              </Button>
            </div>
          </div>
        </>
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