// Image Service - Handle manual uploads and automatic image fetching

import React from 'react';
import { imageCacheService } from './imageCacheService';

// Image APIs for fetching product images
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // Replace with your key
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

// SerpApi for Google Shopping (more reliable for product images)
const SERPAPI_KEY = 'e4b1a95bd46976556e574611eadb956051517e390dd63a4ca6adcb46de251d80';
const SERPAPI_URL = 'https://serpapi.com/search.json';

// Backend service URL (if available)
const BACKEND_SERVICE_URL = 'http://localhost:3001';

// Fallback images for different categories
const FALLBACK_IMAGES = {
  fertilizer: '/images/fallback/fertilizer.png',
  seed: '/images/fallback/seed.png',
  pesticide: '/images/fallback/pesticide.png',
  organic: '/images/fallback/organic.png',
  default: '/images/fallback/product.png'
};

class ImageService {
  constructor() {
    this.cache = new Map();
  }

  // Upload manual image to storage
  async uploadImage(file, productId) {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', file);
      formData.append('productId', productId);

      // In a real app, upload to your storage service (S3, Firebase Storage, etc.)
      // For now, we'll create a local URL
      const imageUrl = URL.createObjectURL(file);
      
      // Store in localStorage for persistence (in real app, save to database)
      const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages') || '{}');
      uploadedImages[productId] = {
        url: imageUrl,
        source: 'manual',
        uploadedAt: new Date().toISOString(),
        filename: file.name,
        size: file.size
      };
      localStorage.setItem('uploadedImages', JSON.stringify(uploadedImages));

      return {
        success: true,
        imageUrl,
        source: 'manual'
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Fetch image automatically from web
  async fetchImageFromWeb(productName, category = 'fertilizer', product = {}) {
    try {
      // SKIP CACHE FOR NOW - Force fresh image fetching
      const brand = product.brand || '';
      const hsn = product.hsn || product.hsnCode || '';
      
      console.log(`🔄 FORCING FRESH IMAGE FETCH for: ${productName} (Brand: ${brand}, HSN: ${hsn})`);
      
      // Skip cache temporarily to get fresh images
      // const cachedImage = await imageCacheService.getCachedImage(productName, brand, hsn);
      // if (cachedImage && cachedImage.imageUrl) {
      //   console.log(`🎯 Using cached image for: ${productName}`);
      //   return {
      //     success: true,
      //     imageUrl: cachedImage.imageUrl,
      //     source: cachedImage.source + '_cached',
      //     attribution: cachedImage.attribution,
      //     cached: true
      //   };
      // }

      // SKIP IN-MEMORY CACHE TOO - Force completely fresh fetching
      const cacheKey = `${productName}_${category}`;
      // if (this.cache.has(cacheKey)) {
      //   return this.cache.get(cacheKey);
      // }
      
      console.log(`🚀 Starting fresh image search for: ${productName}`);
      
      // Clear any existing cache for this product
      this.cache.delete(cacheKey);

      // Prepare search query
      const searchQuery = this.buildSearchQuery(productName, category);

      // Skip backend service for now (not running)
      // const backendResult = await this.fetchFromBackend(productName, category, brand);
      // if (backendResult.success) {
      //   this.cache.set(cacheKey, backendResult);
      //   return backendResult;
      // }

      // Try curated images first (faster and more reliable)
      console.log(`🎨 Trying curated images for: ${productName}`);
      const curatedResult = await this.getCuratedFertilizerImage(productName, category);
      if (curatedResult.success) {
        this.cache.set(cacheKey, curatedResult);
        console.log(`✅ Found curated image for ${productName} from ${curatedResult.source}: ${curatedResult.imageUrl}`);
        return curatedResult;
      } else {
        console.log(`❌ No curated image found for ${productName}: ${curatedResult.error}`);
      }

      // Try SerpApi Google Images first (better for product packaging)
      if (SERPAPI_KEY && SERPAPI_KEY !== 'YOUR_SERPAPI_KEY') {
        console.log(`🔍 Trying SerpAPI Google Images for: ${productName}`);
        const imagesResult = await this.searchGoogleImages(productName, brand, hsn);
        if (imagesResult.success) {
          this.cache.set(cacheKey, imagesResult);
          // Cache in Firebase for future use
          await imageCacheService.setCachedImage(productName, brand, hsn, imagesResult);
          console.log(`✅ Found SerpAPI Google Images for ${productName} from ${imagesResult.source}`);
          return imagesResult;
        }

        // Fallback to Google Shopping if Images didn't work
        console.log(`🔍 Trying SerpAPI Google Shopping for: ${productName}`);
        const serpResult = await this.searchGoogleShopping(productName, brand, hsn);
        if (serpResult.success) {
          this.cache.set(cacheKey, serpResult);
          // Cache in Firebase for future use
          await imageCacheService.setCachedImage(productName, brand, hsn, serpResult);
          console.log(`✅ Found SerpAPI Google Shopping for ${productName} from ${serpResult.source}`);
          return serpResult;
        }
      }

      // Skip slow scraping methods for now
      // const indiamartResult = await this.fetchFromIndiaMART(productName, brand);
      // const bighaatResult = await this.fetchFromBigHaat(productName, brand);
      // const unsplashResult = await this.searchUnsplash(searchQuery);

      console.log(`⚠️ No images found for ${productName}, using fallback`);

      // AUTOMATIC FETCHING DISABLED - Use manual upload only
      console.log(`📁 Automatic image fetching disabled. Use manual upload for: ${productName}`);
      return this.getFallbackImage(category, productName);

    } catch (error) {
      console.error('Error in fetchImageFromWeb:', error);
      return this.getFallbackImage(category, productName);
    }
  }

  // Fetch from backend service (avoids CORS issues)
  async fetchFromBackend(productName, category, brand = '') {
    try {
      const response = await fetch(`${BACKEND_SERVICE_URL}/api/fetch-product-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName,
          brand,
          category
        })
      });

      if (!response.ok) {
        throw new Error(`Backend service error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          imageUrl: data.localImageUrl || data.imageUrl, // Prefer local image
          source: 'backend_service',
          attribution: data.productInfo
        };
      }

      return { success: false, error: data.error || 'Backend service failed' };
    } catch (error) {
      console.warn('Backend service not available:', error.message);
      return { success: false, error: 'Backend service unavailable' };
    }
  }

  // Helper function to match product with brand and keywords (more flexible)
  matchProduct(product, brand, keywords) {
    if (!product.title) return false;

    const titleLower = product.title.toLowerCase();
    const brandLower = brand.toLowerCase();

    // More flexible brand matching - check if brand is mentioned anywhere
    const brandMatch = !brand || titleLower.includes(brandLower);

    // More flexible keyword matching - at least 50% of keywords should match
    const keywordMatches = keywords.filter(k => titleLower.includes(k.toLowerCase())).length;
    const keywordMatch = keywords.length === 0 || (keywordMatches / keywords.length) >= 0.5;

    // Check if source is trusted (more lenient)
    const trustedSources = ['amazon', 'flipkart', 'indiamart', 'bighaat', 'agribegri', 'krishijagran', 'agritech'];
    const sourceMatch = trustedSources.some(source =>
      product.source?.toLowerCase().includes(source) ||
      product.link?.toLowerCase().includes(source)
    );

    // Check if title contains fertilizer-related terms
    const fertilizerTerms = ['fertilizer', 'urea', 'dap', 'npk', 'potash', 'compost', 'manure', 'nutrient'];
    const fertilizerMatch = fertilizerTerms.some(term => titleLower.includes(term));

    return (brandMatch || fertilizerMatch) && keywordMatch && sourceMatch;
  }

  // Search Google Shopping via SerpApi with improved filtering
  async searchGoogleShopping(productName, brand = '', hsn = '') {
    try {
      console.log(`🔍 SerpApi search: ${productName} | Brand: ${brand} | HSN: ${hsn}`);

      // Build more targeted search query for fertilizers
      let query = `${productName}`;
      if (brand) query += ` ${brand}`;
      query += ` fertilizer agriculture India`;

      console.log(`🔍 Search query: ${query}`);

      const params = new URLSearchParams({
        engine: 'google_shopping',
        q: query,
        location: 'India',
        hl: 'en',
        gl: 'in',
        api_key: SERPAPI_KEY
      });

      const response = await fetch(`${SERPAPI_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`SerpApi request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.shopping_results && data.shopping_results.length > 0) {
        console.log(`📦 Found ${data.shopping_results.length} shopping results`);

        // Filter results by brand and keywords
        const keywords = productName.split(' ').filter(word => word.length > 2);
        const filteredResults = data.shopping_results.filter(product =>
          this.matchProduct(product, brand, keywords)
        );

        console.log(`🎯 Filtered to ${filteredResults.length} matching results`);

        if (filteredResults.length > 0) {
          const bestMatch = filteredResults[0];
          const imageUrl = bestMatch.thumbnail || bestMatch.image || bestMatch.product_image;

          if (imageUrl) {
            console.log(`✅ Found matching product: ${bestMatch.title} from ${bestMatch.source}`);
            return {
              success: true,
              imageUrl: imageUrl,
              source: 'google_shopping_filtered',
              attribution: {
                title: bestMatch.title,
                price: bestMatch.price,
                source: bestMatch.source,
                link: bestMatch.link,
                matchScore: 'high'
              }
            };
          }
        }

        // If no filtered results, try the first result anyway (less strict)
        if (data.shopping_results.length > 0) {
          const firstResult = data.shopping_results[0];
          const imageUrl = firstResult.thumbnail || firstResult.image || firstResult.product_image;

          if (imageUrl) {
            console.log(`⚠️ Using first available result: ${firstResult.title}`);
            return {
              success: true,
              imageUrl: imageUrl,
              source: 'google_shopping_fallback',
              attribution: {
                title: firstResult.title,
                price: firstResult.price,
                source: firstResult.source,
                link: firstResult.link,
                matchScore: 'medium'
              }
            };
          }
        }

        console.warn(`❌ No usable images found for ${productName} (${brand})`);
        console.log('Available results:', data.shopping_results.map(r => r.title).slice(0, 3));
      }

      return { success: false, error: 'No matching product images found' };
    } catch (error) {
      console.error('SerpApi search error:', error);
      
      // Check if it's a CORS error
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'CORS error - SerpApi calls need backend service',
          corsIssue: true
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  // Search Google Images via SerpApi for fertilizer product packaging
  async searchGoogleImages(productName, brand = '', hsn = '') {
    try {
      console.log(`🔍 SerpApi Google Images search: ${productName} | Brand: ${brand}`);

      // Build high-precision search query for fertilizer product packaging
      let query = '';

      // Create specific queries based on product type for better results
      const productLower = productName.toLowerCase();

      if (productLower.includes('urea')) {
        query = `"urea fertilizer bag" OR "urea fertilizer sack" OR "urea 50kg bag" packaging product`;
      } else if (productLower.includes('dap')) {
        query = `"DAP fertilizer bag" OR "diammonium phosphate packaging" product`;
      } else if (productLower.includes('npk')) {
        query = `"NPK fertilizer packaging" OR "NPK 20-20-20 bag" product`;
      } else if (productLower.includes('potash') || productLower.includes('mop')) {
        query = `"potash fertilizer bag" OR "muriate of potash packaging" product`;
      } else if (productLower.includes('organic') || productLower.includes('compost')) {
        query = `"organic fertilizer bag" OR "compost fertilizer packet" packaging`;
      } else if (productLower.includes('zinc')) {
        query = `"zinc sulphate fertilizer" OR "zinc fertilizer packaging" product`;
      } else {
        // Generic fertilizer query
        query = `"${productName}" fertilizer packaging product bag`;
      }

      // Add brand if available
      if (brand) {
        query = `${brand} ${query}`;
      }

      console.log(`🔍 SerpApi Google Images query: "${query}"`);

      // Use Google Images engine for better product packaging results
      const params = new URLSearchParams({
        engine: 'google_images',
        q: query,
        tbm: 'isch',
        hl: 'en',
        gl: 'in',
        num: '15',
        api_key: SERPAPI_KEY
      });

      const response = await fetch(`${SERPAPI_URL}?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`SerpApi request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.images_results && data.images_results.length > 0) {
        console.log(`📸 Found ${data.images_results.length} image results`);

        // Filter for high-quality product images
        const productImages = data.images_results.filter(img => {
          const title = (img.title || '').toLowerCase();
          const source = (img.source || '').toLowerCase();

          // Prefer images that look like actual products
          return (
            img.original &&
            (title.includes('fertilizer') || title.includes('bag') || title.includes('packaging') ||
             source.includes('indiamart') || source.includes('amazon') || source.includes('flipkart') ||
             source.includes('tradeindia') || source.includes('alibaba') || source.includes('bighaat'))
          );
        });

        console.log(`🎯 Found ${productImages.length} product-like images after filtering`);

        // Use the best quality image available
        const bestImage = productImages[0] || data.images_results[0];

        if (bestImage) {
          return {
            success: true,
            imageUrl: bestImage.original,
            source: 'serpapi_images',
            attribution: {
              title: bestImage.title,
              source: bestImage.source,
              position: bestImage.position
            }
          };
        }
      }

      return { success: false, error: 'No matching product images found' };
    } catch (error) {
      console.error('SerpApi Google Images search error:', error);

      // Check if it's a CORS error
      if (error.message.includes('CORS') || error.message.includes('fetch')) {
        return {
          success: false,
          error: 'CORS error - SerpApi calls need backend service',
          corsIssue: true
        };
      }

      return { success: false, error: error.message };
    }
  }

  // Fetch from IndiaMART (scraping approach)
  async fetchFromIndiaMART(productName, brand = '') {
    try {
      console.log(`Trying IndiaMART for: ${productName} ${brand}`);
      
      // Note: This is a simplified approach - in production, you'd need a backend service
      // to handle CORS and proper scraping
      const searchQuery = `${productName} ${brand} fertilizer`.trim();
      const searchUrl = `https://dir.indiamart.com/search.mp?ss=${encodeURIComponent(searchQuery)}`;
      
      // For now, return a placeholder since direct scraping from browser has CORS issues
      console.log(`IndiaMART search URL: ${searchUrl}`);
      
      return {
        success: false,
        error: 'IndiaMART scraping requires backend service',
        searchUrl: searchUrl
      };
    } catch (error) {
      console.error('IndiaMART fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  // Fetch from BigHaat (scraping approach)
  async fetchFromBigHaat(productName, brand = '') {
    try {
      console.log(`Trying BigHaat for: ${productName} ${brand}`);
      
      // Note: This is a simplified approach - in production, you'd need a backend service
      const searchQuery = `${productName} ${brand}`.trim();
      const searchUrl = `https://www.bighaat.com/search?q=${encodeURIComponent(searchQuery)}`;
      
      // For now, return a placeholder since direct scraping from browser has CORS issues
      console.log(`BigHaat search URL: ${searchUrl}`);
      
      return {
        success: false,
        error: 'BigHaat scraping requires backend service',
        searchUrl: searchUrl
      };
    } catch (error) {
      console.error('BigHaat fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  // Search Unsplash for product images
  async searchUnsplash(query) {
    try {
      const response = await fetch(
        `${UNSPLASH_API_URL}?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Unsplash API request failed');
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const image = data.results[0];
        return {
          success: true,
          imageUrl: image.urls.small,
          source: 'unsplash',
          attribution: {
            photographer: image.user.name,
            photographerUrl: image.user.links.html,
            downloadLocation: image.links.download_location
          }
        };
      }

      return { success: false, error: 'No images found' };
    } catch (error) {
      console.error('Unsplash search error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get curated fertilizer images from known sources
  async getCuratedFertilizerImage(productName, category) {
    try {
      // ACTUAL FERTILIZER PRODUCT IMAGES - Using specific fertilizer images
      const curatedImages = {
        // IFFCO Urea products - White granular fertilizer bags
        'urea': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop&auto=format&q=80',
        'urea 50kg': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop&auto=format&q=80',
        'urea bag': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop&auto=format&q=80',
        'iffco urea': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop&auto=format&q=80',

        // Coromandel DAP products - Dark granular fertilizer
        'dap': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&auto=format&q=80',
        'dap 50kg': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&auto=format&q=80',
        'diammonium phosphate': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&auto=format&q=80',
        'coromandel dap': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&auto=format&q=80',

        // Tata Chemicals NPK products - Mixed color granules
        'npk': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=400&fit=crop&auto=format&q=80',
        'npk 20-20-20': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=400&fit=crop&auto=format&q=80',
        'npk complex': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=400&fit=crop&auto=format&q=80',
        'tata npk': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=400&fit=crop&auto=format&q=80',
        'tata chemicals': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=400&fit=crop&auto=format&q=80',

        // ICL Potash products - Reddish-pink granules
        'potash': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=400&fit=crop&auto=format&q=80',
        'potash 50kg': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=400&fit=crop&auto=format&q=80',
        'mop': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=400&fit=crop&auto=format&q=80',
        'muriate of potash': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=400&fit=crop&auto=format&q=80',
        'icl potash': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=400&fit=crop&auto=format&q=80',

        // Green Gold Organic products - Dark brown compost
        'organic': 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=400&h=400&fit=crop&auto=format&q=80',
        'compost': 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=400&h=400&fit=crop&auto=format&q=80',
        'organic compost': 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=400&h=400&fit=crop&auto=format&q=80',
        'vermicompost': 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=400&h=400&fit=crop&auto=format&q=80',
        'green gold': 'https://images.unsplash.com/photo-1560707303-4e980ce876ad?w=400&h=400&fit=crop&auto=format&q=80',

        // Zinc Sulphate - Purple/violet crystals
        'zinc': 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=400&h=400&fit=crop&auto=format&q=80',
        'zinc sulphate': 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=400&h=400&fit=crop&auto=format&q=80',

        // Additional fertilizer types
        'calcium': 'https://images.unsplash.com/photo-1592595896551-12b371d546d5?w=400&h=400&fit=crop&auto=format&q=80',
        'sulphur': 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=400&fit=crop&auto=format&q=80',
        'boron': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=400&fit=crop&auto=format&q=80',
        'iron': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop&auto=format&q=80',

        // Seeds and other agri inputs
        'seed': 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop&auto=format&q=80',
        'pesticide': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop&auto=format&q=80',
        'fungicide': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=400&fit=crop&auto=format&q=80',
        'insecticide': 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=400&fit=crop&auto=format&q=80'
      };

      // Try to match product name with curated images
      const productKey = productName.toLowerCase();
      console.log(`🎨 Looking for curated image for: "${productKey}"`);
      console.log(`📋 Available curated keys:`, Object.keys(curatedImages));

      // Check for exact matches first
      if (curatedImages[productKey]) {
        console.log(`✅ Found exact match for: ${productKey}`);
        return {
          success: true,
          imageUrl: curatedImages[productKey],
          source: 'curated_exact'
        };
      }

      // Check for partial matches - prioritize longer matches
      const matches = [];
      for (const [key, imageUrl] of Object.entries(curatedImages)) {
        if (productKey.includes(key)) {
          matches.push({ key, imageUrl, score: key.length });
          console.log(`🔍 Product "${productKey}" contains key "${key}"`);
        } else if (key.includes(productKey)) {
          matches.push({ key, imageUrl, score: productKey.length });
          console.log(`🔍 Key "${key}" contains product "${productKey}"`);
        }
      }

      // Sort by score (longer matches first) and return the best match
      if (matches.length > 0) {
        matches.sort((a, b) => b.score - a.score);
        const bestMatch = matches[0];
        console.log(`✅ Found partial match: "${bestMatch.key}" for "${productKey}" (score: ${bestMatch.score})`);
        return {
          success: true,
          imageUrl: bestMatch.imageUrl,
          source: 'curated_partial'
        };
      }

      // Check by category
      if (category) {
        const categoryKey = category.toLowerCase();
        if (curatedImages[categoryKey]) {
          console.log(`✅ Found category match: ${categoryKey}`);
          return {
            success: true,
            imageUrl: curatedImages[categoryKey],
            source: 'curated_category'
          };
        }
      }

      // Default fertilizer bag image if no match found
      console.log(`⚠️ No curated match found for: ${productKey}, using default fertilizer image`);
      return {
        success: true,
        imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=400&fit=crop&auto=format',
        source: 'curated_default'
      };
    } catch (error) {
      console.error('Error getting curated image:', error);
      return { success: false, error: error.message };
    }
  }

  // Build search query based on product name and category
  buildSearchQuery(productName, category) {
    // Clean product name and add category context
    const cleanName = productName
      .toLowerCase()
      .replace(/\d+kg|\d+g|\d+ml|\d+l/g, '') // Remove weight/volume
      .replace(/bag|packet|bottle|container/g, '') // Remove packaging terms
      .trim();

    // Enhanced category terms for better search results
    const categoryTerms = {
      fertilizer: 'fertilizer agriculture farming India bag',
      nitrogen: 'urea nitrogen fertilizer agriculture India bag',
      phosphorus: 'DAP phosphorus fertilizer agriculture India bag',
      compound: 'NPK compound fertilizer agriculture India bag',
      potassium: 'potash potassium fertilizer agriculture India bag',
      organic: 'organic compost fertilizer agriculture India bag',
      seed: 'seeds agriculture farming plant India',
      pesticide: 'pesticide agriculture farming spray India',
      fungicide: 'fungicide agriculture farming spray India',
      insecticide: 'insecticide agriculture farming spray India'
    };

    // Add India context for better local results
    const searchTerm = `${cleanName} ${categoryTerms[category] || categoryTerms.fertilizer}`;
    
    return searchTerm;
  }

  // Get fallback image based on category
  getFallbackImage(category, productName) {
    // Try to match category from product name if not provided
    if (!category) {
      const name = productName.toLowerCase();
      if (name.includes('seed')) category = 'seed';
      else if (name.includes('pesticide') || name.includes('spray')) category = 'pesticide';
      else if (name.includes('organic') || name.includes('compost')) category = 'organic';
      else category = 'fertilizer';
    }

    return {
      success: true,
      imageUrl: FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default,
      source: 'fallback'
    };
  }

  // Get image for product (checks manual upload first, then auto-fetch)
  async getProductImage(product, forceRefresh = false) {
    try {
      console.log(`🔍 Getting image for: ${product.name} (Force refresh: ${forceRefresh})`);

      // Check if manual image exists (always respect manual uploads)
      const uploadedImages = JSON.parse(localStorage.getItem('uploadedImages') || '{}');
      if (uploadedImages[product.id] && !forceRefresh) {
        console.log(`📁 Using manual upload for: ${product.name}`);
        return {
          success: true,
          imageUrl: uploadedImages[product.id].url,
          source: 'manual'
        };
      }

      // If force refresh is enabled, skip existing image check
      if (!forceRefresh && product.image && product.image !== '' && !product.image.includes('placeholder')) {
        console.log(`💾 Using existing image for: ${product.name}`);
        return {
          success: true,
          imageUrl: product.image,
          source: 'existing'
        };
      }

      // AUTOMATIC FETCHING DISABLED - Return fallback image
      console.log(`📁 No manual upload found for: ${product.name}. Use manual upload to add images.`);
      return this.getFallbackImage(product.category, product.name);
    } catch (error) {
      console.error('Error getting product image:', error);
      return this.getFallbackImage(product.category, product.name);
    }
  }

  // Batch process images for multiple products
  async batchProcessImages(products) {
    const results = [];
    
    for (const product of products) {
      try {
        const imageResult = await this.getProductImage(product);
        results.push({
          productId: product.id,
          ...imageResult
        });
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing image for product ${product.id}:`, error);
        results.push({
          productId: product.id,
          ...this.getFallbackImage(product.category, product.name)
        });
      }
    }
    
    return results;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
export const imageService = new ImageService();

// React hook for using images in components
export const useProductImage = (product) => {
  const [imageData, setImageData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      try {
        const result = await imageService.getProductImage(product);
        if (mounted) {
          setImageData(result);
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to load product image:', error);
        if (mounted) {
          setImageData(imageService.getFallbackImage(product.category, product.name));
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [product.id, product.name, product.category]);

  return { imageData, loading };
};

export default imageService;
