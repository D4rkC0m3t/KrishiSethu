/**
 * 📝 TEXTAREA COMPONENT
 *
 * Reusable textarea component with consistent styling
 */

import React from 'react';

export const Textarea = ({
  className = '',
  disabled = false,
  placeholder = '',
  value = '',
  onChange,
  ...props
}) => {
  const baseClasses = 'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-vertical';

  return (
    <textarea
      className={`${baseClasses} ${className}`}
      disabled={disabled}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...props}
    />
  );
};