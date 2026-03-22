from server.db import get_connection
import json


# -----------------------------
# Materials
# -----------------------------

def list_materials():
    """Return all materials."""
    sql = """
        SELECT
            id,
            name,
            type,
            color,
            quantity_on_hand,
            cost_per_unit,
            supplier,
            reorder_point,
            brand,
            finish,
            unit
        FROM materials
        ORDER BY id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()

    return rows


def create_material(
    name,
    type,
    color,
    quantity_on_hand=0,
    cost_per_unit=0,
    supplier=None,
    reorder_point=0,
    brand=None,
    finish=None,
    unit=None
):
    """Insert a new material. Returns the existing id if a duplicate already exists, otherwise the new material id."""
    normalized_name = (name or "").strip()
    normalized_type = (type or "Other").strip()
    normalized_color = (color or "N/A").strip()
    normalized_brand = (brand or "").strip() or None
    normalized_finish = (finish or "").strip() or None
    normalized_unit = (unit or "").strip() or None

    existing = find_material(
        name=normalized_name,
        type=normalized_type,
        color=normalized_color,
        brand=normalized_brand,
        finish=normalized_finish,
        unit=normalized_unit,
    )
    if existing:
        return existing[0]

    sql = """
        INSERT INTO materials (
            name,
            type,
            color,
            quantity_on_hand,
            cost_per_unit,
            supplier,
            reorder_point,
            brand,
            finish,
            unit
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                sql,
                (
                    normalized_name,
                    normalized_type,
                    normalized_color,
                    quantity_on_hand,
                    cost_per_unit,
                    supplier,
                    reorder_point,
                    normalized_brand,
                    normalized_finish,
                    normalized_unit,
                ),
            )
            material_id = cur.fetchone()[0]
            conn.commit()

    return material_id


def update_material(
    material_id: int,
    name,
    type,
    color,
    quantity_on_hand,
    cost_per_unit,
    supplier=None,
    reorder_point=0,
    brand=None,
    finish=None,
    unit=None,
):
    """Update an existing material row."""
    sql = """
        UPDATE materials
        SET
            name = %s,
            type = %s,
            color = %s,
            quantity_on_hand = %s,
            cost_per_unit = %s,
            supplier = %s,
            reorder_point = %s,
            brand = %s,
            finish = %s,
            unit = %s
        WHERE id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                sql,
                (
                    name,
                    type,
                    color,
                    quantity_on_hand,
                    cost_per_unit,
                    supplier,
                    reorder_point,
                    brand,
                    finish,
                    unit,
                    material_id,
                ),
            )
            conn.commit()


def delete_material(material_id: int):
    """Delete a material row."""
    sql = """
        DELETE FROM materials
        WHERE id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (material_id,))
            conn.commit()


def count_products_using_material(material_id: int):
    """Return how many product BOM rows currently reference a material."""
    sql = """
        SELECT COUNT(*)
        FROM product_materials
        WHERE material_id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (material_id,))
            count = cur.fetchone()[0]

    return count


def list_products_using_material(material_id: int):
    """Return product ids and names for products whose BOM references a material."""
    sql = """
        SELECT DISTINCT
            p.id,
            p.name
        FROM product_materials pm
        JOIN products p ON p.id = pm.product_id
        WHERE pm.material_id = %s
        ORDER BY LOWER(p.name), p.id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (material_id,))
            rows = cur.fetchall()

    return rows


