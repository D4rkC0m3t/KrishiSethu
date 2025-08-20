import React from 'react';
import { Package, ShoppingCart, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const RecentActivity = ({ onNavigate }) => {
  // Mock recent activity data - in real app this would come from props or API
  const activities = [
    {
      id: 1,
      type: 'sale',
      title: 'Sale Completed',
      description: 'NPK Fertilizer - 50kg sold to Ramesh Kumar',
      amount: '₹2,500',
      time: '2 hours ago',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 2,
      type: 'purchase',
      title: 'Stock Added',
      description: 'Urea Fertilizer - 100 bags received',
      amount: '₹45,000',
      time: '4 hours ago',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 3,
      type: 'sale',
      title: 'Sale Completed',
      description: 'Organic Compost - 25kg sold to Suresh Patel',
      amount: '₹1,200',
      time: '6 hours ago',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 4,
      type: 'stock_adjustment',
      title: 'Stock Adjusted',
      description: 'DAP Fertilizer quantity updated',
      amount: '+15 units',
      time: '1 day ago',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 5,
      type: 'sale',
      title: 'Sale Completed',
      description: 'Pesticide Spray - 5L sold to Mohan Singh',
      amount: '₹3,200',
      time: '1 day ago',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    }
  ];

  const getActivityBadge = (type) => {
    switch (type) {
      case 'sale':
        return <Badge variant="success" className="text-xs">Sale</Badge>;
      case 'purchase':
        return <Badge variant="info" className="text-xs">Purchase</Badge>;
      case 'stock_adjustment':
        return <Badge variant="secondary" className="text-xs">Adjustment</Badge>;
      default:
        return <Badge variant="default" className="text-xs">Activity</Badge>;
    }
  };

  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600" />
            Recent Activity
          </CardTitle>
          <button
            onClick={() => onNavigate('reports')}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View All
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <div 
                key={activity.id} 
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => onNavigate('reports')}
              >
                <div className={`p-2 rounded-full ${activity.bgColor} flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.title}
                    </p>
                    {getActivityBadge(activity.type)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">
                    {activity.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {activity.amount}
                    </span>
                    <span className="text-xs text-gray-500">
                      {activity.time}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {activities.length === 0 && (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400">Activity will appear here as you use the system</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;