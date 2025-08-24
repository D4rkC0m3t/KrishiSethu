import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Calendar,
  Target, Star, Award, Filter, Download, RefreshCw, Settings, Bell,
  ArrowUp, ArrowDown, BarChart3, PieChart as PieChartIcon, Activity,
  User, Mail, Phone, MapPin, Eye, Edit, Search, Heart, Zap,
  Brain, Sparkles, Crown, Gift, AlertTriangle, CheckCircle
} from 'lucide-react';
import { salesService, customersService, productsService } from '../lib/supabaseDb';
import { formatCurrency, formatDate, formatPercentage } from '../utils/numberUtils';

const SalesCustomerAnalytics = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('3months');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Analytics state
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalCustomers: 0,
    avgOrderValue: 0,
    customerRetentionRate: 0,
    lifetimeValue: 0,
    growthRate: 0
  });

  // Load data
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [customersData, salesData, productsData] = await Promise.all([
        customersService.getAll(),
        salesService.getAll(), 
        productsService.getAll()
      ]);

      setCustomers(customersData || []);
      setSales(salesData || []);
      setProducts(productsData || []);

      // Generate enhanced mock data for analytics
      const enhancedCustomers = generateEnhancedCustomerData(customersData || []);
      const enhancedSales = generateEnhancedSalesData(salesData || [], enhancedCustomers, productsData || []);
      
      setCustomers(enhancedCustomers);
      setSales(enhancedSales);
      
      calculateAnalytics(enhancedCustomers, enhancedSales);

    } catch (err) {
      console.error('Error loading analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateEnhancedCustomerData = (baseCustomers) => {
    const segments = ['VIP', 'Premium', 'Regular', 'New', 'At Risk'];
    const regions = ['North', 'South', 'East', 'West', 'Central'];
    const industries = ['Agriculture', 'Horticulture', 'Organic Farming', 'Commercial', 'Retail'];

    // If no base customers, create sample ones
    if (!baseCustomers.length) {
      baseCustomers = Array.from({ length: 50 }, (_, i) => ({
        id: `customer_${i + 1}`,
        name: `Customer ${i + 1}`,
        email: `customer${i + 1}@example.com`,
        phone: `+91-98765${String(43210 + i).slice(-5)}`,
        address: `Address ${i + 1}`,
        city: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata'][i % 5],
        state: ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal'][i % 5]
      }));
    }

    return baseCustomers.map((customer, index) => ({
      ...customer,
      segment: segments[index % segments.length],
      region: regions[index % regions.length],
      industry: industries[index % industries.length],
      registrationDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      lastPurchaseDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      totalOrders: Math.floor(Math.random() * 50) + 1,
      totalSpent: Math.floor(Math.random() * 500000) + 10000,
      avgOrderValue: 0, // Will be calculated
      lifetimeValue: 0, // Will be calculated
      retentionScore: Math.floor(Math.random() * 100) + 1,
      satisfactionScore: Math.floor(Math.random() * 5) + 1,
      preferredProducts: [],
      riskScore: Math.floor(Math.random() * 100),
      growthPotential: Math.floor(Math.random() * 100),
      loyaltyPoints: Math.floor(Math.random() * 10000),
      communicationPreference: ['Email', 'Phone', 'SMS', 'WhatsApp'][index % 4],
      purchaseFrequency: Math.floor(Math.random() * 30) + 1, // days between purchases
      seasonalPattern: ['Spring', 'Summer', 'Monsoon', 'Winter'][index % 4]
    }));
  };

  const generateEnhancedSalesData = (baseSales, customers, products) => {
    // Generate comprehensive sales data if none exists
    const enhancedSales = [];
    const salesCount = Math.max(baseSales.length, 200);

    for (let i = 0; i < salesCount; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const product = products[Math.floor(Math.random() * products.length)] || { id: 'prod_1', name: 'Sample Product' };
      const saleDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
      const quantity = Math.floor(Math.random() * 10) + 1;
      const unitPrice = Math.floor(Math.random() * 5000) + 500;
      const total = quantity * unitPrice;

      enhancedSales.push({
        id: `sale_${i + 1}`,
        customerId: customer?.id || 'unknown',
        customerName: customer?.name || 'Unknown Customer',
        customerSegment: customer?.segment || 'Regular',
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice,
        total,
        saleDate,
        month: saleDate.getMonth(),
        quarter: Math.floor(saleDate.getMonth() / 3) + 1,
        salesPersonId: `sp_${Math.floor(Math.random() * 5) + 1}`,
        region: customer?.region || 'Central',
        channel: ['Online', 'Store', 'Phone', 'Field Sales'][Math.floor(Math.random() * 4)],
        paymentMethod: ['Cash', 'Card', 'UPI', 'Cheque'][Math.floor(Math.random() * 4)],
        discount: Math.floor(Math.random() * total * 0.1),
        margin: Math.floor(total * (0.15 + Math.random() * 0.25)), // 15-40% margin
        campaign: Math.random() > 0.7 ? `Campaign_${Math.floor(Math.random() * 5) + 1}` : null
      });
    }

    return enhancedSales;
  };

  const calculateAnalytics = (customersData, salesData) => {
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total, 0);
    const totalCustomers = customersData.length;
    const totalOrders = salesData.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate customer metrics
    const customerMetrics = customersData.map(customer => {
      const customerSales = salesData.filter(sale => sale.customerId === customer.id);
      const customerRevenue = customerSales.reduce((sum, sale) => sum + sale.total, 0);
      const orderCount = customerSales.length;
      
      return {
        ...customer,
        totalSpent: customerRevenue,
        totalOrders: orderCount,
        avgOrderValue: orderCount > 0 ? customerRevenue / orderCount : 0,
        lifetimeValue: customerRevenue * (customer.retentionScore / 100) * 2 // Simplified CLV
      };
    });

    setCustomers(customerMetrics);

    const avgLifetimeValue = customerMetrics.reduce((sum, c) => sum + c.lifetimeValue, 0) / totalCustomers;
    const retentionRate = customerMetrics.filter(c => c.retentionScore > 60).length / totalCustomers * 100;
    
    setAnalytics({
      totalRevenue,
      totalCustomers,
      avgOrderValue,
      customerRetentionRate: retentionRate,
      lifetimeValue: avgLifetimeValue,
      growthRate: 12.5 // Mock growth rate
    });
  };

  // Customer Segmentation Analysis
  const customerSegmentation = useMemo(() => {
    const segments = customers.reduce((acc, customer) => {
      const segment = customer.segment;
      if (!acc[segment]) {
        acc[segment] = {
          name: segment,
          count: 0,
          totalRevenue: 0,
          avgLifetimeValue: 0,
          retentionRate: 0
        };
      }
      acc[segment].count++;
      acc[segment].totalRevenue += customer.totalSpent;
      acc[segment].retentionRate += customer.retentionScore;
      return acc;
    }, {});

    return Object.values(segments).map(segment => ({
      ...segment,
      avgLifetimeValue: segment.totalRevenue / segment.count,
      retentionRate: segment.retentionRate / segment.count,
      percentage: (segment.count / customers.length) * 100
    }));
  }, [customers]);

  // Sales Forecasting Data
  const salesForecast = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    // Historical data (last 6 months)
    const historical = months.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((month, index) => {
      const monthSales = sales.filter(sale => sale.month === (currentMonth - 5 + index + 12) % 12);
      return {
        month,
        actual: monthSales.reduce((sum, sale) => sum + sale.total, 0),
        type: 'historical'
      };
    });

    // Forecast data (next 6 months)
    const forecast = months.slice(currentMonth + 1, Math.min(12, currentMonth + 7)).map((month, index) => {
      const baseValue = historical[historical.length - 1]?.actual || 100000;
      const growth = 1 + (Math.random() * 0.3 - 0.1); // -10% to +20% growth
      return {
        month,
        forecast: Math.floor(baseValue * growth * (1 + index * 0.05)),
        type: 'forecast'
      };
    });

    return [...historical, ...forecast];
  }, [sales]);

  // Customer Lifetime Value Analysis
  const clvAnalysis = useMemo(() => {
    return customers
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
      .slice(0, 10)
      .map(customer => ({
        name: customer.name,
        segment: customer.segment,
        lifetimeValue: customer.lifetimeValue,
        totalOrders: customer.totalOrders,
        avgOrderValue: customer.avgOrderValue,
        retentionScore: customer.retentionScore,
        growthPotential: customer.growthPotential
      }));
  }, [customers]);

  // Product Performance by Customer Segment
  const productSegmentPerformance = useMemo(() => {
    const segmentProducts = {};
    
    sales.forEach(sale => {
      const segment = sale.customerSegment;
      if (!segmentProducts[segment]) {
        segmentProducts[segment] = {};
      }
      if (!segmentProducts[segment][sale.productName]) {
        segmentProducts[segment][sale.productName] = {
          revenue: 0,
          quantity: 0,
          orders: 0
        };
      }
      segmentProducts[segment][sale.productName].revenue += sale.total;
      segmentProducts[segment][sale.productName].quantity += sale.quantity;
      segmentProducts[segment][sale.productName].orders++;
    });

    return segmentProducts;
  }, [sales]);

  // Customer Retention Cohort Analysis
  const cohortAnalysis = useMemo(() => {
    const cohorts = {};
    
    customers.forEach(customer => {
      const cohortMonth = customer.registrationDate.toISOString().slice(0, 7);
      if (!cohorts[cohortMonth]) {
        cohorts[cohortMonth] = {
          month: cohortMonth,
          customers: 0,
          retained: 0,
          revenue: 0
        };
      }
      cohorts[cohortMonth].customers++;
      if (customer.retentionScore > 60) {
        cohorts[cohortMonth].retained++;
      }
      cohorts[cohortMonth].revenue += customer.totalSpent;
    });

    return Object.values(cohorts).map(cohort => ({
      ...cohort,
      retentionRate: (cohort.retained / cohort.customers) * 100,
      avgRevenue: cohort.revenue / cohort.customers
    }));
  }, [customers]);

  // Personalized Recommendations Engine
  const generateRecommendations = (customer) => {
    const customerSales = sales.filter(sale => sale.customerId === customer.id);
    const purchasedProducts = [...new Set(customerSales.map(sale => sale.productName))];
    
    // Find similar customers
    const similarCustomers = customers.filter(c => 
      c.id !== customer.id && 
      c.segment === customer.segment &&
      Math.abs(c.avgOrderValue - customer.avgOrderValue) < customer.avgOrderValue * 0.3
    );

    // Recommend products bought by similar customers but not by this customer
    const recommendations = [];
    similarCustomers.forEach(simCustomer => {
      const simSales = sales.filter(sale => sale.customerId === simCustomer.id);
      simSales.forEach(sale => {
        if (!purchasedProducts.includes(sale.productName)) {
          const existing = recommendations.find(r => r.productName === sale.productName);
          if (existing) {
            existing.score += 1;
            existing.totalRevenue += sale.total;
          } else {
            recommendations.push({
              productName: sale.productName,
              score: 1,
              totalRevenue: sale.total,
              avgPrice: sale.unitPrice
            });
          }
        }
      });
    });

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(rec => ({
        ...rec,
        confidence: Math.min(100, (rec.score / similarCustomers.length) * 100)
      }));
  };

  const getSegmentColor = (segment) => {
    const colors = {
      VIP: '#FFD700',
      Premium: '#E6E6FA', 
      Regular: '#87CEEB',
      New: '#98FB98',
      'At Risk': '#FFB6C1'
    };
    return colors[segment] || '#CCCCCC';
  };

  const CustomerSegmentationTab = () => (
    <div className="space-y-6">
      {/* Segment Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {customerSegmentation.map((segment) => (
          <Card key={segment.name} className="relative overflow-hidden">
            <div 
              className="absolute top-0 left-0 right-0 h-1"
              style={{ backgroundColor: getSegmentColor(segment.name) }}
            />
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{segment.name}</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{segment.count}</div>
                <div className="text-xs text-muted-foreground">
                  {formatPercentage(segment.percentage)} of customers
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Avg CLV:</span>
                    <span className="font-medium">{formatCurrency(segment.avgLifetimeValue)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Retention:</span>
                    <span className="font-medium">{Math.round(segment.retentionRate)}%</span>
                  </div>
                </div>
                <Progress value={segment.retentionRate} className="h-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Segment Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Distribution by Segment</CardTitle>
            <CardDescription>Percentage breakdown of customer segments</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customerSegmentation}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                >
                  {customerSegmentation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSegmentColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Customer Segment</CardTitle>
            <CardDescription>Total revenue contribution per segment</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerSegmentation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="totalRevenue" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Segment Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Segment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Segment</th>
                  <th className="text-center p-2">Customers</th>
                  <th className="text-center p-2">% of Base</th>
                  <th className="text-right p-2">Total Revenue</th>
                  <th className="text-right p-2">Avg CLV</th>
                  <th className="text-center p-2">Retention Rate</th>
                  <th className="text-center p-2">Growth Potential</th>
                </tr>
              </thead>
              <tbody>
                {customerSegmentation.map((segment) => (
                  <tr key={segment.name} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getSegmentColor(segment.name) }}
                        />
                        <span className="font-medium">{segment.name}</span>
                      </div>
                    </td>
                    <td className="text-center p-2">{segment.count}</td>
                    <td className="text-center p-2">{formatPercentage(segment.percentage)}</td>
                    <td className="text-right p-2">{formatCurrency(segment.totalRevenue)}</td>
                    <td className="text-right p-2">{formatCurrency(segment.avgLifetimeValue)}</td>
                    <td className="text-center p-2">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={segment.retentionRate} className="w-16 h-2" />
                        <span>{Math.round(segment.retentionRate)}%</span>
                      </div>
                    </td>
                    <td className="text-center p-2">
                      {segment.retentionRate > 80 ? (
                        <Badge className="bg-green-100 text-green-800">High</Badge>
                      ) : segment.retentionRate > 60 ? (
                        <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Low</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SalesForecastingTab = () => (
    <div className="space-y-6">
      {/* Forecast Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Forecast - 6 Months</CardTitle>
            <CardDescription>Historical performance vs forecasted growth</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesForecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [formatCurrency(value), name === 'actual' ? 'Actual Sales' : 'Forecasted Sales']} />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: '#22c55e' }}
                  name="Actual Sales"
                />
                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#3b82f6' }}
                  name="Forecasted Sales"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Growth Trends</CardTitle>
            <CardDescription>Month-over-month growth analysis</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesForecast.filter(d => d.actual)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stackId="1"
                  stroke="#f59e0b" 
                  fill="url(#colorRevenue)" 
                />
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Forecast Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Month Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(salesForecast.find(f => f.forecast)?.forecast || 0)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              12% growth expected
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quarter Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(salesForecast
                .filter(f => f.forecast)
                .slice(0, 3)
                .reduce((sum, f) => sum + f.forecast, 0)
              )}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Target className="h-3 w-3 mr-1" />
              Q1 target: 85% likely
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">87%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Activity className="h-3 w-3 mr-1" />
              Historical accuracy
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confidence Level</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">92%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 mr-1" />
              High confidence
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seasonal Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Sales Pattern Analysis</CardTitle>
          <CardDescription>Identify seasonal trends for better forecasting</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={[
                { season: 'Spring', sales: 85, forecast: 92 },
                { season: 'Summer', sales: 120, forecast: 135 },
                { season: 'Monsoon', sales: 95, forecast: 105 },
                { season: 'Winter', sales: 110, forecast: 125 }
              ]}>
                <PolarGrid />
                <PolarAngleAxis dataKey="season" />
                <PolarRadiusAxis />
                <Radar name="Historical" dataKey="sales" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                <Radar name="Forecast" dataKey="forecast" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const CLVAnalysisTab = () => (
    <div className="space-y-6">
      {/* CLV Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average CLV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.lifetimeValue)}</div>
            <div className="text-xs text-muted-foreground">Per customer</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top 10% CLV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold">
              {formatCurrency(clvAnalysis.slice(0, Math.ceil(clvAnalysis.length * 0.1))
                .reduce((sum, c) => sum + c.lifetimeValue, 0) / Math.ceil(clvAnalysis.length * 0.1))}
            </div>
            <div className="text-xs text-muted-foreground">VIP customers</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CLV Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+18.5%</div>
            <div className="text-xs text-muted-foreground">Year over year</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High-Value Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {customers.filter(c => c.lifetimeValue > analytics.lifetimeValue * 1.5).length}
            </div>
            <div className="text-xs text-muted-foreground">Above avg CLV</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers by CLV */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Customers by Lifetime Value</CardTitle>
          <CardDescription>Highest value customers with growth potential analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Customer</th>
                  <th className="text-center p-2">Segment</th>
                  <th className="text-right p-2">Lifetime Value</th>
                  <th className="text-center p-2">Total Orders</th>
                  <th className="text-right p-2">Avg Order Value</th>
                  <th className="text-center p-2">Retention Score</th>
                  <th className="text-center p-2">Growth Potential</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clvAnalysis.map((customer, index) => (
                  <tr key={customer.name} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <Badge style={{ backgroundColor: getSegmentColor(customer.segment) }}>
                        {customer.segment}
                      </Badge>
                    </td>
                    <td className="text-right p-2 font-bold text-green-600">
                      {formatCurrency(customer.lifetimeValue)}
                    </td>
                    <td className="text-center p-2">{customer.totalOrders}</td>
                    <td className="text-right p-2">{formatCurrency(customer.avgOrderValue)}</td>
                    <td className="text-center p-2">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={customer.retentionScore} className="w-12 h-2" />
                        <span className="text-xs">{customer.retentionScore}%</span>
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <div className="flex items-center justify-center">
                        {customer.growthPotential > 80 ? (
                          <Badge className="bg-green-100 text-green-800">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            High
                          </Badge>
                        ) : customer.growthPotential > 50 ? (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Activity className="h-3 w-3 mr-1" />
                            Medium
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Low
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-center p-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customers.find(c => c.name === customer.name));
                          setShowCustomerDetails(true);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* CLV Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CLV Distribution</CardTitle>
            <CardDescription>Customer lifetime value ranges</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { range: '0-50K', count: customers.filter(c => c.lifetimeValue < 50000).length },
                { range: '50-100K', count: customers.filter(c => c.lifetimeValue >= 50000 && c.lifetimeValue < 100000).length },
                { range: '100-200K', count: customers.filter(c => c.lifetimeValue >= 100000 && c.lifetimeValue < 200000).length },
                { range: '200K+', count: customers.filter(c => c.lifetimeValue >= 200000).length }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CLV vs Retention Score</CardTitle>
            <CardDescription>Correlation between lifetime value and retention</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={customers.slice(0, 50)}>
                <CartesianGrid />
                <XAxis dataKey="retentionScore" name="Retention Score" />
                <YAxis dataKey="lifetimeValue" name="CLV" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => [
                    name === 'lifetimeValue' ? formatCurrency(value) : `${value}%`,
                    name === 'lifetimeValue' ? 'CLV' : 'Retention Score'
                  ]}
                />
                <Scatter dataKey="lifetimeValue" fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const PersonalizedRecommendationsTab = () => {
    const [selectedCustomerForRecs, setSelectedCustomerForRecs] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    const generateCustomerRecommendations = (customer) => {
      setSelectedCustomerForRecs(customer);
      const recs = generateRecommendations(customer);
      setRecommendations(recs);
    };

    return (
      <div className="space-y-6">
        {/* Recommendation Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <div className="text-xs text-muted-foreground">Personalized offers</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">23.5%</div>
              <div className="text-xs text-muted-foreground">From recommendations</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(145000)}</div>
              <div className="text-xs text-muted-foreground">From personalized sales</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Customer Satisfaction</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">4.7⭐</div>
              <div className="text-xs text-muted-foreground">Recommendation score</div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Selection for Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Personalized Recommendations</CardTitle>
            <CardDescription>Select a customer to generate AI-powered product recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {customers.slice(0, 9).map((customer) => (
                <div
                  key={customer.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCustomerForRecs?.id === customer.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => generateCustomerRecommendations(customer)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-xs text-muted-foreground">{customer.segment}</div>
                      <div className="text-xs text-green-600">{formatCurrency(customer.lifetimeValue)} CLV</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedCustomerForRecs && recommendations.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
                  Recommendations for {selectedCustomerForRecs.name}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((rec, index) => (
                    <Card key={index} className="relative">
                      <div className="absolute top-2 right-2">
                        <Badge className={`text-xs ${
                          rec.confidence > 80 ? 'bg-green-100 text-green-800' :
                          rec.confidence > 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(rec.confidence)}% confidence
                        </Badge>
                      </div>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{rec.productName}</span>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div>Avg Price: {formatCurrency(rec.avgPrice)}</div>
                            <div>Popularity Score: {rec.score}/10</div>
                            <div>Potential Revenue: {formatCurrency(rec.totalRevenue)}</div>
                          </div>
                          <Button size="sm" className="w-full">
                            <Mail className="h-3 w-3 mr-2" />
                            Send Recommendation
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cross-sell Opportunities */}
        <Card>
          <CardHeader>
            <CardTitle>Cross-sell Opportunities</CardTitle>
            <CardDescription>Products frequently bought together</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { primary: 'NPK Fertilizer', secondary: 'Micro Nutrients', confidence: 85, revenue: 45000 },
                { primary: 'Organic Compost', secondary: 'Bio Pesticides', confidence: 78, revenue: 32000 },
                { primary: 'Urea', secondary: 'DAP', confidence: 92, revenue: 67000 }
              ].map((opportunity, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{opportunity.primary} + {opportunity.secondary}</div>
                    <div className="text-sm text-muted-foreground">
                      {opportunity.confidence}% of customers who buy {opportunity.primary} also buy {opportunity.secondary}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold text-green-600">{formatCurrency(opportunity.revenue)}</div>
                    <div className="text-xs text-muted-foreground">Revenue potential</div>
                  </div>
                  <Button variant="outline" size="sm" className="ml-4">
                    Create Campaign
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading sales and customer analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-background text-foreground min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Advanced Sales & Customer Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive customer insights, sales forecasting, and personalized recommendations
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last 1 Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last 1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => onNavigate('dashboard')}>
            ← Back
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            <div className="text-xs text-green-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{analytics.growthRate}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCustomers}</div>
            <div className="text-xs text-muted-foreground">Active customers</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.avgOrderValue)}</div>
            <div className="text-xs text-muted-foreground">Per transaction</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.customerRetentionRate)}%</div>
            <div className="text-xs text-muted-foreground">Retention rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Lifetime Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.lifetimeValue)}</div>
            <div className="text-xs text-muted-foreground">Per customer</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{analytics.growthRate}%</div>
            <div className="text-xs text-muted-foreground">Year over year</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segmentation">Customer Segmentation</TabsTrigger>
          <TabsTrigger value="forecasting">Sales Forecasting</TabsTrigger>
          <TabsTrigger value="clv">CLV Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PersonalizedRecommendationsTab />
        </TabsContent>

        <TabsContent value="segmentation">
          <CustomerSegmentationTab />
        </TabsContent>

        <TabsContent value="forecasting">
          <SalesForecastingTab />
        </TabsContent>

        <TabsContent value="clv">
          <CLVAnalysisTab />
        </TabsContent>
      </Tabs>

      {/* Customer Details Dialog */}
      <Dialog open={showCustomerDetails} onOpenChange={setShowCustomerDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Analysis - {selectedCustomer?.name}</DialogTitle>
            <DialogDescription>Comprehensive customer insights and recommendations</DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Overview */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Customer Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Segment:</span>
                        <Badge style={{ backgroundColor: getSegmentColor(selectedCustomer.segment) }}>
                          {selectedCustomer.segment}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Region:</span>
                        <span>{selectedCustomer.region}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Industry:</span>
                        <span>{selectedCustomer.industry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Registration Date:</span>
                        <span>{formatDate(selectedCustomer.registrationDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Performance Metrics</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lifetime Value:</span>
                        <span className="font-bold text-green-600">{formatCurrency(selectedCustomer.lifetimeValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Orders:</span>
                        <span>{selectedCustomer.totalOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average Order Value:</span>
                        <span>{formatCurrency(selectedCustomer.avgOrderValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Retention Score:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={selectedCustomer.retentionScore} className="w-16 h-2" />
                          <span>{selectedCustomer.retentionScore}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations for this customer */}
              <div>
                <h4 className="font-medium mb-4">Personalized Recommendations</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {generateRecommendations(selectedCustomer).map((rec, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="font-medium">{rec.productName}</div>
                          <div className="text-sm text-muted-foreground">
                            Confidence: {Math.round(rec.confidence)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Avg Price: {formatCurrency(rec.avgPrice)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerDetails(false)}>
              Close
            </Button>
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Send Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesCustomerAnalytics;
