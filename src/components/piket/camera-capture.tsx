'use client';

import * as React from 'react';
import { Camera, RefreshCw, SwitchCamera, CheckCircle2, AlertCircle, VideoOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWibNow } from '@/lib/utils/piket';

export interface CapturedCameraPhoto {
  previewUrl: string;
  base64: string;
  sizeBytes: number;
  fileName: string;
}

interface CameraCaptureProps {
  captured: CapturedCameraPhoto | null;
  onCapture: (photo: CapturedCameraPhoto | null) => void;
  locationLabel?: string;
  disabled?: boolean;
}

export function CameraCapture({
  captured,
  onCapture,
  locationLabel,
  disabled,
}: CameraCaptureProps) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = React.useState<'user' | 'environment'>('user');
  const [cameraActive, setCameraActive] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const stopStream = React.useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = React.useCallback(
    async (mode: 'user' | 'environment') => {
      if (disabled) return;
      stopStream();
      setError(null);
      setStarting(true);

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setStarting(false);
        setError(
          'Browser atau koneksi saat ini tidak mendukung kamera langsung (pastikan membuka portal melalui HTTPS atau localhost).'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraActive(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          setError(
            'Izin kamera ditolak oleh browser. Mohon aktifkan izin kamera pada ikon gembok di bilah alamat browser, lalu tekan Coba Lagi.'
          );
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          setError('Perangkat kamera tidak ditemukan pada perangkat ini.');
        } else {
          setError('Gagal menyalakan kamera. Pastikan tidak ada aplikasi lain yang sedang menggunakan kamera.');
        }
      } finally {
        setStarting(false);
      }
    },
    [disabled, stopStream]
  );

  // Matikan stream saat komponen dilepas
  React.useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const handleSwitchCamera = () => {
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    if (cameraActive) {
      startCamera(next);
    }
  };

  const handleSnap = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const maxWidth = 1200;
    let width = video.videoWidth;
    let height = video.videoHeight;
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Jika kamera depan, cerminkan hasil tangkapan agar natural seperti cermin sebelum menulis teks watermark
    ctx.save();
    if (facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // Tambahkan bilah timestamp & lokasi halus di bagian bawah foto sebagai bukti sah
    const barHeight = Math.max(36, Math.round(height * 0.085));
    ctx.fillStyle = 'rgba(20, 40, 32, 0.78)';
    ctx.fillRect(0, height - barHeight, width, barHeight);

    const wib = getWibNow();
    const stampLine = `GIBEI UNIMED • ${wib.dateStr} ${wib.timeStr}${
      locationLabel ? ` • ${locationLabel}` : ''
    }`;

    const fontSize = Math.max(12, Math.round(barHeight * 0.4));
    ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(stampLine, 14, height - barHeight / 2, width - 28);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/webp', 0.82)
    );
    if (!blob) return;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Gagal membaca foto WebP.'));
      reader.readAsDataURL(blob);
    });

    const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

    onCapture({
      previewUrl: dataUrl,
      base64,
      sizeBytes: blob.size,
      fileName: `piket-${wib.dateStr}-${Date.now()}.webp`,
    });

    stopStream();
  };

  const handleRetake = () => {
    onCapture(null);
    startCamera(facingMode);
  };

  return (
    <div className="space-y-3">
      {/* Frame Kamera / Pratinjau */}
      <div className="relative rounded-2xl overflow-hidden border border-line bg-[#142820] aspect-[4/3] sm:aspect-video flex items-center justify-center">
        {captured ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={captured.previewUrl}
              alt="Bukti kehadiran piket"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-bold shadow-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Foto Siap ({(captured.sizeBytes / 1024).toFixed(0)} KB WebP)
            </div>
          </>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'} ${
                facingMode === 'user' ? '-scale-x-100' : ''
              }`}
            />

            {!cameraActive && (
              <div className="p-6 text-center space-y-3 max-w-sm">
                <div className="h-12 w-12 rounded-2xl bg-white/10 text-gold flex items-center justify-center mx-auto">
                  {error ? <VideoOff className="h-6 w-6 text-rose-300" /> : <Camera className="h-6 w-6" />}
                </div>
                {error ? (
                  <div className="space-y-2">
                    <p className="text-xs text-rose-200 leading-relaxed flex items-start justify-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-white/80 leading-relaxed">
                    Aktifkan kamera langsung untuk mengambil foto bukti kehadiran piket di ruang Galeri Investasi BEI UNIMED.
                  </p>
                )}

                <Button
                  type="button"
                  variant="gold"
                  size="sm"
                  onClick={() => startCamera(facingMode)}
                  disabled={disabled || starting}
                  className="gap-2 font-bold shadow-md"
                >
                  <Camera className="h-4 w-4" />
                  {starting ? 'Menyalakan Kamera...' : error ? 'Coba Aktifkan Kamera Lagi' : 'Aktifkan Kamera'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tombol Kontrol Kamera */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {captured ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRetake}
            disabled={disabled}
            className="w-full sm:w-auto gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Ambil Foto Ulang
          </Button>
        ) : cameraActive ? (
          <div className="flex flex-wrap items-center gap-2 w-full">
            <Button
              type="button"
              variant="gold"
              onClick={handleSnap}
              disabled={disabled}
              className="flex-1 gap-2 font-bold shadow-sm"
            >
              <Camera className="h-4 w-4" />
              Ambil Foto Kehadiran
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleSwitchCamera}
              disabled={disabled}
              className="gap-1.5"
              title="Ganti Kamera Depan / Belakang"
            >
              <SwitchCamera className="h-4 w-4" />
              <span className="hidden xs:inline">Putar Kamera</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={stopStream}
              disabled={disabled}
              className="text-ink-muted"
            >
              Tutup
            </Button>
          </div>
        ) : null}
      </div>

      <p className="text-[11px] text-ink-muted flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-gold shrink-0" />
        Foto diambil langsung dari kamera dan otomatis dikonversi ke format WebP ringan disertai timestamp WIB.
      </p>
    </div>
  );
}

