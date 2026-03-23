# Mountory Inventory

Mountory Inventory is a purpose-built full-stack inventory system for managing products, materials, and purchasing workflows for my 3D printing shop (**Mountory**).

The project intentionally uses a **minimal, transparent backend stack** to demonstrate backend fundamentals, relational data modeling, and clean API design without hiding logic behind heavy frameworks or ORMs. What started as a generic inventory demo was deliberately evolved into a real operational tool for tracking filament, hardware, packaging supplies, sellable products, and purchase orders.

---

## Features

### Products
- Create and manage products with:
  - SKU
  - Name
  - Department
  - Sell price
  - Listed / unlisted status
- Attach materials directly to products through a BOM (bill of materials)
- View products in live tables with detail and edit drawers
- Product cost and margin foundations via BOM-linked material cost

### Materials
- Track materials including:
  - Filament
  - Hardware
  - Packaging and miscellaneous supplies
- Store:
  - quantity on hand
  - reorder point
  - cost per unit
  - supplier
  - brand / finish / type / color
  - unit of measure
- Low-stock alerts and inventory health classification

### Purchase Orders
- Create and manage purchase orders
- Add line items directly to purchase orders
- Track:
  - PO number
  - supplier
  - status
  - ordered date
  - received date
  - total cost
- Validate purchase-order workflow rules by status
- Track received purchase orders as restocking events in dashboard activity

### Dashboard / Insights
- Dashboard stat cards for:
  - listed products
  - total materials
  - low stock
  - open orders
  - inventory value
- Recent activity feed powered by real inventory events
- Insights page for inventory health:
  - low stock
  - near reorder
  - overstocked
  - healthy
 
### Settings
- Basic settings page with workspace/profile placeholders
- Dark mode support
- Settings structure ready for future authentication and user preferences

---

## Tech Stack

### Backend
- Python
- FastAPI
- psycopg (raw SQL, no ORM)

### Frontend
- React
- Vite
- Tailwind CSS
- Component-based UI with a frontend service layer using `fetch`

### Database
- PostgreSQL
- Custom SQL schema
- Explicit constraints and indexes

---

## Architecture Overview

- **PostgreSQL** stores all application data
- **Raw SQL repositories** isolate all database access
- **FastAPI** exposes REST API endpoints
- **React frontend** consumes the API through a centralized service layer
- Frontend and backend run separately in local development

---

## Project Structure

```text
mountory-inventory/
  frontend/
    src/
      components/        # UI components
      hooks/             # Custom React hooks
      lib/               # Shared frontend helpers
      pages/             # Top-level app pages
      services/          # Frontend API/data layer
      utils/             # Utility functions
    index.html
    package.json
    vite.config.js
    tailwind.config.js
    vercel.json
  server/
    init/                # First-run DB initialization scripts
    main.py              # FastAPI app and API routes
    db.py                # PostgreSQL connection helpers
    repositories.py      # Raw SQL repository layer
    schema.sql           # Full reset / rebuild schema
    bootstrap.sql        # Safe repeatable schema updater
  docker-compose.yml     # Local PostgreSQL container
  requirements.txt       # Backend dependencies
  README.md
```

---

## Getting Started

### Live Demo

A hosted version of the app is available here:

```text
https://mountory-inventory.vercel.app/
```

---

### Local Development

### Prerequisites
- Python 3.11+
- Docker
- Node.js + npm
- Git

---

### Setup

Clone the repository:

Using HTTPS:
```bash
git clone https://github.com/MaxW125/mountory-inventory.git
cd mountory-inventory
```

Using SSH:
```bash
git clone git@github.com:MaxW125/mountory-inventory.git
cd mountory-inventory
```

Start Docker containers:
```bash
docker compose up -d
```

Create and activate a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install backend dependencies:
```bash
pip install -r requirements.txt
```

Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

Run the backend server:
```bash
python3 -m uvicorn server.main:app --reload
```

In a second terminal, run the frontend:
```bash
cd frontend
npm run dev
```

Open the frontend using the local URL shown by Vite in the terminal output, typically:
```text
http://127.0.0.1:5173
or
http://localhost:5173/
```

### Existing Local Database

If you already have a local database from an older version of the project, run the bootstrap script to apply safe schema updates without wiping your data:
```bash
docker compose exec -T postgres psql -U inventory_user -d inventory_db < server/bootstrap.sql
```

### Full Local Reset

To completely rebuild the local database from scratch:

```bash
docker compose down -v
docker compose up -d
```

### Shutting Down

When you are done, stop the backend and frontend servers in their terminals with:
```bash
Ctrl + C
```

Then stop Docker containers:
```bash
docker compose down
```

To deactivate the virtual environment:
```bash
deactivate
```

---

## API Endpoints

### Products
- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/{product_id}`
- `DELETE /api/products/{product_id}`
- `PATCH /api/products/{product_id}/listed`
- `GET /api/products/{product_id}/materials`
- `POST /api/products/{product_id}/materials`
- `DELETE /api/products/{product_id}/materials/{material_id}`

### Materials
- `GET /api/materials`
- `POST /api/materials`
- `PATCH /api/materials/{material_id}`
- `DELETE /api/materials/{material_id}`

### Product Departments
- `GET /api/product-departments`
- `POST /api/product-departments`
- `DELETE /api/product-departments/{department_id}`

### Material Units
- `GET /api/material-units`
- `POST /api/material-units`
- `DELETE /api/material-units/{unit_id}`

### Purchase Orders
- `GET /api/purchase-orders`
- `POST /api/purchase-orders`
- `PATCH /api/purchase-orders/{po_id}`
- `DELETE /api/purchase-orders/{po_id}`
- `GET /api/purchase-orders/{po_id}/items`
- `POST /api/purchase-orders/{po_id}/items`
- `DELETE /api/purchase-orders/{po_id}/items/{material_id}`

---

## Design Philosophy

This project emphasizes:

- Minimal dependencies
- Explicit SQL over ORMs
- Clear separation of concerns
- Predictable data flow
- Readable, extensible backend architecture
- Production-minded schema design

The goal is correctness, clarity, and extensibility over abstraction.

---

## TODO

- Add authentication
- Separate hosted demo/user data so each environment or user does not share the same database
- Automatically deduct material inventory when products are sold
- Expand profit tracking features
- Add an orders page for customer orders and fulfillment
- When a purchase order is marked as received, add quantity to material stock
- Fix unit conversion between product BOM usage and material stock units
- Allow custom thresholds for low stock, near reorder, overstock, and healthy in Insights

---

## License

This project is intended for educational and portfolio purposes.