def find_material(name, type, color, brand=None, finish=None, unit=None):
    """Find a material by name + type + color + brand + finish + unit. Returns the row or None."""
    sql = """
        SELECT
            id,
            name,
            type,
            color,
            quantity_on_hand,
            cost_per_unit,
            supplier,
            reorder_point,
            brand,
            finish,
            unit
        FROM materials
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(%s))
          AND LOWER(TRIM(type)) = LOWER(TRIM(%s))
          AND LOWER(TRIM(color)) = LOWER(TRIM(%s))
          AND LOWER(TRIM(COALESCE(brand, ''))) = LOWER(TRIM(COALESCE(%s, '')))
          AND LOWER(TRIM(COALESCE(finish, ''))) = LOWER(TRIM(COALESCE(%s, '')))
          AND LOWER(TRIM(COALESCE(unit, ''))) = LOWER(TRIM(COALESCE(%s, '')))
        LIMIT 1;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (name, type, color, brand, finish, unit))
            row = cur.fetchone()

    return row


def find_or_create_material(material):
    """Find an existing material or create it."""
    name = (material.get("name") or "").strip()
    type = (material.get("type") or "Other").strip()
    color = (material.get("color") or "N/A").strip()

    if not name:
        raise ValueError("Material name is required")

    quantity_on_hand = material.get("quantity_on_hand", 0)
    cost_per_unit = material.get("cost_per_unit", 0)
    supplier = material.get("supplier")
    reorder_point = material.get("reorder_point", 0)
    brand = (material.get("brand") or "").strip() or None
    finish = (material.get("finish") or "").strip() or None
    unit = (material.get("unit") or "").strip() or None

    existing = find_material(
        name=name,
        type=type,
        color=color,
        brand=brand,
        finish=finish,
        unit=unit,
    )
    if existing:
        return existing[0]

    return create_material(
        name=name,
        type=type,
        color=color,
        quantity_on_hand=quantity_on_hand,
        cost_per_unit=cost_per_unit,
        supplier=supplier,
        reorder_point=reorder_point,
        brand=brand,
        finish=finish,
        unit=unit,
    )

# -----------------------------
# Material Units
# -----------------------------

def list_material_units():
    """Return all allowed material units."""
    sql = """
        SELECT
            id,
            name
        FROM material_units
        ORDER BY LOWER(name), id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()

    return rows


def get_material_unit_by_id(unit_id: int):
    """Return one material unit row by id, or None."""
    sql = """
        SELECT
            id,
            name
        FROM material_units
        WHERE id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (unit_id,))
            row = cur.fetchone()

    return row


def find_material_unit_by_name(name: str):
    """Return one material unit row by name (case-insensitive), or None."""
    sql = """
        SELECT
            id,
            name
        FROM material_units
        WHERE LOWER(name) = LOWER(%s)
        LIMIT 1;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (name,))
            row = cur.fetchone()

    return row


def create_material_unit(name: str):
    """Create a material unit if it does not already exist. Returns the unit id."""
    normalized_name = (name or "").strip()
    if not normalized_name:
        raise ValueError("Unit name is required")

    existing = find_material_unit_by_name(normalized_name)
    if existing:
        return existing[0]

    sql = """
        INSERT INTO material_units (name)
        VALUES (%s)
        RETURNING id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (normalized_name,))
            unit_id = cur.fetchone()[0]
            conn.commit()

    return unit_id


def count_materials_using_unit(name: str):
    """Return how many materials currently use a unit name."""
    sql = """
        SELECT COUNT(*)
        FROM materials
        WHERE LOWER(unit) = LOWER(%s);
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (name,))
            count = cur.fetchone()[0]

    return count


def delete_material_unit(unit_id: int):
    """Delete one material unit row by id."""
    sql = """
        DELETE FROM material_units
        WHERE id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (unit_id,))
            conn.commit()

# -----------------------------
# Products
# -----------------------------

def list_products():
    """Return all products (including live unit_cost computed from BOM)."""
    sql = """
        SELECT
            p.id,
            p.sku,
            p.name,
            p.department,
            p.sell_price,
            p.is_listed,
            COALESCE(SUM(pm.qty_per_unit * m.cost_per_unit), 0) AS unit_cost
        FROM products p
        LEFT JOIN product_materials pm ON pm.product_id = p.id
        LEFT JOIN materials m ON m.id = pm.material_id
        GROUP BY
            p.id,
            p.sku,
            p.name,
            p.department,
            p.sell_price,
            p.is_listed
        ORDER BY p.id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()

    return rows


