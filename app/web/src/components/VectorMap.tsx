import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Bug, Map as MapIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { API_BASE } from '@/lib/api';

interface VectorSpan { x: number; y: number; w: number }
interface VectorEdge { x1: number; y1: number; x2: number; y2: number }
interface VectorRoom { id: number; color: string; center: [number, number]; spans: VectorSpan[]; outline?: VectorEdge[] }
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

// fitView frames what was actually mapped (the raw map is mostly empty canvas)
// and picks a frame shape close to it.
function fitView(md: VectorMapData): { x: number; y: number; w: number; aspect: number } {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const spans = [...(md.walls ?? []), ...(md.floor ?? []), ...(md.rooms ?? []).flatMap(r => r.spans ?? [])];
  for (const s of spans) {
    x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x + s.w);
    y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y + 1);
  }
  for (const [x, y] of md.path ?? []) {
    x0 = Math.min(x0, x); x1 = Math.max(x1, x);
    y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  if (!isFinite(x0) || x1 <= x0 || y1 <= y0) {
    return { x: md.width / 2, y: md.height / 2, w: md.width, aspect: md.height / md.width };
  }
  const pad = Math.max(x1 - x0, y1 - y0) * 0.05;
  const bw = x1 - x0 + 2 * pad, bh = y1 - y0 + 2 * pad;
  const aspect = Math.min(Math.max(bh / bw, 0.6), 1.25);
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: Math.max(bw, bh / aspect), aspect };
}

