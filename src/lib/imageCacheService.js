// Image Cache Service - Store fetched images in Firebase to avoid re-fetching
import { db } from './firebase';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

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

      // Check Firebase cache
      const docRef = doc(db, this.collectionName, cacheKey);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Check if cache is still valid (30 days)
        const cacheAge = Date.now() - data.cachedAt.toMillis();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
        
        if (cacheAge < maxAge) {
          // Add to local cache
          this.localCache.set(cacheKey, data);
          console.log(`🗄️ Found in Firebase cache: ${productName} (${Math.round(cacheAge / (24 * 60 * 60 * 1000))} days old)`);
          return data;
        } else {
          console.log(`⏰ Cache expired for: ${productName}`);
          // Delete expired cache
          await this.deleteCachedImage(cacheKey);
        }
      }

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
        cachedAt: serverTimestamp(),
        fetchedFrom: imageData.source,
        matchScore: imageData.matchScore || 'unknown'
      };

      // Store in Firebase
      const docRef = doc(db, this.collectionName, cacheKey);
      await setDoc(docRef, cacheData);

      // Store in local cache
      this.localCache.set(cacheKey, { ...cacheData, cachedAt: { toMillis: () => Date.now() } });

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
      const docRef = doc(db, this.collectionName, cacheKey);
      await docRef.delete();
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
      const q = query(collection(db, this.collectionName));
      const querySnapshot = await getDocs(q);
      
      const stats = {
        total: querySnapshot.size,
        sources: {},
        oldestCache: null,
        newestCache: null
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Count by source
        const source = data.source || 'unknown';
        stats.sources[source] = (stats.sources[source] || 0) + 1;
        
        // Track oldest and newest
        const cacheTime = data.cachedAt?.toMillis() || 0;
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
      const q = query(collection(db, this.collectionName));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(doc.ref.delete());
      });

      await Promise.all(deletePromises);
      this.localCache.clear();
      
      console.log(`🧹 Cleared ${querySnapshot.size} cached images`);
      return { success: true, deleted: querySnapshot.size };
    } catch (error) {
      console.error('Error clearing cache:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear expired cache entries
  async clearExpiredCache() {
    try {
      const q = query(collection(db, this.collectionName));
      const querySnapshot = await getDocs(q);
      
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      const now = Date.now();
      const deletePromises = [];
      let expiredCount = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const cacheAge = now - (data.cachedAt?.toMillis() || 0);
        
        if (cacheAge > maxAge) {
          deletePromises.push(doc.ref.delete());
          expiredCount++;
        }
      });

      await Promise.all(deletePromises);
      
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
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        image: imageUrl,
        imageSource: source,
        imageUpdatedAt: serverTimestamp()
      });
      
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