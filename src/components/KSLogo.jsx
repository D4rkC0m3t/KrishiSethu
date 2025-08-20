import React from 'react';

const KSLogo = ({ size = 64, className = "" }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 64 64" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        {/* Background Circle */}
        <circle cx="32" cy="32" r="30" fill="#16a34a"/>
        
        {/* Inner Circle for depth */}
        <circle cx="32" cy="32" r="25" fill="#22c55e" opacity="0.8"/>
        
        {/* Wheat decorations */}
        <g fill="#fbbf24" opacity="0.6">
          {/* Top wheat */}
          <path d="M32 8 L28 16 L36 16 Z"/>
          {/* Bottom wheat */}
          <path d="M32 56 L28 48 L36 48 Z"/>
          {/* Left wheat */}
          <path d="M8 32 L16 28 L16 36 Z"/>
          {/* Right wheat */}
          <path d="M56 32 L48 28 L48 36 Z"/>
        </g>
        
        {/* KS Text */}
        <text 
          x="32" 
          y="38" 
          fontFamily="Arial, sans-serif" 
          fontSize="20" 
          fontWeight="bold" 
          fill="white" 
          textAnchor="middle"
          dominantBaseline="middle"
        >
          KS
        </text>
      </svg>
    </div>
  );
};

export default KSLogo;
