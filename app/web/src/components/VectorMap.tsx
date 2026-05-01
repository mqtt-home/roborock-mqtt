import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '@/lib/api';

interface VectorSpan { x: number; y: number; w: number }
interface VectorRoom { id: number; color: string; spans: VectorSpan[] }
interface VectorPosition { x: number; y: number; angle?: number }
interface VectorMapData {
  width: number;
  height: number;
  rooms: VectorRoom[];
  walls: VectorSpan[];
  floor: VectorSpan[];
  path: [number, number][];
  charger?: VectorPosition;
  robot?: VectorPosition;
}

interface VectorMapProps {
  slug: string;
  isCleaning: boolean;
}

export function VectorMap({ slug, isCleaning }: VectorMapProps) {
  const [mapData, setMapData] = useState<VectorMapData | null>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMap = useCallback(() => {
    fetch(`${API_BASE}/devices/${slug}/map.json`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setMapData(data); })
      .catch(() => {});
  }, [slug]);

  // Initial fetch + periodic refresh
  useEffect(() => {
    fetchMap();
    const interval = isCleaning ? 30000 : 150000;
    const timer = setInterval(fetchMap, interval);
    return () => clearInterval(timer);
  }, [fetchMap, isCleaning]);

  // Reset view on device switch
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setMapData(null);
    fetchMap();
  }, [slug, fetchMap]);

  // Wheel zoom — use native listener to prevent page scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(s => Math.min(Math.max(s * factor, 0.5), 10));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [mapData]);

  // Mouse/touch drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setTranslate(t => ({ x: t.x + dx, y: t.y + dy }));
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    lastPinchDist.current = null;
  }, []);

  // Touch pinch zoom
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (lastPinchDist.current !== null) {
      const factor = dist / lastPinchDist.current;
      setScale(s => Math.min(Math.max(s * factor, 0.5), 10));
    }
    lastPinchDist.current = dist;
  }, []);

  // Double-tap reset
  const handleDoubleClick = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  if (!mapData) return null;

  const { width, height, rooms, walls, floor, path, charger, robot } = mapData;

  return (
    <div className="mb-6 rounded-lg border border-border overflow-hidden bg-card touch-none select-none"
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchMove={handleTouchMove}
        onDoubleClick={handleDoubleClick}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ display: 'block', background: 'var(--color-background)' }}
        >
          {/* Floor */}
          {floor?.map((s, i) => (
            <rect key={`f${i}`} x={s.x} y={s.y} width={s.w} height={1} fill="#B4BEC8" />
          ))}

          {/* Rooms */}
          {rooms?.map(room =>
            room.spans.map((s, i) => (
              <rect key={`r${room.id}-${i}`} x={s.x} y={s.y} width={s.w} height={1} fill={room.color} opacity={0.7} />
            ))
          )}

          {/* Walls */}
          {walls?.map((s, i) => (
            <rect key={`w${i}`} x={s.x} y={s.y} width={s.w} height={1} fill="#3C3C3C" />
          ))}

          {/* Cleaning path */}
          {path && path.length > 1 && (
            <polyline
              points={path.map(([x, y]) => `${x},${y}`).join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={0.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Charger */}
          {charger && (
            <circle cx={charger.x} cy={charger.y} r={3} fill="#4285F4" stroke="#fff" strokeWidth={0.5} />
          )}

          {/* Robot */}
          {robot && (
            <circle cx={robot.x} cy={robot.y} r={3} fill="#34A853" stroke="#fff" strokeWidth={0.5} />
          )}
        </svg>
      </div>
    </div>
  );
}
