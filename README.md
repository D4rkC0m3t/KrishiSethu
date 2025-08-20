# 🌾 KrishiSethu Inventory Management System

A modern, comprehensive inventory management system designed specifically for fertilizer shops and agricultural businesses.

## ✨ Features

### 🏪 **Complete Business Management**
- **Inventory Management** - Products, categories, suppliers, stock tracking
- **Point of Sale (POS)** - Real-time sales processing with receipt generation
- **Customer Management** - Customer database with purchase history
- **Supplier Management** - Supplier information and purchase orders
- **Sales & Purchase Tracking** - Complete transaction history
- **Comprehensive Reporting** - Sales, inventory, and financial reports

### 🔐 **User Management & Security**
- **30-Day Free Trial** - Automatic trial system for new users
- **Role-Based Access** - Admin, trial, and paid user permissions
- **Secure Authentication** - Powered by Supabase Auth
- **Row Level Security** - Database-level security policies

### 📊 **Advanced Features**
- **Real-time Dashboard** - Live business metrics and KPIs
- **GST/Tax Management** - Automated tax calculations and reports
- **Barcode Scanning** - Product identification and inventory management
- **Invoice Generation** - Professional invoices with PDF export
- **Offline Support** - Continue working without internet connection
- **Mobile Responsive** - Works perfectly on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd krishisethu-inventory-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Environment Variables

Create a `.env.local` file with the following variables:

```env
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_ENVIRONMENT=development
REACT_APP_APP_NAME=KrishiSethu Inventory Management
REACT_APP_VERSION=1.0.0
```

## 🗄️ Database Setup

This application uses Supabase as the backend. The required database tables include:

- `profiles` - User management and authentication
- `products` - Product inventory
- `categories` - Product categorization
- `suppliers` - Supplier information
- `customers` - Customer database
- `sales` - Sales transactions
- `purchases` - Purchase orders
- `brands` - Product brands
- `stock_movements` - Inventory tracking
- `notifications` - System notifications

## 📱 Usage

### For New Users
1. **Register** for a 30-day free trial
2. **Set up your shop** details and preferences
3. **Add products** to your inventory
4. **Start selling** using the POS system

### For Administrators
1. **User Management** - Manage trial extensions and user permissions
2. **System Monitoring** - Track usage and performance
3. **Data Management** - Export/import data and manage backups

## 🛠️ Development

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run test:e2e` - Run end-to-end tests

### Project Structure

```
src/
├── components/          # React components
├── contexts/           # React contexts (Auth, Settings)
├── hooks/              # Custom React hooks
├── lib/                # Core libraries and services
├── utils/              # Utility functions
└── styles/             # CSS and styling
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Set environment variables** in Vercel dashboard

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Other Platforms

The application can be deployed to any static hosting service:
- Netlify
- AWS S3 + CloudFront
- Firebase Hosting
- GitHub Pages

## 📊 Performance

- **Bundle Size**: Optimized for fast loading
- **Mobile First**: Responsive design for all devices
- **Offline Support**: Works without internet connection
- **Real-time Updates**: Live data synchronization

## 🔒 Security

- **Authentication**: Secure user authentication with Supabase
- **Authorization**: Role-based access control
- **Data Protection**: Row Level Security (RLS) policies
- **HTTPS**: Enforced secure connections
- **Input Validation**: Comprehensive data validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Check the documentation
- Review the FAQ
- Contact the development team

---

**Built with ❤️ for the agricultural community**

*Empowering fertilizer shops with modern inventory management technology*
