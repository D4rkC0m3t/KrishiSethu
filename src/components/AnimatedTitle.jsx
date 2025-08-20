import React, { useState, useEffect } from 'react';

const AnimatedTitle = ({ 
  text = "KrishiSethu", 
  className = "",
  speed = 100,
  showCursor = true 
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (currentIndex < text.length && isTyping) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && isTyping) {
      // Finished typing, wait a bit then start over
      const timeout = setTimeout(() => {
        setIsTyping(false);
        setCurrentIndex(text.length);
      }, 2000);

      return () => clearTimeout(timeout);
    } else if (!isTyping && currentIndex > 0) {
      // Backspace effect
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev.slice(0, -1));
        setCurrentIndex(prev => prev - 1);
      }, speed / 2);

      return () => clearTimeout(timeout);
    } else if (!isTyping && currentIndex === 0) {
      // Start typing again
      const timeout = setTimeout(() => {
        setIsTyping(true);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, isTyping, text, speed]);

  return (
    <div className={`font-bold ${className}`}>
      <span>{displayText}</span>
      {showCursor && (
        <span className="animate-pulse">|</span>
      )}
    </div>
  );
};

// Predefined animated titles for different contexts
export const WelcomeTitle = ({ className = "" }) => (
  <AnimatedTitle 
    text="Welcome to KrishiSethu"
    className={`text-4xl text-green-600 ${className}`}
    speed={80}
  />
);

export const LoadingTitle = ({ className = "" }) => (
  <AnimatedTitle 
    text="Loading..."
    className={`text-2xl text-blue-600 ${className}`}
    speed={150}
  />
);

export const BrandTitle = ({ className = "" }) => (
  <AnimatedTitle 
    text="KrishiSethu"
    className={`text-3xl text-green-700 ${className}`}
    speed={120}
  />
);

export const SuccessTitle = ({ className = "" }) => (
  <AnimatedTitle 
    text="Success!"
    className={`text-2xl text-green-600 ${className}`}
    speed={100}
  />
);

export default AnimatedTitle;
