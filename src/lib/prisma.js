import { PrismaClient } from '@prisma/client';

// Global variable to store the Prisma client instance
let prisma;

// Create a singleton Prisma client
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, use a global variable to preserve the instance across hot reloads
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.prisma;
}

export default prisma;

// Helper functions for common operations
export const prismaHelpers = {
  // User operations
  async createUser(userData) {
    return await prisma.user.create({
      data: userData,
    });
  },

  async getUserById(id) {
    return await prisma.user.findUnique({
      where: { id },
    });
  },

  // Product operations
  async getProducts(options = {}) {
    const { skip = 0, take = 50, where = {}, include = {} } = options;
    return await prisma.product.findMany({
      skip,
      take,
      where: {
        isActive: true,
        ...where,
      },
      include: {
        category: true,
        brand: true,
        supplier: true,
        ...include,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  async createProduct(productData) {
    return await prisma.product.create({
      data: productData,
      include: {
        category: true,
        brand: true,
        supplier: true,
      },
    });
  },

  async updateProduct(id, productData) {
    return await prisma.product.update({
      where: { id },
      data: productData,
      include: {
        category: true,
        brand: true,
        supplier: true,
      },
    });
  },

  // Sale operations
  async createSale(saleData, saleItems) {
    return await prisma.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: saleData,
      });

      // Create sale items
      const items = await Promise.all(
        saleItems.map((item) =>
          tx.saleItem.create({
            data: {
              ...item,
              saleId: sale.id,
            },
          })
        )
      );

      // Update product quantities
      await Promise.all(
        saleItems.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
            },
          })
        )
      );

      // Create stock movements
      await Promise.all(
        saleItems.map((item) =>
          tx.stockMovement.create({
            data: {
              productId: item.productId,
              movementType: 'sale',
              quantity: -item.quantity,
              referenceType: 'sale',
              referenceId: sale.id,
              createdBy: saleData.createdBy,
            },
          })
        )
      );

      return { sale, items };
    });
  },

  // Purchase operations
  async createPurchase(purchaseData, purchaseItems) {
    return await prisma.$transaction(async (tx) => {
      // Create the purchase
      const purchase = await tx.purchase.create({
        data: purchaseData,
      });

      // Create purchase items
      const items = await Promise.all(
        purchaseItems.map((item) =>
          tx.purchaseItem.create({
            data: {
              ...item,
              purchaseId: purchase.id,
            },
          })
        )
      );

      // Update product quantities
      await Promise.all(
        purchaseItems.map((item) =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: {
                increment: item.quantity,
              },
            },
          })
        )
      );

      // Create stock movements
      await Promise.all(
        purchaseItems.map((item) =>
          tx.stockMovement.create({
            data: {
              productId: item.productId,
              movementType: 'purchase',
              quantity: item.quantity,
              referenceType: 'purchase',
              referenceId: purchase.id,
              createdBy: purchaseData.createdBy,
            },
          })
        )
      );

      return { purchase, items };
    });
  },

  // Category operations
  async getCategories() {
    return await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  },

  // Brand operations
  async getBrands() {
    return await prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  // Supplier operations
  async getSuppliers() {
    return await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  // Customer operations
  async getCustomers() {
    return await prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  // Dashboard statistics
  async getDashboardStats() {
    const [
      totalProducts,
      lowStockProducts,
      totalSales,
      totalPurchases,
      totalCustomers,
      totalSuppliers,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({
        where: {
          isActive: true,
          quantity: { lte: prisma.product.fields.reorderPoint },
        },
      }),
      prisma.sale.count(),
      prisma.purchase.count(),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
    ]);

    return {
      totalProducts,
      lowStockProducts,
      totalSales,
      totalPurchases,
      totalCustomers,
      totalSuppliers,
    };
  },
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});