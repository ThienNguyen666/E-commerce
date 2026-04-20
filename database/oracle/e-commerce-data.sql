--SET SERVEROUTPUT ON;

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

DECLARE
    -- Mảng lời khen (Positive)
    TYPE t_text_array IS TABLE OF VARCHAR2(500);
    v_pos_comments t_text_array := t_text_array(
        'Sản phẩm tuyệt vời, đóng gói rất kỹ lưỡng.',
        'Chất lượng vượt mong đợi, giao hàng nhanh chóng.',
        'Rất đáng đồng tiền bát gạo, sẽ ủng hộ shop dài dài.',
        'Hàng chính hãng, dùng rất mượt mà và ổn định.',
        'Thiết kế đẹp, cầm rất chắc tay, màu sắc y như hình.',
        'Nhân viên tư vấn nhiệt tình, sản phẩm quá ổn trong tầm giá.',
        'Vừa nhận được hàng, test qua thấy rất tốt, 5 sao cho shop!',
        'Giao hàng siêu tốc, đóng gói cẩn thận, sản phẩm rất ưng ý.'
    );

    -- Mảng trung bình (Neutral)
    v_neu_comments t_text_array := t_text_array(
        'Sản phẩm dùng tạm được, giao hàng hơi chậm một chút.',
        'Chất lượng tương xứng với giá tiền, không có gì phàn nàn.',
        'Mọi thứ ổn, nhưng hộp hơi móp do vận chuyển.',
        'Hàng dùng ok, nhưng màu sắc ngoài thực tế hơi nhạt hơn ảnh.',
        'Sản phẩm bình thường, chưa có gì quá nổi bật.'
    );

    -- Mảng lời chê (Negative)
    v_neg_comments t_text_array := t_text_array(
        'Chất lượng kém, không giống như mô tả.',
        'Giao sai màu, làm việc thiếu chuyên nghiệp.',
        'Sản phẩm mới dùng 2 ngày đã có dấu hiệu hỏng.',
        'Đóng gói quá sơ sài, hàng bị trầy xước nhiều.',
        'Quá thất vọng, giá cao mà chất lượng không ra gì.'
    );

    v_rating      INT;
    v_comment     VARCHAR2(1000);
    v_review_date TIMESTAMP WITH TIME ZONE;
    v_count       INT := 0;

BEGIN
    DBMS_OUTPUT.PUT_LINE('--- Bắt đầu seeding Reviews ---');

    -- Chỉ lấy User đã thực sự mua hàng (từ Order_Items join Orders)
    -- Sử dụng Cursor để loop qua các cặp User-Product đã hoàn tất đơn hàng
    FOR r IN (
        SELECT DISTINCT o.user_id, oi.product_id, o.order_date
        FROM Order_Items oi
        JOIN Orders o ON oi.order_id = o.order_id
        WHERE ROWNUM <= 5000 -- Giới hạn 5000 review để đảm bảo performance
    ) LOOP
        
        -- 1. Tạo phân phối Rating kiểu thực tế (70% 5 sao, 15% 4 sao, 5% 3 sao, 5% 2 sao, 5% 1 sao)
        DECLARE
            v_rand NUMBER := DBMS_RANDOM.VALUE(0, 100);
        BEGIN
            IF v_rand < 70 THEN 
                v_rating := 5;
                v_comment := v_pos_comments(TRUNC(DBMS_RANDOM.VALUE(1, v_pos_comments.COUNT + 1)));
            ELSIF v_rand < 85 THEN 
                v_rating := 4;
                v_comment := v_pos_comments(TRUNC(DBMS_RANDOM.VALUE(1, v_pos_comments.COUNT + 1)));
            ELSIF v_rand < 90 THEN 
                v_rating := 3;
                v_comment := v_neu_comments(TRUNC(DBMS_RANDOM.VALUE(1, v_neu_comments.COUNT + 1)));
            ELSIF v_rand < 95 THEN 
                v_rating := 2;
                v_comment := v_neg_comments(TRUNC(DBMS_RANDOM.VALUE(1, v_neg_comments.COUNT + 1)));
            ELSE 
                v_rating := 1;
                v_comment := v_neg_comments(TRUNC(DBMS_RANDOM.VALUE(1, v_neg_comments.COUNT + 1)));
            END IF;
        END;

        -- 2. Đảm bảo thời gian đánh giá sau thời gian đặt hàng (từ 1 đến 7 ngày)
        v_review_date := r.order_date + DBMS_RANDOM.VALUE(1, 7);

        -- 3. Insert kèm xử lý trùng lặp (tránh lỗi uq_user_product_review nếu data cũ đã có)
        BEGIN
            INSERT INTO Reviews (product_id, user_id, rating, comments, created_at, updated_at)
            VALUES (r.product_id, r.user_id, v_rating, v_comment, v_review_date, v_review_date);
            
            v_count := v_count + 1;
        EXCEPTION
            WHEN DUP_VAL_ON_INDEX THEN
                NULL; -- Bỏ qua nếu user này đã review sản phẩm này rồi
        END;

        -- Commit theo batch mỗi 500 dòng để tối ưu Undo Log
        IF MOD(v_count, 500) = 0 THEN
            COMMIT;
        END IF;

    END LOOP;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Hoàn tất! Đã thêm ' || v_count || ' đánh giá chất lượng cao.');
END;
/

SELECT COUNT(*) FROM Users;
SELECT COUNT(*) FROM Products;
SELECT COUNT(*) FROM Orders;
SELECT COUNT(*) FROM Order_Items;
SELECT * FROM Reviews;
