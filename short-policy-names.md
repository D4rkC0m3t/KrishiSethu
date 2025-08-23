# Supabase Storage Policies - Shortened Names (Under 50 Characters)

## Dashboard Policy Setup

Use these **exact policy names** when creating policies in Supabase Dashboard → Storage → Policies:

### 📸 **product-images** bucket:
- **Policy Name**: `Auth users full access product images`
- **Characters**: 36 ✅
- **Operation**: All
- **Target Roles**: authenticated  
- **Policy Definition**: `true`

### 📄 **product-documents** bucket:
- **Policy Name**: `Auth users full access product docs`
- **Characters**: 33 ✅
- **Operation**: All
- **Target Roles**: authenticated
- **Policy Definition**: `true`

### 🏪 **pos-images** bucket:
- **Policy Name**: `Auth users full access pos images`
- **Characters**: 32 ✅
- **Operation**: All
- **Target Roles**: authenticated
- **Policy Definition**: `true`

### 📋 **pos-documents** bucket:
- **Policy Name**: `Auth users full access pos docs`
- **Characters**: 29 ✅
- **Operation**: All
- **Target Roles**: authenticated
- **Policy Definition**: `true`

## Alternative Even Shorter Names:

If you want even shorter policy names:

| **Bucket** | **Policy Name** | **Characters** |
|------------|----------------|----------------|
| `product-images` | `Product images full access` | 26 ✅ |
| `product-documents` | `Product docs full access` | 24 ✅ |
| `pos-images` | `POS images full access` | 22 ✅ |
| `pos-documents` | `POS docs full access` | 20 ✅ |

## Super Short Names:

For maximum brevity:

| **Bucket** | **Policy Name** | **Characters** |
|------------|----------------|----------------|
| `product-images` | `Product img access` | 18 ✅ |
| `product-documents` | `Product doc access` | 18 ✅ |
| `pos-images` | `POS img access` | 14 ✅ |
| `pos-documents` | `POS doc access` | 14 ✅ |

## Instructions:

1. Go to **Supabase Dashboard** → **Storage** → **Policies**
2. Click **"New Policy"** for each bucket
3. Copy the exact policy name from above
4. Set **Operation**: `All`
5. Set **Target Roles**: `authenticated`  
6. Set **Policy Definition**: `true`
7. Click **Save**

## Verification:

After creating all policies, your uploads should work without the "Bucket not found" error!
