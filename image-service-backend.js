// Simple Node.js backend service for fetching product images
// This handles CORS issues and provides a clean API for the React app

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Enable CORS for React app
app.use(cors({
  origin: 'http://localhost:3000', // React app URL
  credentials: true
}));

app.use(express.json());

// SerpApi configuration
const SERPAPI_KEY = 'e4b1a95bd46976556e574611eadb956051517e390dd63a4ca6adcb46de251d80';
const SERPAPI_URL = 'https://serpapi.com/search.json';

// Create images directory if it doesn't exist
const imagesDir = path.join(__dirname, 'public', 'images', 'products');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Image service is running' });
});

// Fetch product image from Google Shopping
app.post('/api/fetch-product-image', async (req, res) => {
  try {
    const { productName, brand, category } = req.body;
    
    if (!productName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Product name is required' 
      });
    }

    console.log(`Fetching image for: ${productName} (${brand || 'No brand'})`);

    // Build search query
    const searchQuery = buildSearchQuery(productName, brand, category);
    
    // Call SerpApi
    const params = {
      engine: 'google_shopping',
      q: searchQuery,
      location: 'India',
      api_key: SERPAPI_KEY
    };

    const response = await axios.get(SERPAPI_URL, { params });
    const data = response.data;

    if (data.shopping_results && data.shopping_results.length > 0) {
      const product = data.shopping_results[0];
      
      // Get image URL
      const imageUrl = product.thumbnail || product.image || product.product_image;
      
      if (imageUrl) {
        // Optionally download and save image locally
        let localImagePath = null;
        try {
          localImagePath = await downloadImage(imageUrl, productName);
        } catch (downloadError) {
          console.warn('Failed to download image locally:', downloadError.message);
        }

        return res.json({
          success: true,
          imageUrl: imageUrl,
          localImageUrl: localImagePath ? `/images/products/${path.basename(localImagePath)}` : null,
          source: 'google_shopping',
          productInfo: {
            title: product.title,
            price: product.price,
            source: product.source,
            link: product.link
          }
        });
      }
    }

    res.json({ 
      success: false, 
      error: 'No product images found in Google Shopping results' 
    });

  } catch (error) {
    console.error('Error fetching product image:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Batch fetch images for multiple products
app.post('/api/batch-fetch-images', async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Products array is required' 
      });
    }

    console.log(`Batch fetching images for ${products.length} products`);

    const results = [];
    
    for (const product of products) {
      try {
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = await fetchSingleProductImage(product);
        results.push({
          productId: product.id,
          productName: product.name,
          ...result
        });
        
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

    // Generate report
    const report = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    };

    res.json(report);

  } catch (error) {
    console.error('Error in batch fetch:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Helper function to build search query
function buildSearchQuery(productName, brand = '', category = 'fertilizer') {
  const cleanName = productName
    .toLowerCase()
    .replace(/\d+kg|\d+g|\d+ml|\d+l/g, '') // Remove weights
    .replace(/bag|packet|bottle/g, '') // Remove packaging terms
    .trim();

  const brandContext = brand ? `${brand} ` : '';
  const fertilizerTerms = 'fertilizer agriculture farming';
  
  return `${brandContext}${cleanName} ${fertilizerTerms}`;
}

// Helper function to match product with brand and keywords
function matchProduct(product, brand, keywords) {
  if (!product.title) return false;
  
  const titleLower = product.title.toLowerCase();
  const brandLower = brand.toLowerCase();
  
  // Check if brand matches
  const brandMatch = !brand || titleLower.includes(brandLower);
  
  // Check if all keywords match
  const keywordMatch = keywords.every(k => titleLower.includes(k.toLowerCase()));
  
  // Check if source is trusted
  const trustedSources = ['amazon.in', 'flipkart.com', 'indiamart.com', 'bighaat.com', 'agribegri.com'];
  const sourceMatch = trustedSources.some(source => 
    product.source?.toLowerCase().includes(source) || 
    product.link?.toLowerCase().includes(source)
  );
  
  return brandMatch && keywordMatch && sourceMatch;
}

// Helper function to fetch single product image with improved filtering
async function fetchSingleProductImage(product) {
  try {
    const productName = product.name;
    const brand = product.brand || '';
    const hsn = product.hsn || product.hsnCode || '';
    
    console.log(`Fetching image for: ${productName} | Brand: ${brand} | HSN: ${hsn}`);
    
    // Build targeted search query
    const searchTerms = [productName, brand, 'fertilizer'];
    if (hsn) searchTerms.push(hsn);
    
    const query = `${searchTerms.join(' ')} site:amazon.in OR site:flipkart.com OR site:indiamart.com OR site:bighaat.com`;
    
    const params = {
      engine: 'google_shopping',
      q: query,
      location: 'India',
      api_key: SERPAPI_KEY
    };

    const response = await axios.get(SERPAPI_URL, { params });
    const data = response.data;

    if (data.shopping_results && data.shopping_results.length > 0) {
      // Filter results by brand and keywords
      const keywords = productName.split(' ').filter(word => word.length > 2);
      const filteredResults = data.shopping_results.filter(productResult => 
        matchProduct(productResult, brand, keywords)
      );
      
      if (filteredResults.length > 0) {
        const bestMatch = filteredResults[0];
        const imageUrl = bestMatch.thumbnail || bestMatch.image || bestMatch.product_image;
        
        if (imageUrl) {
          console.log(`✅ Found matching product: ${bestMatch.title} from ${bestMatch.source}`);
          return {
            success: true,
            imageUrl: imageUrl,
            source: 'google_shopping_filtered',
            productInfo: {
              title: bestMatch.title,
              price: bestMatch.price,
              source: bestMatch.source,
              link: bestMatch.link,
              matchScore: 'high'
            }
          };
        }
      }
      
      // If no filtered results, log available options
      console.warn(`❌ No brand/keyword match for ${productName} (${brand})`);
      console.log('Available results:', data.shopping_results.map(r => r.title).slice(0, 3));
    }

    return { success: false, error: 'No matching images found' };
  } catch (error) {
    console.error(`Error fetching image for ${product.name}:`, error);
    return { success: false, error: error.message };
  }
}

// Helper function to download image locally
async function downloadImage(imageUrl, productName) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const fileName = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.jpg`;
    const filePath = path.join(imagesDir, fileName);
    
    fs.writeFileSync(filePath, response.data);
    console.log(`Image saved: ${fileName}`);
    
    return filePath;
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Image Service Backend running on http://localhost:${PORT}`);
  console.log(`📁 Images will be saved to: ${imagesDir}`);
  console.log(`🔑 Using SerpApi key: ${SERPAPI_KEY.substring(0, 10)}...`);
});

module.exports = app;