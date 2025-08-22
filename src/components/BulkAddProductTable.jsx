import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { productsService, suppliersService, brandsService, categoriesService } from '../lib/supabaseDb';
import { Trash2, Plus, RefreshCw } from 'lucide-react';
import {
  CATEGORIES,
  FERTILIZER_TYPES,
  UNITS,
  GST_RATES,
  getTypesForCategory,
  getHSNCode,
  getSuggestedGSTRate
} from '../config/fertilizerConfig';
import {
  getRecommendedUnit,
  validateProductName,
  getProductNamingExamples,
  getUnitDisplayInfo,
  validateQuantity,
  formatPriceWithUnit
} from '../utils/uomHelpers';

const COLUMNS = [
  { key: 'name', label: 'Product Name*', width: 220, required: true },
  { key: 'brand', label: 'Brand*', width: 160, required: true, type: 'brand' },
  { key: 'category', label: 'Category*', width: 170, required: true, type: 'category' },
  { key: 'type', label: 'Type*', width: 140, required: true, options: FERTILIZER_TYPES, dependsOn: 'category' },
  { key: 'batchNo', label: 'Batch No*', width: 140, required: true },
  { key: 'barcode', label: 'Barcode/QR', width: 150 },
  { key: 'hsn', label: 'HSN', width: 110 },
  { key: 'gstRate', label: 'GST %', width: 100, options: GST_RATES.map(r => r.toString()) },
  { key: 'manufacturingDate', label: 'Mfg Date', width: 150, type: 'date' },
  { key: 'expiryDate', label: 'Expiry Date*', width: 150, required: true, type: 'date' },
  { key: 'purchasePrice', label: 'Purchase ₹*', width: 120, required: true, type: 'number' },
  { key: 'salePrice', label: 'Sale ₹*', width: 110, required: true, type: 'number' },
  { key: 'quantity', label: 'Qty*', width: 90, required: true, type: 'number' },
  { key: 'unit', label: 'Unit*', width: 110, required: true, options: UNITS },
  { key: 'supplierId', label: 'Supplier*', width: 200, required: true, type: 'supplier' },
  { key: 'description', label: 'Description', width: 240 },
];

const emptyRow = () => ({
  name: '',
  brand: '',
  type: '',
  category: '',
  batchNo: '',
  barcode: '',
  hsn: '',
  gstRate: '18', // Default GST rate
  manufacturingDate: '',
  expiryDate: '',
  purchasePrice: '',
  salePrice: '',
  quantity: '1', // Default quantity
  unit: 'pcs', // Default to pieces for new UOM approach
  supplierId: '',
  description: ''
});

