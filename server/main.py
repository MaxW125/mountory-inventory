from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
import json
from fastapi.middleware.cors import CORSMiddleware
from server.repositories import (
    list_products,
    create_product,
    update_product,
    delete_product,
    find_product_by_sku,
    list_product_departments,
    create_product_department,
    get_product_department_by_id,
    count_products_using_department,
    delete_product_department,
    set_product_listed,
    list_materials,
    create_material,
    update_material,
    delete_material,
    count_products_using_material,
    list_products_using_material,
    find_material,
    list_material_units,
    create_material_unit,
    get_material_unit_by_id,
    count_materials_using_unit,
    delete_material_unit,
    list_product_materials,
    upsert_product_material,
    delete_product_material,
    list_purchase_orders,
    create_purchase_order,
    update_purchase_order,
    delete_purchase_order,
    find_purchase_order_by_number,
    list_purchase_order_items,
    upsert_purchase_order_item,
    delete_purchase_order_item,
)


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (JS/CSS)
app.mount("/static", StaticFiles(directory="web/static"), name="static")

# Templates (HTML)
templates = Jinja2Templates(directory="web/templates")


def normalize_material_payload(payload: dict):
    name = (payload.get("name") or "").strip()
    type_value = (payload.get("type") or "").strip()
    color = (payload.get("color") or "N/A").strip()
    supplier = (payload.get("supplier") or "").strip()
    brand = (payload.get("brand") or "").strip()
    finish = (payload.get("finish") or "").strip()
    unit = (payload.get("unit") or "").strip()

    if not unit:
        unit = "—"

    if not brand:
        brand = "—"

    if not finish:
        finish = "—"

    if not type_value:
        type_value = "—"

    if not name:
        raise HTTPException(status_code=400, detail="Material name is required.")

    try:
        quantity_on_hand = float(payload.get("quantity_on_hand", 0))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Quantity on hand must be a number.")

    if quantity_on_hand < 0:
        raise HTTPException(status_code=400, detail="Quantity on hand cannot be negative.")

    try:
        cost_per_unit = float(payload.get("cost_per_unit", 0))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Cost per unit must be a number.")

    if cost_per_unit < 0:
        raise HTTPException(status_code=400, detail="Cost per unit cannot be negative.")

    try:
        reorder_point = float(payload.get("reorder_point", 0))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Reorder point must be a number.")

    if reorder_point < 0:
        raise HTTPException(status_code=400, detail="Reorder point cannot be negative.")

    return {
        "name": name,
        "type": type_value,
        "color": color or "N/A",
        "quantity_on_hand": quantity_on_hand,
        "cost_per_unit": cost_per_unit,
        "supplier": supplier or None,
        "reorder_point": reorder_point,
        "brand": brand,
        "finish": finish,
        "unit": unit,
    }


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/products")
def get_products():
    rows = list_products()

    products = []
    for row in rows:
        products.append(
            {
                "id": row[0],
                "sku": row[1],
                "name": row[2],
                "department": row[3],
                "sell_price": str(row[4]),
                "is_listed": bool(row[5]),
                "unit_cost": str(row[6]),
            }
        )

    return products


@app.post("/api/products")
def create_product_api(payload: dict):
    sku = (payload.get("sku") or "").strip()
    name = (payload.get("name") or "").strip()
    department = (payload.get("department") or "").strip()
    sell_price = payload.get("sell_price", 0)
    is_listed = payload.get("is_listed", True)

    if not sku:
        raise HTTPException(status_code=400, detail="Product SKU is required.")

    if not name:
        raise HTTPException(status_code=400, detail="Product name is required.")

    if not department:
        raise HTTPException(status_code=400, detail="Product department is required.")

    try:
        sell_price = float(sell_price)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Sell price must be a number.")

    if sell_price < 0:
        raise HTTPException(status_code=400, detail="Sell price cannot be negative.")

    existing = find_product_by_sku(sku)
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A product with this SKU already exists.",
        )

    product_id = create_product(
        sku=sku,
        name=name,
        department=department,
        sell_price=sell_price,
        is_listed=is_listed,
    )

    return {"id": product_id}


@app.patch("/api/products/{product_id}/listed")
def update_product_listed(product_id: int, payload: dict):
    is_listed = bool(payload["is_listed"])
    set_product_listed(product_id, is_listed)
    return {"ok": True}


# Patch endpoint for updating product info
@app.patch("/api/products/{product_id}")
def update_product_api(product_id: int, payload: dict):
    sku = (payload.get("sku") or "").strip()
    name = (payload.get("name") or "").strip()
    department = (payload.get("department") or "").strip()
    sell_price = payload.get("sell_price", 0)
    is_listed = payload.get("is_listed", True)

    if not sku:
        raise HTTPException(status_code=400, detail="Product SKU is required.")

    if not name:
        raise HTTPException(status_code=400, detail="Product name is required.")

    if not department:
        raise HTTPException(status_code=400, detail="Product department is required.")

    try:
        sell_price = float(sell_price)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Sell price must be a number.")

    if sell_price < 0:
        raise HTTPException(status_code=400, detail="Sell price cannot be negative.")

    existing = find_product_by_sku(sku)
    if existing and existing[0] != product_id:
        raise HTTPException(
            status_code=400,
            detail="A product with this SKU already exists.",
        )

    update_product(
        product_id=product_id,
        sku=sku,
        name=name,
        department=department,
        sell_price=sell_price,
        is_listed=is_listed,
    )
    return {"ok": True}

