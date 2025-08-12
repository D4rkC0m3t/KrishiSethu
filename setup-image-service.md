# KrishiSethu Image Service Setup

This guide will help you set up the image fetching service for your POS system.

## What's Been Fixed

✅ **POS Component**: Now properly loads and displays product images
✅ **Image Service**: Enhanced with SerpApi Google Shopping integration
✅ **Backend Service**: Created to handle CORS issues and image downloading
✅ **Fallback System**: Multiple fallback options for reliable image loading

## Quick Start

### Option 1: Use Enhanced Frontend Only (Immediate)

The POS system now has improved image loading with curated images and better fallbacks:

1. **Your POS is already updated** - images should start loading automatically
2. **Curated images** are available for common fertilizers (Urea, DAP, NPK, etc.)
3. **Loading indicators** show while images are being fetched
4. **Fallback icons** display when images can't be loaded

### Option 2: Full Backend Service (Recommended)

For the best image quality using real Google Shopping data:

1. **Install backend dependencies**:
   ```bash
   cd "d:\Inventory Management\inventory-management"
   npm install express cors axios --save-dev
   ```

2. **Start the image service backend**:
   ```bash
   node image-service-backend.js
   ```
   
   You should see:
   ```
   🚀 Image Service Backend running on http://localhost:3001
   📁 Images will be saved to: [path]/public/images/products
   🔑 Using SerpApi key: e4b1a95bd4...
   ```

3. **Your React app will automatically use the backend** when available

## Testing the Image Service

### Test Component Available

A test component has been created at `src/components/ImageTest.jsx`. To use it:

1. **Add to your navigation** or temporarily replace a component
2. **Test different products** like:
   - "Urea 50kg Bag" (IFFCO)
   - "DAP 50kg Bag" (Coromandel)
   - "NPK 20-20-20 50kg" (Tata Chemicals)

### Manual Testing in POS

1. **Go to Point of Sale** in your app
2. **Check product cards** - they should show:
   - Loading spinners initially
   - Product images when loaded
   - Package icons as fallbacks

## Image Sources Priority

The system tries these sources in order:

1. **Database images** (if product.image exists)
2. **Backend service** (SerpApi Google Shopping)
3. **Curated images** (pre-selected for common fertilizers)
4. **Unsplash API** (generic agriculture images)
5. **Fallback icons** (package icon)

## Troubleshooting

### Images Not Loading?

1. **Check browser console** for error messages
2. **Verify backend service** is running (if using Option 2)
3. **Check network tab** to see which requests are failing

### Backend Service Issues?

1. **Port conflict**: Change PORT in `image-service-backend.js`
2. **Dependencies missing**: Run `npm install express cors axios`
3. **SerpApi quota**: Check your SerpApi dashboard for usage

### CORS Errors?

- This is expected when calling SerpApi directly from browser
- Use the backend service (Option 2) to avoid CORS issues

## Production Deployment

For production, you should:

1. **Deploy backend service** to your server
2. **Update BACKEND_SERVICE_URL** in imageService.js
3. **Set up image storage** (AWS S3, Firebase Storage, etc.)
4. **Add image caching** for better performance

## API Endpoints

### Backend Service Endpoints

- `GET /health` - Health check
- `POST /api/fetch-product-image` - Fetch single product image
- `POST /api/batch-fetch-images` - Batch fetch multiple images
- `GET /images/products/*` - Serve downloaded images

### Example API Call

```javascript
fetch('http://localhost:3001/api/fetch-product-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productName: 'Urea 50kg Bag',
    brand: 'IFFCO',
    category: 'fertilizer'
  })
})
```

## Next Steps

1. **Test the current implementation** in your POS
2. **Start backend service** if you want real Google Shopping images
3. **Add more curated images** for your specific products
4. **Consider Firebase Storage integration** for permanent image storage

## Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify all dependencies are installed
3. Ensure the backend service is running (if using Option 2)
4. Test with the ImageTest component first

The image loading should now work much better in your Point of Sale system!