export default function BulkAddProductTable({ onNavigate }) {
  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
  const [suppliers, setSuppliers] = useState([]);
  const [brands, setBrands] = useState([]);
  // Initialize categories with config data immediately to avoid first render issues
  const [categories, setCategories] = useState(() => {
    console.log('🔍 CATEGORIES from config:', CATEGORIES);
    const configCategories = CATEGORIES.map((name, index) => ({
      id: `cat_${index + 1}`,
      name: name,
      description: `${name} products`,
      is_active: true,
      sort_order: index + 1
    }));
    console.log('🔍 Initial categories state:', configCategories);
    return configCategories;
  });
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const tableRef = useRef(null);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        console.log('🔄 Loading suppliers for bulk add...');

        // Try to load real suppliers first
        try {
          const { suppliersService } = await import('../lib/supabaseDb');
          const result = await suppliersService.getAll();

          if (result && result.length > 0) {
            console.log(`✅ Loaded ${result.length} suppliers from database`);
            setSuppliers(result);
            return;
          }
        } catch (dbError) {
          console.warn('⚠️ Could not load suppliers from database:', dbError.message);
        }

        // Show empty state to encourage user to set up suppliers
        console.log('📦 No suppliers found in database, showing empty state');
        setSuppliers([]);
      } catch (e) {
        console.error('❌ Failed to load suppliers:', e);
        console.log('📦 Error loading suppliers, showing empty state');
        setSuppliers([]);
      }
    };

    const loadBrands = async () => {
      try {
        setBrandsLoading(true);
        console.log('🔄 Loading brands for bulk add...');

        // Check if database has brands, otherwise show empty state
        try {
          const data = await brandsService.getAll();
          console.log('📊 Database brands loaded:', data);
          if (data && data.length > 0) {
            // Ensure each brand has an id field
            const validBrands = data.map(brand => ({
              ...brand,
              id: brand.id || brand._id || brand.brandId || `brand_${Date.now()}_${Math.random()}`
            }));
            console.log('🔄 Using database brands:', validBrands);
            setBrands(validBrands);
          } else {
            console.log('📦 No brands in database, showing empty state');
            setBrands([]);
          }
          setBrandsLoading(false);
        } catch (dbError) {
          console.warn('⚠️ Database brands not available, showing empty state:', dbError.message);
          setBrands([]);
          setBrandsLoading(false);
        }
      } catch (error) {
        console.error('❌ Error loading brands:', error);
        // Show empty state to encourage user to set up brands
        setBrands([]);
      } finally {
        setBrandsLoading(false);
      }
    };

    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        console.log('🔄 Loading categories from database...');

        // Try to load from database first
        const data = await categoriesService.getAll();
        console.log('📊 Database categories loaded:', data);

        if (data && data.length > 0) {
          setCategories(data);
        } else {
          // Fallback to config categories
          const configCategories = CATEGORIES.map((name, index) => ({
            id: `cat_${index + 1}`,
            name: name,
            description: `${name} products`,
            is_active: true,
            sort_order: index + 1
          }));
          setCategories(configCategories);
        }
      } catch (error) {
        console.error('❌ Error loading categories:', error);
        // Fallback to config categories
        const configCategories = CATEGORIES.map((name, index) => ({
          id: `cat_${index + 1}`,
          name: name,
          description: `${name} products`,
          is_active: true,
          sort_order: index + 1
        }));
        setCategories(configCategories);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadSuppliers();
    loadBrands();
    loadCategories();
  }, []);

  const addRows = (count = 5) => setRows(prev => [...prev, ...Array.from({ length: count }, emptyRow)]);
  const clearRows = () => setRows([emptyRow()]);
  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  const handleCellChange = (idx, key, value) => {
    setRows(prev => prev.map((r, i) => {
      if (i !== idx) return r;

      const updatedRow = { ...r, [key]: value };

      // Auto-populate based on field changes
      if (key === 'category') {
        // Reset type when category changes and auto-populate GST rate
        updatedRow.type = '';
        updatedRow.gstRate = getSuggestedGSTRate(value).toString();
      } else if (key === 'type' && r.category) {
        // Auto-populate HSN code when type is selected
        const hsnCode = getHSNCode(r.category, value);
        if (hsnCode) {
          updatedRow.hsn = hsnCode;
        }
      }

      return updatedRow;
    }));
  };

  // Paste TSV/CSV from clipboard into the focused cell and auto-spread into grid
  const handlePaste = (e, startRow, startCol) => {
    const text = e.clipboardData?.getData('text');
    if (!text) return;
    const rowsText = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (rowsText.length <= 1 && text.indexOf('\t') === -1) return; // normal paste
    e.preventDefault();
    const data = rowsText.map(line => line.split(/\t|,/) );
    setRows(prev => {
      const copy = [...prev];
      for (let r = 0; r < data.length; r++) {
        const targetIndex = startRow + r;
        if (!copy[targetIndex]) copy[targetIndex] = emptyRow();
        for (let c = 0; c < data[r].length && (startCol + c) < COLUMNS.length; c++) {
          const colKey = COLUMNS[startCol + c].key;
          copy[targetIndex] = { ...copy[targetIndex], [colKey]: data[r][c].trim() };
        }
      }
      return copy;
    });
  };

  const validateRow = (row) => {
    const errs = {};
    COLUMNS.forEach(col => {
      if (col.required) {
        const v = row[col.key];
        if (v === undefined || v === null || String(v).trim() === '') errs[col.key] = 'Required';
      }
    });
    // Additional validation
    if (row.purchasePrice && row.salePrice && parseFloat(row.salePrice) <= parseFloat(row.purchasePrice)) {
      errs.salePrice = 'Must be > purchase';
    }
    return errs;
  };

  const validRows = useMemo(() => rows.map(validateRow), [rows]);

  const handleSaveAll = async () => {
    setSaving(true);
    const msgs = [];
    let successCount = 0;
    let errorCount = 0;

    try {
      console.log(`🚀 Starting bulk save of ${rows.length} products...`);

      // Build promises sequentially to keep it simple
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const errs = validateRow(row);
        if (Object.keys(errs).length > 0) {
          msgs.push({ type: 'error', text: `Row ${i + 1} has validation errors. Skipped.` });
          errorCount++;
          continue;
        }

        // Resolve names to IDs for foreign key references
        const categoryId = categories.find(cat => cat.name === row.category)?.id || null;
        const brandId = brands.find(brand => brand.name === row.brand)?.id || null;

        // Map category name to enum value - convert frontend category names to database enum values
        const categoryToEnumMapping = {
          'Chemical Fertilizer': 'Chemical',
          'Organic Fertilizer': 'Organic',
          'Bio Fertilizer': 'Bio',
          'NPK Fertilizers': 'NPK',
          'Seeds': 'Seeds',
          'Pesticides': 'Pesticide',
          'Tools': 'Tools'
        };

        // For types, we need to map the category to the enum value
        const typeEnum = categoryToEnumMapping[row.category] || 'Chemical'; // Default to Chemical

        console.log('🔄 Resolving references:', {
          categoryName: row.category,
          categoryId: categoryId,
          brandName: row.brand,
          brandId: brandId,
          typeEnum: typeEnum
        });

        // Validate that we have valid IDs
        if (!categoryId) {
          throw new Error(`Category "${row.category}" not found in database`);
        }
        if (!brandId) {
          throw new Error(`Brand "${row.brand}" not found in database`);
        }

        // Map frontend fields to database schema
        const payload = {
          name: row.name.trim(),
          type: typeEnum,
          category_id: categoryId,
          brand_id: brandId,
          supplier_id: row.supplierId || null,
          batch_no: row.batchNo,
          barcode: row.barcode || null,
          hsn: row.hsn || null,
          gst_rate: row.gstRate ? Number(row.gstRate) : 18,
          manufacturing_date: row.manufacturingDate ? new Date(row.manufacturingDate) : null,
          expiry_date: row.expiryDate ? new Date(row.expiryDate) : null,
          purchase_price: parseFloat(row.purchasePrice),
          sale_price: parseFloat(row.salePrice), // Map to sale_price
          quantity: parseInt(row.quantity || '1', 10),
          unit: row.unit || 'kg',
          min_stock_level: 10, // Default minimum stock level
          description: row.description || null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };

        try {
          console.log(`💾 Saving product ${i + 1}: ${row.name}`);
          const result = await productsService.add(payload);
          console.log(`✅ Product ${i + 1} saved successfully:`, result);
          msgs.push({ type: 'ok', text: `✅ Row ${i + 1}: ${row.name} added successfully.` });
          successCount++;
        } catch (e) {
          console.error(`❌ Error saving product ${i + 1}:`, e);
          const errorMsg = e.message || 'Unknown error occurred';
          msgs.push({ type: 'error', text: `❌ Row ${i + 1}: ${row.name} failed - ${errorMsg}` });
          errorCount++;
        }
      }

      // Add summary message
      if (successCount > 0 && errorCount === 0) {
        msgs.unshift({ type: 'ok', text: `🎉 All ${successCount} products saved successfully!` });
      } else if (successCount > 0 && errorCount > 0) {
        msgs.unshift({ type: 'error', text: `⚠️ ${successCount} products saved, ${errorCount} failed. Check details below.` });
      } else if (errorCount > 0) {
        msgs.unshift({ type: 'error', text: `❌ All ${errorCount} products failed to save. Check details below.` });
      }

      console.log(`📊 Bulk save completed: ${successCount} success, ${errorCount} errors`);
      setMessages(msgs);
    } catch (error) {
      console.error('❌ Bulk save operation failed:', error);
      msgs.push({ type: 'error', text: `❌ Bulk save failed: ${error.message || 'Unknown error'}` });
      setMessages(msgs);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => onNavigate('inventory')}>← Back to Inventory</Button>
        <div>
          <h1 className="text-2xl font-bold">Bulk Add Products</h1>
          <p className="text-sm text-muted-foreground">Excel-like table entry. Paste from Excel/CSV, add rows, and save all.</p>
        </div>
      </div>

      {/* UOM Guidance Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-800">📦 UOM Best Practice Guide</CardTitle>
          <CardDescription className="text-blue-700">
            Follow this approach for consistent inventory tracking
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">✅ Product Naming</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• <strong>Format:</strong> [Name] @[%] - [Size]</li>
                <li>• <strong>Liquid:</strong> Nutrient @12% - 250ml</li>
                <li>• <strong>Granular:</strong> NPK @20:20:0 - 50kg</li>
                <li>• <strong>Seeds:</strong> Wheat Premium - 1kg Pack</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">📏 Unit & Pricing</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• <strong>Default Unit:</strong> "pcs" (pieces)</li>
                <li>• <strong>Quantity:</strong> Count individual items</li>
                <li>• <strong>Price:</strong> Per piece, not per box</li>
                <li>• <strong>Example:</strong> 50 bottles = 50 pcs @ ₹200/pc</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Entry Grid</CardTitle>
          <CardDescription>Use Tab/Enter to move between cells. You can paste multiple rows directly.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 pb-3">
            <Button size="sm" onClick={() => addRows(5)}><Plus className="h-4 w-4 mr-1"/>Add 5 rows</Button>
            <Button size="sm" variant="outline" onClick={() => addRows(10)}><Plus className="h-4 w-4 mr-1"/>Add 10</Button>
            <Button size="sm" variant="outline" onClick={clearRows}><Trash2 className="h-4 w-4 mr-1"/>Clear</Button>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" onClick={handleSaveAll} disabled={saving}><RefreshCw className={`h-4 w-4 mr-1 ${saving ? 'animate-spin' : ''}`}/> {saving ? 'Saving...' : 'Save All'}</Button>
            </div>
          </div>

          <div className="overflow-auto border rounded-md">
            <table ref={tableRef} className="min-w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-2 py-2 text-left w-10">#</th>
                  {COLUMNS.map(col => (
                    <th key={col.key} className="px-2 py-2 text-left" style={{ minWidth: col.width }}>{col.label}</th>
                  ))}
                  <th className="px-2 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-t">
                    <td className="px-2 py-1 text-muted-foreground">{rIdx + 1}</td>
                    {COLUMNS.map((col, cIdx) => (
                      <td key={col.key} className="px-2 py-1 align-top">
                        {col.options ? (
                          <Select
                            value={row[col.key] || ''}
                            onValueChange={(v) => handleCellChange(rIdx, col.key, v)}
                            disabled={col.dependsOn && !row[col.dependsOn]}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={
                                col.dependsOn && !row[col.dependsOn]
                                  ? `Select ${col.dependsOn} first`
                                  : `Select ${col.label.replace('*','')}`
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {(col.key === 'type' && row.category
                                ? (() => {
                                    const types = getTypesForCategory(row.category);
                                    console.log(`🔍 Types for category "${row.category}":`, types);
                                    return types;
                                  })()
                                : col.options
                              ).map(opt => (
                                <SelectItem key={opt} value={opt}>
                                  {col.key === 'gstRate' ? `${opt}%` : opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : col.type === 'supplier' ? (
                          <Select value={row.supplierId || ''} onValueChange={(v) => handleCellChange(rIdx, 'supplierId', v)}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                              {suppliers.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        ) : col.type === 'category' ? (
                          <Select value={row.category || ''} onValueChange={(v) => handleCellChange(rIdx, 'category', v)}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select Category"} />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category.id} value={category.name}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : col.type === 'brand' ? (
                          <Select value={row.brand || ''} onValueChange={(v) => handleCellChange(rIdx, 'brand', v)}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={brandsLoading ? "Loading..." : "Select Brand"} />
                            </SelectTrigger>
                            <SelectContent>
                              {brands.map(brand => (
                                <SelectItem key={brand.id} value={brand.name}>
                                  {brand.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={col.type === 'number' ? 'number' : (col.type === 'date' ? 'date' : 'text')}
                            className={`h-8 ${validRows[rIdx][col.key] ? 'border-red-500' : ''}`}
                            value={row[col.key] || ''}
                            onChange={(e) => handleCellChange(rIdx, col.key, e.target.value)}
                            onPaste={(e) => handlePaste(e, rIdx, cIdx)}
                          />
                        )}
                        {validRows[rIdx][col.key] && (
                          <div className="text-[10px] text-red-500 mt-0.5">{validRows[rIdx][col.key]}</div>
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeRow(rIdx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {messages.length > 0 && (
            <div className="mt-4 space-y-1">
              {messages.map((m, i) => (
                <div key={i} className={`text-sm ${m.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{m.text}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

