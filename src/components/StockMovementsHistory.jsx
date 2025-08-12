import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { stockMovementsService } from '../lib/firestore';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Package,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw
} from 'lucide-react';

const StockMovementsHistory = ({ onNavigate }) => {
  const [movements, setMovements] = useState([]);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Load stock movements
  useEffect(() => {
    loadMovements();
  }, []);

  const loadMovements = async () => {
    try {
      setIsLoading(true);
      const data = await stockMovementsService.getAll();
      setMovements(data || []);
      setFilteredMovements(data || []);
    } catch (error) {
      console.error('Error loading stock movements:', error);
      // Fallback to mock data for demo
      const mockMovements = [
        {
          id: '1',
          productId: 'prod1',
          productName: 'NPK 20-20-20',
          movementType: 'sale',
          quantity: -5,
          previousStock: 50,
          newStock: 45,
          referenceId: 'SALE001',
          referenceType: 'sale',
          reason: 'Sale to customer',
          createdAt: { toDate: () => new Date('2025-01-06T10:30:00') },
          createdBy: 'user1'
        },
        {
          id: '2',
          productId: 'prod1',
          productName: 'NPK 20-20-20',
          movementType: 'purchase',
          quantity: 50,
          previousStock: 0,
          newStock: 50,
          referenceId: 'PUR001',
          referenceType: 'purchase',
          reason: 'Purchase from supplier',
          createdAt: { toDate: () => new Date('2025-01-05T14:20:00') },
          createdBy: 'user1'
        },
        {
          id: '3',
          productId: 'prod2',
          productName: 'Urea',
          movementType: 'adjustment',
          quantity: -2,
          previousStock: 10,
          newStock: 8,
          referenceId: null,
          referenceType: 'adjustment',
          reason: 'Damaged goods',
          createdAt: { toDate: () => new Date('2025-01-04T16:45:00') },
          createdBy: 'user1'
        }
      ];
      setMovements(mockMovements);
      setFilteredMovements(mockMovements);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter movements
  useEffect(() => {
    let filtered = movements.filter(movement => {
      const matchesSearch = 
        movement.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.referenceId?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || movement.movementType === filterType;

      let matchesDate = true;
      if (filterDate !== 'all') {
        const movementDate = movement.createdAt?.toDate ? movement.createdAt.toDate() : new Date(movement.createdAt);
        const today = new Date();
        const diffTime = today - movementDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (filterDate) {
          case 'today':
            matchesDate = diffDays <= 1;
            break;
          case 'week':
            matchesDate = diffDays <= 7;
            break;
          case 'month':
            matchesDate = diffDays <= 30;
            break;
          default:
            matchesDate = true;
        }
      }

      return matchesSearch && matchesType && matchesDate;
    });

    setFilteredMovements(filtered);
  }, [movements, searchTerm, filterType, filterDate]);

  const getMovementIcon = (type) => {
    switch (type) {
      case 'sale':
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      case 'purchase':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'adjustment':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMovementBadge = (type) => {
    const variants = {
      sale: 'destructive',
      purchase: 'default',
      adjustment: 'secondary'
    };
    return (
      <Badge variant={variants[type] || 'outline'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const formatDate = (date) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Stock Movements</h1>
          <p className="text-gray-600">Track all inventory changes and movements</p>
        </div>
        <Button onClick={loadMovements} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by product, reason, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sale">Sales</SelectItem>
                  <SelectItem value="purchase">Purchases</SelectItem>
                  <SelectItem value="adjustment">Adjustments</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Stock Movements ({filteredMovements.length})
          </CardTitle>
          <CardDescription>Complete audit trail of inventory changes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading movements...</div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No stock movements found</p>
              <p className="text-sm">Stock movements will appear here as you make sales, purchases, and adjustments</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMovements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {getMovementIcon(movement.movementType)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{movement.productName}</h3>
                        {getMovementBadge(movement.movementType)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{movement.reason}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>📅 {formatDate(movement.createdAt)}</span>
                        {movement.referenceId && (
                          <span>🔗 {movement.referenceId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {movement.previousStock} → {movement.newStock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StockMovementsHistory;
