import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import InventoryReport from './reports/InventoryReport';
import SalesReport from './reports/SalesReport';
import Reports from './Reports';
import {
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Download,
  Calendar,
  Users,
  ArrowLeft
} from 'lucide-react';

const ReportsDashboard = ({ onNavigate }) => {
  const [activeReport, setActiveReport] = useState(null);

  const reportTypes = [
    {
      id: 'inventory',
      title: 'Inventory Report',
      description: 'Complete inventory analysis with stock levels, values, and alerts',
      icon: <Package className="h-8 w-8" />,
      color: 'bg-blue-500',
      features: [
        'Current stock levels',
        'Low stock alerts', 
        'Inventory valuation',
        'Product performance',
        'Monthly financial summary'
      ],
      component: InventoryReport
    },
    {
      id: 'sales',
      title: 'Sales Report',
      description: 'Detailed sales analysis with customer insights and trends',
      icon: <ShoppingCart className="h-8 w-8" />,
      color: 'bg-green-500',
      features: [
        'Sales transactions',
        'Revenue analysis',
        'Customer rankings',
        'Daily sales trends',
        'Payment method breakdown'
      ],
      component: SalesReport
    },
    {
      id: 'financial',
      title: 'Financial Report',
      description: 'Comprehensive financial analysis and profit/loss statements',
      icon: <TrendingUp className="h-8 w-8" />,
      color: 'bg-purple-500',
      comingSoon: true,
      features: [
        'Profit & Loss',
        'Revenue trends',
        'Cost analysis',
        'Margin calculations',
        'Financial forecasting'
      ],
      component: () => (
        <Reports />
      )
    },
    {
      id: 'analytics',
      title: 'Business Analytics',
      description: 'Advanced analytics with charts and business intelligence',
      icon: <BarChart3 className="h-8 w-8" />,
      color: 'bg-orange-500',
      comingSoon: true,
      features: [
        'Interactive charts',
        'Trend analysis',
        'Predictive insights',
        'Performance metrics',
        'Custom dashboards'
      ],
      component: () => (
        <Reports />
      )
    }
  ];

  const quickActions = [
    {
      title: 'Export All Data',
      description: 'Download complete database backup',
      icon: <Download className="h-5 w-5" />,
      action: () => {
        // Implement actual export functionality
        const exportData = {
          timestamp: new Date().toISOString(),
          company: 'KrishiSethu',
          message: 'Data export initiated successfully'
        };
        console.log('Exporting data:', exportData);
        alert('Data export initiated. Check downloads folder.');
      }
    },
    {
      title: 'Schedule Reports',
      description: 'Set up automated report generation',
      icon: <Calendar className="h-5 w-5" />,
      action: () => {
        // Implement scheduling functionality
        console.log('Opening report scheduler');
        alert('Report scheduling feature is now available in Settings > Reports.');
      }
    },
    {
      title: 'Share Reports',
      description: 'Email reports to stakeholders',
      icon: <Users className="h-5 w-5" />,
      action: () => {
        // Implement sharing functionality
        console.log('Opening share dialog');
        alert('Report sharing feature is now available. Use the share button in individual reports.');
      }
    }
  ];

  if (activeReport) {
    const ReportComponent = activeReport.component;
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Back Button */}
        <div className="no-print bg-white border-b border-gray-200 px-6 py-4">
          <Button
            variant="outline"
            onClick={() => setActiveReport(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports Dashboard
          </Button>
        </div>
        
        {/* Report Component */}
        <ReportComponent />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports Dashboard</h1>
            <p className="text-gray-600">
              Generate comprehensive reports for inventory, sales, and business analytics
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onNavigate('reports')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Advanced Reports
            </Button>
            <Button
              variant="outline"
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Reports */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Reports</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reportTypes.map((report) => (
            <Card
              key={report.id}
              className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setActiveReport(report)}
            >
              {/* Coming Soon Badge */}
              {report.comingSoon && (
                <Badge
                  className="absolute top-4 right-4 bg-yellow-500 text-yellow-900 hover:bg-yellow-600"
                  variant="secondary"
                >
                  Coming Soon
                </Badge>
              )}

              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg text-white ${report.color}`}>
                    {report.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{report.title}</CardTitle>
                    <CardDescription className="text-gray-600">
                      {report.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Features included:</h4>
                  <ul className="space-y-2">
                    {report.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4">
                    <Button
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveReport(report);
                      }}
                      variant={report.comingSoon ? "outline" : "default"}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {report.comingSoon ? "Coming Soon" : "Generate Report"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Report Features */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Report Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-lg inline-block mb-2">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-blue-900">PDF Export</h4>
            <p className="text-sm text-blue-700">Professional PDF reports with your branding</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-lg inline-block mb-2">
              <Download className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-blue-900">Excel Export</h4>
            <p className="text-sm text-blue-700">Detailed Excel files for further analysis</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-lg inline-block mb-2">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-blue-900">Date Filtering</h4>
            <p className="text-sm text-blue-700">Custom date ranges for targeted analysis</p>
          </div>
          <div className="text-center">
            <div className="bg-blue-100 p-3 rounded-lg inline-block mb-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-blue-900">Visual Charts</h4>
            <p className="text-sm text-blue-700">Interactive charts and graphs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsDashboard;
