# 🚀 Deployment Guide

## Environments

| Environment | URL | Branch | Database | Frequency |
|-------------|-----|--------|----------|-----------|
| Development | localhost:3000 | develop | Local Oracle | Continuous |
| Staging | staging.ecommerce.com | staging | Staging Oracle | Per PR |
| Production | ecommerce.com | main | Production Oracle | Per Release |

---

## Prerequisites

- AWS Account configured
- Docker installed
- AWS CLI configured
- Environment secrets configured in GitHub

---

## Environment Configuration

### GitHub Secrets Setup

Navigate to: **Settings → Secrets and variables → Actions**

#### For Staging:
```
AWS_ACCESS_KEY_ID (staging)
AWS_SECRET_ACCESS_KEY (staging)
AWS_REGION: us-east-1
STAGING_URL: https://staging.ecommerce.com
STAGING_DB_HOST: staging-oracle.rds.amazonaws.com
STAGING_REDIS_HOST: staging-redis.elasticache.amazonaws.com
```

#### For Production:
```
AWS_ACCESS_KEY_ID (production)
AWS_SECRET_ACCESS_KEY (production)
AWS_REGION: us-east-1
PRODUCTION_URL: https://ecommerce.com
PRODUCTION_DB_HOST: prod-oracle.rds.amazonaws.com
PRODUCTION_REDIS_HOST: prod-redis.elasticache.amazonaws.com
DOCKER_USERNAME: your-docker-username
DOCKER_PASSWORD: your-docker-token
DOCKER_REGISTRY: your-docker-registry
```

---

## Staging Deployment

### Automatic Deployment

**Triggers**: Pull Request created or updated

**Process**:
1. Run CI/CD pipeline (tests, linting)
2. Build Docker image
3. Push to Docker registry
4. Deploy to staging environment
5. Run smoke tests
6. Post status to PR

### Manual Deployment

```bash
# Deploy specific branch to staging
./scripts/deploy-staging.sh branch-name

# Or via GitHub CLI
gh workflow run deploy.yml -f environment=staging
```

### Staging Checklist

- [ ] All tests passing
- [ ] Code review approved
- [ ] No breaking changes
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Health checks passing

---

## Production Deployment

### Automatic Deployment

**Triggers**: Push to `main` branch

**Process**:
1. Run full CI/CD pipeline
2. Build production image
3. Create deployment approval
4. Deploy to production (after approval)
5. Monitor health and logs
6. Create release

### Pre-Deployment Checklist

```bash
# Create a pre-deployment checklist
- [ ] Version bumped in package.json
- [ ] CHANGELOG updated
- [ ] All tests passing with coverage > 80%
- [ ] Code reviewed and approved
- [ ] Database migrations tested on staging
- [ ] Documentation updated
- [ ] Performance metrics acceptable
- [ ] Security scan passed
- [ ] Backup created
- [ ] Rollback plan prepared
```

### Manual Production Deployment

```bash
# Deploy manually (requires approval)
./scripts/deploy-production.sh

# Verify deployment
curl https://ecommerce.com/api/health

# Check logs
./scripts/check-logs.sh production
```

---

## Database Migrations

### Before Deployment

```bash
# Test migrations on staging
npm run migrate:staging

# Verify data integrity
npm run verify:data
```

### Migration Strategy

#### Option 1: Zero-Downtime Migration
```sql
-- Step 1: Add new column (non-breaking)
ALTER TABLE products ADD COLUMN new_field VARCHAR2(100);

-- Step 2: Migrate data in background
UPDATE products SET new_field = ... WHERE ...;

-- Step 3: Remove old column (in next deployment)
ALTER TABLE products DROP COLUMN old_field;
```

#### Option 2: Backward Compatible
```typescript
// Accept both old and new field names
const getProduct = async (id: number) => {
  const product = await db.query('SELECT ...')
  
  // Support old API
  if (!product.new_field && product.old_field) {
    product.new_field = product.old_field
  }
  
  return product
}
```

### Rollback Migrations

```bash
# If something goes wrong
npm run migrate:rollback

# Verify rollback
npm run migrate:status

# Check data
SELECT COUNT(*) FROM products;
```

---

## Health Checks & Monitoring

### Health Endpoint

