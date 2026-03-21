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