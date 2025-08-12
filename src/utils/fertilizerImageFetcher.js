// Fertilizer Image Fetcher - Automatically fetch product images from reliable sources
// This utility helps populate the product catalog with appropriate images

import { imageService } from '../lib/imageService';

class FertilizerImageFetcher {
  constructor() {
    this.sources = {
      amazon: 'https://www.amazon.in/s?k=',
      indiamart: 'https://dir.indiamart.com/search.mp?ss=',
      serpapi: 'https://serpapi.com/search.json'
    };
    
    this.serpApiKey = 'e4b1a95bd46976556e574611eadb956051517e390dd63a4ca6adcb46de251d80';
    
    // Brand mappings based on your actual stock items
    this.brandMappings = {
      'IFFCO': {
        urea: 'IFFCO Urea 50kg bag white granular nitrogen fertilizer India',
        'urea 50kg': 'IFFCO Urea 50kg bag white granular nitrogen fertilizer India',
        fertilizer: 'IFFCO fertilizer bag India agriculture'
      },
      'Coromandel': {
        dap: 'Coromandel DAP 50kg bag diammonium phosphate fertilizer India',
        'dap 50kg': 'Coromandel DAP 50kg bag diammonium phosphate fertilizer India',
        phosphorus: 'Coromandel phosphorus fertilizer bag India'
      },
      'Tata Chemicals': {
        npk: 'Tata Chemicals NPK 20-20-20 50kg complex fertilizer bag India',
        'npk 20-20-20': 'Tata Chemicals NPK 20-20-20 50kg complex fertilizer bag India',
        compound: 'Tata Chemicals compound fertilizer bag India'
      },
      'ICL': {
        potash: 'ICL Potash 50kg bag muriate of potash MOP fertilizer India',
        'potash 50kg': 'ICL Potash 50kg bag muriate of potash MOP fertilizer India',
        potassium: 'ICL potassium fertilizer bag India'
      },
      'Green Gold': {
        organic: 'Green Gold Organic Compost 25kg bag vermicompost fertilizer India',
        compost: 'Green Gold Organic Compost 25kg bag vermicompost fertilizer India',
        'organic compost': 'Green Gold Organic Compost 25kg bag vermicompost fertilizer India'
      }
    };
  }

  // Generate search query for fertilizer products
  generateSearchQuery(productName, brand = '') {
    const cleanName = productName
      .toLowerCase()
      .replace(/\d+kg|\d+g|\d+ml|\d+l/g, '') // Remove weights
      .replace(/bag|packet|bottle/g, '') // Remove packaging terms
      .trim();

    // Add brand context if available
    const brandContext = brand ? `${brand} ` : '';
    
    // Add fertilizer context
    const fertilizerTerms = 'fertilizer agriculture farming';
    
    return `${brandContext}${cleanName} ${fertilizerTerms}`;
  }

