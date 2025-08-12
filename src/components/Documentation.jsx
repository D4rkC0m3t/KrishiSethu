import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  BookOpen,
  ArrowLeft,
  Search,
  Download,
  ExternalLink,
  Play,
  FileText,
  Video,
  HelpCircle,
  Lightbulb,
  Settings,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Truck,
  CreditCard,
  Database,
  Shield,
  Smartphone,
  Printer,
  Wifi,
  Cloud
} from 'lucide-react';

const Documentation = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');

  const documentationSections = {
    'getting-started': {
      title: 'Getting Started',
      icon: <Play className="h-5 w-5" />,
      items: [
        {
          title: 'Quick Start Guide',
          description: 'Get up and running with your inventory system in 5 minutes',
          type: 'guide',
          duration: '5 min read',
          topics: ['Initial Setup', 'First Product Entry', 'Basic Navigation']
        },
        {
          title: 'System Overview',
          description: 'Understanding the main features and modules',
          type: 'overview',
          duration: '10 min read',
          topics: ['Dashboard', 'Inventory Management', 'POS System', 'Reports']
        },
        {
          title: 'User Roles & Permissions',
          description: 'Learn about different user types and access levels',
          type: 'guide',
          duration: '7 min read',
          topics: ['Admin Users', 'Staff Users', 'Permissions', 'Security']
        }
      ]
    },
    'inventory': {
      title: 'Inventory Management',
      icon: <Package className="h-5 w-5" />,
      items: [
        {
          title: 'Adding Products',
          description: 'How to add fertilizers, seeds, and pesticides to your inventory',
          type: 'tutorial',
          duration: '8 min read',
          topics: ['Product Details', 'Categories', 'Brands', 'Stock Levels', 'Pricing']
        },
        {
          title: 'Stock Management',
          description: 'Managing stock levels, movements, and alerts',
          type: 'guide',
          duration: '12 min read',
          topics: ['Stock Tracking', 'Low Stock Alerts', 'Stock Movements', 'Adjustments']
        },
        {
          title: 'Categories & Brands',
          description: 'Organizing your products with categories and brands',
          type: 'tutorial',
          duration: '6 min read',
          topics: ['Creating Categories', 'Managing Brands', 'Product Organization']
        },
        {
          title: 'Bulk Operations',
          description: 'Import/export products and bulk updates',
          type: 'advanced',
          duration: '15 min read',
          topics: ['CSV Import', 'Bulk Updates', 'Data Export', 'Templates']
        }
      ]
    },
    'pos': {
      title: 'Point of Sale (POS)',
      icon: <ShoppingCart className="h-5 w-5" />,
      items: [
        {
          title: 'Making Sales',
          description: 'Complete guide to processing sales transactions',
          type: 'tutorial',
          duration: '10 min read',
          topics: ['Adding Items', 'Customer Info', 'Payment Processing', 'Receipts']
        },
        {
          title: 'Payment Methods',
          description: 'Accepting cash, card, and UPI payments',
          type: 'guide',
          duration: '8 min read',
          topics: ['Cash Payments', 'Card Payments', 'UPI Payments', 'Split Payments']
        },
        {
          title: 'Discounts & Offers',
          description: 'Applying discounts and managing promotional offers',
          type: 'tutorial',
          duration: '7 min read',
          topics: ['Percentage Discounts', 'Fixed Amount', 'Customer Discounts']
        },
        {
          title: 'Receipt Printing',
          description: 'Setting up thermal printers and receipt formats',
          type: 'technical',
          duration: '12 min read',
          topics: ['Thermal Printers', 'Receipt Templates', 'Print Settings']
        }
      ]
    },
    'customers': {
      title: 'Customer Management',
      icon: <Users className="h-5 w-5" />,
      items: [
        {
          title: 'Customer Database',
          description: 'Managing customer information and history',
          type: 'guide',
          duration: '9 min read',
          topics: ['Customer Profiles', 'Contact Info', 'Purchase History']
        },
        {
          title: 'Sales History',
          description: 'Tracking customer purchases and preferences',
          type: 'tutorial',
          duration: '6 min read',
          topics: ['Transaction History', 'Customer Analytics', 'Repeat Customers']
        }
      ]
    },
    'reports': {
      title: 'Reports & Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      items: [
        {
          title: 'Sales Reports',
          description: 'Generate and analyze sales performance reports',
          type: 'guide',
          duration: '11 min read',
          topics: ['Daily Sales', 'Monthly Reports', 'Product Performance', 'Trends']
        },
        {
          title: 'Inventory Reports',
          description: 'Stock reports and inventory analytics',
          type: 'tutorial',
          duration: '9 min read',
          topics: ['Stock Levels', 'Movement Reports', 'Valuation', 'Aging Analysis']
        },
        {
          title: 'Financial Reports',
          description: 'Revenue, profit, and financial analytics',
          type: 'advanced',
          duration: '13 min read',
          topics: ['Revenue Analysis', 'Profit Margins', 'Tax Reports', 'GST Compliance']
        }
      ]
    },
    'technical': {
      title: 'Technical Setup',
      icon: <Settings className="h-5 w-5" />,
      items: [
        {
          title: 'System Requirements',
          description: 'Hardware and software requirements for optimal performance',
          type: 'technical',
          duration: '5 min read',
          topics: ['Hardware Specs', 'Browser Support', 'Network Requirements']
        },
        {
          title: 'Backup & Security',
          description: 'Data backup procedures and security best practices',
          type: 'technical',
          duration: '14 min read',
          topics: ['Data Backup', 'User Security', 'Access Control', 'Data Recovery']
        },
        {
          title: 'Troubleshooting',
          description: 'Common issues and their solutions',
          type: 'reference',
          duration: '20 min read',
          topics: ['Login Issues', 'Print Problems', 'Network Issues', 'Performance']
        }
      ]
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'tutorial': return 'bg-blue-100 text-blue-800';
      case 'guide': return 'bg-green-100 text-green-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'technical': return 'bg-orange-100 text-orange-800';
      case 'reference': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'tutorial': return <Play className="h-4 w-4" />;
      case 'guide': return <BookOpen className="h-4 w-4" />;
      case 'advanced': return <Lightbulb className="h-4 w-4" />;
      case 'technical': return <Settings className="h-4 w-4" />;
      case 'reference': return <FileText className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const filteredSections = Object.entries(documentationSections).reduce((acc, [key, section]) => {
    if (searchTerm) {
      const filteredItems = section.items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      if (filteredItems.length > 0) {
        acc[key] = { ...section, items: filteredItems };
      }
    } else {
      acc[key] = section;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => onNavigate('dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-semibold">Documentation</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Online Help
            </Button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-card border-r min-h-screen p-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {Object.entries(filteredSections).map(([key, section]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedCategory === key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {section.icon}
                  <span className="font-medium">{section.title}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {section.items.length}
                  </Badge>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {selectedCategory && filteredSections[selectedCategory] && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {filteredSections[selectedCategory].title}
                </h2>
                <p className="text-gray-600">
                  Comprehensive guides and tutorials for {filteredSections[selectedCategory].title.toLowerCase()}
                </p>
              </div>

              <div className="grid gap-6">
                {filteredSections[selectedCategory].items.map((item, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(item.type)}
                          <div>
                            <CardTitle className="text-xl">{item.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {item.description}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(item.type)}>
                            {item.type}
                          </Badge>
                          <Badge variant="outline">
                            {item.duration}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Topics Covered:</h4>
                          <div className="flex flex-wrap gap-2">
                            {item.topics.map((topic, topicIndex) => (
                              <Badge key={topicIndex} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <FileText className="h-4 w-4" />
                              <span>Article</span>
                            </span>
                          </div>
                          <Button size="sm">
                            Read Guide
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documentation;
