# Stockify Backend

A Node.js/Express REST API for the Stockify inventory management system, backed by MongoDB and Cloudinary.

## Tech Stack

- **Node.js / Express** — Web framework
- **MongoDB / Mongoose** — Database and ODM
- **JWT** — Authentication
- **Bcryptjs** — Password hashing
- **Multer** — File upload handling
- **Cloudinary** — Cloud storage for product images and PDF invoices
- **PDFKit** — PDF invoice generation
- **Joi** — Request validation
- **Node-cron** — Scheduled background jobs

## Project Structure

```
src/
├── config/
│   └── db.js                   # MongoDB connection
├── controllers/
│   ├── userController.js        # Register, login, update profile
│   ├── adminController.js       # Password reset flow
│   ├── productController.js     # Product CRUD, CSV upload, buy simulation
│   ├── invoiceController.js     # Invoice view, download, status, delete
│   └── homeController.js        # Dashboard stats and chart data
├── middleware/
│   ├── isAuth.js                # JWT authentication guard
│   ├── upload.js                # Multer config for images and CSV
│   ├── validateRequest.js       # Joi validation middleware factory
│   └── validateUpdateQuantity.js# Product quantity validator
├── models/
│   ├── userSchema.js
│   ├── productSchema.js
│   ├── invoiceSchema.js
│   └── statisticsSchema.js
├── routes/
│   ├── userRoutes.js
│   ├── adminRoutes.js
│   ├── productRoutes.js
│   ├── invoiceRoutes.js
│   └── homeRoutes.js
├── utils/
│   ├── cloudinary.js            # Cloudinary upload helper
│   ├── generateInvoiceHTML.js   # HTML invoice template generator
│   └── generatePDF.js           # PDF invoice generator (PDFKit)
├── validations/
│   ├── userValidation.js
│   └── productValidation.js
├── jobs/
│   └── productCron.js           # Daily expired/zero-unit product cleanup
└── app.js                       # Express app setup and route mounting
server.js                        # Entry point — DB connect + server start
```

## API Reference

All protected routes require the header:
```
Authorization: Bearer <token>
```

### Auth (`/api/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/users/register` | No | Register a new user |
| POST | `/api/users/login` | No | Login and receive JWT |
| PUT | `/api/users/update-user` | No | Update name or password |

### Password Reset (`/api/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/reset-password` | No | Check if user exists by email |
| POST | `/api/admin/change-password` | No | Set new password by email |

### Products (`/api/products`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products/get-products` | Yes | Paginated product list + inventory stats |
| POST | `/api/products/add-product` | Yes | Add single product with image |
| POST | `/api/products/upload-csv` | Yes | Bulk import products from CSV |
| PATCH | `/api/products/update-quantity/:id` | Yes | Simulate buy — deduct stock and create invoice |

### Invoices (`/api/invoices`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/invoices/get-invoices` | Yes | Paginated invoice list + stats |
| GET | `/api/invoices/view/:id` | Yes | Returns invoice as rendered HTML |
| GET | `/api/invoices/download/:id` | Yes | Redirects to PDF download URL |
| PATCH | `/api/invoices/update-status/:id` | Yes | Toggle Paid / Unpaid |
| DELETE | `/api/invoices/delete/:id` | Yes | Delete invoice |

### Home Dashboard (`/api/home`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/home/stats` | Yes | KPIs: revenue, units sold, profit, top products |
| GET | `/api/home/chart` | Yes | Time-series chart data (weekly / monthly / yearly) |

## Data Models

### User
| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Required |
| `email` | String | Required, unique |
| `password` | String | Bcrypt hashed |

### Product
| Field | Type | Notes |
|-------|------|-------|
| `name` | String | Required |
| `productId` | String | Required, unique |
| `category` | String | Required |
| `price` | Number | Required |
| `quantity` | String | Unit label e.g. `Packets`, `Kg` |
| `unit` | Number | Units in stock |
| `expiryDate` | Date | Required |
| `thresholdValue` | Number | Low stock trigger level |
| `stockDetails` | String | Auto-calculated: `In-stock`, `Low stock`, `Out of stock`, `Expired` |
| `image` | String | Cloudinary URL |
| `createdBy` | ObjectId | Ref: User |

### Invoice
| Field | Type | Notes |
|-------|------|-------|
| `invoiceId` | String | Auto-generated: `INV-1001`, `INV-1002`, ... |
| `product` | ObjectId | Ref: Product |
| `user` | ObjectId | Ref: User |
| `unitsBought` | Number | Units purchased |
| `amount` | Number | Total including 15% tax |
| `status` | String | `Unpaid` (default) or `Paid` |
| `dueDate` | Date | Auto-set to 10 days after creation |
| `pdfPath` | String | Cloudinary URL to PDF |
| `htmlPath` | String | Cloudinary URL to HTML |

### Statistics
| Field | Type | Notes |
|-------|------|-------|
| `product` | ObjectId | Ref: Product |
| `user` | ObjectId | Ref: User |
| `status` | String | `Purchase` or `Sell` |
| `unit` | Number | Units transacted |
| `amount` | Number | Transaction amount |

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the `Backend` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Running the Server

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

## CSV Bulk Upload Format

Required columns (order does not matter):

| Column | Type | Description |
|--------|------|-------------|
| `name` | string | Product name |
| `productId` | string | Unique product identifier |
| `category` | string | Product category |
| `price` | number | Price per unit |
| `quantity` | string | Unit label (e.g. `Packets`, `Kg`) |
| `unit` | number | Number of units in stock |
| `expiryDate` | date | e.g. `2026-12-31` |
| `thresholdValue` | number | Low stock trigger level |
| `image` | string | Product image URL |

### Example

```csv
name,productId,category,price,quantity,unit,expiryDate,thresholdValue,image
Maggi,PROD-001,Food & Beverages,430,Packets,100,2026-12-31,10,https://example.com/maggi.jpg
Red Bull,PROD-002,Beverages,405,Cans,50,2026-06-30,5,https://example.com/redbull.jpg
```

## Background Jobs

A cron job runs daily at **23:59:59**:
- Marks products as `Expired` if their `expiryDate` has passed
- Deletes products with `unit <= 0` (out-of-stock cleanup)

## Business Logic Notes

- **Stock status** is auto-calculated on every product save via a Mongoose pre-save hook
- **Invoice amount** = `(units × price) × 1.15` (15% tax)
- **Invoice ID** is auto-incremented starting from `INV-1001`
- **Due date** is automatically set to 10 days after invoice creation
- All product and invoice data is scoped to the authenticated user
- Pagination is fixed at **10 items per page** across all list endpoints
