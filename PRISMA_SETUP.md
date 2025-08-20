# Prisma Setup Guide for Krishisethu Inventory Management

## Overview
This project has been configured to use Prisma ORM with PostgreSQL database. The configuration supports both Supabase and direct PostgreSQL connections.

## Database Configuration

### Environment Variables
The following environment variables need to be set in your `.env` file:

```env
DATABASE_URL="postgresql://postgres:AdrianLamo%40143@db.srhfccodjurgnuvuqynp.supabase.co:5432/postgres?sslmode=require"
```

### Files Created/Modified
1. **`prisma/schema.prisma`** - Complete database schema with all models
2. **`src/lib/prisma.js`** - Prisma client configuration and helper functions
3. **`setup-prisma.js`** - Automated setup script
4. **`.env`** - Updated with DATABASE_URL
5. **`.env.local`** - Local environment configuration
6. **`package.json`** - Added Prisma scripts

## Database Schema

The schema includes the following models:
- **User** - User management with role-based access
- **Category** - Product categories
- **Brand** - Product brands
- **Supplier** - Supplier information
- **Customer** - Customer management
- **Product** - Inventory items with full tracking
- **Sale/SaleItem** - Sales transactions
- **Purchase/PurchaseItem** - Purchase orders
- **StockMovement** - Inventory movement tracking
- **Setting** - Application settings

## Available Scripts

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database (for development)
npm run prisma:push

# Pull schema from database
npm run prisma:pull

# Open Prisma Studio (database GUI)
npm run prisma:studio

# Reset database (caution: deletes all data)
npm run prisma:reset

# Complete setup (recommended for first time)
npm run db:setup
```

## Setup Instructions

### 1. First Time Setup
```bash
cd inventory-management
npm run db:setup
```

### 2. Manual Setup
```bash
# Install dependencies (if not already done)
npm install

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push
```

### 3. Verify Setup
```bash
# Open Prisma Studio to verify tables
npm run prisma:studio
```

## Usage in Application

### Import Prisma Client
```javascript
import prisma, { prismaHelpers } from './src/lib/prisma.js';
```

### Basic Operations
```javascript
// Get all products
const products = await prismaHelpers.getProducts();

// Create a new product
const newProduct = await prismaHelpers.createProduct({
  name: 'Fertilizer XYZ',
  type: 'Chemical',
  quantity: 100,
  salePrice: 500,
  // ... other fields
});

// Create a sale with items
const sale = await prismaHelpers.createSale(
  {
    saleNumber: 'SALE-001',
    customerName: 'John Doe',
    totalAmount: 1000,
    // ... other sale data
  },
  [
    {
      productId: 'product-uuid',
      quantity: 2,
      unitPrice: 500,
      totalPrice: 1000,
    }
  ]
);
```

## Database Connection Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check if the database server is running
   - Verify network connectivity
   - Ensure SSL configuration is correct

2. **Authentication Failed**
   - Verify username and password in DATABASE_URL
   - Check if URL encoding is correct (@ symbol should be %40)

3. **SSL Issues**
   - Ensure `?sslmode=require` is added to the connection string
   - For local development, you might need `?sslmode=disable`

### Testing Connection
```bash
# Test database connection
node test-pg-connection.js
```

## Migration from Supabase

If you're migrating from Supabase client to Prisma:

1. **Keep Supabase for Authentication** (recommended)
2. **Use Prisma for Database Operations**
3. **Update Components Gradually**

Example migration:
```javascript
// Before (Supabase)
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('is_active', true);

// After (Prisma)
const products = await prismaHelpers.getProducts({
  where: { isActive: true }
});
```

## Production Considerations

1. **Connection Pooling** - Prisma handles this automatically
2. **Environment Variables** - Use production DATABASE_URL
3. **SSL Configuration** - Always use SSL in production
4. **Backup Strategy** - Implement regular database backups
5. **Monitoring** - Set up database monitoring and alerts

## Support

For issues related to:
- **Prisma**: Check [Prisma Documentation](https://www.prisma.io/docs)
- **PostgreSQL**: Check [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- **Supabase**: Check [Supabase Documentation](https://supabase.com/docs)

## Next Steps

1. Test database connection
2. Run initial data seeding (if needed)
3. Update application components to use Prisma
4. Set up database monitoring
5. Configure backup strategy