SET SERVEROUTPUT ON;

-- Seed sample vouchers
INSERT INTO Vouchers (code, discount_type, discount_value, min_order_value, max_uses)
VALUES ('SAVE10', 'percent', 10, 50, 100);

INSERT INTO Vouchers (code, discount_type, discount_value, min_order_value, max_uses)
VALUES ('FLAT20', 'fixed', 20, 100, 50);

INSERT INTO Vouchers (code, discount_type, discount_value, min_order_value, max_uses)
VALUES ('NEWUSER', 'percent', 15, 0, 1000);

COMMIT;

DECLARE
    TYPE t_str_array IS TABLE OF VARCHAR2(100);

    v_first_names t_str_array := t_str_array('John','Jane','Michael','Emily','Chris','Sarah','David','Ashley','James','Jessica','Nguyen','Tran','Le','Pham','Hoang','Phan','Vu','Dang','Bui','Do');
    v_last_names  t_str_array := t_str_array('Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','An','Binh','Chi','Dung','Giang','Hung','Khanh','Linh','Minh','Nam');
    v_cat_names   t_str_array := t_str_array('Smartphones','Laptops','Tablets','Audio','Wearables','Cameras','Gaming','Accessories','Home Appliances','Monitors','Printers','Networking','Software','Storage','Components','TVs','Smart Home','Office','Drones','E-readers');
    v_prod_prefix t_str_array := t_str_array('Pro','Ultra','Max','Air','Lite','Elite','Smart','Xtreme','Classic','NextGen');
    v_prod_suffix t_str_array := t_str_array('X1','S2','Z3','V4','Plus','Edge','Focus','Core','Prime','Titan');

    v_user_id     NUMBER;
    v_cat_id      NUMBER;
    v_prod_id     NUMBER;
    v_order_id    NUMBER;
    v_price       NUMBER(12,2);
    v_order_total NUMBER(12,2);
    v_item_qty    NUMBER;
    v_num_items   NUMBER;
    v_rand_val    NUMBER;

BEGIN
    DBMS_OUTPUT.PUT_LINE('Start seeding...');

    ----------------------------------------------------------------------------
    -- 1. Categories
    ----------------------------------------------------------------------------
    FOR i IN 1..v_cat_names.COUNT LOOP
        INSERT INTO Categories (category_name)
        VALUES (v_cat_names(i));
    END LOOP;

    ----------------------------------------------------------------------------
    -- 2. Users
    ----------------------------------------------------------------------------
    FOR i IN 1..1000 LOOP
        INSERT INTO Users (full_name, email)
        VALUES (
            v_first_names(TRUNC(DBMS_RANDOM.VALUE(1,21))) || ' ' ||
            v_last_names(TRUNC(DBMS_RANDOM.VALUE(1,21))),
            LOWER(DBMS_RANDOM.STRING('a',5)) || i || '@example.com'
        );
    END LOOP;

    ----------------------------------------------------------------------------
    -- 3. Products
    ----------------------------------------------------------------------------
    FOR i IN 1..5000 LOOP
        v_cat_id := TRUNC(DBMS_RANDOM.VALUE(1,21));

        INSERT INTO Products (name, price, stock_quantity, category_id)
        VALUES (
            v_prod_prefix(TRUNC(DBMS_RANDOM.VALUE(1,11))) || ' ' ||
            v_cat_names(v_cat_id) || ' ' ||
            v_prod_suffix(TRUNC(DBMS_RANDOM.VALUE(1,11))) || ' #' || i,
            ROUND(DBMS_RANDOM.VALUE(10,2000),2),
            TRUNC(DBMS_RANDOM.VALUE(0,500)),
            v_cat_id
        );
    END LOOP;

    ----------------------------------------------------------------------------
    -- 4. Orders + Order_Items
    ----------------------------------------------------------------------------
    FOR i IN 1..10000 LOOP

        -- Heavy user logic
        v_rand_val := DBMS_RANDOM.VALUE;
        IF v_rand_val < 0.4 THEN
            v_user_id := TRUNC(DBMS_RANDOM.VALUE(1,101));
        ELSE
            v_user_id := TRUNC(DBMS_RANDOM.VALUE(101,1001));
        END IF;

        INSERT INTO Orders (user_id, order_date, total_amount)
        VALUES (
            v_user_id,
            SYSTIMESTAMP - DBMS_RANDOM.VALUE(0,365),
            0
        ) RETURNING order_id INTO v_order_id;

        v_num_items := TRUNC(DBMS_RANDOM.VALUE(1,6));
        v_order_total := 0;

        FOR j IN 1..v_num_items LOOP

            BEGIN
                -- RANDOM product_id đảm bảo tồn tại
                SELECT product_id, price
                INTO v_prod_id, v_price
                FROM (
                    SELECT product_id, price
                    FROM Products
                    ORDER BY DBMS_RANDOM.VALUE
                )
                WHERE ROWNUM = 1;

                v_item_qty := TRUNC(DBMS_RANDOM.VALUE(1,4));

                INSERT INTO Order_Items (order_id, product_id, quantity, unit_price)
                VALUES (v_order_id, v_prod_id, v_item_qty, v_price);

                v_order_total := v_order_total + (v_item_qty * v_price);

            EXCEPTION
                WHEN DUP_VAL_ON_INDEX THEN
                    NULL;
            END;

        END LOOP;

        UPDATE Orders
        SET total_amount = v_order_total
        WHERE order_id = v_order_id;

        -- commit batch để tránh undo lớn
        IF MOD(i, 1000) = 0 THEN
            COMMIT;
            DBMS_OUTPUT.PUT_LINE('Inserted ' || i || ' orders...');
        END IF;

    END LOOP;

    COMMIT;

    DBMS_OUTPUT.PUT_LINE('DONE!');
