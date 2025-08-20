// Barcode Service - Handle barcode scanning for quick product addition

import React from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';

class BarcodeService {
  constructor() {
    this.codeReader = new BrowserMultiFormatReader();
    this.isScanning = false;
    this.stream = null;
    this.listeners = new Set();
  }

  // Start barcode scanning using device camera
  async startScanning(videoElement) {
    try {
      if (this.isScanning) {
        console.warn('Scanning already in progress');
        return;
      }

      // Get available video devices
      const videoInputDevices = await this.codeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      // Use the first available camera (usually back camera on mobile)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      this.isScanning = true;

      // Start scanning
      await this.codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoElement,
        (result, error) => {
          if (result) {
            this.handleScanResult(result.getText());
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Barcode scanning error:', error);
          }
        }
      );

      return { success: true, message: 'Scanning started' };
    } catch (error) {
      console.error('Error starting barcode scan:', error);
      this.isScanning = false;
      return { success: false, error: error.message };
    }
  }

  // Stop barcode scanning
  stopScanning() {
    try {
      if (this.codeReader) {
        this.codeReader.reset();
      }
      this.isScanning = false;
      return { success: true, message: 'Scanning stopped' };
    } catch (error) {
      console.error('Error stopping barcode scan:', error);
      return { success: false, error: error.message };
    }
  }

  // Handle scan result
  handleScanResult(barcode) {
    console.log('Barcode scanned:', barcode);
    
    // Notify all listeners
    this.listeners.forEach(callback => {
      try {
        callback(barcode);
      } catch (error) {
        console.error('Error in barcode listener:', error);
      }
    });
  }

  // Subscribe to barcode scan events
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Find product by barcode
  async findProductByBarcode(barcode, products) {
    try {
      // Search in products array by various barcode fields
      const product = products.find(p => 
        p.barcode === barcode ||
        p.sku === barcode ||
        p.id === barcode ||
        p.hsn === barcode
      );

      if (product) {
        return {
          success: true,
          product,
          message: `Product found: ${product.name}`
        };
      }

      // If not found locally, try to search by partial match
      const partialMatch = products.find(p =>
        p.name.toLowerCase().includes(barcode.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(barcode.toLowerCase()))
      );

      if (partialMatch) {
        return {
          success: true,
          product: partialMatch,
          message: `Similar product found: ${partialMatch.name}`,
          isPartialMatch: true
        };
      }

      return {
        success: false,
        error: `No product found for barcode: ${barcode}`
      };
    } catch (error) {
      console.error('Error finding product by barcode:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Simulate barcode input (for testing without camera)
  simulateBarcodeScan(barcode) {
    console.log('Simulating barcode scan:', barcode);
    this.handleScanResult(barcode);
  }

  // Check if device supports camera
  async checkCameraSupport() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      return {
        supported: videoDevices.length > 0,
        deviceCount: videoDevices.length,
        devices: videoDevices.map(device => ({
          id: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`
        }))
      };
    } catch (error) {
      console.error('Error checking camera support:', error);
      return {
        supported: false,
        error: error.message
      };
    }
  }

  // Get scanning status
  getScanningStatus() {
    return {
      isScanning: this.isScanning,
      listenerCount: this.listeners.size
    };
  }
}

// Create singleton instance
export const barcodeService = new BarcodeService();

// React hook for barcode scanning
export const useBarcode = (onScan) => {
  const [isScanning, setIsScanning] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [cameraSupported, setCameraSupported] = React.useState(null);
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    // Check camera support on mount
    barcodeService.checkCameraSupport().then(result => {
      setCameraSupported(result.supported);
      if (!result.supported) {
        setError(result.error || 'Camera not supported');
      }
    });

    // Subscribe to barcode scans
    const unsubscribe = barcodeService.subscribe((barcode) => {
      if (onScan) {
        onScan(barcode);
      }
    });

    return () => {
      unsubscribe();
      if (isScanning) {
        barcodeService.stopScanning();
      }
    };
  }, [onScan, isScanning]);

  const startScanning = async () => {
    if (!videoRef.current) {
      setError('Video element not available');
      return;
    }

    setError(null);
    const result = await barcodeService.startScanning(videoRef.current);
    
    if (result.success) {
      setIsScanning(true);
    } else {
      setError(result.error);
    }
  };

  const stopScanning = () => {
    const result = barcodeService.stopScanning();
    setIsScanning(false);
    
    if (!result.success) {
      setError(result.error);
    }
  };

  return {
    videoRef,
    isScanning,
    error,
    cameraSupported,
    startScanning,
    stopScanning
  };
};

// Keyboard barcode scanner support (for USB barcode scanners)
export class KeyboardBarcodeScanner {
  constructor(onScan, options = {}) {
    this.onScan = onScan;
    this.buffer = '';
    this.timeout = options.timeout || 100; // ms between characters
    this.minLength = options.minLength || 3;
    this.maxLength = options.maxLength || 50;
    this.timeoutId = null;
    this.isActive = false;

    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    document.addEventListener('keypress', this.handleKeyPress);
    console.log('Keyboard barcode scanner started');
  }

  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    document.removeEventListener('keypress', this.handleKeyPress);
    this.clearBuffer();
    console.log('Keyboard barcode scanner stopped');
  }

  handleKeyPress(event) {
    // Ignore if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    const char = event.key;

    // Enter key indicates end of barcode
    if (char === 'Enter') {
      this.processScan();
      return;
    }

    // Add character to buffer
    this.buffer += char;

    // Clear existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Set new timeout to process scan
    this.timeoutId = setTimeout(() => {
      this.processScan();
    }, this.timeout);
  }

  processScan() {
    if (this.buffer.length >= this.minLength && this.buffer.length <= this.maxLength) {
      console.log('Keyboard barcode scanned:', this.buffer);
      if (this.onScan) {
        this.onScan(this.buffer);
      }
    }
    this.clearBuffer();
  }

  clearBuffer() {
    this.buffer = '';
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

export default barcodeService;
