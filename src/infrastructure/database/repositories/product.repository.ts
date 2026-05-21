import { db } from './dexie.db';
import { Product } from '../../domains/inventory/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Product Repository
 * Handles all product database operations
 */
export class ProductRepository {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Create a new product
   */
  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const now = new Date();
    const newProduct: Product = {
      id: uuidv4(),
      ...product,
      createdAt: now,
      updatedAt: now,
    };

    await db.products.add(newProduct);
    return newProduct;
  }

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<Product | undefined> {
    return await db.products.get(id);
  }

  /**
   * Get product by SKU
   */
  async getBySku(sku: string): Promise<Product | undefined> {
    return await db.products.where('sku').equals(sku).first();
  }

  /**
   * Get product by barcode
   */
  async getByBarcode(barcode: string): Promise<Product | undefined> {
    return await db.products.where('barcode').equals(barcode).first();
  }

  /**
   * Get all products for tenant
   */
  async getAll(limit: number = 1000, offset: number = 0): Promise<Product[]> {
    return await db.products
      .where('tenantId')
      .equals(this.tenantId)
      .offset(offset)
      .limit(limit)
      .toArray();
  }

  /**
   * Get active products only
   */
  async getActive(limit: number = 1000): Promise<Product[]> {
    return await db.products
      .where('tenantId')
      .equals(this.tenantId)
      .filter((p) => p.isActive)
      .limit(limit)
      .toArray();
  }

  /**
   * Search products by name or SKU
   */
  async search(query: string, limit: number = 50): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    return await db.products
      .where('tenantId')
      .equals(this.tenantId)
      .filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.sku.toLowerCase().includes(lowerQuery)
      )
      .limit(limit)
      .toArray();
  }

  /**
   * Update product
   */
  async update(id: string, updates: Partial<Product>): Promise<void> {
    const product = await db.products.get(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    await db.products.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  /**
   * Delete product
   */
  async delete(id: string): Promise<void> {
    await db.products.delete(id);
  }

  /**
   * Get products by category
   */
  async getByCategory(category: string): Promise<Product[]> {
    return await db.products
      .where('tenantId')
      .equals(this.tenantId)
      .filter((p) => p.category === category)
      .toArray();
  }

  /**
   * Bulk import products
   */
  async bulkImport(products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const now = new Date();
    const productsToAdd = products.map((p) => ({
      id: uuidv4(),
      ...p,
      createdAt: now,
      updatedAt: now,
    }));

    await db.products.bulkAdd(productsToAdd);
  }
}
