import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction, 
  className = '',
  variant = 'default' 
}) => {
  const variants = {
    default: 'bg-muted border-border',
    info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    success: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
  };

  return (
    <Card className={`${variants[variant]} ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {/* Icon */}
        <div className="text-6xl mb-4 opacity-50">
          {icon}
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
        
        {/* Action Button */}
        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-2">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

// Predefined empty states for common scenarios
export const EmptyInventory = ({ onAddProduct }) => (
  <EmptyState
    icon="📦"
    title="No Products in Inventory"
    description="Your inventory is empty. Start by adding your first product to begin managing your stock."
    actionLabel="Add First Product"
    onAction={onAddProduct}
    variant="info"
  />
);

export const EmptyProducts = ({ onAddProduct }) => (
  <EmptyState
    icon="🛍️"
    title="No Products Available"
    description="No products are available for sale. Add products to your inventory first."
    actionLabel="Go to Inventory"
    onAction={onAddProduct}
    variant="warning"
  />
);

export const EmptyCustomers = ({ onAddCustomer }) => (
  <EmptyState
    icon="👥"
    title="No Customers Found"
    description="You haven't added any customers yet. Add customers to track their purchase history and manage relationships."
    actionLabel="Add First Customer"
    onAction={onAddCustomer}
    variant="info"
  />
);

export const EmptySales = ({ onMakeSale }) => (
  <EmptyState
    icon="💰"
    title="No Sales Recorded"
    description="You haven't made any sales yet. Start selling products to see your sales history here."
    actionLabel="Make First Sale"
    onAction={onMakeSale}
    variant="success"
  />
);

export const EmptySuppliers = ({ onAddSupplier }) => (
  <EmptyState
    icon="🏭"
    title="No Suppliers Added"
    description="Add suppliers to track your purchase orders and manage your supply chain effectively."
    actionLabel="Add First Supplier"
    onAction={onAddSupplier}
    variant="info"
  />
);

export const EmptySearch = ({ searchTerm, onClearSearch }) => (
  <EmptyState
    icon="🔍"
    title="No Results Found"
    description={`No items match your search for "${searchTerm}". Try adjusting your search terms or browse all items.`}
    actionLabel="Clear Search"
    onAction={onClearSearch}
    variant="default"
  />
);

export const EmptyCategory = ({ category, onViewAll }) => (
  <EmptyState
    icon="📂"
    title={`No Items in ${category}`}
    description={`There are no items in the ${category} category. Try selecting a different category or view all items.`}
    actionLabel="View All Items"
    onAction={onViewAll}
    variant="default"
  />
);

export const LoadingState = ({ message = "Loading..." }) => (
  <EmptyState
    icon="⏳"
    title={message}
    description="Please wait while we fetch your data."
    variant="default"
  />
);

export const ErrorState = ({ error, onRetry }) => (
  <EmptyState
    icon="❌"
    title="Something went wrong"
    description={error || "An unexpected error occurred. Please try again."}
    actionLabel="Try Again"
    onAction={onRetry}
    variant="warning"
  />
);

export const OfflineState = ({ onRefresh }) => (
  <EmptyState
    icon="📱"
    title="You're Offline"
    description="Some features may not be available while offline. Check your internet connection and try again."
    actionLabel="Refresh"
    onAction={onRefresh}
    variant="warning"
  />
);

export const NoPermissionState = ({ onRequestPermission }) => (
  <EmptyState
    icon="🔒"
    title="Permission Required"
    description="You don't have permission to view this content. Please contact your administrator."
    actionLabel="Request Access"
    onAction={onRequestPermission}
    variant="warning"
  />
);

export default EmptyState;
