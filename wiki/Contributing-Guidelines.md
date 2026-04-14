# 🤝 Contributing Guidelines

Thank you for considering contributing to our E-commerce project! Please read these guidelines carefully before submitting any pull requests.

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Ask questions when unsure
- Respect others' time and contributions

---

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/E-commerce.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Commit and push
6. Create a Pull Request

---

## Code Standards

### TypeScript/JavaScript

#### Naming Conventions
```typescript
// Components (PascalCase)
const ProductCard: React.FC = () => {}

// Functions (camelCase)
function calculateTotal() {}

// Constants (UPPER_SNAKE_CASE)
const MAX_ITEMS_PER_PAGE = 20

// Types (PascalCase)
type Product = {
  id: number
  name: string
}
```

#### File Structure
```
src/
├── components/     // React components
├── pages/          // Page components
├── hooks/          // Custom hooks
├── services/       // API services
├── types/          // TypeScript types
├── utils/          // Utility functions
├── styles/         // Global styles
└── constants/      // Constants
```

#### Code Style
```typescript
// ✅ Good
const getProducts = async (categoryId: number): Promise<Product[]> => {
  const response = await apiClient.get(`/products?category=${categoryId}`)
  return response.data
}

// ❌ Bad
const getProducts = (cat) => {
  return fetch(`/products?category=${cat}`).then(r => r.json())
}
```

### Function Documentation

```typescript
/**
 * Fetches products by category
 * @param categoryId - The ID of the category
 * @param limit - Maximum number of products (default: 20)
 * @returns Promise resolving to array of products
 * @throws Error if category not found
 */
function getProductsByCategory(
  categoryId: number,
  limit: number = 20
): Promise<Product[]> {
  // implementation
}
```

### Error Handling

```typescript
// ✅ Good
try {
  const data = await fetchData()
  return data
} catch (error) {
  logger.error('Failed to fetch data:', error)
  throw new ApiError('Failed to fetch data', 500)
}

// ❌ Bad
try {
  const data = await fetchData()
} catch (e) {
  console.log('error')
}
```

---

## Git Workflow

### Branch Naming

```
feature/add-product-search
bugfix/fix-cart-total-calculation
docs/update-readme
refactor/simplify-order-service
chore/update-dependencies
```

### Commit Messages

```
feat: Add product search functionality
fix: Fix cart total calculation bug
docs: Update API documentation
style: Format code with Prettier
refactor: Simplify order service
test: Add tests for ProductService
chore: Update dependencies
```

**Format**: `<type>: <subject>`

**Guidelines**:
- Use imperative mood ("Add" not "Added")
- Don't capitalize subject line
- Limit to 50 characters
- Reference issues: `fix: #123`

### Commit Examples

```bash
# Good
git commit -m "feat: Add product search with filters

- Implement search endpoint
- Add filter by category and price
- Add unit tests
- Fixes #456"

# Bad
git commit -m "update stuff"
```

---

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**
   ```bash
   npm run test
   npm run lint
   ```

2. **Update documentation**
   - Add JSDoc comments
   - Update README if needed
   - Update wiki if significant changes

3. **Rebase with main**
   ```bash
   git rebase origin/main
   ```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests passed
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Comments added for complex logic
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] Tests pass locally
```

---

## Testing

### Unit Tests

```typescript
// ✅ Good test
describe('calculateTotal', () => {
  it('should calculate total with items', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 }
    ]
    const total = calculateTotal(items)
    expect(total).toBe(250)
  })

  it('should return 0 for empty items', () => {
    expect(calculateTotal([])).toBe(0)
  })
})
```

### Running Tests

```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Coverage Requirements

- Minimum 80% code coverage
- All critical paths covered
- Integration tests for APIs

---

## Performance Guidelines

### Frontend

- Lazy load components
- Optimize images
- Use React.memo for expensive renders
- Avoid unnecessary re-renders

```typescript
// ✅ Good
const ProductCard = React.memo(({ product }) => {
  return <div>{product.name}</div>
})

// ❌ Bad
const ProductCard = ({ product }) => {
  console.log('render') // logs every render
  return <div>{product.name}</div>
}
```

### Backend

- Use database indexes
- Implement caching
- Optimize queries
- Limit response sizes

```typescript
// ✅ Good - with caching
async function getProducts() {
  const cached = await redis.get('products')
  if (cached) return cached
  
  const data = await db.query('SELECT ...')
  await redis.setex('products', 3600, data)
  return data
}
```

---

## Security

- Never commit secrets or API keys
- Sanitize user input
- Use parameterized queries
- Validate all inputs
- Add rate limiting
- Use HTTPS

```typescript
// ✅ Good
const query = 'SELECT * FROM users WHERE email = ?'
db.query(query, [userEmail])

// ❌ Bad
const query = `SELECT * FROM users WHERE email = '${userEmail}'`
```

---

## Documentation

### README.md
- Clear description
- Quick start guide
- Feature list
- Installation steps

### Code Comments
```typescript
// ✅ Good - explains WHY
// Use Set instead of array for O(1) lookup performance
const uniqueIds = new Set(ids)

// ❌ Bad - states obvious
// Loop through items
items.forEach(item => {})
```

### API Documentation
- Document endpoints
- Include examples
- Document parameters
- Document responses

---

## Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console logs or debug code
- [ ] No hardcoded values
- [ ] Performance impact considered
- [ ] Security best practices followed
- [ ] Backward compatibility maintained

---

## Common Issues & Solutions

### Linting Errors

```bash
# Fix automatically
npm run lint:fix

# Check specific file
npx eslint src/file.ts
```

### Test Failures

```bash
# Run tests in watch mode
npm run test:watch

# Update snapshots
npm run test -- -u
```

### Build Errors

```bash
# Clear build artifacts
rm -rf dist/ node_modules/

# Reinstall dependencies
npm install

# Rebuild
npm run build
```

---

## Resource Links

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev)
- [Git Workflow](https://git-scm.com/book/en/v2)
- [Jest Testing](https://jestjs.io/)

---

## Questions?

- Open an issue with `[QUESTION]` tag
- Join our discussions
- Review existing documentation

---

**Last Updated:** 2026-04-13