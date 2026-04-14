# 🗄️ Database Schema

## Database Overview

**Database Engine**: Oracle Database 26ai  
**Character Set**: AL32UTF8  
**Tables**: 12 core tables + indexes  
**Procedures**: 15+ PL/SQL procedures

---

## Core Tables

### 1. USERS

```sql
CREATE TABLE users (
  user_id          NUMBER PRIMARY KEY,
  email            VARCHAR2(100) UNIQUE NOT NULL,
  password_hash    VARCHAR2(255) NOT NULL,
  first_name       VARCHAR2(50),
  last_name        VARCHAR2(50),
  phone            VARCHAR2(20),
  role             VARCHAR2(20) DEFAULT 'customer',
  is_active        CHAR(1) DEFAULT 'Y',
  created_at       TIMESTAMP DEFAULT SYSTIMESTAMP,
  updated_at       TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Columns**:
- `user_id`: Unique identifier (auto-increment)
- `email`: User email (unique constraint)
- `password_hash`: Hashed password
- `role`: 'admin', 'customer', 'seller'
- `is_active`: Account status

---

### 2. PRODUCTS

```sql
CREATE TABLE products (
  product_id       NUMBER PRIMARY KEY,
  name             VARCHAR2(200) NOT NULL,
  description      CLOB,
  price            NUMBER(10,2) NOT NULL,
  cost             NUMBER(10,2),
  category_id      NUMBER,
  seller_id        NUMBER REFERENCES users(user_id),
  image_url        VARCHAR2(500),
  sku              VARCHAR2(50) UNIQUE,
  status           VARCHAR2(20) DEFAULT 'active',
  created_at       TIMESTAMP DEFAULT SYSTIMESTAMP,
  updated_at       TIMESTAMP DEFAULT SYSTIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_sku ON products(sku);
```

---

### 3. INVENTORY

```sql
CREATE TABLE inventory (
  inventory_id     NUMBER PRIMARY KEY,
  product_id       NUMBER REFERENCES products(product_id),
  quantity         NUMBER NOT NULL,
  reserved         NUMBER DEFAULT 0,
  available        NUMBER GENERATED ALWAYS AS (quantity - reserved),
  warehouse_id     NUMBER,
  last_updated     TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_inventory_product ON inventory(product_id);
CREATE UNIQUE INDEX idx_inventory_product_warehouse ON inventory(product_id, warehouse_id);
```

---

### 4. CATEGORIES

```sql
CREATE TABLE categories (
  category_id      NUMBER PRIMARY KEY,
  name             VARCHAR2(100) NOT NULL,
  description      VARCHAR2(500),
  parent_id        NUMBER REFERENCES categories(category_id),
  is_active        CHAR(1) DEFAULT 'Y',
  created_at       TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
```

---

### 5. CARTS

```sql
CREATE TABLE carts (
  cart_id          NUMBER PRIMARY KEY,
  user_id          NUMBER REFERENCES users(user_id),
  created_at       TIMESTAMP DEFAULT SYSTIMESTAMP,
  updated_at       TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_carts_user ON carts(user_id);
```

---

### 6. CART_ITEMS

```sql
CREATE TABLE cart_items (
  cart_item_id     NUMBER PRIMARY KEY,
  cart_id          NUMBER REFERENCES carts(cart_id) ON DELETE CASCADE,
  product_id       NUMBER REFERENCES products(product_id),
  quantity         NUMBER NOT NULL CHECK (quantity > 0),
  unit_price       NUMBER(10,2) NOT NULL,
  added_at         TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);
```

---

### 7. ORDERS

```sql
CREATE TABLE orders (
  order_id         NUMBER PRIMARY KEY,
  user_id          NUMBER REFERENCES users(user_id),
  order_number     VARCHAR2(50) UNIQUE NOT NULL,
  status           VARCHAR2(20) DEFAULT 'pending',
  total_amount     NUMBER(12,2) NOT NULL,
  shipping_cost    NUMBER(10,2) DEFAULT 0,
  tax_amount       NUMBER(10,2) DEFAULT 0,
  discount_amount  NUMBER(10,2) DEFAULT 0,
  payment_method   VARCHAR2(50),
  payment_status   VARCHAR2(20) DEFAULT 'pending',
  created_at       TIMESTAMP DEFAULT SYSTIMESTAMP,
  updated_at       TIMESTAMP DEFAULT SYSTIMESTAMP,
  shipped_at       TIMESTAMP,
  delivered_at     TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at);
```

**Status Values**: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`

---

### 8. ORDER_ITEMS

```sql
CREATE TABLE order_items (
  order_item_id    NUMBER PRIMARY KEY,
  order_id         NUMBER REFERENCES orders(order_id) ON DELETE CASCADE,
  product_id       NUMBER REFERENCES products(product_id),
  quantity         NUMBER NOT NULL,
  unit_price       NUMBER(10,2) NOT NULL,
  discount         NUMBER(10,2) DEFAULT 0,
  subtotal         GENERATED ALWAYS AS (quantity * unit_price - discount)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

---

### 9. PAYMENTS

```sql
CREATE TABLE payments (
  payment_id       NUMBER PRIMARY KEY,
  order_id         NUMBER REFERENCES orders(order_id),
  user_id          NUMBER REFERENCES users(user_id),
  amount           NUMBER(12,2) NOT NULL,
  payment_method   VARCHAR2(50) NOT NULL,
  status           VARCHAR2(20) DEFAULT 'pending',
  transaction_id   VARCHAR2(100) UNIQUE,
  created_at       TIMESTAMP DEFAULT SYSTIMESTAMP,
  processed_at     TIMESTAMP
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
```

---

### 10. REVIEWS

```sql
CREATE TABLE reviews (
  review_id        NUMBER PRIMARY KEY,
  product_id       NUMBER REFERENCES products(product_id),
  user_id          NUMBER REFERENCES users(user_id),
  rating           NUMBER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  title            VARCHAR2(100),
  comment          CLOB,
  verified_purchase CHAR(1) DEFAULT 'N',
  helpful_count    NUMBER DEFAULT 0,
  created_at       TIMESTAMP DEFAULT SYSTIMESTAMP,
  updated_at       TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
```

---

### 11. ADDRESSES

```sql
CREATE TABLE addresses (
  address_id       NUMBER PRIMARY KEY,
  user_id          NUMBER REFERENCES users(user_id),
  type             VARCHAR2(20),
  street           VARCHAR2(200) NOT NULL,
  city             VARCHAR2(50) NOT NULL,
  state            VARCHAR2(50),
  postal_code      VARCHAR2(20) NOT NULL,
  country          VARCHAR2(50) NOT NULL,
  is_default       CHAR(1) DEFAULT 'N',
  created_at       TIMESTAMP DEFAULT SYSTIMESTAMP
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
```

---

### 12. AUDIT_LOG

```sql
CREATE TABLE audit_log (
  log_id           NUMBER PRIMARY KEY,
  user_id          NUMBER REFERENCES users(user_id),
  action           VARCHAR2(50) NOT NULL,
  entity_type      VARCHAR2(50) NOT NULL,
  entity_id        NUMBER NOT NULL,
  old_values       CLOB,
  new_values       CLOB,
  timestamp        TIMESTAMP DEFAULT SYSTIMESTAMP,
  ip_address       VARCHAR2(50)
);

CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_user ON audit_log(user_id);
```

---

## Key PL/SQL Procedures

### CREATE_ORDER Procedure

```sql
CREATE OR REPLACE PROCEDURE create_order(
  p_user_id IN NUMBER,
  p_order_number OUT VARCHAR2,
  p_error_code OUT VARCHAR2
) AS
  v_order_id NUMBER;
  v_cart_total NUMBER := 0;
BEGIN
  -- Generate order number
  SELECT TO_CHAR(SYSDATE, 'YYYYMMDD') || '-' || orders_seq.NEXTVAL
  INTO p_order_number FROM DUAL;
  
  -- Create order
  INSERT INTO orders (order_id, user_id, order_number, status, total_amount)
  SELECT orders_id_seq.NEXTVAL, p_user_id, p_order_number, 'pending', 
         SUM(quantity * unit_price)
  FROM cart_items ci
  JOIN carts c ON ci.cart_id = c.cart_id
  WHERE c.user_id = p_user_id
  RETURNING order_id INTO v_order_id;
  
  -- Copy cart items to order items
  INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price)
  SELECT order_items_id_seq.NEXTVAL, v_order_id, ci.product_id, ci.quantity, ci.unit_price
  FROM cart_items ci
  JOIN carts c ON ci.cart_id = c.cart_id
  WHERE c.user_id = p_user_id;
  
  -- Update inventory
  UPDATE inventory
  SET quantity = quantity - (SELECT quantity FROM order_items WHERE order_id = v_order_id)
  WHERE product_id IN (SELECT product_id FROM order_items WHERE order_id = v_order_id);
  
  -- Clear cart
  DELETE FROM cart_items WHERE cart_id IN 
    (SELECT cart_id FROM carts WHERE user_id = p_user_id);
  
  COMMIT;
  p_error_code := 'SUCCESS';
  
EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    p_error_code := 'ERROR: ' || SQLERRM;
END create_order;
/
```

---

## Relationships Diagram

```
USERS ──────┬──────── CARTS ──────── CART_ITEMS ──────┐
            │                              │            │
            │                              └─► PRODUCTS ◄┤
            │                                           │
            ├──────── ORDERS ──────── ORDER_ITEMS ─────┤
            │             │                            │
            │             └──────── PAYMENTS           │
            │                                          │
            ├──────── ADDRESSES                        │
            │                                          │
            ├──────── REVIEWS ─────────────────────────┘
            │
            └──────── AUDIT_LOG
```

---

## Sequence Diagrams

### Place Order Sequence

```
User → Frontend → Backend → Oracle → Redis
  │       │          │         │        │
  ├─────► │          │         │        │
  │       ├─────────► │         │        │
  │       │          ├────────► │        │
  │       │          │          ├──────► │
  │       │          │          │        (Cache updated)
  │       │          ◄──────────┤        │
  │       ◄──────────┤          │        │
  │       (Redirect) │          │        │
  └◄──────           │          │        │
```

---

## Indexes Strategy

| Table | Index | Columns | Type | Purpose |
|-------|-------|---------|------|---------|
| users | idx_users_email | email | UNIQUE | Auth lookup |
| products | idx_products_category | category_id | BTREE | Category browsing |
| orders | idx_orders_status | status | BTREE | Status filtering |
| orders | idx_orders_created | created_at | BTREE | Date range queries |
| inventory | idx_inventory_product | product_id | UNIQUE | Stock lookup |
| reviews | idx_reviews_product | product_id | BTREE | Product reviews |

---

## Performance Considerations

1. **Partitioning**: Orders table by date
2. **Compression**: Archive old orders
3. **Statistics**: Update column statistics regularly
4. **Hints**: Use /*+ */ hints for complex queries
5. **Materialized Views**: For analytics

---

**Last Updated:** 2026-04-13