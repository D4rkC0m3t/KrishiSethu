import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Camera, X, RotateCcw, Flashlight, FlashlightOff } from 'lucide-react';
const BarcodeScanner = ({ onScan, onClose, isOpen }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const codeReaderRef = useRef(null);

  // Initialize barcode reader
  useEffect(() => {
    if (isOpen) {
      initializeBarcodeReader();
      getVideoDevices();
    }
    
    return () => {
      stopScanning();
    };
  }, [isOpen]);

  const initializeBarcodeReader = async () => {
    try {
      // Dynamic import to avoid issues with SSR
      const { BrowserMultiFormatReader } = await import('@zxing/library');
      codeReaderRef.current = new BrowserMultiFormatReader();
      console.log('[BarcodeScanner] ZXing library loaded successfully');
    } catch (error) {
      console.error('[BarcodeScanner] Error loading ZXing library:', error);
      setError('Failed to load barcode scanning library');
    }
  };

  const getVideoDevices = async () => {
    try {
      const videoDevices = await codeReaderRef.current?.listVideoInputDevices();
      if (videoDevices && videoDevices.length > 0) {
        setDevices(videoDevices);
        setSelectedDevice(videoDevices[0].deviceId);
        console.log(`[BarcodeScanner] Found ${videoDevices.length} video devices`);
      } else {
        setError('No camera devices found');
      }
    } catch (error) {
      console.error('[BarcodeScanner] Error getting video devices:', error);
      setError('Failed to access camera devices');
    }
  };

  const startScanning = async () => {
    if (!codeReaderRef.current || !videoRef.current) {
      setError('Scanner not initialized');
      return;
    }

    try {
      setError(null);
      setIsScanning(true);

      // Stop any existing stream
      stopScanning();

      console.log('[BarcodeScanner] Starting camera scan...');

      // Start decoding from video device
      const result = await codeReaderRef.current.decodeFromVideoDevice(
        selectedDevice,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedCode = result.getText();
            console.log('[BarcodeScanner] Barcode detected:', scannedCode);
            
            // Add to scan history
            setScanHistory(prev => [{
              code: scannedCode,
              timestamp: new Date().toLocaleTimeString(),
              format: result.getBarcodeFormat()
            }, ...prev.slice(0, 4)]); // Keep last 5 scans
            
            // Call the onScan callback
            if (onScan) {
              onScan(scannedCode);
            }
            
            // Auto-close after successful scan
            setTimeout(() => {
              stopScanning();
              if (onClose) onClose();
            }, 1000);
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.warn('[BarcodeScanner] Scan error:', error);
          }
        }
      );

      streamRef.current = result;
      console.log('[BarcodeScanner] Camera scanning started successfully');
    } catch (error) {
      console.error('[BarcodeScanner] Error starting scan:', error);
      setError(`Failed to start camera: ${error.message}`);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    try {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks?.().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      setIsScanning(false);
      console.log('[BarcodeScanner] Scanning stopped');
    } catch (error) {
      console.error('[BarcodeScanner] Error stopping scan:', error);
    }
  };

  const switchCamera = async () => {
    const currentIndex = devices.findIndex(device => device.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDevice = devices[nextIndex];
    
    setSelectedDevice(nextDevice.deviceId);
    
    if (isScanning) {
      stopScanning();
      setTimeout(() => startScanning(), 500);
    }
  };

  const toggleFlash = async () => {
    try {
      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !flashEnabled }]
          });
          setFlashEnabled(!flashEnabled);
        } else {
          setError('Flash not supported on this device');
        }
      }
    } catch (error) {
      console.error('[BarcodeScanner] Error toggling flash:', error);
      setError('Failed to toggle flash');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Barcode Scanner</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                stopScanning();
                if (onClose) onClose();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Camera Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-blue-500 w-48 h-32 rounded-lg animate-pulse">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                </div>
              </div>
            )}
            
            {/* Status overlay */}
            <div className="absolute top-2 left-2">
              <Badge variant={isScanning ? "default" : "secondary"}>
                {isScanning ? "Scanning..." : "Ready"}
              </Badge>
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              onClick={isScanning ? stopScanning : startScanning}
              disabled={!codeReaderRef.current || !selectedDevice}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              {isScanning ? 'Stop' : 'Start'} Scan
            </Button>
            
            {devices.length > 1 && (
              <Button
                variant="outline"
                onClick={switchCamera}
                disabled={isScanning}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={toggleFlash}
              disabled={!isScanning}
            >
              {flashEnabled ? (
                <FlashlightOff className="h-4 w-4" />
              ) : (
                <Flashlight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Device selection */}
          {devices.length > 1 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Camera:</label>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                disabled={isScanning}
                className="w-full p-2 border rounded-md text-sm"
              >
                {devices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Recent Scans:</label>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {scanHistory.map((scan, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded flex justify-between">
                    <span className="font-mono">{scan.code}</span>
                    <span className="text-gray-500">{scan.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-600 text-center">
            Position the barcode within the scanning area. The scanner will automatically detect and process barcodes.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarcodeScanner;
