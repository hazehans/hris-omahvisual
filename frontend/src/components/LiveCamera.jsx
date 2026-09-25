import React, { useRef, useState, useCallback } from 'react';

const LiveCamera = ({ onCapture, required = false }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [photoData, setPhotoData] = useState(null);
  const [error, setError] = useState(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error('Camera access denied:', err);
      setError('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin akses kamera.');
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhotoData(dataUrl);
      onCapture(dataUrl);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setPhotoData(null);
    onCapture(null);
    startCamera();
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Foto Bukti {required && <span className="text-red-500">*</span>}
        </label>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

      {!photoData ? (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
          {!stream ? (
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Buka Kamera
            </button>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={capturePhoto}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full border-4 border-blue-500 shadow-lg"
              />
            </>
          )}
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden bg-black aspect-[3/4]">
          <img src={photoData} alt="Captured" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={retakePhoto}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white text-gray-800 rounded-md text-sm font-medium shadow-lg"
          >
            Ulangi Foto
          </button>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default LiveCamera;

