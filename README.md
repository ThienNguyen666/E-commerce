# E-Commerce Web App

A full-stack e-commerce application designed to demonstrate **real-world backend architecture**, combining **OracleDB (transactional system)** and **Redis (high-speed caching)**.

## Features

- **Product Management**  
  Create, update, delete products with relational constraints.

- **Advanced Search**  
  Filter products by name, price range, and category using indexed queries.

- **Shopping Cart (Redis)**  
  Store user carts in Redis for fast read/write and reduced database load.

- **Order Placement**  
  Ensure safe transactions in Oracle (stock update + order creation).

- **Inventory Tracking**  
  Automatically update stock when orders are placed.

- **Voucher System**  
  Apply discounts based on order conditions using SQL subqueries.

- **Reviews & Ratings**  
  Users can rate and comment on products.

- **Sales Analytics**  
  Revenue reports by category or time using SQL aggregation (SUM, AVG).

## Tech Stack

- **Backend:** Node.js (Express)
- **Frontend:** React.js
- **Database:** OracleDB (Relational, ACID compliance)
- **Cache:** Redis (In-memory data store)

## Architecture

- **OracleDB**
  - Source of truth for transactional data (orders, users, products)
  - Ensures ACID compliance

- **Redis**
  - Handles high-frequency operations (shopping cart)
  - Reduces database load
  - Improves response time

- **Application Layer**
  - Handles business logic
  - Coordinates between OracleDB and Redis

## Getting Started

### 1. Setup Oracle Database

1. Login Oracle Database as SYS

2. Run schema & seed scripts:
```bash
database/oracle/e-commerce-schema.sql
database/oracle/e-commerce-data.sql
```

### 2. Start Redis

1. Start Docker Desktop
2. Open PowerShell or CMD and run:

####  First time setup (create Redis container)

```bash
# Specify your Redis version
docker run -d --name redis -p 6379:6379 redis:<version>

# Example
# docker run -d --name redis -p 6379:6379 redis:8.6
```

#### Start Redis (next times)

```bash
docker start redis
```

#### Access Redis CLI

```bash
docker exec -it redis redis-cli
```

### 3. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 4. Environment Variables
Create a `.env` file in the backend folder:

```env
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=
PORT=3000
NODE_ENV=development

# ================== ORACLE DB ==================
ORACLE_USER=SYS
ORACLE_PASSWORD=your_password
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SERVICE_NAME=FREE
ORACLE_PRIVILEGE=SYSDBA

# ================== REDIS ==================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

ADMIN_EMAILS=
```

### 5. Run Application

Start backend and frontend in separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev

```
**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3000

## Notes

* Redis is used to optimize high-frequency operations like cart management.
* Oracle ensures data consistency for transactions such as order placement.

