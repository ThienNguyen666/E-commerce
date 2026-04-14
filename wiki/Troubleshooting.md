# 🔧 Troubleshooting & FAQs

---

## Common Issues

### 1. Oracle Database Connection Issues

#### Issue: ORA-12514: TNS:listener does not currently know of service in connect descriptor

**Cause**: Oracle listener is not running or the service name is incorrect.

**Solution**:
```bash
# Check if Oracle listener is running
lsnrctl status

# If not, start the listener
lsnrctl start

# Verify connection
sqlplus system/password@xe

# Check SID
SELECT name FROM v$database;
```

#### Issue: ORA-01017: invalid username/password; logon denied

**Cause**: Wrong credentials or user doesn't exist.

**Solution**:
```bash
# Check if user exists
sqlplus system/password@xe
SELECT * FROM dba_users WHERE username='YOUR_USER';

# Create user if needed
CREATE USER myuser IDENTIFIED BY mypassword;
GRANT CONNECT, RESOURCE TO myuser;
```

#### Issue: Connection timeout or refused

**Solution**:
```bash
# Check if Oracle service is running
systemctl status oracle-xe

# If not, start it
systemctl start oracle-xe

# Check port
netstat -an | grep 1521

# Update .env file
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_SID=xe
```

---

### 2. Redis Connection Issues

#### Issue: Redis connection refused

**Cause**: Redis server is not running.

**Solution**:
```bash
# Check if Redis is running
redis-cli ping
# If you see: PONG → Redis is working
# If you see: error → Redis is not running

# Start Redis
redis-server

# Or on Ubuntu
sudo systemctl start redis-server
sudo systemctl status redis-server
```

#### Issue: Redis timeout

**Solution**:
```bash
# Check Redis logs
tail -f /var/log/redis/redis-server.log

# Check Redis configuration
redis-cli CONFIG GET "*"

# Clear Redis cache
redis-cli FLUSHALL

# Monitor Redis
redis-cli MONITOR
```

#### Issue: Out of memory error

**Solution**:
```bash
# Check current memory
redis-cli INFO memory

# Clear cache
redis-cli FLUSHDB

# Or flush all databases
redis-cli FLUSHALL

# Increase max memory in redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

---

### 3. Application Build Errors

#### Issue: Module not found errors

**Solution**:
```bash
# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# Clear npm cache
npm cache clean --force

# Try again
npm install
```

#### Issue: TypeScript compilation errors

**Solution**:
```bash
# Check TypeScript version
npx tsc --version

# Compile and show errors
npx tsc --noEmit

# Fix common issues
npm run lint:fix
npm run format:fix

# Reinstall types
npm install --save-dev @types/node @types/react
```

#### Issue: Build output not generated

**Solution**:
```bash
# Check build command
npm run build

# View build logs
npm run build -- --verbose

# Check build configuration
cat tsconfig.json

# Ensure src/ directory exists
ls -la src/
```

---

### 4. API Request Issues

#### Issue: 401 Unauthorized

**Cause**: Missing or invalid JWT token.

**Solution**:
```bash
# Check if token is in request
curl -H "Authorization: Bearer {token}" http://localhost:3000/api/products

# Get new token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password"
  }'

# Check token expiry
# Tokens in JWT are typically valid for 7 days by default
```

#### Issue: 500 Internal Server Error

**Solution**:
```bash
# Check server logs
tail -f logs/application.log
tail -f logs/error.log

# Check database connection
curl http://localhost:3000/api/health

# Check Redis connection
redis-cli ping

# Restart server
npm run dev
```

#### Issue: CORS error

**Solution**:
```typescript
// Add CORS configuration in Express
import cors from 'cors'