```bash
curl https://ecommerce.com/api/health

# Response:
{
  "status": "ok",
  "timestamp": "2026-04-13T10:00:00Z",
  "uptime": "2h 30m",
  "database": "connected",
  "redis": "connected",
  "version": "1.0.0"
}
```

### Monitoring Endpoints

```bash
# Metrics
GET /api/admin/metrics

# Database health
GET /api/admin/health/database

# Cache health
GET /api/admin/health/cache

# Performance metrics
GET /api/admin/performance
```

### Alerts Setup

Configure alerts for:
- HTTP 5xx errors > 5%
- API response time > 500ms
- Database connection errors
- Redis connection errors
- Disk space < 20%
- Memory usage > 80%

---

## Docker Deployment

### Build Docker Image

```bash
# Build
docker build -t ecommerce:v1.0.0 .

# Tag for registry
docker tag ecommerce:v1.0.0 your-registry/ecommerce:v1.0.0

# Push to registry
docker push your-registry/ecommerce:v1.0.0
```

### Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "dist/server.js"]
```

### Run Container

```bash
# Local
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  ecommerce:v1.0.0

# AWS ECR
docker run -p 3000:3000 \
  your-registry/ecommerce:v1.0.0
```

---

## AWS Deployment

### ECS Deployment

```bash
# Push image to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin {aws_account_id}.dkr.ecr.us-east-1.amazonaws.com

docker tag ecommerce:v1.0.0 {aws_account_id}.dkr.ecr.us-east-1.amazonaws.com/ecommerce:v1.0.0
docker push {aws_account_id}.dkr.ecr.us-east-1.amazonaws.com/ecommerce:v1.0.0

# Update ECS service
aws ecs update-service \
  --cluster production-cluster \
  --service ecommerce-service \
  --force-new-deployment
```

### RDS Oracle Database

```bash
# Create DB instance
aws rds create-db-instance \
  --db-instance-identifier ecommerce-prod \
  --db-instance-class db.t3.medium \
  --engine oracle-ee \
  --allocated-storage 100

# Check status
aws rds describe-db-instances \
  --db-instance-identifier ecommerce-prod
```

### ElastiCache Redis

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id ecommerce-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1

# Check status
aws elasticache describe-cache-clusters \
  --cache-cluster-id ecommerce-redis
```

---

## Monitoring & Logging

### CloudWatch Setup

```bash
# View logs
aws logs tail /aws/ecs/ecommerce-service --follow

# Get metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=ecommerce-service \
  --statistics Average
```

### Application Logging

```typescript
// Configure Winston logger
import winston from 'winston'

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})

logger.info('Application started')
```

---

## Rollback Procedures

### Automatic Rollback (if health checks fail)

```yaml
# In deploy.yml
- name: Automatic Rollback
  if: failure()
  run: |
    aws ecs update-service \
      --cluster production-cluster \
      --service ecommerce-service \
      --task-definition ecommerce:previous-revision
```

### Manual Rollback

```bash
# Check deployment history
aws ecs describe-services \
  --cluster production-cluster \
  --services ecommerce-service

# Rollback to previous version
./scripts/rollback.sh production v1.0.0
```

### Rollback Checklist

- [ ] Identify the issue
- [ ] Prepare rollback command
- [ ] Execute rollback
- [ ] Verify health checks
- [ ] Monitor metrics
- [ ] Post incident report
- [ ] Schedule post-mortem

---

## Troubleshooting

### Deployment Fails

```bash
# Check logs
kubectl logs deployment/ecommerce

# Check events
kubectl describe deployment ecommerce

# Check services
kubectl get services

# Debug pod
kubectl exec -it pod/ecommerce-xxx bash
```

### High Error Rate

```bash
# Check error logs
tail -f /var/log/ecommerce/error.log

# Check database connection
sqlplus -L / as sysdba

# Check Redis connection
redis-cli ping

# Check API endpoint
curl https://ecommerce.com/api/health
```

### Performance Issues

```bash
# Check CPU
top

# Check memory
free -h

# Check disk
df -h

# Check network
netstat -an | grep ESTABLISHED | wc -l
```

---

## Production Checklist

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Database backups created
- [ ] Monitoring configured
- [ ] Alerting configured
- [ ] Rollback plan ready
- [ ] Deployment window scheduled
- [ ] Team notified
- [ ] Health checks passing

---

**Last Updated:** 2026-04-13