@app.delete("/api/products/{product_id}")
def delete_product_api(product_id: int):
    delete_product(product_id)
    return {"ok": True}


@app.get("/api/materials")
def get_materials():
    rows = list_materials()

    materials = []
    for row in rows:
        materials.append(
            {
                "id": row[0],
                "name": row[1],
                "type": row[2],
                "color": row[3],
                "quantity_on_hand": float(row[4]),
                "cost_per_unit": str(row[5]),
                "supplier": row[6],
                "reorder_point": float(row[7]),
                "brand": row[8],
                "finish": row[9],
                "unit": row[10],
            }
        )

    return materials


@app.post("/api/materials")
def create_material_api(payload: dict):
    data = normalize_material_payload(payload)

    existing = find_material(
        name=data["name"],
        type=data["type"],
        color=data["color"],
        brand=data["brand"],
        finish=data["finish"],
        unit=data["unit"],
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="A material with the same name, type, color, brand, finish, and unit already exists.",
        )

    material_id = create_material(**data)
    return {"id": material_id}


@app.patch("/api/materials/{material_id}")
def update_material_api(material_id: int, payload: dict):
    data = normalize_material_payload(payload)
    update_material(material_id=material_id, **data)
    return {"ok": True}


@app.delete("/api/materials/{material_id}")
def delete_material_api(material_id: int):
    usage_count = count_products_using_material(material_id)
    if usage_count > 0:
        products = list_products_using_material(material_id)
        product_names = [row[1] for row in products]
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Cannot delete a material that is used in one or more product BOMs.",
                "product_count": usage_count,
                "products": product_names,
            },
        )

    delete_material(material_id)
    return {"ok": True}


# Material Units Endpoints
@app.get("/api/material-units")
def get_material_units():
    rows = list_material_units()

    units = []
    for row in rows:
        units.append(
            {
                "id": row[0],
                "name": row[1],
            }
        )

    return units


@app.post("/api/material-units")
def create_material_unit_api(payload: dict):
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Unit name is required.")

    unit_id = create_material_unit(name)
    unit_row = get_material_unit_by_id(unit_id)

    return {
        "id": unit_row[0],
        "name": unit_row[1],
    }


@app.delete("/api/material-units/{unit_id}")
def delete_material_unit_api(unit_id: int):
    unit_row = get_material_unit_by_id(unit_id)
    if not unit_row:
        raise HTTPException(status_code=404, detail="Unit not found.")

    unit_name = unit_row[1]
    usage_count = count_materials_using_unit(unit_name)
    if usage_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a unit that is currently in use.",
        )

    delete_material_unit(unit_id)
    return {"ok": True}


# Product Departments Endpoints
@app.get("/api/product-departments")
def get_product_departments():
    rows = list_product_departments()

    departments = []
    for row in rows:
        departments.append(
            {
                "id": row[0],
                "name": row[1],
            }
        )

    return departments


@app.post("/api/product-departments")
def create_product_department_api(payload: dict):
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Department name is required.")

    department_id = create_product_department(name)
    department_row = get_product_department_by_id(department_id)

    return {
        "id": department_row[0],
        "name": department_row[1],
    }


@app.delete("/api/product-departments/{department_id}")
def delete_product_department_api(department_id: int):
    department_row = get_product_department_by_id(department_id)
    if not department_row:
        raise HTTPException(status_code=404, detail="Department not found.")

    department_name = department_row[1]
    usage_count = count_products_using_department(department_name)
    if usage_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a department that is currently in use.",
        )

    delete_product_department(department_id)
    return {"ok": True}


@app.get("/api/products/{product_id}/materials")
def get_product_bom(product_id: int):
    rows = list_product_materials(product_id)

    bom = []
    for row in rows:
        bom.append({
            "material_id": row[0],
            "type": row[1],
            "name": row[2],
            "color": row[3],
            "unit": row[4],
            "qty_per_unit": str(row[5]),
        })

    return bom


@app.post("/api/products/{product_id}/materials")
def upsert_product_bom_line(product_id: int, payload: dict):
    material_id = int(payload["material_id"])
    qty_per_unit = payload.get("qty_per_unit", 0)

    try:
        qty_per_unit = float(qty_per_unit)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Qty per unit must be a number.")

    if qty_per_unit <= 0:
        raise HTTPException(status_code=400, detail="Qty per unit must be greater than 0.")

    upsert_product_material(product_id, material_id, qty_per_unit)
    return {"ok": True}


@app.delete("/api/products/{product_id}/materials/{material_id}")
def delete_product_bom_line(product_id: int, material_id: int):
    delete_product_material(product_id, material_id)
    return {"ok": True}

