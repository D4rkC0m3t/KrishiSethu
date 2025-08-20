import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import {
  Package,
  AlertTriangle,
  AlarmClock,
  RefreshCw,
  Calendar,
  Users,
  ShoppingCart,
  DollarSign,
  Activity,
  Truck,
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  Wind,
  Droplets,
  Eye,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { shopDetailsService } from '../lib/shopDetails';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import Inventory from './Inventory';
import AddProduct from './AddProduct';
import BulkAddProductTable from './BulkAddProductTable';
import POS from './POS';
import SalesHistory from './SalesHistory';
import StockMovement from './StockMovement';
import Suppliers from './Suppliers';
import AlertsPanel from './AlertsPanel';
// import AlertsSystem from './AlertsSystem';
import Purchases from './Purchases';
import PurchaseEntry from './PurchaseEntry';
import CustomerManagement from './CustomerManagement';
import Reports from './Reports';
import ReportsDashboard from './ReportsDashboard';
import GSTReports from './reports/GSTReports';
import InvoiceManagement from './InvoiceManagement';
import Settings from './Settings';
import UserManagement from './UserManagement';
import DataImportExport from './DataImportExport';
import EnhancedAlertsSystem from './EnhancedAlertsSystem';
import BackupDataManagement from './BackupDataManagement';
import EInvoice from './EInvoice';
import EInvoiceHistory from './EInvoiceHistory';
import { formatCurrency } from '../utils/numberUtils';
import CategoriesManagement from './CategoriesManagement';
import BrandsManagement from './BrandsManagement';
import StockMovementsHistory from './StockMovementsHistory';
import Documentation from './Documentation';
import Support from './Support';
import AdminControlPanel from './admin/AdminControlPanel';
import DatabaseSyncTest from './DatabaseSyncTest';
import StorageTest from './StorageTest';
import AnimatedTitle from './AnimatedTitle';
// Removed ErrorPage404 import since offline sync handles connectivity gracefully
import ErrorBoundary from './ErrorBoundary';
import useNetworkStatus from '../hooks/useNetworkStatus';
// import ThemeTest from './ThemeTest';

import DatabaseSetup from './DatabaseSetup';
import NotificationDropdown from './NotificationDropdown';
import { productsService, salesService, customersService, suppliersService } from '../lib/supabaseDb';

const Dashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const { isOnline, retryConnection } = useNetworkStatus();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first, then default to light mode
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Default to light mode instead of system preference
    return false;
  });
  const [stats, setStats] = useState({
    totalProducts: 156,
    lowStock: 8,
    nearExpiry: 12,
    todaySales: 25000,
    monthlyProfit: 185000,
    todaysSalesChange: 12,
    monthlyProfitChange: 8,
    totalCustomers: 342,
    activeSuppliers: 15,
    pendingOrders: 5,
    totalRevenue: 1250000,
    avgOrderValue: 1850,
    topSellingProduct: 'NPK 20-20-20'
  });
  const [alerts, setAlerts] = useState([]);
  const [posItem, setPosItem] = useState('');
  const [posQty, setPosQty] = useState('');
  const [posPrice, setPosPrice] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [productToEdit, setProductToEdit] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);

  // Enhanced chart data
  const salesData = [
    { day: 'Mon', sales: 4000, profit: 800, orders: 12 },
    { day: 'Tue', sales: 3000, profit: 600, orders: 8 },
    { day: 'Wed', sales: 5000, profit: 1000, orders: 15 },
    { day: 'Thu', sales: 2000, profit: 400, orders: 6 },
    { day: 'Fri', sales: 3500, profit: 700, orders: 10 },
    { day: 'Sat', sales: 6000, profit: 1200, orders: 18 },
    { day: 'Sun', sales: 4500, profit: 900, orders: 14 }
  ];

  const categoryData = [
    { name: 'NPK Fertilizers', value: 35, color: '#22c55e' },
    { name: 'Organic', value: 25, color: '#3b82f6' },
    { name: 'Micronutrients', value: 20, color: '#f59e0b' },
    { name: 'Pesticides', value: 15, color: '#ef4444' },
    { name: 'Others', value: 5, color: '#8b5cf6' }
  ];

  const recentActivity = [
    { id: 1, type: 'sale', description: 'Sale of NPK 20-20-20 (5 bags)', amount: 4750, time: '2 mins ago' },
    { id: 2, type: 'stock', description: 'Low stock alert: Urea (8 bags left)', amount: null, time: '15 mins ago' },
    { id: 3, type: 'purchase', description: 'Purchase order from Tata Chemicals', amount: 85000, time: '1 hour ago' },
    { id: 4, type: 'customer', description: 'New customer registration: Raj Farm', amount: null, time: '2 hours ago' }
  ];

  // Enhanced data fetching with refresh capability
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      // Real Firebase calls
      const [products, sales, customers, suppliers] = await Promise.all([
        productsService.getAll(),
        salesService.getAll(),
        customersService.getAll(),
        suppliersService.getAll()
      ]);

      // Calculate real stats from Firebase data
      const lowStockProducts = products.filter(p => p.quantity <= 10);
      const nearExpiryProducts = products.filter(p => {
        if (!p.expiryDate) return false;

        // Handle different date formats safely
        let expiryDate;
        if (p.expiryDate instanceof Date) {
          expiryDate = p.expiryDate;
        } else if (typeof p.expiryDate === 'string') {
          expiryDate = new Date(p.expiryDate);
        } else if (p.expiryDate && typeof p.expiryDate.toDate === 'function') {
          expiryDate = p.expiryDate.toDate(); // Firestore Timestamp
        } else {
          return false; // Invalid date format
        }

        if (isNaN(expiryDate.getTime())) return false; // Invalid date

        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays > 0;
      });

      const todaysSales = sales.filter(sale => {
        if (!sale.saleDate) return false;

        // Handle different date formats safely
        let saleDate;
        if (sale.saleDate instanceof Date) {
          saleDate = sale.saleDate;
        } else if (typeof sale.saleDate === 'string') {
          saleDate = new Date(sale.saleDate);
        } else if (sale.saleDate && typeof sale.saleDate.toDate === 'function') {
          saleDate = sale.saleDate.toDate(); // Firestore Timestamp
        } else {
          return false; // Invalid date format
        }

        if (isNaN(saleDate.getTime())) return false; // Invalid date

        const today = new Date();
        return saleDate.toDateString() === today.toDateString();
      });

      const todaysSalesAmount = todaysSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const monthlyRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);

      // Update stats with real data
      setStats(prev => ({
        ...prev,
        totalProducts: products.length,
        lowStock: lowStockProducts.length,
        nearExpiry: nearExpiryProducts.length,
        todaySales: todaysSalesAmount,
        monthlyProfit: monthlyRevenue * 0.2, // Assuming 20% profit margin
        totalCustomers: customers.length,
        activeSuppliers: suppliers.filter(s => s.isActive).length,
        pendingOrders: 5, // This would come from a purchases query
        totalRevenue: monthlyRevenue,
        avgOrderValue: sales.length > 0 ? monthlyRevenue / sales.length : 0,
        topSellingProduct: 'NPK 20-20-20', // This would be calculated from sales data
        todaysSalesChange: Math.floor(Math.random() * 20) + 5, // Would be calculated from historical data
        monthlyProfitChange: Math.floor(Math.random() * 15) + 3 // Would be calculated from historical data
      }));

      // Enhanced alerts data
      const mockAlerts = [
        {
          id: '1',
          type: 'low_stock',
          severity: 'high',
          message: 'Urea is critically low (8 bags remaining)',
          isRead: false
        },
        {
          id: '2',
          type: 'expiry',
          severity: 'medium',
          message: 'DAP expires in 15 days',
          isRead: false
        },
        {
          id: '3',
          type: 'sales',
          severity: 'low',
          message: 'Today\'s sales exceeded target',
          isRead: true
        },
        {
          id: '4',
          type: 'stock',
          severity: 'low',
          message: 'New stock arrived: NPK 20-20-20 (100 bags)',
          isRead: false
        }
      ];
      setAlerts(mockAlerts);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(refreshData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Apply initial dark mode state to DOM
  useEffect(() => {
    const applyTheme = () => {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    };

    applyTheme();

    // Also apply on next tick to ensure it takes effect
    setTimeout(applyTheme, 0);
  }, [darkMode]);

  // Load company details
  const loadCompanyDetails = async () => {
    try {
      console.log('🔄 Loading company details for dashboard...');
      const details = await shopDetailsService.getShopDetails();
      console.log('✅ Company details loaded:', details);
      console.log('🏢 Company name:', details?.name);
      setCompanyDetails(details);
    } catch (error) {
      console.error('❌ Failed to load company details:', error);
    }
  };

  useEffect(() => {
    loadCompanyDetails();
  }, []);

  // Expose refresh function globally so Settings can call it
  useEffect(() => {
    window.refreshDashboardCompanyDetails = loadCompanyDetails;

    // Cleanup on unmount
    return () => {
      delete window.refreshDashboardCompanyDetails;
    };
  }, []);

  const handleNavigation = (page, product = null) => {
    console.log('🧭 Dashboard handleNavigation called with:', page);
    console.log('📍 Current page before navigation:', currentPage);
    setCurrentPage(page);
    console.log('📍 Setting current page to:', page);
    if (page === 'edit-product' && product) {
      console.log('🔄 Setting product to edit:', product);
      console.log('🔍 Product keys:', Object.keys(product));
      console.log('🔍 Product name:', product.name);
      console.log('🔍 Product categoryId/category_id:', product.categoryId, product.category_id);
      console.log('🔍 Product brandId/brand_id:', product.brandId, product.brand_id);
      setProductToEdit(product);
      setCurrentPage('add-product'); // Use the same component for editing
    } else if (page === 'add-product') {
      setProductToEdit(null); // Clear when adding new product
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));

    // Apply to DOM immediately
    const applyTheme = () => {
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    };

    applyTheme();
    // Force re-render by applying on next tick as well
    setTimeout(applyTheme, 0);
  };

  // Generate sample sparkline data
  const generateSparklineData = (trend = 'up') => {
    const data = [];
    let value = trend === 'up' ? 30 : 70;
    for (let i = 0; i < 8; i++) {
      const change = trend === 'up' ? Math.random() * 8 - 2 : Math.random() * 8 - 6;
      value = Math.max(10, Math.min(90, value + change));
      data.push({ value: Math.round(value) });
    }
    return data;
  };

  const StatCard = ({ title, value, description, icon, trend, onClick, bgGradient = 'from-blue-500 to-blue-600', subItems = [] }) => {
    const sparklineData = generateSparklineData(trend > 0 ? 'up' : 'down');

    return (
      <div className={`relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 rounded-lg ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <div className={`bg-gradient-to-br ${bgGradient} p-6 text-white relative h-full rounded-lg`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full border-2 border-white/20"></div>
            <div className="absolute bottom-4 right-8 w-12 h-12 rounded-full border border-white/20"></div>
            <div className="absolute top-8 right-12 w-6 h-6 rounded-full bg-white/10"></div>
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                {icon}
              </div>
              <span className="text-sm font-medium text-white/90">{title}</span>
            </div>
            <div className="text-white/60">⋯</div>
          </div>

          {/* Main Value */}
          <div className="relative z-10 mb-4">
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-sm text-white/80">{description}</div>
          </div>

          {/* Sub Items */}
          {subItems.length > 0 && (
            <div className="relative z-10 space-y-2">
              {subItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color || 'bg-white/60'}`}></div>
                    <span className="text-xs text-white/80">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-white">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Trend Indicator */}
          {trend && (
            <div className="absolute top-4 right-4 z-10">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                trend > 0
                  ? 'bg-green-500/20 text-green-100 border border-green-400/30'
                  : 'bg-red-500/20 text-red-100 border border-red-400/30'
              }`}>
                <span>{trend > 0 ? '↗' : '↘'}</span>
                <span>{Math.abs(trend)}%</span>
              </div>
            </div>
          )}

          {/* Mini Chart Overlay */}
          <div className="absolute bottom-0 right-0 w-24 h-16 opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`gradient-overlay-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="white" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="white"
                  strokeWidth={1.5}
                  fill={`url(#gradient-overlay-${title.replace(/\s+/g, '')})`}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  // Weather Widget Component
  const WeatherWidget = () => {
    const [weather] = useState({
      location: 'Hyderabad, IN',
      temperature: 28,
      condition: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 12,
      visibility: 10,
      uvIndex: 6,
      hourlyForecast: [
        { time: '12 PM', temp: 28, icon: 'sun' },
        { time: '1 PM', temp: 29, icon: 'cloud' },
        { time: '2 PM', temp: 30, icon: 'cloud' },
        { time: '3 PM', temp: 31, icon: 'sun' },
        { time: '4 PM', temp: 29, icon: 'cloud-rain' },
        { time: '5 PM', temp: 27, icon: 'cloud-rain' }
      ]
    });

    const getWeatherIcon = (iconType) => {
      switch (iconType) {
        case 'sun': return <Sun className="h-5 w-5 text-yellow-400" />;
        case 'cloud': return <Cloud className="h-5 w-5 text-muted-foreground" />;
        case 'cloud-rain': return <CloudRain className="h-5 w-5 text-gray-400" />;
        case 'cloud-snow': return <CloudSnow className="h-5 w-5 text-gray-200" />;
        default: return <Sun className="h-5 w-5 text-yellow-400" />;
      }
    };

    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-400 via-cyan-500 to-cyan-600 text-white border-0 shadow-xl h-[400px]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-24 h-24 rounded-full border border-white/20"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 rounded-full border border-white/20"></div>
          <div className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-white/5"></div>
        </div>

        <div className="relative z-10 p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold">Weather</h3>
              <p className="text-xs text-white/80">{weather.location}</p>
            </div>
            <Cloud className="h-5 w-5 text-white/80" />
          </div>

          {/* Current Weather */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-light mb-1">{weather.temperature}°</div>
              <div className="text-xs text-white/90">{weather.condition}</div>
            </div>
            <div className="text-right">
              <Sun className="h-10 w-10 text-yellow-300 mb-1" />
              <div className="text-xs text-white/80">UV: {weather.uvIndex}</div>
            </div>
          </div>

          {/* Weather Details */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center">
              <Droplets className="h-3 w-3 text-white/80 mx-auto mb-1" />
              <div className="text-xs text-white/80">Humidity</div>
              <div className="text-xs font-medium">{weather.humidity}%</div>
            </div>
            <div className="text-center">
              <Wind className="h-3 w-3 text-white/80 mx-auto mb-1" />
              <div className="text-xs text-white/80">Wind</div>
              <div className="text-xs font-medium">{weather.windSpeed} km/h</div>
            </div>
            <div className="text-center">
              <Eye className="h-3 w-3 text-white/80 mx-auto mb-1" />
              <div className="text-xs text-white/80">Visibility</div>
              <div className="text-xs font-medium">{weather.visibility} km</div>
            </div>
          </div>

          {/* Hourly Forecast */}
          <div className="flex-1">
            <div className="text-xs font-medium mb-2 text-white/90">Hourly Forecast</div>
            <div className="flex gap-2 overflow-x-auto">
              {weather.hourlyForecast.map((hour, index) => (
                <div key={index} className="flex-shrink-0 text-center bg-white/10 rounded-lg p-2 backdrop-blur-sm min-w-[50px]">
                  <div className="text-xs text-white/80 mb-1">{hour.time}</div>
                  <div className="mb-1 flex justify-center">{getWeatherIcon(hour.icon)}</div>
                  <div className="text-xs font-medium">{hour.temp}°</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Clock Widget Component
  const ClockWidget = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
      return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    };

    const formatDate = (date) => {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white border-0 shadow-xl h-[400px]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white"></div>
        </div>

        <div className="relative z-10 p-4 text-center h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-center mb-4">
            <Clock className="h-5 w-5 text-white/80 mr-2" />
            <h3 className="text-base font-semibold">World Clock</h3>
          </div>

          {/* Digital Clock */}
          <div className="mb-4">
            <div className="text-3xl font-mono font-light mb-1 tracking-wider">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-white/80">
              {formatDate(currentTime)}
            </div>
          </div>

          {/* Time Zones */}
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-center bg-white/10 rounded-lg p-2 backdrop-blur-sm">
              <div>
                <div className="text-xs font-medium">New York</div>
                <div className="text-xs text-white/80">EST</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono">
                  {new Date().toLocaleTimeString('en-US', {
                    timeZone: 'America/New_York',
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white/10 rounded-lg p-2 backdrop-blur-sm">
              <div>
                <div className="text-xs font-medium">London</div>
                <div className="text-xs text-white/80">GMT</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono">
                  {new Date().toLocaleTimeString('en-US', {
                    timeZone: 'Europe/London',
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white/10 rounded-lg p-2 backdrop-blur-sm">
              <div>
                <div className="text-xs font-medium">Tokyo</div>
                <div className="text-xs text-white/80">JST</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono">
                  {new Date().toLocaleTimeString('en-US', {
                    timeZone: 'Asia/Tokyo',
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Calendar Widget Component
  const CalendarWidget = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }

      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        days.push(new Date(year, month, day));
      }

      return days;
    };

    const navigateMonth = (direction) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + direction);
      setCurrentDate(newDate);
    };

    const isToday = (date) => {
      if (!date) return false;
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const isSelected = (date) => {
      if (!date) return false;
      return date.toDateString() === selectedDate.toDateString();
    };

    const events = [
      { date: new Date(2024, 0, 15), title: 'Team Meeting', color: 'bg-orange-500' },
      { date: new Date(2024, 0, 20), title: 'Product Launch', color: 'bg-green-500' },
      { date: new Date(2024, 0, 25), title: 'Review Session', color: 'bg-red-500' }
    ];

    const hasEvent = (date) => {
      if (!date) return false;
      return events.some(event => event.date.toDateString() === date.toDateString());
    };

    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 text-white border-0 shadow-xl h-[400px]">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-20 h-20 rounded-full border border-white/20"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full border border-white/20"></div>
          <div className="absolute top-1/2 right-1/2 w-8 h-8 rounded-full bg-white/5"></div>
        </div>

        <div className="relative z-10 p-4 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-white/80 mr-2" />
              <h3 className="text-base font-semibold">Calendar</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Month/Year */}
          <div className="text-center mb-3">
            <div className="text-sm font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-medium text-white/80 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-3 flex-1">
            {getDaysInMonth(currentDate).map((date, index) => (
              <button
                key={index}
                onClick={() => date && setSelectedDate(date)}
                className={`
                  aspect-square flex items-center justify-center text-xs rounded-lg transition-all relative
                  ${date ? 'hover:bg-white/10' : ''}
                  ${isToday(date) ? 'bg-white/20 font-bold' : ''}
                  ${isSelected(date) ? 'bg-white/30 ring-1 ring-white/50' : ''}
                  ${!date ? 'cursor-default' : 'cursor-pointer'}
                `}
              >
                {date && (
                  <>
                    <span className={isToday(date) ? 'text-white' : 'text-white/90'}>
                      {date.getDate()}
                    </span>
                    {hasEvent(date) && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full"></div>
                    )}
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Upcoming Events */}
          <div>
            <div className="text-xs font-medium mb-2 text-white/90">Upcoming Events</div>
            <div className="space-y-1">
              {events.slice(0, 3).map((event, index) => (
                <div key={index} className="flex items-center gap-2 bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <div className={`w-1.5 h-1.5 rounded-full ${event.color}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{event.title}</div>
                    <div className="text-xs text-white/80">
                      {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  const renderCurrentPage = () => {
    console.log('🎯 Rendering page:', currentPage);
    console.log('🎯 Available cases:', ['pos', 'inventory', 'add-product', 'bulk-add-products', 'stock-movement', 'sales', 'purchases', 'purchase-entry', 'suppliers', 'customers', 'e-invoice', 'e-invoice-history', 'categories', 'brands', 'stock-movements', 'alerts', 'alerts-system', 'reports', 'reports-dashboard', 'reports-advanced', 'reports-sales', 'reports-inventory', 'reports-financial', 'reports-profit', 'reports-gst', 'invoices', 'settings', 'admin-panel', 'user-management', 'data-import-export', 'backup-data-management', 'documentation', 'support', 'database-sync-test', 'storage-test']);
    console.log('🎯 Is inventory case:', currentPage === 'inventory');
    switch (currentPage) {
      case 'pos':
        return <POS onNavigate={handleNavigation} />;
      case 'inventory':
        return <Inventory onNavigate={handleNavigation} />;
      case 'add-product':
        return <AddProduct onNavigate={handleNavigation} productToEdit={productToEdit} />;
      case 'bulk-add-products':
        return <BulkAddProductTable onNavigate={handleNavigation} />;
      case 'stock-movement':
        return <StockMovement onNavigate={handleNavigation} />;
      case 'sales':
        return <SalesHistory onNavigate={handleNavigation} />;
      case 'purchases':
        return <Purchases onNavigate={handleNavigation} />;
      case 'purchase-entry':
        return <PurchaseEntry onNavigate={handleNavigation} />;
      case 'suppliers':
        return <Suppliers onNavigate={handleNavigation} />;
      case 'customers':
        return <CustomerManagement onNavigate={handleNavigation} />;
      case 'e-invoice':
        return <EInvoice onNavigate={handleNavigation} />;
      case 'e-invoice-history':
        return <EInvoiceHistory onNavigate={handleNavigation} />;
      case 'categories':
        console.log('✅ Rendering CategoriesManagement component');
        return <CategoriesManagement onNavigate={handleNavigation} />;
      case 'brands':
        console.log('✅ Rendering BrandsManagement component');
        return <BrandsManagement onNavigate={handleNavigation} />;
      case 'stock-movements':
        return <StockMovementsHistory onNavigate={handleNavigation} />;
      case 'alerts':
        return <AlertsPanel onNavigate={handleNavigation} />;
      case 'alerts-system':
        return <EnhancedAlertsSystem onNavigate={handleNavigation} />;
      case 'reports':
        return <Reports onNavigate={handleNavigation} />;
      case 'reports-dashboard':
        return <ReportsDashboard onNavigate={handleNavigation} />;
      case 'reports-advanced':
        return <Reports onNavigate={handleNavigation} />;
      case 'reports-sales':
        return <Reports onNavigate={handleNavigation} defaultTab="sales" />;
      case 'reports-inventory':
        return <Reports onNavigate={handleNavigation} defaultTab="inventory" />;
      case 'reports-financial':
        return <Reports onNavigate={handleNavigation} defaultTab="financial" />;
      case 'reports-profit':
        return <Reports onNavigate={handleNavigation} defaultTab="profit" />;
      case 'reports-gst':
        return <GSTReports onNavigate={handleNavigation} />;
      case 'invoices':
        return <InvoiceManagement onNavigate={handleNavigation} />;
      case 'settings':
        return <Settings onNavigate={handleNavigation} />;
      case 'admin-panel':
        return <AdminControlPanel onNavigate={handleNavigation} />;
      case 'user-management':
        return <UserManagement onNavigate={handleNavigation} />;
      case 'data-import-export':
        return <DataImportExport onNavigate={handleNavigation} />;
      case 'backup-data-management':
        return <BackupDataManagement onNavigate={handleNavigation} />;
      case 'documentation':
        return <Documentation onNavigate={handleNavigation} />;
      case 'support':
        return <Support onNavigate={handleNavigation} />;
      case 'database-sync-test':
        return <DatabaseSyncTest onNavigate={handleNavigation} />;
      case 'storage-test':
        return <StorageTest onNavigate={handleNavigation} />;
      // case 'theme-test':
        // return <ThemeTest onNavigate={handleNavigation} />;
      default:
        console.log('❌ No matching route found for:', currentPage, '- rendering dashboard');
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <main className="px-6 py-8 bg-background text-foreground min-h-full">
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground text-sm">
              Overview of your fertilizer inventory and sales
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="pos">POS Entry</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="setup">Setup</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Animated Welcome Section */}
          <div className="relative p-[3px] rounded-xl shadow-xl"
               style={{
                 background: 'linear-gradient(45deg, #ec4899, #eab308, #3b82f6, #10b981, #8b5cf6, #ec4899)',
                 backgroundSize: '400% 400%',
                 animation: 'borderFlow 6s ease-in-out infinite'
               }}>
            {/* Inner Card */}
            <Card className="rounded-xl overflow-hidden border-none">
              <div className="bg-gradient-to-r from-gray-900 via-black to-gray-800
                             bg-[length:200%_200%] animate-gradient
                             text-white p-6 rounded-xl relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 right-4 w-32 h-32 rounded-full border border-white/20"></div>
                  <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full border border-white/20"></div>
                  <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full bg-white/5"></div>
                  <div className="absolute top-8 right-12 w-8 h-8 rounded-full bg-white/10"></div>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <h1 className="text-3xl font-bold mb-2">
                          Welcome to <span className="text-yellow-300">{companyDetails?.name || 'Krishisethu'}</span>
                        </h1>
                        <p className="text-lg text-white/90 mb-1">
                          Your Complete Inventory Management Solution
                        </p>
                        <p className="text-sm text-white/80">
                          {new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                          day: 'numeric'
                        })}
                        </p>
                      </div>
                      <button
                        onClick={loadCompanyDetails}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors opacity-60 hover:opacity-100"
                        title="Refresh company name"
                      >
                        <RefreshCw className="h-4 w-4 text-white" />
                      </button>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.totalProducts}</div>
                        <div className="text-xs text-white/80">Total Products</div>
                      </div>
                      <div className="w-px h-12 bg-white/20"></div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">₹{(stats.monthlyProfit / 1000).toFixed(0)}K</div>
                        <div className="text-xs text-white/80">Monthly Profit</div>
                      </div>
                      <div className="w-px h-12 bg-white/20"></div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                        <div className="text-xs text-white/80">Customers</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                      onClick={() => handleNavigation('pos')}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      New Sale
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                      onClick={() => handleNavigation('inventory')}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                      onClick={() => handleNavigation('invoices')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Invoices
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                      onClick={() => handleNavigation('reports')}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      View Reports
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Enhanced Stats Grid */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Orders"
              value={stats.totalCustomers * 5}
              description="Completed"
              icon={<ShoppingCart className="h-6 w-6 text-white" />}
              trend={stats.monthlyProfitChange}
              bgGradient="from-green-500 to-green-600"
              onClick={() => handleNavigation('sales')}
              subItems={[
                { label: "Overdue", value: "1", color: "bg-red-400" },
                { label: "In Progress", value: "14", color: "bg-yellow-400" },
                { label: "Returns", value: "3", color: "bg-orange-400" }
              ]}
            />
            <StatCard
              title="Stock"
              value={stats.totalProducts}
              description="In Stock"
              icon={<Package className="h-6 w-6 text-white" />}
              trend={8}
              bgGradient="from-orange-500 to-red-500"
              onClick={() => handleNavigation('inventory')}
              subItems={[
                { label: "In Stock", value: stats.totalProducts - stats.lowStock, color: "bg-green-400" },
                { label: "Out Of Stock", value: "12", color: "bg-red-400" },
                { label: "Low Stock", value: stats.lowStock, color: "bg-yellow-400" },
                { label: "Dead Stock", value: "2", color: "bg-muted-foreground" }
              ]}
            />
            <StatCard
              title="Revenue"
              value={formatCurrency(stats.totalRevenue)}
              description="This Month"
              icon={<DollarSign className="h-6 w-6 text-white" />}
              trend={stats.todaysSalesChange}
              bgGradient="from-blue-500 to-blue-600"
              onClick={() => handleNavigation('reports')}
              subItems={[
                { label: "Sales", value: formatCurrency((stats.totalRevenue || 0) * 0.7), color: "bg-green-400" },
                { label: "Profit", value: formatCurrency(stats.monthlyProfit), color: "bg-orange-400" }
              ]}
            />
            <StatCard
              title="Customers"
              value={stats.totalCustomers}
              description="Active Users"
              icon={<Users className="h-6 w-6 text-white" />}
              trend={15}
              bgGradient="from-orange-500 to-red-600"
              onClick={() => handleNavigation('customers')}
              subItems={[
                { label: "New", value: "8", color: "bg-green-400" },
                { label: "Regular", value: stats.totalCustomers - 8, color: "bg-teal-400" }
              ]}
            />
          </div>

          {/* Quick Stats Row */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-md transition-all cursor-pointer" onClick={() => handleNavigation('inventory')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 font-medium">Products</p>
                  <p className="text-lg font-bold text-emerald-900">{stats.totalProducts}</p>
                </div>
                <Package className="h-5 w-5 text-emerald-500" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-md transition-all cursor-pointer" onClick={() => handleNavigation('alerts-system')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-600 font-medium">Low Stock</p>
                  <p className="text-lg font-bold text-yellow-900">{stats.lowStock}</p>
                </div>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-green-50 to-green-100 border-green-200 hover:shadow-md transition-all cursor-pointer" onClick={() => handleNavigation('reports')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-600 font-medium">Profit</p>
                  <p className="text-lg font-bold text-green-900">₹{(stats.monthlyProfit / 1000).toFixed(0)}K</p>
                </div>
                <Activity className="h-5 w-5 text-green-500" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200 hover:shadow-md transition-all cursor-pointer" onClick={() => handleNavigation('purchases')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600 font-medium">Pending</p>
                  <p className="text-lg font-bold text-orange-900">{stats.pendingOrders}</p>
                </div>
                <ShoppingCart className="h-5 w-5 text-orange-500" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200 hover:shadow-md transition-all cursor-pointer" onClick={() => handleNavigation('customers')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-600 font-medium">Customers</p>
                  <p className="text-lg font-bold text-amber-900">{stats.totalCustomers}</p>
                </div>
                <Users className="h-5 w-5 text-amber-500" />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 border-teal-200 hover:shadow-md transition-all cursor-pointer" onClick={() => handleNavigation('suppliers')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-teal-600 font-medium">Suppliers</p>
                  <p className="text-lg font-bold text-teal-900">{stats.activeSuppliers}</p>
                </div>
                <Truck className="h-5 w-5 text-teal-500" />
              </div>
            </Card>
          </div>

          {/* Apple-Style Widgets */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <WeatherWidget />
            <ClockWidget />
            <CalendarWidget />
          </div>

          {/* Charts and Activity Grid */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Sales Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Weekly Sales Trend</CardTitle>
                <CardDescription>Sales and profit overview for the last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sales"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ fill: '#22c55e' }}
                      name="Sales (₹)"
                    />
                    <Line
                      type="monotone"
                      dataKey="profit"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                      name="Profit (₹)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                <CardDescription>Latest updates and transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'sale' ? 'bg-green-500' :
                      activity.type === 'stock' ? 'bg-yellow-500' :
                      activity.type === 'purchase' ? 'bg-orange-500' :
                      'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.description}
                      </p>
                      {activity.amount && (
                        <p className="text-sm text-green-600 font-semibold">
                          {formatCurrency(activity.amount)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* New Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Product Categories</CardTitle>
                <CardDescription>Distribution of products by category</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Orders Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Daily Orders</CardTitle>
                <CardDescription>Number of orders processed daily</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-muted-foreground" />
                    <YAxis className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Bar dataKey="orders" fill="#f59e0b" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pos">
          <Card className="bg-card border border-border shadow-sm max-w-xl">
            <CardHeader>
              <CardTitle className="text-md font-semibold">POS Quick Entry</CardTitle>
              <CardDescription>Add items to bill quickly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Enter product name or code"
                value={posItem}
                onChange={(e) => setPosItem(e.target.value)}
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Qty"
                  type="number"
                  className="w-1/2"
                  value={posQty}
                  onChange={(e) => setPosQty(e.target.value)}
                />
                <Input
                  placeholder="Price"
                  type="number"
                  className="w-1/2"
                  value={posPrice}
                  onChange={(e) => setPosPrice(e.target.value)}
                />
              </div>
              <Button
                disabled={!posItem}
                onClick={() => {
                  // Handle add to bill logic here
                  console.log('Adding to bill:', { item: posItem, qty: posQty, price: posPrice });
                  // Reset form
                  setPosItem('');
                  setPosQty('');
                  setPosPrice('');
                }}
                className="w-full"
              >
                Add to Bill
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNavigation('pos')}
                className="w-full"
              >
                Open Full POS System
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="bg-card border border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-md font-semibold">Alerts & Notices</CardTitle>
              <CardDescription>Important notifications and system alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Low Stock Alert</p>
                    <p className="text-xs text-muted-foreground">{stats.lowStock} items are below minimum stock level</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleNavigation('alerts-system')}>
                    View Details
                  </Button>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlarmClock className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Expiry Alert</p>
                    <p className="text-xs text-muted-foreground">{stats.nearExpiry} products expiring in 30 days</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleNavigation('alerts-system')}>
                    View Details
                  </Button>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Pending Payments</p>
                    <p className="text-xs text-muted-foreground">₹15,975 pending to suppliers</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleNavigation('purchases')}>
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup">
          <DatabaseSetup />
        </TabsContent>
      </Tabs>
    </main>
  );

  // Note: Removed 404 error page for offline state since we have offline sync feature
  // Users can continue working offline with automatic sync when connection is restored

  return (
    <ErrorBoundary onNavigate={handleNavigation}>
    <div className="h-screen flex transition-colors duration-300 bg-background">
      {/* Sidebar - Hide for POS */}
      {currentPage !== 'pos' && (
        <Sidebar
          theme={darkMode ? 'dark' : 'light'}
          currentPage={currentPage}
          onNavigate={handleNavigation}
          alerts={alerts}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Header - Hide for POS */}
        {currentPage !== 'pos' && (
          <header className="bg-background shadow-lg border-b border-border transition-colors duration-300">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div
                  className="cursor-pointer"
                  onClick={() => handleNavigation('dashboard')}
                >
                  <AnimatedTitle size="small" />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {userProfile?.name || currentUser?.email}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {userProfile?.role}
                  </Badge>
                </div>

                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                >
                  {darkMode ? '☀️' : '🌙'}
                </Button>

                {/* Notifications Dropdown */}
                <NotificationDropdown
                  alerts={alerts}
                  onNavigate={handleNavigation}
                />
              </div>
            </div>
          </div>
          </header>
        )}

        {/* Main Content */}
        <div className="flex-1 transition-colors duration-300 overflow-auto bg-background">
          {renderCurrentPage()}
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
