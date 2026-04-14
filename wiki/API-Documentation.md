# 📡 API Documentation

## API Overview

**Base URL**: `http://localhost:3000/api`  
**Version**: 1.0  
**Authentication**: Bearer Token (JWT)  
**Content-Type**: `application/json`

---

## Authentication

### Login Endpoint

**Endpoint**: `POST /auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "role": "customer"
  }
}
```

**Error** (401 Unauthorized):
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

### Register Endpoint

**Endpoint**: `POST /auth/register`

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Products API

### Get All Products

**Endpoint**: `GET /products`

**Query Parameters**:
```
?page=1&limit=20&category=electronics&sort=price:asc
```

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "product_id": 1,
      "name": "Laptop",
      "price": 999.99,
      "category": "electronics",
      "stock": 50,
      "rating": 4.5,
      "reviews_count": 120
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### Get Product Details

**Endpoint**: `GET /products/{product_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "product_id": 1,
    "name": "Laptop",
    "description": "High-performance laptop...",
    "price": 999.99,
    "cost": 500.00,
    "category": "electronics",
    "sku": "LAPTOP-001",
    "stock": 50,
    "rating": 4.5,
    "reviews": [
      {
        "review_id": 1,
        "user": "John Doe",
        "rating": 5,
        "comment": "Excellent product!",
        "created_at": "2026-04-10T12:00:00Z"
      }
    ]
  }
}
```

### Search Products

**Endpoint**: `GET /products/search`

**Query Parameters**:
```
?q=laptop&category=electronics&min_price=500&max_price=1500
```

**Response** (200 OK):
```json
{
  "success": true,
  "results": [...],
  "total": 25,
  "time_ms": 125
}
```

---

## Shopping Cart API

### Get Cart

**Endpoint**: `GET /cart`

**Headers**:
```
Authorization: Bearer {token}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "cart_id": 1,
    "items": [
      {
        "cart_item_id": 1,
        "product_id": 1,
        "product_name": "Laptop",
        "quantity": 1,
        "unit_price": 999.99,
        "subtotal": 999.99
      }
    ],
    "total": 999.99,
    "item_count": 1
  }
}
```

### Add to Cart

**Endpoint**: `POST /cart/items`

**Request**:
```json
{
  "product_id": 1,
  "quantity": 1
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Item added to cart",
  "cart": {...}
}
```

### Update Cart Item

**Endpoint**: `PUT /cart/items/{cart_item_id}`

**Request**:
```json
{
  "quantity": 2
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {...}
}
```

### Remove from Cart

**Endpoint**: `DELETE /cart/items/{cart_item_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

## Orders API

### Create Order

**Endpoint**: `POST /orders`

**Request**:
```json
{
  "shipping_address_id": 1,
  "payment_method": "credit_card",
  "coupon_code": "SAVE10"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "order_id": 1,
    "order_number": "20260413-001",
    "status": "pending",
    "total_amount": 999.99,
    "created_at": "2026-04-13T10:00:00Z"
  }
}
```

### Get Orders

**Endpoint**: `GET /orders`

**Query Parameters**:
```
?status=delivered&sort=created_at:desc
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "order_id": 1,
      "order_number": "20260413-001",
      "status": "delivered",
      "total_amount": 999.99,
      "created_at": "2026-04-13T10:00:00Z",
      "items": [...]
    }
  ]
}
```

### Get Order Details

**Endpoint**: `GET /orders/{order_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "order_id": 1,
    "order_number": "20260413-001",
    "status": "shipped",
    "items": [...],
    "tracking_number": "TRACK123456"
  }
}
```

### Cancel Order

**Endpoint**: `POST /orders/{order_id}/cancel`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

---

## User Profile API

### Get Profile

**Endpoint**: `GET /user/profile`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user_id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "addresses": [...]
  }
}
```

### Update Profile

**Endpoint**: `PUT /user/profile`

**Request**:
```json
{
  "first_name": "John",
  "phone": "+1234567890"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {...}
}
```

### Add Address

**Endpoint**: `POST /user/addresses`

**Request**:
```json
{
  "type": "shipping",
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "country": "USA",
  "is_default": true
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {...}
}
```

---

## Reviews API

### Get Product Reviews

**Endpoint**: `GET /products/{product_id}/reviews`

**Query Parameters**:
```
?page=1&sort=helpful:desc
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### Add Review

**Endpoint**: `POST /products/{product_id}/reviews`

**Request**:
```json
{
  "rating": 5,
  "title": "Amazing product!",
  "comment": "I really love this product..."
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {...}
}
```

---

## Admin API

### Get Analytics

**Endpoint**: `GET /admin/analytics`

**Query Parameters**:
```
?period=month&metric=revenue
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_revenue": 50000.00,
    "total_orders": 250,
    "average_order_value": 200.00,
    "top_products": [...]
  }
}
```

---

## Error Responses

### Common Error Codes

| Code | Status | Message |
|------|--------|---------|
| 400 | Bad Request | Invalid input parameters |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "success": false,
  "error": "Product not found",
  "code": "PRODUCT_NOT_FOUND",
  "status": 404
}
```

---

## Rate Limiting

**Requests per minute**: 100  
**Requests per hour**: 5000

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1618356000
```

---

## Pagination

**Default limit**: 20  
**Max limit**: 100

**Response**:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

**Last Updated:** 2026-04-13