# Purchase Orders
@app.get("/api/purchase-orders")
def get_purchase_orders():
    rows = list_purchase_orders()

    orders = []
    for row in rows:
        orders.append(
            {
                "id": row[0],
                "po_number": row[1],
                "supplier": row[2],
                "status": row[3],
                "ordered_date": row[4].isoformat() if row[4] else None,
                "received_date": row[5].isoformat() if row[5] else None,
                "total_cost": str(row[6]),
            }
        )

    return orders


@app.post("/api/purchase-orders")
def create_purchase_order_api(payload: dict):
    po_number = (payload.get("po_number") or "").strip() or None
    supplier = (payload.get("supplier") or "").strip() or None
    status = (payload.get("status") or "Draft").strip()
    ordered_date = payload.get("ordered_date") or None
    received_date = payload.get("received_date") or None

    if status != "Draft" and not po_number:
        raise HTTPException(status_code=400, detail="PO number is required unless the order is still in Draft.")

    if status != "Draft" and not supplier:
        raise HTTPException(status_code=400, detail="Supplier is required unless the order is still in Draft.")
    if status in {"Ordered", "Received"} and not ordered_date:
        raise HTTPException(status_code=400, detail="Ordered date is required once the purchase order is Ordered or Received.")
    if status == "Received" and not received_date:
        raise HTTPException(status_code=400, detail="Received date is required once the purchase order is Received.")
    if ordered_date and received_date and received_date < ordered_date:
        raise HTTPException(status_code=400, detail="Received date cannot be earlier than ordered date.")

    if po_number:
        existing = find_purchase_order_by_number(po_number)
        if existing:
            raise HTTPException(status_code=400, detail="A purchase order with this PO number already exists.")

    po_id = create_purchase_order(
        po_number=po_number,
        supplier=supplier,
        status=status,
        ordered_date=ordered_date,
        received_date=received_date,
    )

    return {"id": po_id}


@app.patch("/api/purchase-orders/{po_id}")
def update_purchase_order_api(po_id: int, payload: dict):
    po_number = (payload.get("po_number") or "").strip() or None
    supplier = (payload.get("supplier") or "").strip() or None
    status = (payload.get("status") or "Draft").strip()
    ordered_date = payload.get("ordered_date") or None
    received_date = payload.get("received_date") or None

    if status != "Draft" and not po_number:
        raise HTTPException(status_code=400, detail="PO number is required unless the order is still in Draft.")

    if status != "Draft" and not supplier:
        raise HTTPException(status_code=400, detail="Supplier is required unless the order is still in Draft.")
    if status in {"Ordered", "Received"} and not ordered_date:
        raise HTTPException(status_code=400, detail="Ordered date is required once the purchase order is Ordered or Received.")
    if status == "Received" and not received_date:
        raise HTTPException(status_code=400, detail="Received date is required once the purchase order is Received.")
    if ordered_date and received_date and received_date < ordered_date:
        raise HTTPException(status_code=400, detail="Received date cannot be earlier than ordered date.")

    if po_number:
        existing = find_purchase_order_by_number(po_number)
        if existing and existing[0] != po_id:
            raise HTTPException(status_code=400, detail="A purchase order with this PO number already exists.")

    update_purchase_order(
        po_id=po_id,
        po_number=po_number,
        supplier=supplier,
        status=status,
        ordered_date=ordered_date,
        received_date=received_date,
    )

    return {"ok": True}


@app.delete("/api/purchase-orders/{po_id}")
def delete_purchase_order_api(po_id: int):
    delete_purchase_order(po_id)
    return {"ok": True}


@app.get("/api/purchase-orders/{po_id}/items")
def get_purchase_order_items(po_id: int):
    rows = list_purchase_order_items(po_id)

    items = []
    for row in rows:
        items.append(
            {
                "material_id": row[0],
                "name": row[1],
                "type": row[2],
                "color": row[3],
                "unit": row[4],
                "quantity_ordered": str(row[5]),
                "unit_cost": str(row[6]),
            }
        )

    return items


@app.post("/api/purchase-orders/{po_id}/items")
def upsert_purchase_order_item_api(po_id: int, payload: dict):
    material_id = int(payload["material_id"])
    quantity_ordered = payload.get("quantity_ordered", 0)
    unit_cost = payload.get("unit_cost", 0)

    try:
        quantity_ordered = float(quantity_ordered)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Quantity ordered must be a number.")

    if quantity_ordered <= 0:
        raise HTTPException(status_code=400, detail="Quantity ordered must be greater than 0.")

    try:
        unit_cost = float(unit_cost)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Unit cost must be a number.")

    if unit_cost < 0:
        raise HTTPException(status_code=400, detail="Unit cost cannot be negative.")

    upsert_purchase_order_item(
        po_id=po_id,
        material_id=material_id,
        quantity_ordered=quantity_ordered,
        unit_cost=unit_cost,
    )

    return {"ok": True}


@app.delete("/api/purchase-orders/{po_id}/items/{material_id}")
def delete_purchase_order_item_api(po_id: int, material_id: int):
    delete_purchase_order_item(po_id, material_id)
    return {"ok": True}