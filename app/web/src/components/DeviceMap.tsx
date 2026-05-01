import { useState, useEffect } from 'react';
import { API_BASE } from '@/lib/api';

interface DeviceMapProps {
  slug: string;
  isCleaning: boolean;
}

export function DeviceMap({ slug, isCleaning }: DeviceMapProps) {
  const [hasMap, setHasMap] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh map periodically (more often during cleaning)
  useEffect(() => {
    const interval = isCleaning ? 30000 : 150000; // 30s cleaning, 2.5min idle
    const timer = setInterval(() => setRefreshKey(k => k + 1), interval);
    return () => clearInterval(timer);
  }, [isCleaning]);

  // Reset on device switch
  useEffect(() => {
    setHasMap(false);
    setRefreshKey(0);
  }, [slug]);

  const src = `${API_BASE}/devices/${slug}/map?t=${refreshKey}`;

  return (
    <div className="mb-6">
      <img
        src={src}
        alt="Vacuum map"
        onLoad={() => setHasMap(true)}
        onError={() => setHasMap(false)}
        className={`w-full rounded-lg border border-border ${hasMap ? '' : 'hidden'}`}
      />
    </div>
  );
}