def create_product(sku, name, department, sell_price, is_listed=True):
    """Create a product row and return its id."""
    sql = """
        INSERT INTO products (
            sku,
            name,
            department,
            sell_price,
            is_listed
        )
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (sku, name, department, sell_price, is_listed))
            product_id = cur.fetchone()[0]
            conn.commit()

    return product_id


def set_product_listed(product_id: int, is_listed: bool):
    """Update whether a product is actively listed/sellable."""
    sql = """
        UPDATE products
        SET is_listed = %s
        WHERE id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (is_listed, product_id))
            conn.commit()


def update_product(product_id: int, sku, name, department, sell_price, is_listed):
    """Update core product fields."""
    sql = """
        UPDATE products
        SET
            sku = %s,
            name = %s,
            department = %s,
            sell_price = %s,
            is_listed = %s
        WHERE id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (sku, name, department, sell_price, is_listed, product_id))
            conn.commit()


# -----------------------------
# Delete Product and its BOM
# -----------------------------

def delete_product(product_id: int):
    """Delete a product row and any BOM rows linked to it."""
    delete_bom_sql = """
        DELETE FROM product_materials
        WHERE product_id = %s;
    """

    delete_product_sql = """
        DELETE FROM products
        WHERE id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(delete_bom_sql, (product_id,))
            cur.execute(delete_product_sql, (product_id,))
            conn.commit()


# -----------------------------
# Product Departments
# -----------------------------

def list_product_departments():
    """Return all allowed product departments."""
    sql = """
        SELECT
            id,
            name
        FROM product_departments
        ORDER BY LOWER(name), id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()

    return rows


def get_product_department_by_id(department_id: int):
    """Return one product department row by id, or None."""
    sql = """
        SELECT
            id,
            name
        FROM product_departments
        WHERE id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (department_id,))
            row = cur.fetchone()

    return row


def find_product_department_by_name(name: str):
    """Return one product department row by name (case-insensitive), or None."""
    sql = """
        SELECT
            id,
            name
        FROM product_departments
        WHERE LOWER(name) = LOWER(%s)
        LIMIT 1;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (name,))
            row = cur.fetchone()

    return row


def create_product_department(name: str):
    """Create a product department if it does not already exist. Returns the department id."""
    normalized_name = " ".join((name or "").strip().split())
    normalized_name = normalized_name.title()
    if not normalized_name:
        raise ValueError("Department name is required")

    existing = find_product_department_by_name(normalized_name)
    if existing:
        return existing[0]

    sql = """
        INSERT INTO product_departments (name)
        VALUES (%s)
        RETURNING id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (normalized_name,))
            department_id = cur.fetchone()[0]
            conn.commit()

    return department_id


def count_products_using_department(name: str):
    """Return how many products currently use a department name."""
    sql = """
        SELECT COUNT(*)
        FROM products
        WHERE LOWER(department) = LOWER(%s);
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (name,))
            count = cur.fetchone()[0]

    return count


def delete_product_department(department_id: int):
    """Delete one product department row by id."""
    sql = """
        DELETE FROM product_departments
        WHERE id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (department_id,))
            conn.commit()


def find_product_by_sku(sku: str):
    """Return one product row by SKU (case-insensitive), or None."""
    sql = """
        SELECT
            id,
            sku,
            name,
            department,
            sell_price,
            is_listed
        FROM products
        WHERE LOWER(TRIM(sku)) = LOWER(TRIM(%s))
        LIMIT 1;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (sku,))
            row = cur.fetchone()

    return row

# -----------------------------
# Product BOM (recipe)
# -----------------------------

def list_product_materials(product_id: int):
    """Return the BOM (recipe) for a product."""
    sql = """
        SELECT
            pm.material_id,
            m.type,
            m.name,
            m.color,
            m.unit,
            pm.qty_per_unit
        FROM product_materials pm
        JOIN materials m ON m.id = pm.material_id
        WHERE pm.product_id = %s
        ORDER BY m.type, m.name, m.color;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (product_id,))
            return cur.fetchall()


