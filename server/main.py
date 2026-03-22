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
        is_listed = row[4]
        unit_cost = row[5]
        materials_input_raw = row[6]
        materials_input = None

        if materials_input_raw:
            try:
                materials_input = json.loads(materials_input_raw)
            except Exception:
                materials_input = materials_input_raw

        products.append(
            {
                "id": row[0],
                "sku": row[1],
                "name": row[2],
                "price": str(row[3]),
                "unit_cost": str(unit_cost),
                "is_listed": bool(is_listed),
                "materials_input": materials_input,
            }
        )

    return products


@app.post("/api/products")
def create_product_api(payload: dict):
    sku = payload["sku"]
    name = payload["name"]
    price = payload["price"]
    is_listed = payload.get("is_listed", True)
    materials_used = payload.get("materials_used") or []

    product_id = create_product(
        sku=sku,
        name=name,
        price=price,
        is_listed=is_listed,
        materials_used=materials_used,
    )

    return {"id": product_id}


@app.patch("/api/products/{product_id}/listed")
def update_product_listed(product_id: int, payload: dict):
    is_listed = bool(payload["is_listed"])
    set_product_listed(product_id, is_listed)
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
            "qty_per_unit": str(row[4]),
        })

    return bom


@app.post("/api/products/{product_id}/materials")
def upsert_product_bom_line(product_id: int, payload: dict):
    material_id = int(payload["material_id"])
    qty_per_unit = payload.get("qty_per_unit", 0)

    upsert_product_material(product_id, material_id, qty_per_unit)
    return {"ok": True}


@app.delete("/api/products/{product_id}/materials/{material_id}")
def delete_product_bom_line(product_id: int, material_id: int):
    delete_product_material(product_id, material_id)
    return {"ok": True}