

-- Mountory Inventory bootstrap schema updater
-- Safe to run multiple times on an existing database.

-- Lookup tables
CREATE TABLE IF NOT EXISTS product_departments (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS material_units (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Core inventory tables
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  sell_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_listed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  listed_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS materials (
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

CREATE TABLE IF NOT EXISTS product_materials (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  material_id BIGINT NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  qty_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, material_id)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id BIGSERIAL PRIMARY KEY,
  po_number TEXT UNIQUE,
  supplier TEXT,
  status TEXT NOT NULL DEFAULT 'Draft',
  ordered_date DATE,
  received_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id BIGSERIAL PRIMARY KEY,
  purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  material_id BIGINT NOT NULL REFERENCES materials(id) ON DELETE RESTRICT,
  quantity_ordered NUMERIC(10,2) NOT NULL,
  unit_cost NUMERIC(10,4) NOT NULL,
  CONSTRAINT purchase_order_items_po_material_key UNIQUE (purchase_order_id, material_id)
);

-- Products table upgrades
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sell_price NUMERIC(10,2) NOT NULL DEFAULT 0;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_listed BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS listed_at TIMESTAMPTZ NULL;

-- Materials table upgrades
ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT '—';

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'N/A';

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS quantity_on_hand NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC(12,4) NOT NULL DEFAULT 0;

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS supplier TEXT;

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS reorder_point NUMERIC(12,2) NOT NULL DEFAULT 0;

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS brand TEXT NOT NULL DEFAULT '—';

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS finish TEXT NOT NULL DEFAULT '—';

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT '—';

ALTER TABLE materials
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Purchase orders table upgrades
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS po_number TEXT;

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS supplier TEXT;

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Draft';

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS ordered_date DATE;

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS received_date DATE;

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_material_lookup
  ON materials(type, name, color, brand, finish, unit);

CREATE INDEX IF NOT EXISTS idx_pm_product
  ON product_materials(product_id);

CREATE INDEX IF NOT EXISTS idx_pm_material
  ON product_materials(material_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_status
  ON purchase_orders(status);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po
  ON purchase_order_items(purchase_order_id);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_material
  ON purchase_order_items(material_id);

-- Optional seed data for better first-run UX
INSERT INTO material_units (name)
VALUES ('g'), ('kg'), ('pcs'), ('ft'), ('in')
ON CONFLICT (name) DO NOTHING;

INSERT INTO product_departments (name)
VALUES ('Home Decor'), ('Organization'), ('Accessories'), ('Seasonal')
ON CONFLICT (name) DO NOTHING;