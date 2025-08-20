import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  BookOpen,
  Video,
  HelpCircle,
  ExternalLink,
  Search,
  FileText,
  Users,
  Settings,
  ShoppingCart
} from 'lucide-react';

const Documentation = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const documentationSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      description: 'Learn the basics of KrishiSethu',
      articles: [
        'Quick Start Guide',
        'Setting up your first shop',
        'Adding products to inventory',
        'Making your first sale'
      ]
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      icon: FileText,
      description: 'Manage your products and stock',
      articles: [
        'Adding new products',
        'Managing categories and brands',
        'Stock movements and adjustments',
        'Low stock alerts'
      ]
    },
    {
      id: 'sales',
      title: 'Sales & POS',
      icon: ShoppingCart,
      description: 'Process sales and manage transactions',
      articles: [
        'Using the POS system',
        'Processing payments',
        'Generating receipts',
        'Managing returns'
      ]
    },
    {
      id: 'customers',
      title: 'Customer Management',
      icon: Users,
      description: 'Manage customer relationships',
      articles: [
        'Adding new customers',
        'Customer credit management',
        'Purchase history tracking',
        'Customer reports'
      ]
    },
    {
      id: 'settings',
      title: 'Settings & Configuration',
      icon: Settings,
      description: 'Configure your system',
      articles: [
        'Shop settings',
        'Tax configuration',
        'User permissions',
        'Backup and restore'
      ]
    }
  ];

  const videoTutorials = [
    {
      title: 'KrishiSethu Overview',
      duration: '5:30',
      description: 'Complete overview of the system'
    },
    {
      title: 'Setting up Inventory',
      duration: '8:15',
      description: 'How to add and manage products'
    },
    {
      title: 'Processing Sales',
      duration: '6:45',
      description: 'Using the POS system effectively'
    },
    {
      title: 'Reports and Analytics',
      duration: '7:20',
      description: 'Understanding your business data'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documentation & Help</h2>
          <p className="text-gray-600">Learn how to use KrishiSethu effectively</p>
        </div>
        <Badge variant="outline" className="text-blue-600">
          <HelpCircle className="w-4 h-4 mr-1" />
          Help Center
        </Badge>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Documentation Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documentationSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <IconComponent className="w-5 h-5 mr-2 text-blue-600" />
                  {section.title}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {section.articles.map((article, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <FileText className="w-3 h-3 mr-2 text-gray-400" />
                      <button className="text-blue-600 hover:underline">
                        {article}
                      </button>
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" className="w-full mt-4">
                  View All Articles
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Video Tutorials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="w-5 h-5 mr-2 text-red-600" />
            Video Tutorials
          </CardTitle>
          <CardDescription>
            Watch step-by-step video guides
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {videoTutorials.map((video, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Video className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{video.title}</p>
                  <p className="text-sm text-gray-500">{video.description}</p>
                  <p className="text-xs text-gray-400">{video.duration}</p>
                </div>
                <Button size="sm" variant="outline">
                  Watch
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="py-6">
            <HelpCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="font-medium">FAQ</p>
            <p className="text-sm text-gray-500 mb-3">Common questions</p>
            <Button size="sm" variant="outline">View FAQ</Button>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="py-6">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium">Community</p>
            <p className="text-sm text-gray-500 mb-3">Join discussions</p>
            <Button size="sm" variant="outline">Join Community</Button>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="py-6">
            <ExternalLink className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="font-medium">Contact Support</p>
            <p className="text-sm text-gray-500 mb-3">Get direct help</p>
            <Button size="sm" variant="outline">Contact Us</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Documentation;
