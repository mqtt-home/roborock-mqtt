import { useState, useEffect, useRef, useCallback } from 'react';
import { Bug } from 'lucide-react';
import { API_BASE } from '@/lib/api';

interface VectorSpan { x: number; y: number; w: number }
interface VectorRoom { id: number; color: string; center: [number, number]; spans: VectorSpan[] }
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
  room_names?: Record<string, string>;
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
  // viewBox state: center position and visible width (zoom level)
  const [viewCenter, setViewCenter] = useState<{ x: number; y: number } | null>(null);
  const [viewWidth, setViewWidth] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<number | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const lastPinchDist = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

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
    setMapData(null);
    setViewCenter(null);
    setViewWidth(null);
    fetchMap();
  }, [slug, fetchMap]);

  // Reset view when map data first loads
  useEffect(() => {
    if (mapData && viewCenter === null) {
      setViewCenter({ x: mapData.width / 2, y: mapData.height / 2 });
      setViewWidth(mapData.width);
    }
  }, [mapData, viewCenter]);

  // Wheel zoom — zoom into cursor position
  useEffect(() => {
    const el = svgRef.current;
    if (!el || !mapData) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewWidth(vw => {
        const w = vw ?? mapData.width;
        return Math.min(Math.max(w * factor, mapData.width * 0.1), mapData.width * 2);
      });
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
    if (!dragging || !mapData || !viewWidth) return;
    const el = svgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = (e.clientX - lastPos.current.x) / rect.width * viewWidth;
    const dy = (e.clientY - lastPos.current.y) / rect.height * (viewWidth * mapData.height / mapData.width);
    lastPos.current = { x: e.clientX, y: e.clientY };
    setViewCenter(c => c ? { x: c.x - dx, y: c.y - dy } : null);
  }, [dragging, mapData, viewWidth]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    lastPinchDist.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 2 || !mapData) return;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (lastPinchDist.current !== null) {
      const factor = lastPinchDist.current / dist;
      setViewWidth(vw => {
        const w = vw ?? mapData.width;
        return Math.min(Math.max(w * factor, mapData.width * 0.1), mapData.width * 2);
      });
    }
    lastPinchDist.current = dist;
  }, [mapData]);

  const handleDoubleClick = useCallback(() => {
    if (!mapData) return;
    setViewCenter({ x: mapData.width / 2, y: mapData.height / 2 });
    setViewWidth(mapData.width);
  }, [mapData]);

  if (!mapData || !viewCenter || !viewWidth) return null;

  const { width, height, rooms, walls, floor, path, charger, robot, room_names, debug_blocks } = mapData;
  const hoveredBlockData = debug_blocks?.find(b => b.type === hoveredBlock);

  const aspect = height / width;
  const vw = viewWidth;
  const vh = vw * aspect;
  const vbX = viewCenter.x - vw / 2;
  const vbY = viewCenter.y - vh / 2;

  // Scale font size relative to zoom so labels stay readable
  const fontSize = Math.max(3, vw / 80);

  return (
    <div className="mb-6">
      <div className="rounded-lg border border-border overflow-hidden bg-card touch-none select-none"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
        <svg
          ref={svgRef}
          viewBox={`${vbX} ${vbY} ${vw} ${vh}`}
          className="w-full h-auto"
          style={{ display: 'block', background: 'var(--color-background)' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchMove={handleTouchMove}
          onDoubleClick={handleDoubleClick}
        >
          {/* Floor */}
          {floor?.map((s, i) => (
            <rect key={`f${i}`} x={s.x} y={s.y} width={s.w} height={1} fill="#B4BEC8" />
          ))}

          {/* Rooms */}
          {rooms?.map(room =>
            <g key={`rg${room.id}`}
              onPointerEnter={() => setHoveredRoom(room.id)}
              onPointerLeave={() => setHoveredRoom(null)}
            >
              {room.spans.map((s, i) => (
                <rect key={`r${room.id}-${i}`} x={s.x} y={s.y} width={s.w} height={1}
                  fill={room.color}
                  opacity={hoveredRoom === room.id ? 0.95 : 0.7}
                />
              ))}
            </g>
          )}

          {/* Walls */}
          {walls?.map((s, i) => (
            <rect key={`w${i}`} x={s.x} y={s.y} width={s.w} height={1} fill="#3C3C3C" />
          ))}

          {/* Room labels */}
          {rooms?.map(room => {
            const name = room_names?.[String(room.id)] ?? `Room ${room.id}`;
            return (
              <text
                key={`rl${room.id}`}
                x={room.center[0]}
                y={room.center[1]}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fontSize}
                fontFamily="system-ui, sans-serif"
                fontWeight={hoveredRoom === room.id ? 700 : 600}
                fill="#fff"
                stroke="#000"
                strokeWidth={fontSize * 0.15}
                paintOrder="stroke"
                style={{ pointerEvents: 'none' }}
              >
                {name}
              </text>
            );
          })}

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
            <circle cx={charger.x} cy={charger.y} r={fontSize * 0.6} fill="#4285F4" stroke="#fff" strokeWidth={fontSize * 0.1} />
          )}

          {/* Robot */}
          {robot && (
            <circle cx={robot.x} cy={robot.y} r={fontSize * 0.6} fill="#34A853" stroke="#fff" strokeWidth={fontSize * 0.1} />
          )}

          {/* Debug highlight overlay */}
          {hoveredBlockData?.points?.map(([x, y], i) => (
            <circle
              key={`dbg-${i}`}
              cx={x}
              cy={y}
              r={fontSize}
              fill={debugColors[hoveredBlock! % debugColors.length]}
              opacity={0.9}
              stroke="#fff"
              strokeWidth={fontSize * 0.1}
            />
          ))}
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
