import React, { useEffect, useRef } from 'react';

const LottieHero = () => {
  const containerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // Dynamically import Lottie to avoid SSR issues
    const loadLottie = async () => {
      try {
        const lottie = await import('lottie-web');

        if (containerRef.current && !animationRef.current) {
          animationRef.current = lottie.default.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: '/business-investor-gaining-profit-from-investment.json',
            rendererSettings: {
              preserveAspectRatio: 'xMidYMid slice',
              clearCanvas: false,
              progressiveLoad: false,
              hideOnTransparent: true
            }
          });

          // Ensure transparent background
          if (containerRef.current) {
            containerRef.current.style.backgroundColor = 'transparent';
          }
        }
      } catch (error) {
        console.error('Failed to load Lottie animation:', error);
      }
    };

    loadLottie();

    // Cleanup function
    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-1/2 h-screen bg-gradient-to-br from-slate-900/20 via-gray-900/30 to-black/40 overflow-hidden flex items-center justify-center">
      {/* Dark Glass Effect Background */}
      <div className="absolute inset-0 bg-black/5 backdrop-blur-sm"></div>

      {/* Lottie Animation Container */}
      <div
        ref={containerRef}
        className="w-full max-w-lg h-96 z-10 lottie-container"
        style={{
          filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3))',
          background: 'transparent',
          mixBlendMode: 'screen',
        }}
      />

      {/* Fallback content if Lottie fails to load */}
      <div className="absolute inset-0 flex items-center justify-center z-5">
        <div className="text-center opacity-30">
          <div className="w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 mx-auto border border-white/20">
            <svg className="w-16 h-16 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Loading animation...</p>
        </div>
      </div>

      {/* Overlay Text */}
      <div className="absolute bottom-8 left-8 right-8 text-center text-white z-20">
        <h2 className="text-4xl font-bold mb-4" style={{
          animation: 'fadeInUp 1s ease-out'
        }}>Welcome to Krishisethu</h2>
        <p className="text-xl opacity-90" style={{
          animation: 'fadeInUp 1s ease-out 0.5s both'
        }}>Modern Inventory Management for Agriculture</p>
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/40 to-transparent z-5"></div>

      {/* Corner accent lights */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-tr-full"></div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default LottieHero;
