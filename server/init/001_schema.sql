-- Mountory Inventory initial schema
-- This file is intended for first-time database initialization only.

-- Lookup tables
CREATE TABLE product_departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE material_units (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Core inventory tables
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  sell_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_listed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  listed_at TIMESTAMPTZ NULL
);

CREATE TABLE materials (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '—',
  color TEXT NOT NULL DEFAULT 'N/A',
  quantity_on_hand NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC(12,4) NOT NULL DEFAULT 0,
  supplier TEXT,
  reorder_point NUMERIC(12,2) NOT NULL DEFAULT 0,
  brand TEXT NOT NULL DEFAULT '—',
  finish TEXT NOT NULL DEFAULT '—',
  unit TEXT NOT NULL DEFAULT '—',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product BOM / recipe table
CREATE TABLE product_materials (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  material_id BIGINT NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  qty_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, material_id)
);

-- Purchase orders
CREATE TABLE purchase_orders (
  id BIGSERIAL PRIMARY KEY,
  po_number TEXT UNIQUE,
  supplier TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  ordered_date DATE,
  received_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_order_items (
  id BIGSERIAL PRIMARY KEY,
  purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  material_id BIGINT NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  quantity_ordered NUMERIC(10,2) NOT NULL,
  unit_cost NUMERIC(10,4) NOT NULL,
  CONSTRAINT purchase_order_items_po_material_key UNIQUE (purchase_order_id, material_id)
);

-- Helpful indexes
CREATE INDEX idx_material_lookup
  ON materials(type, name, color, brand, finish, unit);

CREATE INDEX idx_pm_product
  ON product_materials(product_id);

CREATE INDEX idx_pm_material
  ON product_materials(material_id);

CREATE INDEX idx_purchase_orders_status
  ON purchase_orders(status);

CREATE INDEX idx_purchase_order_items_po
  ON purchase_order_items(purchase_order_id);

CREATE INDEX idx_purchase_order_items_material
  ON purchase_order_items(material_id);

-- Seed data for better first-run UX
INSERT INTO material_units (name)
VALUES ('g'), ('kg'), ('pcs'), ('ft'), ('in')
ON CONFLICT (name) DO NOTHING;

INSERT INTO product_departments (name)
VALUES ('Home Decor'), ('Organization'), ('Accessories'), ('Seasonal')
ON CONFLICT (name) DO NOTHING;
