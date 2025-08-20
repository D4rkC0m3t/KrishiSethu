import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import {
  LifeBuoy,
  ArrowLeft,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  FileText,
  Video,
  Download,
  ExternalLink,
  Send,
  User,
  Calendar,
  Zap,
  Shield,
  Headphones,
  Globe,
  Smartphone,
  Monitor,
  Wifi,
  Database,
  Bug,
  Lightbulb,
  Star,
  ThumbsUp,
  CreditCard,
  Sparkles,
  Rocket,
  Construction
} from 'lucide-react';

const Support = ({ onNavigate }) => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState('');

  // Handle coming soon popup
  const handleComingSoon = (featureName) => {
    setComingSoonFeature(featureName);
    setShowComingSoon(true);
  };
  const [supportForm, setSupportForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    priority: 'medium',
    description: ''
  });

  const supportCategories = [
    { id: 'technical', label: 'Technical Issues', icon: <Monitor className="h-5 w-5" />, color: 'bg-red-100 text-red-800' },
    { id: 'billing', label: 'Billing & Payments', icon: <CreditCard className="h-5 w-5" />, color: 'bg-blue-100 text-blue-800' },
    { id: 'feature', label: 'Feature Requests', icon: <Lightbulb className="h-5 w-5" />, color: 'bg-green-100 text-green-800' },
    { id: 'training', label: 'Training & Setup', icon: <User className="h-5 w-5" />, color: 'bg-purple-100 text-purple-800' },
    { id: 'bug', label: 'Bug Reports', icon: <Bug className="h-5 w-5" />, color: 'bg-orange-100 text-orange-800' },
    { id: 'general', label: 'General Inquiry', icon: <HelpCircle className="h-5 w-5" />, color: 'bg-gray-100 text-gray-800' }
  ];

  const supportChannels = [
    {
      id: 'live-chat',
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      icon: <MessageCircle className="h-6 w-6" />,
      availability: 'Available 9 AM - 6 PM IST',
      responseTime: 'Immediate',
      status: 'online',
      action: 'Start Chat'
    },
    {
      id: 'phone',
      title: 'Phone Support',
      description: 'Speak directly with our technical experts',
      icon: <Phone className="h-6 w-6" />,
      availability: 'Mon-Fri 9 AM - 6 PM IST',
      responseTime: 'Immediate',
      status: 'available',
      action: 'Call Now',
      phone: '+91-8688765111'
    },
    {
      id: 'email',
      title: 'Email Support',
      description: 'Send detailed queries and get comprehensive solutions',
      icon: <Mail className="h-6 w-6" />,
      availability: '24/7',
      responseTime: 'Within 4 hours',
      status: 'always',
      action: 'Send Email',
      email: 'support@krishisethu.com'
    },
    {
      id: 'remote',
      title: 'Remote Assistance',
      description: 'Screen sharing for complex technical issues',
      icon: <Monitor className="h-6 w-6" />,
      availability: 'By Appointment',
      responseTime: 'Same day',
      status: 'scheduled',
      action: 'Schedule Session'
    }
  ];

  const faqItems = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I add my first product to inventory?',
          a: 'Go to Inventory → Add Product, fill in the product details including name, category, price, and stock quantity. Click Save to add the product.'
        },
        {
          q: 'How do I process my first sale?',
          a: 'Navigate to POS System, search for products, add them to cart, enter customer details if needed, and process payment through cash, card, or UPI.'
        },
        {
          q: 'How do I set up my shop details?',
          a: 'Go to Settings → Shop Configuration to add your shop name, address, contact details, GST number, and upload your logo.'
        }
      ]
    },
    {
      category: 'Technical Issues',
      questions: [
        {
          q: 'Why is my thermal printer not working?',
          a: 'Check printer connection, ensure correct drivers are installed, verify printer settings in Settings → Printer Configuration, and test with a sample receipt.'
        },
        {
          q: 'How do I backup my data?',
          a: 'Go to Settings → Backup & Data Management. You can create manual backups or set up automatic daily backups to cloud storage.'
        },
        {
          q: 'What if I lose internet connection?',
          a: 'The system works offline for basic operations like POS sales. Data will sync automatically when connection is restored.'
        }
      ]
    },
    {
      category: 'Billing & Payments',
      questions: [
        {
          q: 'How do I handle GST calculations?',
          a: 'GST is automatically calculated based on product HSN codes and tax rates. You can configure tax rates in Settings → Tax Configuration.'
        },
        {
          q: 'Can I accept UPI payments?',
          a: 'Yes, the system supports UPI payments. Configure your UPI ID in Settings → Payment Methods for QR code generation.'
        },
        {
          q: 'How do I generate sales reports?',
          a: 'Go to Reports section to generate daily, weekly, monthly sales reports with detailed analytics and export options.'
        }
      ]
    }
  ];

  const recentTickets = [
    {
      id: 'TKT-001',
      subject: 'Thermal printer setup issue',
      category: 'technical',
      priority: 'high',
      status: 'in-progress',
      created: '2024-01-15',
      lastUpdate: '2 hours ago'
    },
    {
      id: 'TKT-002',
      subject: 'GST report generation',
      category: 'billing',
      priority: 'medium',
      status: 'resolved',
      created: '2024-01-14',
      lastUpdate: '1 day ago'
    },
    {
      id: 'TKT-003',
      subject: 'Feature request: Bulk discount',
      category: 'feature',
      priority: 'low',
      status: 'under-review',
      created: '2024-01-13',
      lastUpdate: '2 days ago'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'available': return 'bg-blue-500';
      case 'always': return 'bg-purple-500';
      case 'scheduled': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getTicketStatusColor = (status) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'in-progress': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'under-review': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'pending': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Show coming soon popup instead of actual submission
    handleComingSoon('Support Ticket Submission');
  };

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
              <LifeBuoy className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-semibold">Support Center</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Support Available
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="help" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="help">Get Help</TabsTrigger>
            <TabsTrigger value="contact">Contact Support</TabsTrigger>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          {/* Get Help Tab */}
          <TabsContent value="help" className="space-y-6">
            {/* Support Channels */}
            <div>
              <h2 className="text-2xl font-bold mb-4">How can we help you today?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportChannels.map((channel) => (
                  <Card key={channel.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {channel.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{channel.title}</CardTitle>
                            <CardDescription>{channel.description}</CardDescription>
                          </div>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(channel.status)}`}></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Availability:</span>
                          <span className="font-medium">{channel.availability}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Response Time:</span>
                          <span className="font-medium">{channel.responseTime}</span>
                        </div>
                        {channel.phone && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium">{channel.phone}</span>
                          </div>
                        )}
                        {channel.email && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium">{channel.email}</span>
                          </div>
                        )}
                        <Button
                          className="w-full mt-3"
                          onClick={() => handleComingSoon(channel.action)}
                        >
                          {channel.action}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {faqItems.map((category, categoryIndex) => (
                  <Card key={categoryIndex}>
                    <CardHeader>
                      <CardTitle className="text-lg">{category.category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {category.questions.map((faq, faqIndex) => (
                          <div key={faqIndex} className="border-b last:border-b-0 pb-4 last:pb-0">
                            <h4 className="font-medium text-gray-900 mb-2">{faq.q}</h4>
                            <p className="text-gray-600 text-sm">{faq.a}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Contact Support Tab */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Submit a Support Request</CardTitle>
                <CardDescription>
                  Describe your issue in detail and we'll get back to you as soon as possible
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name *</label>
                      <input
                        type="text"
                        required
                        value={supportForm.name}
                        onChange={(e) => setSupportForm({...supportForm, name: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={supportForm.email}
                        onChange={(e) => setSupportForm({...supportForm, email: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject *</label>
                    <input
                      type="text"
                      required
                      value={supportForm.subject}
                      onChange={(e) => setSupportForm({...supportForm, subject: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of your issue"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category *</label>
                      <select
                        required
                        value={supportForm.category}
                        onChange={(e) => setSupportForm({...supportForm, category: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select category</option>
                        {supportCategories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Priority</label>
                      <select
                        value={supportForm.priority}
                        onChange={(e) => setSupportForm({...supportForm, priority: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <textarea
                      required
                      rows={6}
                      value={supportForm.description}
                      onChange={(e) => setSupportForm({...supportForm, description: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Support Request
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Your Support Tickets</h2>
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-mono text-sm text-gray-500">{ticket.id}</span>
                            <Badge className={getTicketStatusColor(ticket.status)}>
                              {ticket.status.replace('-', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-lg mb-1">{ticket.subject}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Created: {ticket.created}</span>
                            <span>Last update: {ticket.lastUpdate}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleComingSoon('Ticket Details')}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>User Manual</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Complete user guide with step-by-step instructions</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleComingSoon('User Manual Download')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Video className="h-5 w-5" />
                    <span>Video Tutorials</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Watch video guides for common tasks and features</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleComingSoon('Video Tutorials')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Watch Videos
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="h-5 w-5" />
                    <span>Knowledge Base</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Browse our comprehensive online help center</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleComingSoon('Knowledge Base')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Knowledge Base
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Coming Soon Popup */}
      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent className="max-w-md mx-auto">
          <div className="text-center py-6">
            {/* Animated Background */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 rounded-full p-6 mx-auto w-24 h-24 flex items-center justify-center">
                <Construction className="h-12 w-12 text-white animate-bounce" />
              </div>
            </div>

            {/* Title with Sparkles */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Coming Soon!
              </DialogTitle>
              <Sparkles className="h-6 w-6 text-yellow-500 animate-pulse" />
            </div>

            {/* Feature Name */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full border border-blue-200">
                <Rocket className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-800">{comingSoonFeature}</span>
              </div>
            </div>

            {/* Description */}
            <DialogDescription className="text-gray-600 mb-6 leading-relaxed">
              We're working hard to bring you this amazing feature!
              <br />
              <span className="font-medium text-purple-600">Stay tuned for updates.</span>
            </DialogDescription>

            {/* Decorative Elements */}
            <div className="flex justify-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
              </div>
              <Zap className="h-5 w-5 text-orange-500 animate-pulse" />
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
              </div>
            </div>

            {/* Close Button */}
            <Button
              onClick={() => setShowComingSoon(false)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105"
            >
              Got it! ✨
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Support;
