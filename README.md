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
- **Database:** OracleDB
- **Cache:** Redis

## Architecture

- **OracleDB** → Source of truth (orders, products, users)  
- **Redis** → Cache layer (shopping cart, frequently accessed data)

## Getting Started

### 1. Setup Database
Run the SQL scripts:

```bash
database/oracle/e-commerce-schema.sql
database/oracle/e-commerce-data.sql
````

### 2. Start Redis

```bash
redis-server
```

### 3. Run Application

```bash
npm install

# setup .env (Oracle + Redis)

cd backend
npm run dev

cd ../frontend
npm run dev
```

## Notes

* Redis is used to optimize high-frequency operations like cart management.
* Oracle ensures data consistency for transactions such as order placement.

