// Utility to generate KS logos programmatically
export const generateKSLogo = (size = 512) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.45;
  
  // Clear canvas
  ctx.clearRect(0, 0, size, size);
  
  // Draw background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = '#16a34a';
  ctx.fill();
  
  // Draw inner circle for depth
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.85, 0, 2 * Math.PI);
  ctx.fillStyle = '#22c55e';
  ctx.globalAlpha = 0.8;
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // Draw KS text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.35}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('KS', centerX, centerY);
  
  // Add small wheat decoration if size is large enough
  if (size >= 64) {
    ctx.fillStyle = '#fbbf24';
    ctx.globalAlpha = 0.6;
    
    const wheatSize = size * 0.03;
    
    // Top wheat
    ctx.beginPath();
    ctx.moveTo(centerX, radius * 0.3);
    ctx.lineTo(centerX - wheatSize, radius * 0.5);
    ctx.lineTo(centerX + wheatSize, radius * 0.5);
    ctx.closePath();
    ctx.fill();
    
    // Bottom wheat
    ctx.beginPath();
    ctx.moveTo(centerX, size - radius * 0.3);
    ctx.lineTo(centerX - wheatSize, size - radius * 0.5);
    ctx.lineTo(centerX + wheatSize, size - radius * 0.5);
    ctx.closePath();
    ctx.fill();
    
    // Left wheat
    ctx.beginPath();
    ctx.moveTo(radius * 0.3, centerY);
    ctx.lineTo(radius * 0.5, centerY - wheatSize);
    ctx.lineTo(radius * 0.5, centerY + wheatSize);
    ctx.closePath();
    ctx.fill();
    
    // Right wheat
    ctx.beginPath();
    ctx.moveTo(size - radius * 0.3, centerY);
    ctx.lineTo(size - radius * 0.5, centerY - wheatSize);
    ctx.lineTo(size - radius * 0.5, centerY + wheatSize);
    ctx.closePath();
    ctx.fill();
    
    ctx.globalAlpha = 1;
  }
  
  return canvas;
};

export const downloadCanvasAsImage = (canvas, filename) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export const generateAllLogos = () => {
  // Generate different sizes
  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 192, name: 'logo192.png' },
    { size: 512, name: 'logo512.png' }
  ];
  
  sizes.forEach(({ size, name }) => {
    const canvas = generateKSLogo(size);
    downloadCanvasAsImage(canvas, name);
  });
};

// Function to replace logos in the public folder (for development)
export const replaceLogosInPublic = async () => {
  const sizes = [192, 512];
  
  for (const size of sizes) {
    const canvas = generateKSLogo(size);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    
    // This would need to be handled by a build script or manually
    console.log(`Generated ${size}x${size} logo blob:`, blob);
  }
};
