-- SAFE DROP (ignore error if tables do not exist)
BEGIN EXECUTE IMMEDIATE 'DROP TABLE Voucher_Usage CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE Reviews CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE Order_Items CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE Orders CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE Products CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE Users CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE Categories CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/
BEGIN EXECUTE IMMEDIATE 'DROP TABLE Vouchers CASCADE CONSTRAINTS'; EXCEPTION WHEN OTHERS THEN NULL; END;
/

-- 1. Categories Table
CREATE TABLE Categories (
    category_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category_name VARCHAR2(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE Users (
    user_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name VARCHAR2(255) NOT NULL,
    email VARCHAR2(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_email_format CHECK (REGEXP_LIKE(email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'))
);

-- 3. Products Table
CREATE TABLE Products (
    product_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(255) NOT NULL,
    price NUMBER(12, 2) NOT NULL,
    stock_quantity INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prod_category FOREIGN KEY (category_id) REFERENCES Categories(category_id),
    CONSTRAINT chk_prod_price CHECK (price >= 0),
    CONSTRAINT chk_prod_stock CHECK (stock_quantity >= 0)
);

-- 4. Vouchers Table
CREATE TABLE Vouchers (
    voucher_id      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code            VARCHAR2(50) NOT NULL UNIQUE,
    discount_type   VARCHAR2(10) NOT NULL,
    discount_value  NUMBER(12,2) NOT NULL,
    min_order_value NUMBER(12,2) DEFAULT 0 NOT NULL,
    max_uses        INT DEFAULT NULL,
    used_count      INT DEFAULT 0 NOT NULL,
    expires_at      TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    is_active       NUMBER(1) DEFAULT 1 NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_discount_type  CHECK (discount_type IN ('percent','fixed')),
    CONSTRAINT chk_discount_value CHECK (discount_value > 0),
    CONSTRAINT chk_min_order      CHECK (min_order_value >= 0)
);

-- 5. Orders Table (includes voucher fields from additions)
CREATE TABLE Orders (
    order_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT NOT NULL,
    voucher_id INT DEFAULT NULL,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMBER(12, 2) DEFAULT 0 NOT NULL,
    discount_amount NUMBER(12,2) DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES Users(user_id),
    CONSTRAINT fk_order_voucher FOREIGN KEY (voucher_id) REFERENCES Vouchers(voucher_id),
    CONSTRAINT chk_order_total CHECK (total_amount >= 0)
);

-- 6. Order_Items Table
CREATE TABLE Order_Items (
    item_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMBER(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_order FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES Products(product_id),
    CONSTRAINT uq_order_product UNIQUE (order_id, product_id),
    CONSTRAINT chk_item_qty CHECK (quantity > 0),
    CONSTRAINT chk_item_price CHECK (unit_price >= 0)
);

-- 7. Voucher_Usage Table
CREATE TABLE Voucher_Usage (
    usage_id    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    voucher_id  INT NOT NULL,
    user_id     INT NOT NULL,
    order_id    INT NOT NULL,
    used_at     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vu_voucher FOREIGN KEY (voucher_id) REFERENCES Vouchers(voucher_id),
    CONSTRAINT fk_vu_user    FOREIGN KEY (user_id)    REFERENCES Users(user_id),
    CONSTRAINT fk_vu_order   FOREIGN KEY (order_id)   REFERENCES Orders(order_id),
    CONSTRAINT uq_user_voucher UNIQUE (voucher_id, user_id)
);

-- 8. Reviews Table
CREATE TABLE Reviews (
    review_id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id  INT NOT NULL,
    user_id     INT NOT NULL,
    rating      INT NOT NULL,
    comments   VARCHAR2(2000),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rev_product FOREIGN KEY (product_id) REFERENCES Products(product_id),
    CONSTRAINT fk_rev_user    FOREIGN KEY (user_id)    REFERENCES Users(user_id),
    CONSTRAINT chk_rating     CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT uq_user_product_review UNIQUE (product_id, user_id)
);