app.use(cors({
  origin: ['http://localhost:5173', 'https://ecommerce.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

---

### 5. Frontend Issues

#### Issue: Blank page or white screen

**Cause**: React not rendering, JavaScript error, or network issue.

**Solution**:
```bash
# Check browser console for errors
# Open DevTools: F12 or Right-click → Inspect

# Check network tab for failed requests

# Verify API is running
curl http://localhost:3000/api/health

# Check React logs
npm run dev -- --debug

# Clear browser cache
# Ctrl+Shift+Delete or Cmd+Shift+Delete
```

#### Issue: Component not rendering

**Solution**:
```typescript
// Add error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo)
  }
  
  render() {
    return this.props.children
  }
}

// Wrap components
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

#### Issue: Hot reload not working

**Solution**:
```bash
# Restart dev server
npm run dev

# Clear Vite cache
rm -rf .vite

# Check file watchers
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### 6. Performance Issues

#### Issue: Slow API responses

**Solution**:
```bash
# Check API response time
curl -w "Time: %{time_total}s" http://localhost:3000/api/products

# Check database query performance
EXPLAIN PLAN FOR SELECT * FROM products;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

# Add indexes if missing
CREATE INDEX idx_products_category ON products(category_id);

# Check Redis cache
redis-cli INFO stats
```

#### Issue: High CPU usage

**Solution**:
```bash
# Check running processes
top

# Find Node process
ps aux | grep node

# Monitor process
watch -n 1 'ps aux | grep node'

# Check for memory leaks
npm install -g clinic
clinic doctor -- node dist/server.js
```

#### Issue: Memory leak

**Solution**:
```bash
# Monitor memory usage
npm run dev -- --expose-gc

# Use heap snapshot
node --inspect dist/server.js
# Then visit chrome://inspect

# Check for listeners not being removed
EventEmitter.prototype._maxListeners = 10
emitter.setMaxListeners(0) // Use sparingly
```

---

### 7. Database Issues

#### Issue: Query timeout

**Solution**:
```sql
-- Check long-running queries
SELECT * FROM v$session WHERE status='ACTIVE';

-- Kill session if needed
ALTER SYSTEM KILL SESSION 'sid,serial#';

-- Add timeout to query
SET LONG_TIMEOUT 30000;

-- Check indexes
SELECT * FROM user_indexes WHERE table_name='PRODUCTS';
```

#### Issue: Transaction deadlock

**Solution**:
```sql
-- Detect deadlock
SELECT * FROM v$session WHERE wait_class='Lock';

-- Kill blocking session
ALTER SYSTEM KILL SESSION 'sid,serial#' IMMEDIATE;

-- Retry transaction with backoff
```

#### Issue: Data corruption

**Solution**:
```sql
-- Check table integrity
ANALYZE TABLE products VALIDATE STRUCTURE;

-- Repair if needed
ALTER TABLE products ENABLE ROW MOVEMENT;

-- Restore from backup
RMAN> RESTORE DATABASE FROM BACKUP;
RMAN> RECOVER DATABASE;
```

---

### 8. Deployment Issues

#### Issue: Deployment fails

**Solution**:
```bash
# Check GitHub Actions logs
gh run view {run_id}

# Check artifact logs
gh run view {run_id} --log

# Re-run workflow
gh run rerun {run_id}

# Check secrets are configured
gh secret list
```

#### Issue: Health check failing after deployment

**Solution**:
```bash
# Check if service is running
curl http://localhost:3000/api/health

# Check logs
docker logs {container_id}

# Check environment variables
docker inspect {container_id} | grep Env

# Rollback deployment
./scripts/rollback.sh production
```

---

## FAQs

### Q: How do I reset the database?

**A:**
```bash
# Drop all tables
npm run db:reset

# Or manually
sqlplus system/password@xe
DROP USER myuser CASCADE;
CREATE USER myuser IDENTIFIED BY mypassword;
GRANT CONNECT, RESOURCE TO myuser;

# Re-run migrations
npm run migrate
npm run seed
```

### Q: How do I clear Redis cache?

**A:**
```bash
# Clear specific key
redis-cli DEL key_name

# Clear all keys
redis-cli FLUSHDB

# Clear all databases
redis-cli FLUSHALL

# Check cache size
redis-cli DBSIZE
```

### Q: How do I view application logs?

**A:**
```bash
# Local development
npm run dev 2>&1 | tee app.log

# Production
tail -f /var/log/ecommerce/app.log
tail -f /var/log/ecommerce/error.log

# Docker
docker logs {container_id}
docker logs -f {container_id} # Follow mode

# AWS CloudWatch
aws logs tail /aws/ecs/ecommerce-service --follow
```

### Q: How do I run migrations?

**A:**
```bash
# Run pending migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Check migration status
npm run migrate:status

# Run specific migration
npm run migrate -- --name=create_users_table
```

### Q: How do I enable debug mode?

**A:**
```bash
# Backend
DEBUG=* npm run dev

# Frontend
VITE_DEBUG=true npm run dev

# Docker
docker run -e DEBUG=* ecommerce:latest
```

### Q: How do I update dependencies?

**A:**
```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all packages
npm update

# Major version update
npm install package-name@latest

# Security audit
npm audit
npm audit fix
```

### Q: How do I create a database backup?

**A:**
```bash
# Oracle backup
expdp system/password DIRECTORY=backup_dir DUMPFILE=backup.dmp

# MySQL backup
mysqldump -u user -p database > backup.sql

# Restore
impdp system/password DIRECTORY=backup_dir DUMPFILE=backup.dmp
```

### Q: How do I scale the application?

**A:**
```bash
# Horizontal scaling (multiple instances)
# Configure load balancer
# Update Docker Compose or Kubernetes

# Vertical scaling (more resources)
# Increase AWS EC2 instance size
# Increase RDS instance class
# Increase ElastiCache node type
```

---

## Getting Help

1. **Check existing issues**: Search GitHub issues
2. **Read documentation**: Check wiki pages
3. **Community support**: Ask in GitHub Discussions
4. **Report bug**: Create issue with reproduction steps
5. **Contact team**: Email or Slack

---

**Last Updated:** 2026-04-13