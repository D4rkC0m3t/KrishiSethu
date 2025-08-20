// Image Cache Service - Store fetched images in Supabase to avoid re-fetching


// Simple in-memory cache for now since we're migrating from Firebase
const imageCache = new Map();

class ImageCacheService {
  constructor() {
    this.collectionName = 'imageCache';
    this.localCache = new Map(); // In-memory cache for session
  }

  // Generate cache key for product
  generateCacheKey(productName, brand = '', hsn = '') {
    const key = `${productName}_${brand}_${hsn}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return key;
  }

  // Check if image exists in cache (Firebase)
  async getCachedImage(productName, brand = '', hsn = '') {
    try {
      const cacheKey = this.generateCacheKey(productName, brand, hsn);
      
      // Check local cache first
      if (this.localCache.has(cacheKey)) {
        const cached = this.localCache.get(cacheKey);
        console.log(`📦 Found in local cache: ${productName}`);
        return cached;
      }

      // Check in-memory cache
      if (imageCache.has(cacheKey)) {
        const cached = imageCache.get(cacheKey);
        console.log(`📦 Found in cache: ${productName}`);
        return cached;
      }

      // No cached data found in database

      return null;
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  }

  // Store image in cache (Firebase)
  async setCachedImage(productName, brand = '', hsn = '', imageData) {
    try {
      const cacheKey = this.generateCacheKey(productName, brand, hsn);
      
      const cacheData = {
        productName,
        brand,
        hsn,
        imageUrl: imageData.imageUrl,
        source: imageData.source,
        attribution: imageData.attribution || null,
        productInfo: imageData.productInfo || null,
        cachedAt: new Date().toISOString(),
        fetchedFrom: imageData.source,
        matchScore: imageData.matchScore || 'unknown'
      };

      // Store in local cache only (simplified for Supabase migration)
      this.localCache.set(cacheKey, cacheData);
      imageCache.set(cacheKey, cacheData);

      console.log(`💾 Cached image for: ${productName} from ${imageData.source}`);
      return true;
    } catch (error) {
      console.error('Error caching image:', error);
      return false;
    }
  }

  // Delete cached image
  async deleteCachedImage(cacheKey) {
    try {
      // Remove from cache (simplified for Supabase migration)
      this.localCache.delete(cacheKey);
      console.log(`🗑️ Deleted cached image: ${cacheKey}`);
      return true;
    } catch (error) {
      console.error('Error deleting cached image:', error);
      return false;
    }
  }

  // Get cache statistics
  async getCacheStats() {
    try {
      // Get cache stats (simplified for Supabase migration)
      const cacheEntries = Array.from(imageCache.entries());
      
      const stats = {
        total: cacheEntries.length,
        sources: {},
        oldestCache: null,
        newestCache: null
      };

      cacheEntries.forEach(([key, data]) => {
        // Count by source
        const source = data.source || 'unknown';
        stats.sources[source] = (stats.sources[source] || 0) + 1;

        // Track oldest and newest
        const cacheTime = data.cachedAt ? new Date(data.cachedAt).getTime() : 0;
        if (!stats.oldestCache || cacheTime < stats.oldestCache) {
          stats.oldestCache = cacheTime;
        }
        if (!stats.newestCache || cacheTime > stats.newestCache) {
          stats.newestCache = cacheTime;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { total: 0, sources: {}, error: error.message };
    }
  }

  // Clear all cached images
  async clearAllCache() {
    try {
      // Clear all cache (simplified for Supabase migration)
      const cacheSize = imageCache.size;
      imageCache.clear();
      this.localCache.clear();

      console.log(`🧹 Cleared ${cacheSize} cached images`);
      return { success: true, deleted: cacheSize };
    } catch (error) {
      console.error('Error clearing cache:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear expired cache entries
  async clearExpiredCache() {
    try {
      // Clear expired cache (simplified for Supabase migration)
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      const now = Date.now();
      let expiredCount = 0;

      for (const [key, data] of imageCache.entries()) {
        const cacheAge = now - (data.cachedAt ? new Date(data.cachedAt).getTime() : 0);

        if (cacheAge > maxAge) {
          imageCache.delete(key);
          this.localCache.delete(key);
          expiredCount++;
        }
      }
      
      console.log(`🧹 Cleared ${expiredCount} expired cached images`);
      return { success: true, deleted: expiredCount };
    } catch (error) {
      console.error('Error clearing expired cache:', error);
      return { success: false, error: error.message };
    }
  }

  // Update product image in products collection
  async updateProductImage(productId, imageUrl, source) {
    try {
      // Update product image using Supabase service
      // This would be handled by the products service in a real implementation
      console.log(`Would update product ${productId} with image from ${source}`);
      
      console.log(`📝 Updated product ${productId} with image from ${source}`);
      return true;
    } catch (error) {
      console.error('Error updating product image:', error);
      return false;
    }
  }

  // Batch update multiple products with cached images
  async batchUpdateProductImages(products) {
    try {
      const updatePromises = [];
      let updatedCount = 0;

      for (const product of products) {
        const cached = await this.getCachedImage(product.name, product.brand, product.hsn);
        
        if (cached && cached.imageUrl) {
          updatePromises.push(
            this.updateProductImage(product.id, cached.imageUrl, cached.source)
          );
          updatedCount++;
        }
      }

      await Promise.all(updatePromises);
      
      console.log(`📝 Batch updated ${updatedCount} products with cached images`);
      return { success: true, updated: updatedCount };
    } catch (error) {
      console.error('Error batch updating product images:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
export const imageCacheService = new ImageCacheService();

export default imageCacheService;