export function VectorMap({ slug, isCleaning }: VectorMapProps) {
  const { t } = useI18n();
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

  const fit = useMemo(() => (mapData ? fitView(mapData) : null), [mapData]);

  // Reset view when map data first loads
  useEffect(() => {
    if (fit && viewCenter === null) {
      setViewCenter({ x: fit.x, y: fit.y });
      setViewWidth(fit.w);
    }
  }, [fit, viewCenter]);

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
  }, [mapData, viewCenter, viewWidth]);

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
    const dy = (e.clientY - lastPos.current.y) / rect.height * (viewWidth * (fit?.aspect ?? 1));
    lastPos.current = { x: e.clientX, y: e.clientY };
    setViewCenter(c => c ? { x: c.x - dx, y: c.y - dy } : null);
  }, [dragging, mapData, viewWidth, fit]);

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
    if (!fit) return;
    setViewCenter({ x: fit.x, y: fit.y });
    setViewWidth(fit.w);
  }, [fit]);

  if (!mapData || !fit || !viewCenter || !viewWidth) return null;

  const { rooms, walls, floor, path, charger, robot, room_names, debug_blocks } = mapData;
  const hoveredBlockData = debug_blocks?.find(b => b.type === hoveredBlock);

  const aspect = fit.aspect;
  const vw = viewWidth;
  const vh = vw * aspect;
  const vbX = viewCenter.x - vw / 2;
  const vbY = viewCenter.y - vh / 2;

  // Scale font size relative to zoom so labels stay readable
  const fontSize = Math.max(2, vw / 42);

  return (
    <section className="card">
      <div className="card-h">
        <span className="ico sm"><MapIcon /></span>
        <h3>{t('map')}</h3>
        <span className="meta hidden sm:inline">{t('map.reset')}</span>
      </div>
      <div className="card-b">
      <div className="map-frame touch-none select-none"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}>
        <svg
          ref={svgRef}
          viewBox={`${vbX} ${vbY} ${vw} ${vh}`}
          className="w-full h-auto"
          style={{ display: 'block' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchMove={handleTouchMove}
          onDoubleClick={handleDoubleClick}
        >
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" style={{ stroke: 'var(--map-grid)' }} strokeWidth={0.3} />
            </pattern>
            {/* Glow only on markers (just 2 elements) */}
            <filter id="markerGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background + grid, themed via --map-* */}
          <rect x={vbX} y={vbY} width={vw} height={vh} style={{ fill: 'var(--map-bg)' }} />
          <rect x={vbX} y={vbY} width={vw} height={vh} fill="url(#grid)" />

          {/* Floor */}
          <g style={{ fill: 'var(--map-floor)' }} shapeRendering="crispEdges">
            {floor?.map((s, i) => (
              <rect key={`f${i}`} x={s.x} y={s.y} width={s.w} height={1} />
            ))}
          </g>

          {/* Room fills — low opacity */}
          {rooms?.map(room =>
            <g key={`rg${room.id}`} shapeRendering="crispEdges"
              onPointerEnter={() => setHoveredRoom(room.id)}
              onPointerLeave={() => setHoveredRoom(null)}
            >
              {room.spans.map((s, i) => (
                <rect key={`r${room.id}-${i}`} x={s.x} y={s.y} width={s.w} height={1}
                  fill={room.color}
                  style={{ opacity: hoveredRoom === room.id ? 'var(--map-room-fill-hover)' : 'var(--map-room-fill)' }}
                />
              ))}
            </g>
          )}

          {/* Walls */}
          <g style={{ fill: 'var(--map-wall)' }} shapeRendering="crispEdges">
            {walls?.map((s, i) => (
              <rect key={`w${i}`} x={s.x} y={s.y} width={s.w} height={1} />
            ))}
          </g>

          {/* Room outlines — colored borders as single path per room */}
          {rooms?.map(room => {
            if (!room.outline || room.outline.length === 0) return null;
            const isHov = hoveredRoom === room.id;
            const d = room.outline.map(e => `M${e.x1},${e.y1}L${e.x2},${e.y2}`).join('');
            return (
              <path key={`ro${room.id}`}
                d={d}
                stroke={room.color}
                strokeWidth={isHov ? 1.2 : 0.6}
                opacity={isHov ? 1 : 0.7}
                fill="none"
              />
            );
          })}

          {/* Cleaning path */}
          {path && path.length > 1 && (
            <polyline
              points={path.map(([x, y]) => `${x},${y}`).join(' ')}
              fill="none"
              style={{ stroke: 'var(--map-path)' }}
              strokeWidth={0.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Room labels with a halo so they read on any room colour */}
          {rooms?.map(room => {
            const name = room_names?.[String(room.id)] ?? t('map.room', { id: room.id });
            return (
              <text
                key={`rl${room.id}`}
                x={room.center[0]}
                y={room.center[1]}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={fontSize}
                fontWeight={hoveredRoom === room.id ? 700 : 550}
                strokeWidth={fontSize * 0.22}
                strokeLinejoin="round"
                paintOrder="stroke"
                style={{ pointerEvents: 'none', fill: 'var(--map-label)', stroke: 'var(--map-label-halo)', fontFamily: 'var(--font-sans)' }}
              >
                {name}
              </text>
            );
          })}

          {/* Charger */}
          {charger && (
            <g filter="url(#markerGlow)" style={{ fill: 'var(--map-dock)' }}>
              <title>{t('map.dock')}</title>
              <circle cx={charger.x} cy={charger.y} r={fontSize * 0.8} opacity={0.3} />
              <circle cx={charger.x} cy={charger.y} r={fontSize * 0.5} style={{ stroke: 'var(--map-marker-ring)' }} strokeWidth={fontSize * 0.12} />
            </g>
          )}

          {/* Robot */}
          {robot && (
            <g filter="url(#markerGlow)" style={{ fill: 'var(--map-robot)' }}>
              <title>{t('map.robot')}</title>
              <circle cx={robot.x} cy={robot.y} r={fontSize * 0.8} opacity={0.3} />
              <circle cx={robot.x} cy={robot.y} r={fontSize * 0.5} style={{ stroke: 'var(--map-marker-ring)' }} strokeWidth={fontSize * 0.12} />
            </g>
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
              style={{ stroke: 'var(--map-marker-ring)' }}
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
            className="flex min-h-9 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bug className="h-3.5 w-3.5" />
            <span>{t(showDebug ? 'map.blocks.hide' : 'map.blocks.show', { n: debug_blocks.length })}</span>
          </button>

          {showDebug && (
            <div className="mt-1 p-2 rounded-xl border space-y-1 max-h-64 overflow-y-auto" style={{ background: 'var(--surface-2)' }}>
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
                      isHovered ? 'bg-muted' : ''
                    } ${hasPoints ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: hasPoints ? color : 'transparent', border: hasPoints ? 'none' : '1px solid var(--line-2)' }}
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
    </section>
  );
}
