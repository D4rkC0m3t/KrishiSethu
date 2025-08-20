import React, { useState } from 'react';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

const SalesChart = () => {
  const [timeRange, setTimeRange] = useState('7d');

  // Mock sales data - in real app this would come from API
  const salesData = {
    '7d': {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      values: [12000, 15000, 8000, 22000, 18000, 25000, 20000],
      total: 120000,
      growth: 12.5
    },
    '30d': {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      values: [45000, 52000, 48000, 65000],
      total: 210000,
      growth: 8.3
    },
    '90d': {
      labels: ['Month 1', 'Month 2', 'Month 3'],
      values: [180000, 210000, 245000],
      total: 635000,
      growth: 15.2
    }
  };

  const currentData = salesData[timeRange];
  const maxValue = Math.max(...currentData.values);

  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            Sales Overview
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {['7d', '30d', '90d'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="text-xs"
              >
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600 font-medium">Total Sales</p>
            <p className="text-2xl font-bold text-green-700">
              ₹{currentData.total.toLocaleString('en-IN')}
            </p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-600 font-medium">Growth</p>
            <p className="text-2xl font-bold text-blue-700 flex items-center justify-center gap-1">
              <TrendingUp className="h-5 w-5" />
              {currentData.growth}%
            </p>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="space-y-4">
          <div className="flex items-end justify-between h-40 gap-2">
            {currentData.values.map((value, index) => {
              const height = (value / maxValue) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-md transition-all duration-500 hover:from-green-600 hover:to-green-500 cursor-pointer"
                    style={{ height: `${height}%` }}
                    title={`₹${value.toLocaleString('en-IN')}`}
                  ></div>
                  <span className="text-xs text-gray-600 font-medium">
                    {currentData.labels[index]}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Value Labels */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>₹0</span>
            <span>₹{(maxValue / 2).toLocaleString('en-IN')}</span>
            <span>₹{maxValue.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Insights</span>
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <p>• Sales are trending {currentData.growth > 0 ? 'upward' : 'downward'} with {Math.abs(currentData.growth)}% growth</p>
            <p>• Best performing day: {currentData.labels[currentData.values.indexOf(maxValue)]}</p>
            <p>• Average daily sales: ₹{Math.round(currentData.total / currentData.values.length).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesChart;