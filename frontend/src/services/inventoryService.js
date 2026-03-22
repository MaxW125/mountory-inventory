const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJson(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, options);

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(
      typeof data?.detail === "string"
        ? data.detail
        : data?.detail?.message || `Request failed: ${response.status}`
    );
    error.status = response.status;
    error.detail = data?.detail;
    throw error;
  }

  return data;
}

// Products
export async function getProducts() {
  return fetchJson('/api/products');
}

export async function createProduct(product) {
  const payload = {
    sku: product.sku?.trim() || "",
    name: product.name?.trim() || "",
    department: product.department?.trim() || "",
    sell_price: Number(product.sell_price || 0),
    is_listed: !!product.is_listed,
  };

  return fetchJson('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}


export async function updateProduct(productId, product) {
  const payload = {
    sku: product.sku?.trim() || "",
    name: product.name?.trim() || "",
    department: product.department?.trim() || "",
    sell_price: Number(product.sell_price || 0),
    is_listed: !!product.is_listed,
  };

  return fetchJson(`/api/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(productId) {
  return fetchJson(`/api/products/${productId}`, {
    method: 'DELETE',
  });
}

export async function getProductMaterials(productId) {
  return fetchJson(`/api/products/${productId}/materials`);
}

export async function saveProductMaterial(productId, materialId, qtyPerUnit) {
  return fetchJson(`/api/products/${productId}/materials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      material_id: materialId,
      qty_per_unit: Number(qtyPerUnit || 0),
    }),
  });
}

export async function removeProductMaterial(productId, materialId) {
  return fetchJson(`/api/products/${productId}/materials/${materialId}`, {
    method: 'DELETE',
  });
}

export async function getProductDepartments() {
  return fetchJson('/api/product-departments');
}

export async function createProductDepartment(name) {
  return fetchJson('/api/product-departments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
}

export async function deleteProductDepartment(departmentId) {
  return fetchJson(`/api/product-departments/${departmentId}`, {
    method: 'DELETE',
  });
}

export async function getProductCount() {
  const products = await getProducts();
  return products.length;
}

export async function getListedProductCount() {
  const products = await getProducts();
  return products.filter((product) => product.is_listed).length;
}

// Materials
export async function getMaterials() {
  return fetchJson('/api/materials');
}

export async function getMaterialUnits() {
  return fetchJson('/api/material-units');
}

export async function createMaterialUnit(name) {
  return fetchJson('/api/material-units', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
}

export async function deleteMaterialUnit(unitId) {
  return fetchJson(`/api/material-units/${unitId}`, {
    method: 'DELETE',
  });
}

export async function createMaterial(material) {
  const payload = {
    name: material.name || "",
    color: material.color || "N/A",
    quantity_on_hand: Number(material.quantity_on_hand || 0),
    cost_per_unit: Number(material.cost_per_unit || material.unit_cost || 0),
    supplier: material.supplier || "",
    reorder_point: Number(material.reorder_point || 0),
    brand: material.brand || "",
    finish: material.finish || "",
    type: material.type || "",
    unit: material.unit || "",
  };

  return fetchJson("/api/materials", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getMaterialCount() {
  const materials = await getMaterials();
  return materials.length;
}

export async function getLowStockMaterials() {
  const materials = await getMaterials();

  return materials.filter((material) => {
    if (typeof material.reorder_point !== 'number') return false;
    return Number(material.quantity_on_hand) <= material.reorder_point;
  });
}

export async function getTotalInventoryValue() {
  const materials = await getMaterials();

  return materials.reduce((sum, material) => {
    const qty = Number(material.quantity_on_hand || 0);
    const unitCost = Number(material.cost_per_unit || material.unit_cost || 0);
    return sum + qty * unitCost;
  }, 0);
}

// Purchase Orders
export async function getPurchaseOrders() {
  return fetchJson('/api/purchase-orders');
}

export async function createPurchaseOrder(order) {
  const payload = {
    po_number: order.po_number?.trim() || "",
    supplier: order.supplier?.trim() || "",
    status: order.status?.trim() || "Draft",
    ordered_date: order.ordered_date || null,
    received_date: order.received_date || null,
  };

  return fetchJson('/api/purchase-orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function updatePurchaseOrder(poId, order) {
  const payload = {
    po_number: order.po_number?.trim() || "",
    supplier: order.supplier?.trim() || "",
    status: order.status?.trim() || "Draft",
    ordered_date: order.ordered_date || null,
    received_date: order.received_date || null,
  };

  return fetchJson(`/api/purchase-orders/${poId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}

export async function deletePurchaseOrder(poId) {
  return fetchJson(`/api/purchase-orders/${poId}`, {
    method: 'DELETE',
  });
}

export async function getPurchaseOrderItems(poId) {
  return fetchJson(`/api/purchase-orders/${poId}/items`);
}

export async function savePurchaseOrderItem(poId, materialId, quantityOrdered, unitCost) {
  return fetchJson(`/api/purchase-orders/${poId}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      material_id: materialId,
      quantity_ordered: Number(quantityOrdered || 0),
      unit_cost: Number(unitCost || 0),
    }),
  });
}

export async function removePurchaseOrderItem(poId, materialId) {
  return fetchJson(`/api/purchase-orders/${poId}/items/${materialId}`, {
    method: 'DELETE',
  });
}

export async function getOpenOrderCount() {
  const orders = await getPurchaseOrders();
  return orders.filter((order) => order.status === 'Draft' || order.status === 'Ordered').length;
}

export async function getRecentActivity() {
  return [];
}

export async function deleteMaterial(materialId) {
  return fetchJson(`/api/materials/${materialId}`, {
    method: "DELETE",
  });
}

export async function updateMaterial(materialId, material) {
  const payload = {
    name: material.name || "",
    color: material.color || "N/A",
    quantity_on_hand: Number(material.quantity_on_hand || 0),
    cost_per_unit: Number(material.cost_per_unit || material.unit_cost || 0),
    supplier: material.supplier || "",
    reorder_point: Number(material.reorder_point || 0),
    brand: material.brand || "",
    finish: material.finish || "",
    type: material.type || "",
    unit: material.unit || "",
  };

  return fetchJson(`/api/materials/${materialId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}