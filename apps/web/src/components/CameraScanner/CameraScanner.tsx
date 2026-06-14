import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { Videocam, VideocamOff, CheckCircle, ErrorOutline } from '@mui/icons-material';
import { Decoder } from '@nuintun/qrcode';
import { useI18n } from '../../i18n';
import { parseEncFromUrl } from '../../services/signHelper';

interface CameraScannerProps {
  onScan: (enc: string) => void;
  autoLoop: boolean;
  disabled?: boolean;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, autoLoop, disabled }) => {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastScannedRef = useRef<string>('');

  const [isActive, setIsActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'fail'>('idle');

  const startCamera = useCallback(async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsActive(true);
      setScanStatus('scanning');
    } catch (e: any) {
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setCameraError(t('sign.cameraDenied'));
      } else {
        setCameraError('Camera not available');
      }
    }
  }, [t]);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsActive(false);
    setScanStatus('idle');
  }, []);

  // QR scanning loop
  useEffect(() => {
    if (!isActive) return;

    const decoder = new Decoder();
    let running = true;

    const scan = async () => {
      if (!running) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(scan);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const result = await decoder.scan(dataUrl);
        if (result && result.data) {
          const enc = parseEncFromUrl(result.data);
          if (enc && enc !== lastScannedRef.current) {
            lastScannedRef.current = enc;
            setScanStatus('success');
            onScan(enc);
            if (!autoLoop) stopCamera();
            // Reset after 1.5s for re-scan
            setTimeout(() => {
              lastScannedRef.current = '';
              if (autoLoop && isActive) setScanStatus('scanning');
            }, 1500);
          }
        }
      } catch {
        // No QR found in frame, continue
      }

      animFrameRef.current = requestAnimationFrame(scan);
    };

    // Delay first scan to let camera settle
    setTimeout(() => {
      animFrameRef.current = requestAnimationFrame(scan);
    }, 500);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isActive, autoLoop, onScan, stopCamera]);

  const toggleCamera = () => {
    if (isActive) stopCamera();
    else startCamera();
  };

  return (
    <Box>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          mx: 'auto',
          borderRadius: 3,
          overflow: 'hidden',
          border: '2px solid',
          borderColor: scanStatus === 'success'
            ? 'success.main'
            : scanStatus === 'fail'
              ? 'error.main'
              : 'divider',
          bgcolor: '#000',
          aspectRatio: '16/10',
          transition: 'border-color 300ms ease',
        }}
      >
        <video
          ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: isActive ? 'block' : 'none' }}
          playsInline
          muted
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {!isActive && !cameraError && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <VideocamOff sx={{ fontSize: 48 }} />
          </Box>
        )}

        {/* Scan overlay */}
        {isActive && scanStatus === 'scanning' && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60%',
              height: '60%',
              border: '3px dashed rgba(16, 185, 129, 0.6)',
              borderRadius: 2,
              pointerEvents: 'none',
            }}
          />
        )}

        {scanStatus === 'success' && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(16, 185, 129, 0.2)',
            }}
          >
            <CheckCircle sx={{ fontSize: 48, color: '#10B981' }} />
          </Box>
        )}
      </Box>

      {cameraError && (
        <Typography variant="body2" color="error.main" sx={{ mt: 1, textAlign: 'center' }}>
          <ErrorOutline sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
          {cameraError}
        </Typography>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Button
          variant={isActive ? 'outlined' : 'contained'}
          onClick={toggleCamera}
          disabled={disabled}
          startIcon={isActive ? <VideocamOff /> : <Videocam />}
        >
          {isActive ? t('sign.stopCamera') : t('sign.startCamera')}
        </Button>
      </Box>
    </Box>
  );
};

export default CameraScanner;
