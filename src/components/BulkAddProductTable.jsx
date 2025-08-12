import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { productsService, suppliersService } from '../lib/firestore';
import { Trash2, Plus, Upload, Download, RefreshCw } from 'lucide-react';

const fertilizerTypes = ['Micro','Macro','Chemical','Organic','Bio-fertilizer','Liquid','Granular','Water Soluble','Slow Release','Controlled Release','Foliar Spray','Soil Conditioner','Micronutrient Mix','Bio-stimulant','Herbal','Mineral','Soluble Powder','Seeds'];
const categories = ['Nitrogen (N)','Phosphorus (P)','Potassium (K)','Compound (NPK)','Urea','DAP','MOP','SSP','10:26:26','20:20:0:13','19:19:19','Micronutrients','Zinc','Boron','Calcium','Sulphur','Compost','Vermicompost','Bio-stimulants','Soil Conditioner','Organic Manure','Seaweed Extract','Humic/Fulvic','Amino Acid'];
const units = ['kg','bags','liters','tons','packets'];

const COLUMNS = [
  { key: 'name', label: 'Product Name*', width: 220, required: true },
  { key: 'brand', label: 'Brand*', width: 160, required: true },
  { key: 'type', label: 'Type*', width: 140, required: true, options: fertilizerTypes },
  { key: 'category', label: 'Category*', width: 170, required: true, options: categories },
  { key: 'batchNo', label: 'Batch No*', width: 140, required: true },
  { key: 'barcode', label: 'Barcode/QR', width: 150 },
  { key: 'hsn', label: 'HSN', width: 110 },
  { key: 'gstRate', label: 'GST %', width: 100, type: 'number' },
  { key: 'manufacturingDate', label: 'Mfg Date', width: 150, type: 'date' },
  { key: 'expiryDate', label: 'Expiry Date*', width: 150, required: true, type: 'date' },
  { key: 'purchasePrice', label: 'Purchase ₹*', width: 120, required: true, type: 'number' },
  { key: 'salePrice', label: 'Sale ₹*', width: 110, required: true, type: 'number' },
  { key: 'quantity', label: 'Qty*', width: 90, required: true, type: 'number' },
  { key: 'unit', label: 'Unit*', width: 110, required: true, options: units },
  { key: 'supplierId', label: 'Supplier*', width: 200, required: true, type: 'supplier' },
  { key: 'description', label: 'Description', width: 240 },
];

const emptyRow = () => ({
  name: '', brand: '', type: '', category: '', batchNo: '', barcode: '', hsn: '', gstRate: '', manufacturingDate: '', expiryDate: '',
  purchasePrice: '', salePrice: '', quantity: '', unit: 'kg', supplierId: '', description: ''
});

export default function BulkAddProductTable({ onNavigate }) {
  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()]);
  const [suppliers, setSuppliers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const tableRef = useRef(null);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        // Replace with real data call if available
        const mock = [
          { id: 'sup1', name: 'Tata Chemicals Ltd' },
          { id: 'sup2', name: 'IFFCO Distributors' },
          { id: 'sup3', name: 'Green Gold Organics' },
        ];
        setSuppliers(mock);
        // const data = await suppliersService.getAll(); setSuppliers(data);
      } catch (e) { console.error(e); }
    };
    loadSuppliers();
  }, []);

  const addRows = (count = 5) => setRows(prev => [...prev, ...Array.from({ length: count }, emptyRow)]);
  const clearRows = () => setRows([emptyRow()]);
  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  const handleCellChange = (idx, key, value) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [key]: value } : r));
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
    try {
      // Build promises sequentially to keep it simple
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const errs = validateRow(row);
        if (Object.keys(errs).length > 0) {
          msgs.push({ type: 'error', text: `Row ${i + 1} has errors. Skipped.` });
          continue;
        }
        const payload = {
          ...row,
          purchasePrice: parseFloat(row.purchasePrice),
          salePrice: parseFloat(row.salePrice),
          quantity: parseInt(row.quantity || '0', 10),
          manufacturingDate: row.manufacturingDate ? new Date(row.manufacturingDate) : null,
          expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
          gstRate: row.gstRate ? Number(row.gstRate) : undefined,
        };
        try {
          await productsService.add(payload);
          msgs.push({ type: 'ok', text: `Row ${i + 1}: ${row.name} added.` });
        } catch (e) {
          console.error(e);
          msgs.push({ type: 'error', text: `Row ${i + 1}: failed (${e.message || 'error'})` });
        }
      }
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
                          <Select value={row[col.key] || ''} onValueChange={(v) => handleCellChange(rIdx, col.key, v)}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={`Select ${col.label.replace('*','')}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {col.options.map(opt => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
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

