import React, { useEffect, useRef } from 'react';

const AnimatedHero = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add mobile touch support
    const mobileHoverElements = container.querySelectorAll('.mobile-hover');

    mobileHoverElements.forEach((element) => {
      const handleTouchStart = () => {
        element.classList.add('mobile-hovering');
        container.classList.add('mobile-hovering');
      };

      const handleTouchEnd = () => {
        setTimeout(() => {
          element.classList.remove('mobile-hovering');
          container.classList.remove('mobile-hovering');
        }, 100);
      };

      element.addEventListener('touchstart', handleTouchStart);
      element.addEventListener('touchend', handleTouchEnd);

      // Store cleanup
      element._cleanup = () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    });

    return () => {
      mobileHoverElements.forEach((element) => {
        if (element._cleanup) {
          element._cleanup();
        }
      });
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full lg:w-1/2 h-screen bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-green-200 rounded-full"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-blue-200 rounded-full"></div>
        <div className="absolute bottom-20 left-32 w-24 h-24 bg-purple-200 rounded-full"></div>
        <div className="absolute bottom-40 right-10 w-12 h-12 bg-yellow-200 rounded-full"></div>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center z-20">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
          Let's make Inventory Management 
          <span className="block text-green-600">fun!</span>
        </h1>
        <p className="text-gray-600 text-sm lg:text-base">
          Complete fertilizer business ecosystem
        </p>
      </div>

      {/* TradeGecko Ecosystem Infographic - Exact Copy */}
      <div className="ecosystem-infographic-container">
        <div className="ecosystem-infographic-wrapper">
          <div className="ecosystem-infographic mobile-hover">
            
            {/* Central TradeGecko/Fertilizer Manager */}
            <div className="ecosystem-infographic__tradegecko ecosystem-infographic__transform ecosystem-infographic__transform--half mobile-hover">
              <p className="ecosystem-infographic__tradegecko-text ecosystem-infographic__transform-fade">
                Fertilizer Manager
              </p>
              <svg className="ecosystem-infographic__tradegecko-computer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 295 346">
                <use xlinkHref="#ecosystem__tradegecko" />
              </svg>
            </div>

            {/* Purchase Orders */}
            <div className="ecosystem-infographic__purchase-orders ecosystem-infographic__transform ecosystem-infographic__transform--iso mobile-hover">
              <p className="ecosystem-infographic__sales-orders-text ecosystem-infographic__transform-fade">
                Purchase<br />orders
              </p>
              <svg className="ecosystem-infographic__purchase-orders-screen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 110">
                <use xlinkHref="#ecosystem__purchase-orders" />
              </svg>
            </div>

            {/* Mobile */}
            <div className="ecosystem-infographic__mobile ecosystem-infographic__transform mobile-hover">
              <p className="ecosystem-infographic__mobile-text ecosystem-infographic__transform-fade">
                Mobile App
              </p>
              <svg className="ecosystem-infographic__mobile-phone" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 147 97">
                <use xlinkHref="#ecosystem__mobile" />
              </svg>
            </div>

            {/* Suppliers */}
            <div className="ecosystem-infographic__suppliers ecosystem-infographic__transform suppliers-hover">
              <p className="ecosystem-infographic__suppliers-text ecosystem-infographic__transform-fade">
                Suppliers
              </p>
              <svg className="ecosystem-infographic__suppliers-building" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 125 170">
                <use xlinkHref="#ecosystem__suppliers" />
              </svg>
            </div>
            
            {/* Animated Arrows */}
            <div className="ecosystem-infographic__arrows">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 870 608">
                <use xlinkHref="#ecosystem__arrows" />
              </svg>
            </div>

            {/* People */}
            <div className="ecosystem-infographic__man-1">
              <svg className="ecosystem-infographic__man-1-body" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 70">
                <use xlinkHref="#ecosystem__man-1" />
              </svg>
            </div>

            <div className="ecosystem-infographic__lady-1">
              <svg className="ecosystem-infographic__lady-1-body" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 70">
                <use xlinkHref="#ecosystem__lady-1" />
              </svg>
            </div>

            <div className="ecosystem-infographic__lady-2">
              <svg className="ecosystem-infographic__lady-2-body" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 70">
                <use xlinkHref="#ecosystem__lady-2" />
              </svg>
            </div>

            {/* Payment */}
            <div className="ecosystem-infographic__payment ecosystem-infographic__transform ecosystem-infographic__transform--iso mobile-hover">
              <p className="ecosystem-infographic__payment-text ecosystem-infographic__transform-fade">
                Payment<br />Processing
              </p>
              <svg className="ecosystem-infographic__payment-screen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 175 130">
                <use xlinkHref="#ecosystem__payment-screen" />
              </svg>
              <svg className="ecosystem-infographic__payment-card" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 82 53">
                <use xlinkHref="#ecosystem__payment-card" />
              </svg>
            </div>

            {/* Accounting */}
            <div className="ecosystem-infographic__accounting ecosystem-infographic__transform ecosystem-infographic__transform--iso mobile-hover">
              <p className="ecosystem-infographic__accounting-text ecosystem-infographic__transform-fade">
                Accounting<br />integrations
              </p>
              <svg className="ecosystem-infographic__accounting-screen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 175 130">
                <use xlinkHref="#ecosystem__accounting" />
              </svg>
            </div>

            {/* Sales Orders */}
            <div className="ecosystem-infographic__sales-orders ecosystem-infographic__transform ecosystem-infographic__transform--iso mobile-hover">
              <p className="ecosystem-infographic__sales-orders-text ecosystem-infographic__transform-fade">
                Manual<br />sales orders
              </p>
              <svg className="ecosystem-infographic__sales-orders-screen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 110">
                <use xlinkHref="#ecosystem__sales-orders" />
              </svg>
            </div>

            {/* B2B */}
            <div className="ecosystem-infographic__b2b ecosystem-infographic__transform ecosystem-infographic__transform--iso mobile-hover">
              <p className="ecosystem-infographic__b2b-text ecosystem-infographic__transform-fade">
                B2B<br />eCommerce Store
              </p>
              <svg className="ecosystem-infographic__b2b-screen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 175 130">
                <use xlinkHref="#ecosystem__b2b" />
              </svg>
            </div>

            {/* E-commerce */}
            <div className="ecosystem-infographic__ecommerce ecosystem-infographic__transform ecosystem-infographic__transform--iso mobile-hover">
              <p className="ecosystem-infographic__ecommerce-text ecosystem-infographic__transform-fade">
                eCommerce<br />integrations
              </p>
              <svg className="ecosystem-infographic__ecommerce-screen" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 175 130">
                <use xlinkHref="#ecosystem__ecommerce" />
              </svg>
            </div>

            {/* Shipping */}
            <div className="ecosystem-infographic__shipping ecosystem-infographic__transform mobile-hover">
              <p className="ecosystem-infographic__shipping-text ecosystem-infographic__transform-fade">
                Shipping<br />integrations
              </p>
              <svg className="ecosystem-infographic__shipping-truck" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136 121">
                <use xlinkHref="#ecosystem__shipping" />
              </svg>
            </div>

            {/* Warehouses */}
            <div className="ecosystem-infographic__warehouses ecosystem-infographic__transform mobile-hover">
              <p className="ecosystem-infographic__warehouses-text ecosystem-infographic__transform-fade">
                Warehouses
              </p>
              <svg className="ecosystem-infographic__warehouses-building" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 145 115">
                <use xlinkHref="#ecosystem__warehouses" />
              </svg>
            </div>

            {/* SVG Definitions */}
            <div className="svg-defs">
              <svg xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <g id="ecosystem__tradegecko">
                    <rect width="240" height="180" rx="8" fill="#1c4561" />
                    <rect x="10" y="10" width="220" height="140" rx="4" fill="#f0f0f0" />
                    <rect x="20" y="20" width="60" height="40" rx="2" fill="#4CAF50" />
                    <rect x="90" y="20" width="60" height="40" rx="2" fill="#2196F3" />
                    <rect x="160" y="20" width="60" height="40" rx="2" fill="#FF9800" />
                    <rect x="20" y="70" width="60" height="40" rx="2" fill="#9C27B0" />
                    <rect x="90" y="70" width="60" height="40" rx="2" fill="#F44336" />
                    <rect x="160" y="70" width="60" height="40" rx="2" fill="#607D8B" />
                    <rect x="80" y="190" width="80" height="20" rx="10" fill="#1c4561" />
                    <text x="120" y="205" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">FERTILIZER MANAGER</text>
                  </g>

                  <g id="ecosystem__purchase-orders">
                    <rect width="66" height="85" rx="4" fill="#6c7279" />
                    <rect x="5" y="5" width="56" height="65" rx="2" fill="white" />
                    <rect x="10" y="10" width="46" height="4" fill="#6c7279" />
                    <rect x="10" y="18" width="30" height="3" fill="#6c7279" />
                    <rect x="10" y="25" width="40" height="3" fill="#6c7279" />
                    <rect x="10" y="32" width="35" height="3" fill="#6c7279" />
                  </g>

                  <g id="ecosystem__mobile">
                    <rect width="114" height="75" rx="8" fill="#1c4561" />
                    <rect x="8" y="8" width="98" height="59" rx="4" fill="#f0f0f0" />
                    <rect x="15" y="15" width="84" height="45" rx="2" fill="#4CAF50" />
                    <circle cx="57" cy="45" r="8" fill="white" />
                    <text x="57" y="49" textAnchor="middle" fill="#4CAF50" fontSize="8" fontWeight="bold">📱</text>
                  </g>

                  <g id="ecosystem__suppliers">
                    <rect width="97" height="100" fill="#968065" />
                    <polygon points="48.5,0 0,30 97,30" fill="#7a6b56" />
                    <rect x="10" y="40" width="15" height="15" fill="#f4d03f" />
                    <rect x="72" y="40" width="15" height="15" fill="#f4d03f" />
                    <rect x="35" y="70" width="27" height="30" fill="#5d4e37" />
                    <rect x="20" y="110" width="57" height="22" fill="#968065" />
                    <text x="48.5" y="125" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">SUPPLIERS</text>
                  </g>

                  <g id="ecosystem__payment-screen">
                    <rect width="136" height="108" rx="4" fill="#1c4561" />
                    <rect x="5" y="5" width="126" height="88" rx="2" fill="#f0f0f0" />
                    <rect x="15" y="15" width="106" height="68" rx="2" fill="#4CAF50" />
                    <text x="68" y="55" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">💳 PAY</text>
                  </g>

                  <g id="ecosystem__payment-card">
                    <rect width="65" height="41" rx="4" fill="#2196F3" />
                    <rect x="5" y="15" width="55" height="3" fill="black" />
                    <text x="32.5" y="35" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">CARD</text>
                  </g>

                  <g id="ecosystem__accounting">
                    <rect width="136" height="101" rx="4" fill="#429bce" />
                    <rect x="5" y="5" width="126" height="81" rx="2" fill="#f0f0f0" />
                    <rect x="15" y="15" width="30" height="20" fill="#429bce" />
                    <rect x="50" y="15" width="30" height="20" fill="#429bce" />
                    <rect x="85" y="15" width="30" height="20" fill="#429bce" />
                    <rect x="15" y="40" width="100" height="3" fill="#429bce" />
                    <rect x="15" y="48" width="80" height="3" fill="#429bce" />
                    <rect x="15" y="56" width="90" height="3" fill="#429bce" />
                  </g>

                  <g id="ecosystem__sales-orders">
                    <rect width="66" height="85" rx="4" fill="#6c7279" />
                    <rect x="5" y="5" width="56" height="65" rx="2" fill="white" />
                    <rect x="10" y="10" width="46" height="4" fill="#6c7279" />
                    <rect x="10" y="18" width="30" height="3" fill="#6c7279" />
                    <rect x="10" y="25" width="40" height="3" fill="#6c7279" />
                    <rect x="10" y="32" width="35" height="3" fill="#6c7279" />
                    <rect x="10" y="45" width="46" height="4" fill="#6c7279" />
                    <rect x="10" y="53" width="30" height="3" fill="#6c7279" />
                  </g>

                  <g id="ecosystem__b2b">
                    <rect width="136" height="101" rx="4" fill="#a058b8" />
                    <rect x="5" y="5" width="126" height="81" rx="2" fill="#f0f0f0" />
                    <rect x="15" y="15" width="106" height="25" fill="#a058b8" />
                    <rect x="15" y="45" width="30" height="30" fill="#a058b8" />
                    <rect x="50" y="45" width="30" height="30" fill="#a058b8" />
                    <rect x="85" y="45" width="30" height="30" fill="#a058b8" />
                    <text x="68" y="30" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">B2B STORE</text>
                  </g>

                  <g id="ecosystem__ecommerce">
                    <rect width="136" height="101" rx="4" fill="#54b218" />
                    <rect x="5" y="5" width="126" height="81" rx="2" fill="#f0f0f0" />
                    <rect x="15" y="15" width="106" height="25" fill="#54b218" />
                    <rect x="15" y="45" width="30" height="30" fill="#54b218" />
                    <rect x="50" y="45" width="30" height="30" fill="#54b218" />
                    <rect x="85" y="45" width="30" height="30" fill="#54b218" />
                    <text x="68" y="30" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">ONLINE STORE</text>
                  </g>

                  <g id="ecosystem__shipping">
                    <rect width="80" height="60" fill="#f6574d" />
                    <rect x="50" y="0" width="30" height="45" fill="#d32f2f" />
                    <rect x="55" y="5" width="20" height="20" fill="#90caf9" />
                    <circle cx="15" cy="55" r="8" fill="#424242" />
                    <circle cx="65" cy="55" r="8" fill="#424242" />
                    <rect x="10" y="10" width="35" height="30" fill="#ffcdd2" />
                    <text x="27.5" y="28" textAnchor="middle" fill="#f6574d" fontSize="6" fontWeight="bold">CARGO</text>
                  </g>

                  <g id="ecosystem__warehouses">
                    <rect width="113" height="89" fill="#5960ce" />
                    <rect x="10" y="10" width="20" height="15" fill="white" />
                    <rect x="83" y="10" width="20" height="15" fill="white" />
                    <rect x="15" y="35" width="83" height="3" fill="#3f51b5" />
                    <rect x="15" y="42" width="83" height="3" fill="#3f51b5" />
                    <rect x="15" y="49" width="83" height="3" fill="#3f51b5" />
                    <rect x="80" y="60" width="8" height="8" fill="#3f51b5" />
                    <rect x="90" y="60" width="8" height="8" fill="#3f51b5" />
                    <rect x="80" y="70" width="8" height="8" fill="#3f51b5" />
                    <text x="56.5" y="82" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">WAREHOUSE</text>
                  </g>

                  <g id="ecosystem__man-1">
                    <circle cx="12.5" cy="15" r="8" fill="#fdbcb4" />
                    <rect x="8" y="25" width="9" height="20" fill="#2196F3" />
                    <rect x="6" y="45" width="4" height="15" fill="#8D6E63" />
                    <rect x="15" y="45" width="4" height="15" fill="#8D6E63" />
                    <rect x="5" y="60" width="6" height="4" fill="#424242" />
                    <rect x="14" y="60" width="6" height="4" fill="#424242" />
                  </g>

                  <g id="ecosystem__lady-1">
                    <circle cx="12.5" cy="15" r="8" fill="#fdbcb4" />
                    <rect x="8" y="25" width="9" height="20" fill="#E91E63" />
                    <rect x="6" y="45" width="4" height="15" fill="#fdbcb4" />
                    <rect x="15" y="45" width="4" height="15" fill="#fdbcb4" />
                    <rect x="5" y="60" width="6" height="4" fill="#f44336" />
                    <rect x="14" y="60" width="6" height="4" fill="#f44336" />
                  </g>

                  <g id="ecosystem__lady-2">
                    <circle cx="12.5" cy="15" r="8" fill="#fdbcb4" />
                    <rect x="8" y="25" width="9" height="20" fill="#9C27B0" />
                    <rect x="6" y="45" width="4" height="15" fill="#fdbcb4" />
                    <rect x="15" y="45" width="4" height="15" fill="#fdbcb4" />
                    <rect x="5" y="60" width="6" height="4" fill="#673AB7" />
                    <rect x="14" y="60" width="6" height="4" fill="#673AB7" />
                  </g>

                  <g id="ecosystem__arrows">
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                      </marker>
                      <marker id="arrowhead-green" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                      </marker>
                      <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                      </marker>
                      <marker id="arrowhead-purple" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#8b5cf6" />
                      </marker>
                    </defs>

                    <path d="M 340 120 Q 380 140 420 180" stroke="#10b981" strokeWidth="3" fill="none" strokeDasharray="8,4" markerEnd="url(#arrowhead-green)" opacity="0.8">
                      <animate attributeName="stroke-dashoffset" values="0;-12;0" dur="3s" repeatCount="indefinite" />
                    </path>

                    <path d="M 480 200 Q 520 160 560 140" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="6,3" markerEnd="url(#arrowhead-blue)" opacity="0.7">
                      <animate attributeName="stroke-dashoffset" values="0;-9;0" dur="2.5s" repeatCount="indefinite" />
                    </path>

                    <path d="M 520 240 Q 580 250 640 260" stroke="#8b5cf6" strokeWidth="3" fill="none" strokeDasharray="8,4" markerEnd="url(#arrowhead-purple)" opacity="0.8">
                      <animate attributeName="stroke-dashoffset" values="0;-12;0" dur="2.8s" repeatCount="indefinite" />
                    </path>

                    <path d="M 700 240 Q 720 220 740 200" stroke="#ef4444" strokeWidth="3" fill="none" strokeDasharray="8,4" markerEnd="url(#arrowhead)" opacity="0.8">
                      <animate attributeName="stroke-dashoffset" values="0;-12;0" dur="3.2s" repeatCount="indefinite" />
                    </path>

                    <path d="M 450 320 Q 480 380 520 420" stroke="#10b981" strokeWidth="2" fill="none" strokeDasharray="6,3" markerEnd="url(#arrowhead-green)" opacity="0.7">
                      <animate attributeName="stroke-dashoffset" values="0;-9;0" dur="2.2s" repeatCount="indefinite" />
                    </path>

                    <path d="M 580 440 Q 620 430 660 420" stroke="#a855f7" strokeWidth="2" fill="none" strokeDasharray="6,3" markerEnd="url(#arrowhead)" opacity="0.7">
                      <animate attributeName="stroke-dashoffset" values="0;-9;0" dur="2.7s" repeatCount="indefinite" />
                    </path>

                    <path d="M 720 400 Q 780 380 820 360" stroke="#64748b" strokeWidth="2" fill="none" strokeDasharray="6,3" markerEnd="url(#arrowhead)" opacity="0.7">
                      <animate attributeName="stroke-dashoffset" values="0;-9;0" dur="2.4s" repeatCount="indefinite" />
                    </path>

                    <path d="M 240 280 Q 300 260 360 250" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="6,3" markerEnd="url(#arrowhead-blue)" opacity="0.7">
                      <animate attributeName="stroke-dashoffset" values="0;-9;0" dur="2.6s" repeatCount="indefinite" />
                    </path>

                    <path d="M 380 320 Q 320 380 280 420" stroke="#06b6d4" strokeWidth="2" fill="none" strokeDasharray="6,3" markerEnd="url(#arrowhead)" opacity="0.7">
                      <animate attributeName="stroke-dashoffset" values="0;-9;0" dur="2.9s" repeatCount="indefinite" />
                    </path>

                    <path d="M 580 340 Q 540 320 500 300" stroke="#10b981" strokeWidth="2" fill="none" strokeDasharray="6,3" markerEnd="url(#arrowhead-green)" opacity="0.7">
                      <animate attributeName="stroke-dashoffset" values="0;-9;0" dur="2.1s" repeatCount="indefinite" />
                    </path>
                  </g>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Authentic TradeGecko CSS Styles */}
      <style jsx>{`
        .ecosystem-infographic-container {
          position: relative;
          width: 92vw;
          min-width: 1100px;
          max-width: 1170px;
          margin: 0 auto;
          background: white;
        }

        .ecosystem-infographic-wrapper {
          position: relative;
          width: 0;
          height: 0;
          padding: ${(50 * 555/940)}% 50%;
        }

        .ecosystem-infographic {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .ecosystem-infographic__tradegecko {
          position: absolute;
          left: ${((349 + -65) / 940) * 100}%;
          top: ${((230 + -85) / 555) * 100}%;
          width: ${(240 / 940) * 100}%;
          height: ${(281 / 555) * 100}%;
        }

        .ecosystem-infographic__tradegecko-text {
          position: absolute;
          bottom: ${(230 / 281) * 100}%;
          right: ${(165 / 240) * 100}%;
          color: #1c4561;
          transform-origin: 100% 50%;
        }

        .ecosystem-infographic__purchase-orders {
          position: absolute;
          left: ${((590 + -65) / 940) * 100}%;
          top: ${((120 + -85) / 555) * 100}%;
          width: ${(66 / 940) * 100}%;
          height: ${(85 / 555) * 100}%;
        }

        .ecosystem-infographic__mobile {
          position: absolute;
          left: ${((547 + -65) / 940) * 100}%;
          top: ${((343 + -85) / 555) * 100}%;
          width: ${(114 / 940) * 100}%;
          height: ${(75 / 555) * 100}%;
        }

        .ecosystem-infographic__suppliers {
          position: absolute;
          left: ${((405 + -65) / 940) * 100}%;
          top: ${((105 + -85) / 555) * 100}%;
          width: ${(97 / 940) * 100}%;
          height: ${(132 / 555) * 100}%;
        }

        .ecosystem-infographic__arrows {
          position: absolute;
          top: ${((130 + -85) / 555) * 100}%;
          left: ${((230 + -65) / 940) * 100}%;
          width: ${(700 / 940) * 100}%;
          height: ${(489 / 555) * 100}%;
          pointer-events: none;
        }

        .ecosystem-infographic__payment {
          position: absolute;
          top: ${((250 + -85) / 555) * 100}%;
          left: ${((130 + -65) / 940) * 100}%;
          height: ${(130 / 555) * 100}%;
          width: ${(170 / 940) * 100}%;
        }

        .ecosystem-infographic__accounting {
          position: absolute;
          top: ${((480 + -85) / 555) * 100}%;
          left: ${((163 + -65) / 940) * 100}%;
          width: ${(136 / 940) * 100}%;
          height: ${(101 / 555) * 100}%;
        }

        .ecosystem-infographic__ecommerce {
          position: absolute;
          left: ${((534 + -65) / 940) * 100}%;
          top: ${((488 + -85) / 555) * 100}%;
          width: ${(136 / 940) * 100}%;
          height: ${(101 / 555) * 100}%;
        }

        .ecosystem-infographic__b2b {
          position: absolute;
          left: ${((673 + -65) / 940) * 100}%;
          top: ${((408 + -85) / 555) * 100}%;
          width: ${(136 / 940) * 100}%;
          height: ${(101 / 555) * 100}%;
        }

        .ecosystem-infographic__sales-orders {
          position: absolute;
          left: ${((843 + -65) / 940) * 100}%;
          top: ${((344 + -85) / 555) * 100}%;
          width: ${(66 / 940) * 100}%;
          height: ${(85 / 555) * 100}%;
        }

        .ecosystem-infographic__shipping {
          position: absolute;
          left: ${((730 + -65) / 940) * 100}%;
          top: ${((185 + -85) / 555) * 100}%;
          width: ${(106 / 940) * 100}%;
          height: ${(94 / 555) * 100}%;
        }

        .ecosystem-infographic__warehouses {
          position: absolute;
          left: ${((648 + -65) / 940) * 100}%;
          top: ${((255 + -85) / 555) * 100}%;
          width: ${(113 / 940) * 100}%;
          height: ${(89 / 555) * 100}%;
        }

        .ecosystem-infographic__man-1 {
          position: absolute;
          left: ${((650 + -65) / 940) * 100}%;
          top: ${((571 + -85) / 555) * 100}%;
          width: ${(19 / 940) * 100}%;
          height: ${(54 / 555) * 100}%;
        }

        .ecosystem-infographic__lady-1 {
          position: absolute;
          left: ${((787 + -65) / 940) * 100}%;
          top: ${((490 + -85) / 555) * 100}%;
          width: ${(19 / 940) * 100}%;
          height: ${(54 / 555) * 100}%;
        }

        .ecosystem-infographic__lady-2 {
          position: absolute;
          left: ${((927 + -65) / 940) * 100}%;
          top: ${((413 + -85) / 555) * 100}%;
          width: ${(19 / 940) * 100}%;
          height: ${(54 / 555) * 100}%;
        }

        .ecosystem-infographic__transform {
          transform-origin: 50% 50%;
          transition-property: transform, filter, opacity;
          transition-timing-function: ease-out;
          transition-duration: 0.1s;
          transition-delay: 0.1s;
        }

        .ecosystem-infographic__transform--iso {
          transform: rotate(-30deg) skewX(-30deg) scaleY(0.86);
        }

        .ecosystem-infographic__transform svg {
          position: absolute;
        }

        .ecosystem-infographic__transform-fade {
          padding: 10px;
          margin: 0;
          margin-bottom: -10px;
          white-space: pre;
          background: rgba(255, 255, 255, 0.8);
          transform: scaleX(0);
          transition: transform 0.1s;
          pointer-events: none;
        }

        p {
          font-size: ${16 / (1 + 0.3)}px;
          line-height: 1.4;
        }

        .ecosystem-infographic__transform--half p {
          font-size: ${16 / (1 + 0.3 / 2)}px;
        }

        .ecosystem-infographic:hover .ecosystem-infographic__transform,
        .ecosystem-infographic.mobile-hovering .ecosystem-infographic__transform {
          opacity: 0.9;
          transition-duration: 0.1s;
        }

        .ecosystem-infographic:hover .ecosystem-infographic__transform:hover,
        .ecosystem-infographic:hover .ecosystem-infographic__transform.mobile-hovering,
        .ecosystem-infographic.mobile-hovering .ecosystem-infographic__transform:hover,
        .ecosystem-infographic.mobile-hovering .ecosystem-infographic__transform.mobile-hovering {
          z-index: 1;
          transform: scale(${1 + 0.3});
          filter: grayscale(0);
          transition-delay: 0s;
          opacity: 1;
          transition: transform cubic-bezier(.3,.01,.31,0),
                      filter ease,
                      opacity ease;
          transition-duration: 0.1s;
        }

        .ecosystem-infographic__transform--half:hover,
        .ecosystem-infographic__transform--half.mobile-hovering {
          transform: scale(${1 + (0.3 / 2)});
        }

        .ecosystem-infographic:hover .ecosystem-infographic__transform:hover .ecosystem-infographic__transform-fade,
        .ecosystem-infographic:hover .ecosystem-infographic__transform.mobile-hovering .ecosystem-infographic__transform-fade,
        .ecosystem-infographic.mobile-hovering .ecosystem-infographic__transform:hover .ecosystem-infographic__transform-fade,
        .ecosystem-infographic.mobile-hovering .ecosystem-infographic__transform.mobile-hovering .ecosystem-infographic__transform-fade {
          transition-delay: 0.1s;
          transform: scaleX(1);
          pointer-events: auto;
        }

        .svg-defs {
          position: absolute;
          visibility: hidden;
          top: 0;
          left: 0;
          width: 0;
          height: 0;
          pointer-events: none;
        }

        /* Arrow flow animations */
        .ecosystem-infographic__arrows path {
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
        }

        .ecosystem-infographic__arrows path:hover {
          stroke-width: 4;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        /* Enhanced hover effects for better UX */
        .ecosystem-infographic__transform:hover {
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
        }

        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .ecosystem-infographic-container {
            min-width: 800px;
            max-width: 900px;
          }
        }

        @media (max-width: 900px) {
          .ecosystem-infographic-container {
            min-width: 600px;
            max-width: 700px;
          }

          .ecosystem-infographic__arrows path {
            stroke-width: 2;
          }
        }
      `}</style>
    </div>
  );
};

export default AnimatedHero;