END;
/

ALTER TABLE Users ADD hashed_password VARCHAR2(255);
UPDATE Users SET hashed_password = '$2b$10$LHTYQWrH7cPASbqvIKymEuSb2woBvHBn/FEGOa1oXyL7zVcEvDka6';
ALTER TABLE Users MODIFY hashed_password VARCHAR2(255) NOT NULL;

--------------------------------------------------------------------------------
-- 2. PERFORMANCE BENCHMARKING (INDEX VS NO INDEX)
--------------------------------------------------------------------------------

-- Scenario: Complex JOIN + Aggregate on large dataset
-- Step A: Without specific performance indexes (Only PK/FK indexes)
EXPLAIN PLAN FOR
SELECT c.category_name, SUM(oi.quantity * oi.unit_price) as revenue
FROM Categories c
JOIN Products p ON c.category_id = p.category_id
JOIN Order_Items oi ON p.product_id = oi.product_id
GROUP BY c.category_name
ORDER BY revenue DESC;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Step B: Create Optimization Indexes
CREATE INDEX idx_oi_product_id ON Order_Items(product_id);
CREATE INDEX idx_products_cat_id ON Products(category_id);

-- Step C: Re-run explain plan to see improvement (Hash Join/Index Scan vs Full Scan)
EXPLAIN PLAN FOR
SELECT c.category_name, SUM(oi.quantity * oi.unit_price) as revenue
FROM Categories c
JOIN Products p ON c.category_id = p.category_id
JOIN Order_Items oi ON p.product_id = oi.product_id
GROUP BY c.category_name
ORDER BY revenue DESC;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Scenario: Search performance on SKU names
EXPLAIN PLAN FOR
SELECT * FROM Products WHERE name LIKE 'Pro%';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Create B-Tree index for prefix search
CREATE INDEX idx_products_name ON Products(name);

EXPLAIN PLAN FOR
SELECT * FROM Products WHERE name LIKE 'Pro%';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

SELECT COUNT(*) FROM Users;
SELECT COUNT(*) FROM Products;
SELECT COUNT(*) FROM Orders;
SELECT COUNT(*) FROM Order_Items;