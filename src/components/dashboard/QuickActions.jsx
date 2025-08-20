import React from 'react';
import { Plus, ShoppingCart, Package, BarChart3, Settings, Users, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

const QuickActions = ({ onNavigate }) => {
  const actions = [
    {
      title: 'Add Product',
      description: 'Add new product to inventory',
      icon: Plus,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: () => onNavigate('products')
    },
    {
      title: 'New Sale',
      description: 'Record a new sale',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      onClick: () => onNavigate('sales')
    },
    {
      title: 'Purchase Order',
      description: 'Create purchase order',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      onClick: () => onNavigate('purchases')
    },
    {
      title: 'View Reports',
      description: 'Check sales & inventory reports',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      onClick: () => onNavigate('reports')
    },
    {
      title: 'Pig Latin Translator',
      description: 'Translate text to Pig Latin',
      icon: Zap,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      onClick: () => onNavigate('pig-latin')
    }
  ];

  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant="ghost"
                onClick={action.onClick}
                className="w-full justify-start p-4 h-auto hover:bg-gray-50 transition-colors duration-200"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center w-full">
                  <div className={`p-2 rounded-lg ${action.bgColor} mr-4`}>
                    <Icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">
                      {action.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;