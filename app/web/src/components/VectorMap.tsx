import { useState, useEffect, useRef, useCallback } from 'react';
import { Bug } from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface VectorSpan { x: number; y: number; w: number }
interface VectorRoom { id: number; color: string; spans: VectorSpan[] }
interface VectorPosition { x: number; y: number; angle?: number }
interface VectorDebugBlock {
  type: number;
  label: string;
  header_len: number;
  data_len: number;
  points?: [number, number][];
}
interface VectorMapData {
  width: number;
  height: number;
  rooms: VectorRoom[];
  walls: VectorSpan[];
  floor: VectorSpan[];
  path: [number, number][];
  charger?: VectorPosition;
  robot?: VectorPosition;
  debug_blocks?: VectorDebugBlock[];
}

interface VectorMapProps {
  slug: string;
  isCleaning: boolean;
}

const debugColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F0B27A', '#82E0AA', '#F1948A', '#AED6F1', '#D7BDE2',
];

export function VectorMap({ slug, isCleaning }: VectorMapProps) {
  const [mapData, setMapData] = useState<VectorMapData | null>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMap = useCallback(() => {
    fetch(`${API_BASE}/devices/${slug}/map.json`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setMapData(data); })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    fetchMap();
    const interval = isCleaning ? 30000 : 150000;
    const timer = setInterval(fetchMap, interval);
    return () => clearInterval(timer);
  }, [fetchMap, isCleaning]);

  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
    setMapData(null);
    fetchMap();
  }, [slug, fetchMap]);

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

  const handleDoubleClick = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  if (!mapData) return null;

  const { width, height, rooms, walls, floor, path, charger, robot, debug_blocks } = mapData;
  const hoveredBlockData = debug_blocks?.find(b => b.type === hoveredBlock);

  return (
    <div className="mb-6">
      <div className="rounded-lg border border-border overflow-hidden bg-card touch-none select-none"
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
            {floor?.map((s, i) => (
              <rect key={`f${i}`} x={s.x} y={s.y} width={s.w} height={1} fill="#B4BEC8" />
            ))}
            {rooms?.map(room =>
              room.spans.map((s, i) => (
                <rect key={`r${room.id}-${i}`} x={s.x} y={s.y} width={s.w} height={1} fill={room.color} opacity={0.7} />
              ))
            )}
            {walls?.map((s, i) => (
              <rect key={`w${i}`} x={s.x} y={s.y} width={s.w} height={1} fill="#3C3C3C" />
            ))}
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
            {charger && (
              <circle cx={charger.x} cy={charger.y} r={3} fill="#4285F4" stroke="#fff" strokeWidth={0.5} />
            )}
            {robot && (
              <circle cx={robot.x} cy={robot.y} r={3} fill="#34A853" stroke="#fff" strokeWidth={0.5} />
            )}

            {/* Debug highlight overlay */}
            {hoveredBlockData?.points?.map(([x, y], i) => (
              <circle
                key={`dbg-${i}`}
                cx={x}
                cy={y}
                r={4}
                fill={debugColors[hoveredBlock! % debugColors.length]}
                opacity={0.9}
                stroke="#fff"
                strokeWidth={0.5}
              />
            ))}
            {/* Draw lines between consecutive point pairs for zone-type blocks */}
            {hoveredBlockData?.points && hoveredBlockData.points.length >= 2 && (
              <polyline
                points={hoveredBlockData.points.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke={debugColors[hoveredBlock! % debugColors.length]}
                strokeWidth={1}
                opacity={0.7}
                strokeDasharray="2,2"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Debug toggle */}
      {debug_blocks && debug_blocks.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bug className="h-3.5 w-3.5" />
            <span>{showDebug ? 'Hide' : 'Show'} Map Blocks ({debug_blocks.length})</span>
          </button>

          {showDebug && (
            <div className="mt-2 p-3 bg-card rounded-lg border border-border space-y-1.5 max-h-64 overflow-y-auto">
              {debug_blocks.map((block, i) => {
                const hasPoints = block.points && block.points.length > 0;
                const isKnown = [1, 2, 3, 4, 5, 6, 7, 8, 11, 1024].includes(block.type);
                const isHovered = hoveredBlock === block.type;
                const color = debugColors[block.type % debugColors.length];

                return (
                  <div
                    key={`${block.type}-${i}`}
                    onMouseEnter={() => hasPoints ? setHoveredBlock(block.type) : undefined}
                    onMouseLeave={() => setHoveredBlock(null)}
                    className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
                      isHovered ? 'bg-accent' : ''
                    } ${hasPoints ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: hasPoints ? color : 'transparent', border: hasPoints ? 'none' : '1px solid var(--color-border)' }}
                    />
                    <span className={isKnown ? 'text-muted-foreground' : 'text-foreground font-medium'}>
                      {block.label}
                    </span>
                    <span className="text-muted-foreground ml-auto tabular-nums">
                      {block.data_len > 0 ? `${block.data_len}B` : ''}
                      {hasPoints ? ` (${block.points!.length}pts)` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
