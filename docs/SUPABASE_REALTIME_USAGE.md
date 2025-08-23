# 🔔 Supabase Realtime Integration Guide

## Overview

We've replaced the old polling system with proper **Supabase Realtime subscriptions** that provide instant updates when data changes in your database.

## ✅ What's Fixed

1. **No more polling loops** - No "Loading inventory..." every 5 seconds
2. **Instant updates** - Changes appear immediately when data changes
3. **Efficient** - Only updates when actual changes occur
4. **Clean subscriptions** - Proper cleanup when components unmount

---

## 🔧 How to Use in Components

### Option 1: Use the Hook (Recommended)

```jsx
import { useInventoryRealtime } from '../hooks/useSupabaseRealtime';

const InventoryComponent = () => {
  const [products, setProducts] = useState([]);

  // Set up realtime subscription for inventory updates
  useInventoryRealtime((update) => {
    console.log('📦 Inventory updated:', update);
    
    switch (update.type) {
      case 'INSERT':
        // New product added
        setProducts(prev => [...prev, update.product]);
        break;
      case 'UPDATE':
        // Product updated (quantity changed, etc.)
        setProducts(prev => 
          prev.map(p => 
            p.id === update.product.id ? update.product : p
          )
        );
        break;
      case 'DELETE':
        // Product removed
        setProducts(prev => 
          prev.filter(p => p.id !== update.product.id)
        );
        break;
    }
  });

  return (
    <div>
      {/* Your inventory UI */}
      {products.map(product => (
        <div key={product.id}>
          {product.name} - Stock: {product.quantity}
        </div>
      ))}
    </div>
  );
};
```

### Option 2: Use the Service Directly

```jsx
import { realtimeService } from '../lib/realtime';

useEffect(() => {
  // Subscribe to products table
  const unsubscribe = realtimeService.subscribeToProducts((payload) => {
    console.log('🔄 Product change:', payload);
    // Handle the update
  });

  // Cleanup
  return unsubscribe;
}, []);
```

---

## 📋 Available Hooks

### `useInventoryRealtime(callback)`
- Subscribes to product/inventory changes
- Focuses on stock quantity updates
- Perfect for inventory and POS components

### `useSalesRealtime(callback)`
- Subscribes to sales changes
- Great for dashboard and sales history

### `useCustomersRealtime(callback)`
- Subscribes to customer changes
- Useful for customer management

### `useSupabaseRealtime(tableName, callback)`
- Generic hook for any table
- Most flexible option

---

## 💡 Real-World Examples

### POS Component with Live Inventory

```jsx
// In POS.jsx
import { useInventoryRealtime } from '../hooks/useSupabaseRealtime';

const POS = () => {
  const [products, setProducts] = useState([]);

  // Live inventory updates - no more polling!
  useInventoryRealtime((update) => {
    if (update.type === 'UPDATE') {
      // Update product quantities in real-time
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === update.product.id 
            ? { ...product, quantity: update.product.quantity }
            : product
        )
      );
      
      // Show notification
      console.log(`📦 Stock updated: ${update.product.name} - ${update.product.quantity} remaining`);
    }
  });

  // ... rest of POS component
};
```

### Dashboard with Live Sales Updates

```jsx
// In Dashboard.jsx
import { useSalesRealtime } from '../hooks/useSupabaseRealtime';

const Dashboard = () => {
  const [recentSales, setRecentSales] = useState([]);

  // Live sales updates
  useSalesRealtime((update) => {
    if (update.type === 'INSERT') {
      // New sale completed
      setRecentSales(prev => [update.product, ...prev.slice(0, 9)]);
      
      // Show success notification
      toast.success(`💰 New sale: ₹${update.product.total_amount}`);
    }
  });

  // ... rest of dashboard
};
```

---

## 🎯 Benefits

1. **Real-time updates** - See changes instantly across all users
2. **No loading loops** - No more "Loading inventory..." spam
3. **Efficient** - Only updates when data actually changes
4. **Automatic cleanup** - Subscriptions cleaned up when components unmount
5. **Battery friendly** - No constant polling draining device resources

---

## 🛠 Supabase Realtime Setup

Make sure your Supabase project has Realtime enabled:

1. Go to your Supabase dashboard
2. Settings → API
3. Enable "Realtime" for tables you want to monitor
4. Set Row Level Security policies if needed

---

## 📊 Console Output

When working correctly, you'll see:
- `🔔 Setting up Supabase Realtime subscription for products`
- `📡 Realtime status for products: SUBSCRIBED`
- `🔄 Realtime update for products: {eventType: 'UPDATE', ...}`
- `📦 Inventory update detected: {...}`

---

This replaces the old polling system and gives you **instant, efficient updates** without the annoying loading loops! 🎉
