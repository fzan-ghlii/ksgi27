'use client';

import * as React from 'react';
import {
  MapPin,
  Navigation,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PiketSettings } from '@/types';
import { calculateDistanceMeters, formatDistance } from '@/lib/utils/piket';

export interface DetectedLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceMeters: number;
  inArea: boolean;
}

interface LocationDetectorProps {
  settings: PiketSettings;
  location: DetectedLocation | null;
  onDetected: (loc: DetectedLocation | null) => void;
  disabled?: boolean;
}

export function LocationDetector({
  settings,
  location,
  onDetected,
  disabled,
}: LocationDetectorProps) {
  const [detecting, setDetecting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const detectLocation = React.useCallback(() => {
    if (disabled) return;
    setError(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Browser atau perangkat tidak mendukung fitur deteksi lokasi GPS.');
      return;
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.round(pos.coords.accuracy || 0);
        const dist = calculateDistanceMeters(lat, lng, settings.latitude, settings.longitude);
        const inArea = dist <= settings.radius_meters;

        onDetected({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          distanceMeters: dist,
          inArea,
        });
        setDetecting(false);
      },
      (err) => {
        setDetecting(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            'Izin lokasi GPS ditolak. Mohon izinkan akses lokasi (Location) di pengaturan browser Anda lalu tekan Deteksi Ulang.'
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Sinyal lokasi GPS tidak tersedia. Pastikan GPS/Location perangkat dalam keadaan aktif.');
        } else if (err.code === err.TIMEOUT) {
          setError('Waktu pencarian sinyal GPS habis. Coba bergerak ke area dekat jendela lalu tekan Deteksi Ulang.');
        } else {
          setError('Gagal mendeteksi lokasi perangkat.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [disabled, onDetected, settings.latitude, settings.longitude, settings.radius_meters]);

  // Deteksi lokasi otomatis saat pertama kali membuka form absensi
  React.useEffect(() => {
    if (location || error || disabled) return;
    const id = window.setTimeout(() => {
      detectLocation();
    }, 0);
    return () => window.clearTimeout(id);
    // Hanya dijalankan saat mount awal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hitung ulang jarak bila pengaturan radius berubah
  React.useEffect(() => {
    if (!location) return;
    const dist = calculateDistanceMeters(
      location.latitude,
      location.longitude,
      settings.latitude,
      settings.longitude
    );
    const inArea = dist <= settings.radius_meters;
    if (dist !== location.distanceMeters || inArea !== location.inArea) {
      onDetected({
        ...location,
        distanceMeters: dist,
        inArea,
      });
    }
  }, [location, onDetected, settings.latitude, settings.longitude, settings.radius_meters]);

  return (
    <div className="rounded-2xl border border-line bg-surface/60 p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-cerulean-light text-cerulean flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-ink">Deteksi Lokasi GPS Real-Time</div>
            <div className="text-[11px] text-ink-muted line-clamp-1">
              Titik Acuan: {settings.location_name} (Radius {settings.radius_meters} m)
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={detectLocation}
          disabled={disabled || detecting}
          className="gap-1.5 text-xs shrink-0"
        >
          {detecting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-cerulean" />
              Mencari GPS...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 text-cerulean" />
              {location ? 'Perbarui Lokasi' : 'Deteksi Lokasi'}
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {location && !error && (
        <div
          className={`p-3.5 rounded-xl border text-xs space-y-2 ${
            location.inArea
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/80 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold flex items-center gap-1.5">
              {location.inArea ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Berada di Dalam Area Galeri ({formatDistance(location.distanceMeters)})
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Di Luar Radius Galeri ({formatDistance(location.distanceMeters)} dari titik acuan)
                </>
              )}
            </span>

            <a
              href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold underline hover:opacity-80"
            >
              <Navigation className="h-3 w-3" />
              Buka di Maps
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] opacity-85 font-mono">
            <span>
              Koordinat: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </span>
            <span>Akurasi GPS: ±{location.accuracy} m</span>
          </div>

          {!location.inArea && settings.enforce_radius && (
            <p className="text-[11px] text-rose-700 font-semibold pt-1">
              Mode radius ketat aktif: Anda wajib berada dalam jarak maksimal {settings.radius_meters} m dari Galeri Investasi untuk mengirim absensi.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

