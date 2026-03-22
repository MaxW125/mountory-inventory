const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function fetchJson(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, options);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

// Products
export async function getProducts() {
  return fetchJson('/api/products');
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

// Placeholder sections for future backend expansion
export async function getPurchaseOrders() {
  return [];
}

export async function getOpenOrderCount() {
  return 0;
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