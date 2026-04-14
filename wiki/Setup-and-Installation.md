# 🚀 Setup & Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Link |
|------------|---------|------|
| Node.js | 18.x or higher | https://nodejs.org |
| npm | 9.x or higher | (comes with Node.js) |
| Oracle Database | 21c or higher | https://www.oracle.com/database |
| Redis | 6.x or higher | https://redis.io |
| Git | Latest | https://git-scm.com |

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ThienNguyen666/E-commerce.git
cd E-commerce
```

### 2. Install Node Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configurations:

```env
# Application
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Database - Oracle
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SID=xe
ORACLE_USER=system
ORACLE_PASSWORD=your_oracle_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRY=7d

# Payment Gateway
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Admin
ADMIN_EMAIL=admin@ecommerce.com
ADMIN_PASSWORD=secure_password
```

---

## Database Setup

### Oracle Database Installation

#### On Ubuntu/Debian:
```bash
# Add Oracle repository
wget https://download.oracle.com/...

# Install
sudo apt-get install oracle-database-xe-21c
```

#### On Windows:
1. Download from [Oracle Database Express Edition](https://www.oracle.com/database/technologies/xe-downloads.html)
2. Run the installer
3. Follow the setup wizard

### Initialize Oracle Database

```bash
# Connect to Oracle
sqlplus system/password

# Run initialization scripts
@./scripts/database/init.sql
@./scripts/database/schema.sql
@./scripts/database/procedures.sql
@./scripts/database/seed-data.sql

# Verify tables
SELECT * FROM user_tables;
```

---

## Redis Setup

### On Ubuntu/Debian:

```bash
# Install
sudo apt-get install redis-server

# Start service
sudo systemctl start redis-server

# Verify
redis-cli ping
# Output: PONG
```

### On Windows:

1. Download from [Redis Windows](https://github.com/microsoftarchive/redis/releases)
2. Extract and run `redis-server.exe`
3. Verify:
```bash
redis-cli ping
# Output: PONG
```

### On macOS:

```bash
# Install with Homebrew
brew install redis

# Start service
brew services start redis

# Verify
redis-cli ping
```

---

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Database Migrations

```bash
# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### 3. Start Development Server

```bash
npm run dev
```

Expected output:
```
✓ Server running on http://localhost:3000
✓ Database connected to Oracle XE
✓ Redis connected on localhost:6379
```

### 4. Verify Backend

```bash
# Test API endpoint
curl http://localhost:3000/api/health

# Response should be:
# {"status":"ok","timestamp":"2026-04-13T...","uptime":"..."}
```

---

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=E-commerce MVP
```

### 3. Start Development Server

```bash
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in 456 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### 4. Access Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

---

## Full Stack Development Workflow

### Terminal 1: Oracle Database
```bash
# Already running as service
```

### Terminal 2: Redis
```bash
redis-server
```

### Terminal 3: Backend
```bash
cd backend
npm run dev
```

### Terminal 4: Frontend
```bash
cd frontend
npm run dev
```

---

## Running Tests

### Unit Tests
```bash
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Coverage Report
```bash
npm run test:coverage
```

---

## Building for Production

### Frontend Build

```bash
cd frontend
npm run build

# Output: dist/
```

### Backend Build

```bash
cd backend
npm run build

# Output: dist/
```

### Docker Setup (Optional)

```bash
# Build image
docker build -t ecommerce-app .

# Run container
docker run -p 3000:3000 -p 5173:5173 ecommerce-app
```

---

## Troubleshooting

### Oracle Connection Issues

```bash
# Check Oracle service
sqlplus system/password as sysdba

# If not connected, check:
# 1. Oracle service is running
# 2. Credentials are correct
# 3. Host and port are correct
```

### Redis Connection Failed

```bash
# Check if Redis is running
redis-cli ping

# If not, start Redis:
redis-server

# Or reset Redis:
redis-cli FLUSHALL
redis-cli shutdown
redis-server
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

1. Complete setup and verification
2. Read [Architecture Overview](./Architecture-Overview)
3. Start [Contributing](./Contributing-Guidelines)
4. Deploy to [Staging](./Deployment-Guide)

---

**Last Updated:** 2026-04-13