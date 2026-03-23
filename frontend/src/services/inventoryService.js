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

function formatActivityTime(value) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
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
  return orders.filter((order) => order.status === 'Ordered').length;
}

export async function getRecentActivity() {
  const [products, materials, purchaseOrders] = await Promise.all([
    getProducts(),
    getMaterials(),
    getPurchaseOrders(),
  ]);

  const activities = [];

  for (const order of purchaseOrders) {
    if (order.created_at) {
      activities.push({
        id: `po-created-${order.id}`,
        action: 'Purchase order created',
        detail: `${order.po_number || 'Draft PO'}${order.supplier ? ` · ${order.supplier}` : ''}`,
        sortValue: order.created_at,
        time: formatActivityTime(order.created_at),
      });
    }

    if (order.status === 'Received' && order.received_date) {
      activities.push({
        id: `po-received-${order.id}`,
        action: 'Material restocked',
        detail: `${order.po_number || 'Draft PO'}${order.supplier ? ` · ${order.supplier}` : ''}`,
        sortValue: order.received_date,
        time: formatActivityTime(order.received_date),
      });
    }
  }

  for (const product of products) {
    if (product.created_at) {
      activities.push({
        id: `product-created-${product.id}`,
        action: 'Product added',
        detail: `${product.name}${product.sku ? ` · ${product.sku}` : ''}`,
        sortValue: product.created_at,
        time: formatActivityTime(product.created_at),
      });
    }

    if (product.is_listed && product.listed_at) {
      activities.push({
        id: `product-listed-${product.id}`,
        action: 'Product listed',
        detail: `${product.name}${product.sku ? ` · ${product.sku}` : ''}`,
        sortValue: product.listed_at,
        time: formatActivityTime(product.listed_at),
      });
    }
  }

  for (const material of materials) {
    if (material.created_at) {
      activities.push({
        id: `material-created-${material.id}`,
        action: 'Material added',
        detail: `${material.name}${material.color ? ` · ${material.color}` : ''}`,
        sortValue: material.created_at,
        time: formatActivityTime(material.created_at),
      });
    }
  }

  const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000);

  return activities
    .filter((activity) => {
      const time = new Date(activity.sortValue).getTime();
      return !Number.isNaN(time) && time >= twoDaysAgo;
    })
    .sort((a, b) => new Date(b.sortValue).getTime() - new Date(a.sortValue).getTime())
    .map((activity) => ({
      ...activity,
      timestamp: activity.sortValue,
    }));
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