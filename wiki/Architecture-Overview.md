# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                             │
│                   React Router v7 UI                         │
└────────────┬────────────────────────────────────┬────────────┘
             │                                    │
             │ HTTP/HTTPS                         │ WebSocket
             ▼                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY                               │
│            (Express.js with TypeScript)                      │
└────┬───────────────────────────────────────────────────────┬─┘
     │                                                       │
     │ ◄─────────────────────────────────────►               │
     │            Middleware & Auth                          │
     │                                                       │
     ▼                                                       ▼
┌─────────────────────┐                          ┌─────────────────┐
│   CACHE LAYER       │                          │  DB LAYER       │
│   Redis Cluster     │                          │  Oracle DB      │
│                     │                          │                 │
│ • Session Store     │                          │ • Tables        │
│ • Query Cache       │                          │ • Procedures    │
│ • Real-time Data    │                          │ • Triggers      │
└─────────────────────┘                          └─────────────────┘
     ▲                                                      ▲
     │                                                      │
     └───────────────────┬──────────────────────────────────┘
                         │
                  Cache Invalidation
                  & Data Sync
```

## Component Architecture

### Frontend (React Router v7)
```
App/
├── pages/
│   ├── Home
│   ├── Products
│   ├── ProductDetail
│   ├── Cart
│   ├── Checkout
│   ├── Orders
│   └── Admin
├── components/
│   ├── Header
│   ├── Navigation
│   ├── ProductCard
│   ├── CartItem
│   └── Breadcrumb
├── hooks/
│   ├── useCart
│   ├── useAuth
│   ├── useProducts
│   └── useFetch
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── cache.ts
└── store/ (Redux/Context)
    ├── cart
    ├── user
    └── products
```

### Backend (Node.js + Express)
```
src/
├── routes/
│   ├── products.js
│   ├── cart.js
│   ├── orders.js
│   ├── users.js
│   └── admin.js
├── controllers/
│   ├── ProductController.js
│   ├── CartController.js
│   ├── OrderController.js
│   └── UserController.js
├── services/
│   ├── ProductService.js
│   ├── OrderService.js
│   └── PaymentService.js
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Order.js
│   └── Cart.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── validation.js
├── db/
│   ├── connection.js
│   ├── migrations/
│   └── queries.js
└── utils/
    ├── logger.js
    ├── cache.js
    └── helpers.js
```

## Data Flow

### 1. Product Browsing Flow
```
User Search Request
    ↓
React Router Navigation
    ↓
API Call to /api/products
    ↓
Express Middleware (Auth, Logging)
    ↓
ProductController
    ├─→ Check Redis Cache
    │    ├─ Cache Hit → Return cached data
    │    └─ Cache Miss → Query Oracle DB
    │
    └─→ Oracle Query
         ├─ Execute SELECT query
         └─ Return results
    ↓
Cache Results in Redis (TTL: 24h)
    ↓
Response to Client
    ↓
React State Update & Render
```

### 2. Order Processing Flow
```
User Checkout
    ↓
React Form Submission
    ↓
API POST /api/orders
    ↓
Authentication Middleware
    ↓
OrderController
    ├─ Validate cart items
    ├─ Check inventory (from Redis cache)
    ├─ Process payment
    └─ Create order in Oracle
    ↓
PL/SQL Procedure: CREATE_ORDER
    ├─ INSERT INTO orders table
    ├─ INSERT INTO order_items table
    ├─ UPDATE inventory
    └─ COMMIT transaction
    ↓
Invalidate Redis Cache
    ├─ Flush user cart
    ├─ Update inventory cache
    └─ Update user orders
    ↓
Send Response to Client
    ↓
React Navigation to Order Confirmation
```

### 3. Real-time Cache Update
```
Admin Updates Product
    ↓
API PUT /api/admin/products/:id
    ↓
AdminController
    ├─ Update Oracle DB
    ├─ Execute PL/SQL trigger
    └─ Delete from Redis cache
    ↓
Broadcast to Connected Clients
    ├─ WebSocket notification
    └─ React component re-fetches data
    ↓
Cache rebuilt on next request
```

## API Architecture

### Request/Response Cycle
```
Request Headers
├─ Authorization: Bearer {token}
├─ Content-Type: application/json
└─ X-Request-ID: {uuid}
    ↓
Express Middleware Pipeline
├─ Cors Handler
├─ Body Parser
├─ Auth Middleware
├─ Rate Limiter
└─ Validation Middleware
    ↓
Route Handler (Controller)
├─ Validate Input
├─ Process Business Logic
├─ Query Database/Cache
└─ Format Response
    ↓
Response
├─ Status Code
├─ Headers
└─ JSON Body
```

## Database Strategy

### Oracle Database
- **Primary data store** for all business data
- **Transactions** for ACID compliance
- **Procedures** for complex operations
- **Triggers** for automatic updates

### Redis Cache
- **Session storage** (TTL: 30 days)
- **Product catalog** (TTL: 24 hours)
- **Shopping carts** (TTL: 7 days)
- **User preferences** (TTL: 30 days)
- **Inventory cache** (TTL: 1 hour)

### Cache Invalidation Strategy
- **Write-through**: Update Oracle → Update Redis
- **TTL-based**: Auto-expiry based on data type
- **Event-based**: Invalidate on specific events
- **Manual**: Admin trigger cache clear

## Performance Optimization

### Frontend
- Code splitting with React Router
- Lazy loading of components
- Image optimization
- CSS/JS minification

### Backend
- Database connection pooling
- Redis caching layer
- Query optimization
- Response compression

### Monitoring
- Application Performance Monitoring (APM)
- Database query analysis
- Cache hit rate tracking
- API response time metrics

## Security Architecture

- JWT token-based authentication
- Role-based access control (RBAC)
- HTTPS/TLS encryption
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting

---

**Last Updated:** 2026-04-13