  // Fetch image from Amazon India (manual scraping approach)
  async fetchFromAmazon(productName, brand = '') {
    try {
      const searchQuery = this.generateSearchQuery(productName, brand);
      const amazonUrl = `${this.sources.amazon}${encodeURIComponent(searchQuery)}`;
      
      // Note: This would require a backend service to scrape Amazon
      // For now, return a placeholder that indicates Amazon source
      console.log(`Would search Amazon for: ${searchQuery}`);
      console.log(`Amazon URL: ${amazonUrl}`);
      
      return {
        success: false,
        error: 'Amazon scraping requires backend service',
        searchUrl: amazonUrl
      };
    } catch (error) {
      console.error('Amazon fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  // Fetch image from IndiaMART (manual scraping approach)
  async fetchFromIndiaMART(productName, brand = '') {
    try {
      const searchQuery = this.generateSearchQuery(productName, brand);
      const indiamartUrl = `${this.sources.indiamart}${encodeURIComponent(searchQuery)}`;
      
      // Note: This would require a backend service to scrape IndiaMART
      console.log(`Would search IndiaMART for: ${searchQuery}`);
      console.log(`IndiaMART URL: ${indiamartUrl}`);
      
      return {
        success: false,
        error: 'IndiaMART scraping requires backend service',
        searchUrl: indiamartUrl
      };
    } catch (error) {
      console.error('IndiaMART fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  // Fetch image from SerpApi Google Shopping
  async fetchFromSerpApi(productName, brand = '') {
    try {
      const searchQuery = this.generateSearchQuery(productName, brand);
      
      const params = new URLSearchParams({
        engine: 'google_shopping',
        q: searchQuery,
        location: 'India',
        api_key: this.serpApiKey
      });

      const response = await fetch(`${this.sources.serpapi}?${params}`);

      if (!response.ok) {
        throw new Error('SerpApi request failed');
      }

      const data = await response.json();
      
      if (data.shopping_results && data.shopping_results.length > 0) {
        const product = data.shopping_results[0];
        
        // Prefer thumbnail, fallback to other image fields
        const imageUrl = product.thumbnail || product.image || product.product_image;
        
        if (imageUrl) {
          return {
            success: true,
            imageUrl: imageUrl,
            source: 'serpapi_shopping',
            productInfo: {
              title: product.title,
              price: product.price,
              source: product.source,
              link: product.link
            }
          };
        }
      }

      return { success: false, error: 'No product images found in Google Shopping' };
    } catch (error) {
      console.error('SerpApi fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get curated image based on brand and product type
  getCuratedBrandImage(productName, brand) {
    try {
      const productLower = productName.toLowerCase();
      const brandUpper = brand.toUpperCase();
      
      if (this.brandMappings[brandUpper]) {
        const brandProducts = this.brandMappings[brandUpper];
        
        // Try to match product type
        for (const [type, description] of Object.entries(brandProducts)) {
          if (productLower.includes(type)) {
            // Return a curated image URL (these would be pre-collected images)
            return {
              success: true,
              imageUrl: `/images/brands/${brandUpper.toLowerCase()}/${type}.jpg`,
              source: 'curated_brand',
              description: description
            };
          }
        }
      }
      
      return { success: false, error: 'No brand mapping found' };
    } catch (error) {
      console.error('Brand image error:', error);
      return { success: false, error: error.message };
    }
  }

  // Batch process multiple products
  async batchFetchImages(products) {
    const results = [];
    
    for (const product of products) {
      try {
        console.log(`Processing images for: ${product.name}`);
        
        // Try curated brand images first
        const brandResult = this.getCuratedBrandImage(product.name, product.brand || '');
        if (brandResult.success) {
          results.push({
            productId: product.id,
            productName: product.name,
            ...brandResult
          });
          continue;
        }
        
        // Try SerpApi Google Shopping
        const serpResult = await this.fetchFromSerpApi(product.name, product.brand || '');
        if (serpResult.success) {
          results.push({
            productId: product.id,
            productName: product.name,
            ...serpResult
          });
          continue;
        }
        
        // Try existing image service as fallback
        const imageResult = await imageService.getProductImage(product);
        results.push({
          productId: product.id,
          productName: product.name,
          ...imageResult
        });
        
        // Add delay to avoid overwhelming services
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`Error processing ${product.name}:`, error);
        results.push({
          productId: product.id,
          productName: product.name,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  // Generate report of image fetching results
  generateReport(results) {
    const report = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      sources: {},
      errors: []
    };
    
    results.forEach(result => {
      if (result.success) {
        const source = result.source || 'unknown';
        report.sources[source] = (report.sources[source] || 0) + 1;
      } else {
        report.errors.push({
          product: result.productName,
          error: result.error
        });
      }
    });
    
    return report;
  }

  // Save images to local storage (for demo purposes)
  saveImagesToStorage(results) {
    try {
      const successfulImages = results
        .filter(r => r.success)
        .reduce((acc, result) => {
          acc[result.productId] = {
            url: result.imageUrl,
            source: result.source,
            fetchedAt: new Date().toISOString()
          };
          return acc;
        }, {});
      
      // Merge with existing images
      const existingImages = JSON.parse(localStorage.getItem('fetchedImages') || '{}');
      const updatedImages = { ...existingImages, ...successfulImages };
      
      localStorage.setItem('fetchedImages', JSON.stringify(updatedImages));
      
      return {
        success: true,
        saved: Object.keys(successfulImages).length,
        total: Object.keys(updatedImages).length
      };
    } catch (error) {
      console.error('Error saving images to storage:', error);
      return { success: false, error: error.message };
    }
  }

  // Load images from storage
  loadImagesFromStorage() {
    try {
      return JSON.parse(localStorage.getItem('fetchedImages') || '{}');
    } catch (error) {
      console.error('Error loading images from storage:', error);
      return {};
    }
  }

  // Clear image cache
  clearImageCache() {
    try {
      localStorage.removeItem('fetchedImages');
      localStorage.removeItem('uploadedImages');
      imageService.clearCache();
      return { success: true };
    } catch (error) {
      console.error('Error clearing image cache:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
export const fertilizerImageFetcher = new FertilizerImageFetcher();

// Utility function to populate product images
export const populateProductImages = async (products) => {
  console.log(`Starting image population for ${products.length} products...`);
  
  const results = await fertilizerImageFetcher.batchFetchImages(products);
  const report = fertilizerImageFetcher.generateReport(results);
  const saveResult = fertilizerImageFetcher.saveImagesToStorage(results);
  
  console.log('Image Population Report:', report);
  console.log('Save Result:', saveResult);
  
  return {
    results,
    report,
    saveResult
  };
};

export default fertilizerImageFetcher;