def upsert_product_material(product_id: int, material_id: int, qty_per_unit):
    """Add or update one material line on a product BOM."""
    sql = """
        INSERT INTO product_materials (product_id, material_id, qty_per_unit)
        VALUES (%s, %s, %s)
        ON CONFLICT (product_id, material_id)
        DO UPDATE SET qty_per_unit = EXCLUDED.qty_per_unit;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (product_id, material_id, qty_per_unit))
            conn.commit()


def delete_product_material(product_id: int, material_id: int):
    """Remove one material line from a product BOM."""
    sql = """
        DELETE FROM product_materials
        WHERE product_id = %s AND material_id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (product_id, material_id))
            conn.commit()


# -----------------------------
# Purchase Orders
# -----------------------------

def list_purchase_orders():
    """Return all purchase orders with computed total_cost."""
    sql = """
        SELECT
            po.id,
            po.po_number,
            po.supplier,
            po.status,
            po.ordered_date,
            po.received_date,
            COALESCE(SUM(poi.quantity_ordered * poi.unit_cost), 0) AS total_cost
        FROM purchase_orders po
        LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
        GROUP BY
            po.id,
            po.po_number,
            po.supplier,
            po.status,
            po.ordered_date,
            po.received_date
        ORDER BY po.id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()

    return rows


def create_purchase_order(po_number, supplier, status="Draft", ordered_date=None, received_date=None):
    """Create a purchase order row and return its id."""
    sql = """
        INSERT INTO purchase_orders (
            po_number,
            supplier,
            status,
            ordered_date,
            received_date
        )
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (po_number, supplier, status, ordered_date, received_date))
            po_id = cur.fetchone()[0]
            conn.commit()

    return po_id


def update_purchase_order(po_id: int, po_number, supplier, status, ordered_date=None, received_date=None):
    """Update core purchase order fields."""
    sql = """
        UPDATE purchase_orders
        SET
            po_number = %s,
            supplier = %s,
            status = %s,
            ordered_date = %s,
            received_date = %s
        WHERE id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (po_number, supplier, status, ordered_date, received_date, po_id))
            conn.commit()


def delete_purchase_order(po_id: int):
    """Delete a purchase order row. Line items cascade automatically."""
    sql = """
        DELETE FROM purchase_orders
        WHERE id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (po_id,))
            conn.commit()


def find_purchase_order_by_number(po_number: str):
    """Return one purchase order row by PO number (case-insensitive), or None."""
    sql = """
        SELECT
            id,
            po_number,
            supplier,
            status,
            ordered_date,
            received_date
        FROM purchase_orders
        WHERE LOWER(TRIM(po_number)) = LOWER(TRIM(%s))
        LIMIT 1;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (po_number,))
            row = cur.fetchone()

    return row


def list_purchase_order_items(po_id: int):
    """Return all line items for one purchase order."""
    sql = """
        SELECT
            poi.material_id,
            m.name,
            m.type,
            m.color,
            m.unit,
            poi.quantity_ordered,
            poi.unit_cost
        FROM purchase_order_items poi
        JOIN materials m ON m.id = poi.material_id
        WHERE poi.purchase_order_id = %s
        ORDER BY m.type, m.name, m.color;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (po_id,))
            rows = cur.fetchall()

    return rows


def upsert_purchase_order_item(po_id: int, material_id: int, quantity_ordered, unit_cost):
    """Add or update one material line on a purchase order."""
    sql = """
        INSERT INTO purchase_order_items (purchase_order_id, material_id, quantity_ordered, unit_cost)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (purchase_order_id, material_id)
        DO UPDATE SET
            quantity_ordered = EXCLUDED.quantity_ordered,
            unit_cost = EXCLUDED.unit_cost;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (po_id, material_id, quantity_ordered, unit_cost))
            conn.commit()


def delete_purchase_order_item(po_id: int, material_id: int):
    """Remove one material line from a purchase order."""
    sql = """
        DELETE FROM purchase_order_items
        WHERE purchase_order_id = %s AND material_id = %s;
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (po_id, material_id))
            conn.commit()
