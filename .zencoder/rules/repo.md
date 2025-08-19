---
description: Repository Information Overview
alwaysApply: true
---

# Krishisethu Inventory Management System

## Summary
A React-based inventory management system for fertilizer shops, built with Firebase backend. The application provides features for product management, sales tracking, customer management, and reporting with role-based access control.

## Structure
- **src/**: React application source code
  - **components/**: UI components including Dashboard, Login, etc.
  - **contexts/**: React context providers (AuthContext)
  - **lib/**: Firebase configuration and utilities
  - **utils/**: Helper functions and utilities
- **public/**: Static assets and HTML template
- **build/**: Production build output

## Language & Runtime
**Language**: JavaScript (React)
**Version**: React 19.1.1
**Build System**: Create React App
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React 19.1.1
- Firebase 12.0.0 (Authentication, Firestore, Storage)
- Tailwind CSS 3.3.5
- Radix UI components
- Recharts 3.1.2 (for data visualization)
- GSAP 3.13.0 (for animations)

**Development Dependencies**:
- Tailwind CSS tooling
- Testing libraries (Jest, React Testing Library)
- PostCSS 8.4.27

## Build & Installation
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Firebase Configuration
**Project ID**: krishisetu-88b88
**Services**: Authentication, Firestore, Storage
**Security Rules**: Custom rules in firestore.rules and storage.rules
**Deployment**:
```bash
firebase deploy --only hosting
```

## Database Structure
**Type**: Firestore (NoSQL)
**Collections**:
- users: User accounts with role-based permissions
- products: Inventory items with stock tracking
- customers: Customer information and purchase history
- sales: Sales transactions and invoices
- purchases: Purchase orders from suppliers
- suppliers: Supplier information
- categories: Product categorization
- stock_movements: Inventory change tracking

## Authentication
**Provider**: Firebase Authentication
**Methods**: Email/Password
**User Roles**:
- admin: Full system access
- manager: Manage products, sales, purchases
- staff: Process sales, view products

## Testing
**Framework**: Jest with React Testing Library
**Test Location**: src/App.test.js and component tests
**Run Command**:
```bash
npm test
```

## PWA Support
**Features**: Offline capability, installable app
**Service Worker**: public/sw.js
**Manifest**: public/manifest.json