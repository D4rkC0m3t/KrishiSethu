import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calculator,
  Activity,
  Package,
  AlertTriangle,
  Target,
  PieChart,
  RefreshCw,
  Download,
  Info,
  CheckCircle,
  XCircle,
  Minus,
  DollarSign,
  Calendar,
  Filter
} from 'lucide-react';
import { productsService, salesService, purchasesService } from '../lib/supabaseDb';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, AreaChart, Area } from 'recharts';

const InventoryAnalytics = ({ onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [valuationMethod, setValuationMethod] = useState('weighted_average');
  const [dateRange, setDateRange] = useState('last_30_days');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // Load analytics data
  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const [products, sales, purchases] = await Promise.all([
        productsService.getAll(),
        salesService.getAll(),
        purchasesService.getAll()
      ]);

      const analytics = await generateInventoryAnalytics(products, sales, purchases);
      setAnalyticsData(analytics);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate comprehensive inventory analytics
  const generateInventoryAnalytics = async (products, sales, purchases) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter data based on date range
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at || sale.date);
      return saleDate >= thirtyDaysAgo;
    });

    const filteredPurchases = purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.created_at || purchase.date);
      return purchaseDate >= thirtyDaysAgo;
    });

    // ABC Analysis
    const abcAnalysis = performABCAnalysis(products, filteredSales);
    
    // Inventory Valuation
    const inventoryValuation = calculateInventoryValuation(products, purchases, valuationMethod);
    
    // Stock Movement Analytics
    const stockMovementAnalytics = analyzeStockMovement(products, filteredSales, filteredPurchases);
    
    // Performance Metrics
    const performanceMetrics = calculatePerformanceMetrics(products, filteredSales, filteredPurchases);
    
    // Turnover Analysis
    const turnoverAnalysis = calculateTurnoverAnalysis(products, filteredSales);
    
    // Demand Forecasting (basic)
    const demandForecast = calculateDemandForecast(filteredSales);
    
    // Stock Health Analysis
    const stockHealth = analyzeStockHealth(products, filteredSales);

    return {
      abcAnalysis,
      inventoryValuation,
      stockMovementAnalytics,
      performanceMetrics,
      turnoverAnalysis,
      demandForecast,
      stockHealth,
      summary: {
        totalProducts: products.length,
        totalValue: inventoryValuation.totalValue,
        averageTurnover: turnoverAnalysis.averageTurnover,
        stockHealthScore: stockHealth.overallScore
      }
    };
  };

  // ABC Analysis Implementation
  const performABCAnalysis = (products, sales) => {
    // Calculate revenue per product
    const productRevenue = {};
    sales.forEach(sale => {
      const productName = sale.productName || sale.product_name;
      const revenue = sale.totalAmount || sale.total || 0;
      productRevenue[productName] = (productRevenue[productName] || 0) + revenue;
    });

    // Sort products by revenue
    const sortedProducts = Object.entries(productRevenue)
      .sort(([,a], [,b]) => b - a)
      .map(([name, revenue]) => ({ name, revenue }));

    const totalRevenue = sortedProducts.reduce((sum, p) => sum + p.revenue, 0);
    let cumulativeRevenue = 0;
    const analysisResults = [];

    // Classify products into A, B, C categories
    sortedProducts.forEach((product, index) => {
      cumulativeRevenue += product.revenue;
      const cumulativePercentage = (cumulativeRevenue / totalRevenue) * 100;
      
      let category;
      if (cumulativePercentage <= 70) {
        category = 'A';
      } else if (cumulativePercentage <= 90) {
        category = 'B';
      } else {
        category = 'C';
      }

      analysisResults.push({
        rank: index + 1,
        productName: product.name,
        revenue: product.revenue,
        percentage: (product.revenue / totalRevenue) * 100,
        cumulativePercentage,
        category
      });
    });

    // Calculate category summaries
    const categoryA = analysisResults.filter(p => p.category === 'A');
    const categoryB = analysisResults.filter(p => p.category === 'B');
    const categoryC = analysisResults.filter(p => p.category === 'C');

    return {
      products: analysisResults,
      summary: {
        categoryA: {
          count: categoryA.length,
          revenue: categoryA.reduce((sum, p) => sum + p.revenue, 0),
          percentage: (categoryA.reduce((sum, p) => sum + p.revenue, 0) / totalRevenue) * 100
        },
        categoryB: {
          count: categoryB.length,
          revenue: categoryB.reduce((sum, p) => sum + p.revenue, 0),
          percentage: (categoryB.reduce((sum, p) => sum + p.revenue, 0) / totalRevenue) * 100
        },
        categoryC: {
          count: categoryC.length,
          revenue: categoryC.reduce((sum, p) => sum + p.revenue, 0),
          percentage: (categoryC.reduce((sum, p) => sum + p.revenue, 0) / totalRevenue) * 100
        }
      }
    };
  };

  // Inventory Valuation Methods
  const calculateInventoryValuation = (products, purchases, method) => {
    const valuation = {};
    let totalValue = 0;

    products.forEach(product => {
      const currentStock = product.quantity || 0;
      const productPurchases = purchases.filter(p => 
        (p.productName || p.product_name) === product.name
      ).sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));

      let unitCost = 0;

      switch (method) {
        case 'fifo': // First In, First Out
          unitCost = calculateFIFOCost(productPurchases, currentStock);
          break;
        case 'lifo': // Last In, First Out
          unitCost = calculateLIFOCost(productPurchases, currentStock);
          break;
        case 'weighted_average': // Weighted Average
          unitCost = calculateWeightedAverageCost(productPurchases);
          break;
        default:
          unitCost = product.unitPrice || 0;
      }

      const productValue = currentStock * unitCost;
      valuation[product.name] = {
        stock: currentStock,
        unitCost,
        totalValue: productValue
      };
      totalValue += productValue;
    });

    return {
      method,
      valuation,
      totalValue,
      productCount: products.length
    };
  };

  const calculateFIFOCost = (purchases, currentStock) => {
    if (!purchases.length) return 0;
    
    let remainingStock = currentStock;
    let totalCost = 0;
    
    // Start from oldest purchases
    for (let i = 0; i < purchases.length && remainingStock > 0; i++) {
      const purchase = purchases[i];
      const qty = Math.min(remainingStock, purchase.quantity || 0);
      const cost = purchase.unitPrice || purchase.unit_price || 0;
      
      totalCost += qty * cost;
      remainingStock -= qty;
    }
    
    return currentStock > 0 ? totalCost / currentStock : 0;
  };

  const calculateLIFOCost = (purchases, currentStock) => {
    if (!purchases.length) return 0;
    
    let remainingStock = currentStock;
    let totalCost = 0;
    
    // Start from newest purchases
    for (let i = purchases.length - 1; i >= 0 && remainingStock > 0; i--) {
      const purchase = purchases[i];
      const qty = Math.min(remainingStock, purchase.quantity || 0);
      const cost = purchase.unitPrice || purchase.unit_price || 0;
      
      totalCost += qty * cost;
      remainingStock -= qty;
    }
    
    return currentStock > 0 ? totalCost / currentStock : 0;
  };

  const calculateWeightedAverageCost = (purchases) => {
    if (!purchases.length) return 0;
    
    let totalCost = 0;
    let totalQuantity = 0;
    
    purchases.forEach(purchase => {
      const qty = purchase.quantity || 0;
      const cost = purchase.unitPrice || purchase.unit_price || 0;
      
      totalCost += qty * cost;
      totalQuantity += qty;
    });
    
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  };

  // Stock Movement Analytics
  const analyzeStockMovement = (products, sales, purchases) => {
    const movementData = [];
    const monthlyMovement = {};
    
    // Analyze monthly trends
    sales.forEach(sale => {
      const date = new Date(sale.created_at || sale.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMovement[monthKey]) {
        monthlyMovement[monthKey] = { sales: 0, purchases: 0 };
      }
      
      monthlyMovement[monthKey].sales += sale.quantity || 0;
    });
    
    purchases.forEach(purchase => {
      const date = new Date(purchase.created_at || purchase.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMovement[monthKey]) {
        monthlyMovement[monthKey] = { sales: 0, purchases: 0 };
      }
      
      monthlyMovement[monthKey].purchases += purchase.quantity || 0;
    });

    // Convert to chart data
    const chartData = Object.entries(monthlyMovement).map(([month, data]) => ({
      month,
      sales: data.sales,
      purchases: data.purchases,
      netMovement: data.purchases - data.sales
    }));

    return {
      monthlyData: chartData,
      totalSales: sales.reduce((sum, s) => sum + (s.quantity || 0), 0),
      totalPurchases: purchases.reduce((sum, p) => sum + (p.quantity || 0), 0),
      netMovement: purchases.reduce((sum, p) => sum + (p.quantity || 0), 0) - 
                   sales.reduce((sum, s) => sum + (s.quantity || 0), 0)
    };
  };

  // Performance Metrics
  const calculatePerformanceMetrics = (products, sales, purchases) => {
    const metrics = {};
    
    products.forEach(product => {
      const productSales = sales.filter(s => 
        (s.productName || s.product_name) === product.name
      );
      const productPurchases = purchases.filter(p => 
        (p.productName || p.product_name) === product.name
      );

      const salesVelocity = productSales.length > 0 ? 
        productSales.reduce((sum, s) => sum + (s.quantity || 0), 0) / 30 : 0;
      
      const stockLevel = product.quantity || 0;
      const reorderLevel = product.reorderLevel || product.reorder_level || 0;
      
      const daysOfStock = salesVelocity > 0 ? stockLevel / salesVelocity : 999;
      
      metrics[product.name] = {
        salesVelocity: Number(salesVelocity.toFixed(2)),
        stockLevel,
        reorderLevel,
        daysOfStock: Math.round(daysOfStock),
        status: stockLevel <= reorderLevel ? 'low' : 
                stockLevel <= reorderLevel * 1.5 ? 'warning' : 'good'
      };
    });

    return metrics;
  };

  // Turnover Analysis
  const calculateTurnoverAnalysis = (products, sales) => {
    const turnoverData = [];
    let totalTurnover = 0;

    products.forEach(product => {
      const productSales = sales.filter(s => 
        (s.productName || s.product_name) === product.name
      );
      
      const soldQuantity = productSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
      const averageStock = (product.quantity || 0) + (soldQuantity / 2); // Simplified average
      const turnoverRatio = averageStock > 0 ? soldQuantity / averageStock : 0;
      
      turnoverData.push({
        product: product.name,
        soldQuantity,
        averageStock,
        turnoverRatio: Number(turnoverRatio.toFixed(2)),
        category: product.category || 'Uncategorized'
      });
      
      totalTurnover += turnoverRatio;
    });

    return {
      products: turnoverData,
      averageTurnover: products.length > 0 ? Number((totalTurnover / products.length).toFixed(2)) : 0,
      highTurnover: turnoverData.filter(p => p.turnoverRatio > 2).length,
      lowTurnover: turnoverData.filter(p => p.turnoverRatio < 0.5).length
    };
  };

  // Basic Demand Forecasting
  const calculateDemandForecast = (sales) => {
    const dailySales = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.created_at || sale.date).toDateString();
      const product = sale.productName || sale.product_name;
      
      if (!dailySales[product]) {
        dailySales[product] = {};
      }
      
      if (!dailySales[product][date]) {
        dailySales[product][date] = 0;
      }
      
      dailySales[product][date] += sale.quantity || 0;
    });

    const forecasts = {};
    
    Object.keys(dailySales).forEach(product => {
      const salesDates = Object.keys(dailySales[product]).sort();
      const quantities = salesDates.map(date => dailySales[product][date]);
      
      // Simple moving average forecast
      const avgDemand = quantities.reduce((sum, q) => sum + q, 0) / quantities.length || 0;
      const trend = quantities.length > 1 ? 
        (quantities[quantities.length - 1] - quantities[0]) / quantities.length : 0;
      
      forecasts[product] = {
        averageDemand: Number(avgDemand.toFixed(2)),
        trend: Number(trend.toFixed(2)),
        forecastedDemand: Number((avgDemand + trend).toFixed(2)),
        confidence: quantities.length >= 10 ? 'high' : quantities.length >= 5 ? 'medium' : 'low'
      };
    });

    return forecasts;
  };

  // Stock Health Analysis
  const analyzeStockHealth = (products, sales) => {
    let healthyProducts = 0;
    let lowStockProducts = 0;
    let overStockProducts = 0;
    let deadStockProducts = 0;

    products.forEach(product => {
      const productSales = sales.filter(s => 
        (s.productName || s.product_name) === product.name
      );
      
      const hasSales = productSales.length > 0;
      const stockLevel = product.quantity || 0;
      const reorderLevel = product.reorderLevel || product.reorder_level || 10;
      
      if (!hasSales && stockLevel > 0) {
        deadStockProducts++;
      } else if (stockLevel <= reorderLevel) {
        lowStockProducts++;
      } else if (stockLevel > reorderLevel * 3) {
        overStockProducts++;
      } else {
        healthyProducts++;
      }
    });

    const totalProducts = products.length;
    const overallScore = totalProducts > 0 ? 
      Math.round((healthyProducts / totalProducts) * 100) : 0;

    return {
      healthyProducts,
      lowStockProducts,
      overStockProducts,
      deadStockProducts,
      overallScore,
      totalProducts
    };
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [valuationMethod, dateRange, selectedCategory]);

  const refreshData = () => {
    setRefreshing(true);
    loadAnalyticsData().finally(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Analytics</h1>
          <p className="text-muted-foreground">
            Advanced inventory analysis with valuation methods, ABC analysis, and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="valuation-method">Valuation Method</Label>
              <Select value={valuationMethod} onValueChange={setValuationMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weighted_average">Weighted Average</SelectItem>
                  <SelectItem value="fifo">FIFO (First In, First Out)</SelectItem>
                  <SelectItem value="lifo">LIFO (Last In, First Out)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category Filter</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="chemical">Chemical Fertilizers</SelectItem>
                  <SelectItem value="organic">Organic Fertilizers</SelectItem>
                  <SelectItem value="bio">Bio Fertilizers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Products</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {analyticsData.summary.totalProducts}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active inventory items
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Total Value</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                ₹{analyticsData.summary.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {valuationMethod.replace('_', ' ').toUpperCase()} method
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Avg Turnover</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {analyticsData.summary.averageTurnover}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Times per period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Stock Health</span>
              </div>
              <div className="text-2xl font-bold mt-2">
                {analyticsData.summary.stockHealthScore}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Overall health score
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics */}
      {analyticsData && (
        <Tabs defaultValue="abc-analysis" className="space-y-4">
          <TabsList>
            <TabsTrigger value="abc-analysis">ABC Analysis</TabsTrigger>
            <TabsTrigger value="valuation">Inventory Valuation</TabsTrigger>
            <TabsTrigger value="performance">Performance Metrics</TabsTrigger>
            <TabsTrigger value="movement">Stock Movement</TabsTrigger>
            <TabsTrigger value="turnover">Turnover Analysis</TabsTrigger>
            <TabsTrigger value="forecast">Demand Forecast</TabsTrigger>
          </TabsList>

          {/* ABC Analysis Tab */}
          <TabsContent value="abc-analysis" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ABC Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>ABC Classification Summary</CardTitle>
                  <CardDescription>
                    Product categorization based on revenue contribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-red-800">Category A (High Value)</div>
                        <div className="text-sm text-red-600">
                          {analyticsData.abcAnalysis.summary.categoryA.count} products
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-800">
                          {analyticsData.abcAnalysis.summary.categoryA.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-red-600">
                          ₹{analyticsData.abcAnalysis.summary.categoryA.revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-yellow-800">Category B (Medium Value)</div>
                        <div className="text-sm text-yellow-600">
                          {analyticsData.abcAnalysis.summary.categoryB.count} products
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-800">
                          {analyticsData.abcAnalysis.summary.categoryB.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-yellow-600">
                          ₹{analyticsData.abcAnalysis.summary.categoryB.revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-green-800">Category C (Low Value)</div>
                        <div className="text-sm text-green-600">
                          {analyticsData.abcAnalysis.summary.categoryC.count} products
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-800">
                          {analyticsData.abcAnalysis.summary.categoryC.percentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-green-600">
                          ₹{analyticsData.abcAnalysis.summary.categoryC.revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ABC Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>ABC Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Tooltip />
                      <RechartsPieChart
                        data={[
                          { name: 'Category A', value: analyticsData.abcAnalysis.summary.categoryA.percentage, fill: '#ef4444' },
                          { name: 'Category B', value: analyticsData.abcAnalysis.summary.categoryB.percentage, fill: '#f59e0b' },
                          { name: 'Category C', value: analyticsData.abcAnalysis.summary.categoryC.percentage, fill: '#10b981' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {[
                          { name: 'Category A', value: analyticsData.abcAnalysis.summary.categoryA.percentage, fill: '#ef4444' },
                          { name: 'Category B', value: analyticsData.abcAnalysis.summary.categoryB.percentage, fill: '#f59e0b' },
                          { name: 'Category C', value: analyticsData.abcAnalysis.summary.categoryC.percentage, fill: '#10b981' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </RechartsPieChart>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* ABC Products Table */}
            <Card>
              <CardHeader>
                <CardTitle>Product Rankings</CardTitle>
                <CardDescription>Products sorted by revenue contribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Rank</th>
                        <th className="text-left p-2">Product Name</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">% of Total</th>
                        <th className="text-center p-2">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.abcAnalysis.products.slice(0, 10).map((product, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2">{product.rank}</td>
                          <td className="p-2 font-medium">{product.productName}</td>
                          <td className="p-2 text-right">₹{product.revenue.toLocaleString()}</td>
                          <td className="p-2 text-right">{product.percentage.toFixed(2)}%</td>
                          <td className="p-2 text-center">
                            <Badge variant={
                              product.category === 'A' ? 'destructive' :
                              product.category === 'B' ? 'default' : 'secondary'
                            }>
                              {product.category}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Valuation Tab */}
          <TabsContent value="valuation" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Valuation Method Comparison</CardTitle>
                  <CardDescription>
                    Current method: {valuationMethod.replace('_', ' ').toUpperCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Total Inventory Value</span>
                        <span className="text-2xl font-bold">
                          ₹{analyticsData.inventoryValuation.totalValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Using {valuationMethod.replace('_', ' ')} method for {analyticsData.inventoryValuation.productCount} products
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>FIFO Method</span>
                        <span className="text-green-600">Generally higher values</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>LIFO Method</span>
                        <span className="text-red-600">Generally lower values</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Weighted Average</span>
                        <span className="text-blue-600">Balanced approach</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Valued Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analyticsData.inventoryValuation.valuation)
                      .sort(([,a], [,b]) => b.totalValue - a.totalValue)
                      .slice(0, 5)
                      .map(([product, data], index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">{product}</div>
                            <div className="text-sm text-muted-foreground">
                              {data.stock} units × ₹{data.unitCost.toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">₹{data.totalValue.toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Metrics Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Product Performance Metrics</CardTitle>
                <CardDescription>Sales velocity, stock levels, and reorder status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Product</th>
                        <th className="text-right p-2">Sales Velocity</th>
                        <th className="text-right p-2">Stock Level</th>
                        <th className="text-right p-2">Days of Stock</th>
                        <th className="text-center p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analyticsData.performanceMetrics).map(([product, metrics], index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{product}</td>
                          <td className="p-2 text-right">{metrics.salesVelocity}/day</td>
                          <td className="p-2 text-right">{metrics.stockLevel}</td>
                          <td className="p-2 text-right">{metrics.daysOfStock}</td>
                          <td className="p-2 text-center">
                            <Badge variant={
                              metrics.status === 'good' ? 'default' :
                              metrics.status === 'warning' ? 'secondary' : 'destructive'
                            }>
                              {metrics.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stock Movement Tab */}
          <TabsContent value="movement" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Stock Movement Trends</CardTitle>
                <CardDescription>Monthly stock in/out analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData.stockMovementAnalytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="purchases" fill="#10b981" name="Stock In" />
                    <Bar dataKey="sales" fill="#ef4444" name="Stock Out" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Turnover Analysis Tab */}
          <TabsContent value="turnover" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Turnover Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {analyticsData.turnoverAnalysis.averageTurnover}
                      </div>
                      <div className="text-sm text-muted-foreground">Average Turnover Ratio</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-800">
                          {analyticsData.turnoverAnalysis.highTurnover}
                        </div>
                        <div className="text-sm text-green-600">High Turnover</div>
                        <div className="text-xs text-green-500">Ratio > 2.0</div>
                      </div>
                      
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-lg font-bold text-red-800">
                          {analyticsData.turnoverAnalysis.lowTurnover}
                        </div>
                        <div className="text-sm text-red-600">Low Turnover</div>
                        <div className="text-xs text-red-500">Ratio &lt; 0.5</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Turnover Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.turnoverAnalysis.products
                      .sort((a, b) => b.turnoverRatio - a.turnoverRatio)
                      .slice(0, 5)
                      .map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">{product.product}</div>
                            <div className="text-sm text-muted-foreground">
                              Sold: {product.soldQuantity} | Avg Stock: {product.averageStock}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{product.turnoverRatio}</div>
                            <div className="text-sm text-muted-foreground">ratio</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Demand Forecast Tab */}
          <TabsContent value="forecast" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Demand Forecasting</CardTitle>
                <CardDescription>Predicted demand based on historical sales patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Product</th>
                        <th className="text-right p-2">Avg Demand</th>
                        <th className="text-right p-2">Trend</th>
                        <th className="text-right p-2">Forecasted</th>
                        <th className="text-center p-2">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(analyticsData.demandForecast).map(([product, forecast], index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-2 font-medium">{product}</td>
                          <td className="p-2 text-right">{forecast.averageDemand}</td>
                          <td className="p-2 text-right">
                            <span className={forecast.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {forecast.trend >= 0 ? '+' : ''}{forecast.trend}
                            </span>
                          </td>
                          <td className="p-2 text-right font-medium">{forecast.forecastedDemand}</td>
                          <td className="p-2 text-center">
                            <Badge variant={
                              forecast.confidence === 'high' ? 'default' :
                              forecast.confidence === 'medium' ? 'secondary' : 'outline'
                            }>
                              {forecast.confidence}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default InventoryAnalytics;
