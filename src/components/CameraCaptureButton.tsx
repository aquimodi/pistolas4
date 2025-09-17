import React, { useState, useRef, useCallback } from 'react';
import { Camera, X, RotateCcw, Check, AlertTriangle } from 'lucide-react';

interface CameraCaptureButtonProps {
  onPhotoCapture: (photoFile: File) => void;
  className?: string;
}

const CameraCaptureButton: React.FC<CameraCaptureButtonProps> = ({ 
  onPhotoCapture, 
  className = '' 
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    setIsCapturing(true);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment' // Prefer back camera on mobile devices
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      setIsCapturing(false);
      console.error('Camera access error:', err);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
    setCapturedPhoto(null);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob and then to file
    canvas.toBlob((blob) => {
      if (blob) {
        const photoUrl = URL.createObjectURL(blob);
        setCapturedPhoto(photoUrl);
        
        // Convert blob to File object
        const file = new File([blob], `verification-photo-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        
        onPhotoCapture(file);
      }
    }, 'image/jpeg', 0.9);
  }, [onPhotoCapture]);

  const retakePhoto = useCallback(() => {
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto);
      setCapturedPhoto(null);
    }
  }, [capturedPhoto]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (capturedPhoto) {
        URL.revokeObjectURL(capturedPhoto);
      }
    };
  }, [stream, capturedPhoto]);

  if (!isCapturing) {
    return (
      <div className={`${className}`}>
        <button
          type="button"
          onClick={startCamera}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          <Camera className="h-5 w-5 mr-2" />
          Scan Equipment
        </button>
        {error && (
          <div className="mt-2 flex items-center text-red-600 text-sm">
            <AlertTriangle className="h-4 w-4 mr-1" />
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
        <div className="relative">
          {/* Video Preview */}
          {!capturedPhoto && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover rounded-lg bg-gray-900"
                autoPlay
                playsInline
                muted
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photo
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Captured Photo Preview */}
          {capturedPhoto && (
            <div className="relative">
              <img
                src={capturedPhoto}
                alt="Captured verification"
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Use Photo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="mt-2 text-center">
          <p className="text-sm text-gray-600">
            Position the equipment in the camera view and take a photo for verification
          </p>
        </div>
      </div>
    </div>
  );
};

export default CameraCaptureButton;