import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { publicApi } from '../lib/api';

const RISK_COLOR = {
  NORMAL:   { hex: '#22c55e', bg: '#052e16', label: 'Normal'   },
  WATCH:    { hex: '#eab308', bg: '#1c1a03', label: 'Watch'    },
  WARNING:  { hex: '#f97316', bg: '#1c0a03', label: 'Warning'  },
  CRITICAL: { hex: '#ef4444', bg: '#1f0303', label: 'Critical' },
};

function riskOf(s) {
  return RISK_COLOR[s.risk] ?? RISK_COLOR.NORMAL;
}

// ── Custom DivIcon: shows water level pill + status dot ──────────────────────
function makeIcon(station) {
  const rc = riskOf(station);
  const level = station.riverLevel?.levelM;
  const levelText = level != null ? `${level.toFixed(2)} m` : '— m';
  const isOffline = station.status === 'OFFLINE';
  const isCritical = station.risk === 'CRITICAL';

  const pulse = isCritical
    ? `<span style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:${rc.hex};opacity:0.5;animation:pulse 1.4s infinite;"></span>`
    : '';

  const html = `
    <div style="
      position: relative;
      font-family: 'DM Sans', 'Space Mono', monospace;
      user-select: none;
    ">
      ${pulse}
      <!-- Pin body -->
      <div style="
        background: ${rc.bg};
        border: 2px solid ${rc.hex};
        border-radius: 10px 10px 10px 2px;
        padding: 5px 9px 4px;
        min-width: 82px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.55);
        backdrop-filter: blur(4px);
      ">
        <!-- Water level -->
        <div style="
          font-size: 15px;
          font-weight: 700;
          color: ${rc.hex};
          letter-spacing: -0.3px;
          line-height: 1;
          margin-bottom: 3px;
        ">${levelText}</div>
        <!-- Station name (short) -->
        <div style="
          font-size: 9.5px;
          color: rgba(255,255,255,0.65);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 96px;
          line-height: 1.1;
          margin-bottom: 3px;
        ">${station.name}</div>
        <!-- Status row -->
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="
            width: 6px; height: 6px; border-radius: 50%;
            background: ${isOffline ? '#64748b' : rc.hex};
            flex-shrink: 0;
            display: inline-block;
          "></span>
          <span style="
            font-size: 9px;
            font-weight: 600;
            color: ${isOffline ? '#64748b' : rc.hex};
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">${isOffline ? 'Offline' : rc.label}</span>
        </div>
      </div>
      <!-- Arrow tip -->
      <div style="
        width: 0; height: 0;
        border-left: 5px solid transparent;
        border-right: 0px solid transparent;
        border-top: 7px solid ${rc.hex};
        margin-left: 2px;
      "></div>
    </div>
    <style>
      @keyframes pulse {
        0%,100% { transform: scale(1); opacity: 0.5; }
        50%      { transform: scale(2.2); opacity: 0; }
      }
    </style>
  `;

  return L.divIcon({
    html,
    className: '',
    iconAnchor: [10, 0],
    popupAnchor: [45, -10],
  });
}

// ── Popup detail card ─────────────────────────────────────────────────────────
function DetailPopup({ s }) {
  const rc = riskOf(s);
  const level = s.riverLevel?.levelM;
  const thresholds = s.thresholds;
  const pct = level && thresholds
    ? Math.min((level / (thresholds.criticalRiver * 1.2)) * 100, 100)
    : 0;

  let barColor = rc.hex;

  const lastSeen = s.lastSeenAt ? new Date(s.lastSeenAt) : null;
  const minutesAgo = lastSeen ? Math.floor((Date.now() - lastSeen) / 60000) : null;
  const freshness = minutesAgo == null
    ? 'No data'
    : minutesAgo < 60
      ? `${minutesAgo}m ago`
      : minutesAgo < 1440
        ? `${Math.floor(minutesAgo / 60)}h ago`
        : lastSeen.toLocaleDateString();

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', width: 230, color: '#0f172a' }}>
      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <strong style={{ fontSize: 13, lineHeight: 1.3, flex: 1 }}>{s.name}</strong>
          <span style={{
            flexShrink: 0, padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700,
            background: rc.hex + '22', color: rc.hex, border: `1px solid ${rc.hex}44`,
          }}>{rc.label}</span>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.location}</div>
      </div>

      {/* Water level */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>Water Level</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: rc.hex, fontFamily: 'Space Mono, monospace', lineHeight: 1 }}>
            {level != null ? `${level.toFixed(2)}m` : '—'}
          </span>
        </div>
        {level != null && thresholds && (
          <>
            <div style={{ background: '#e2e8f0', borderRadius: 4, height: 7, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: '#94a3b8', marginTop: 2 }}>
              <span>0m</span>
              <span style={{ color: '#f97316' }}>{thresholds.warningRiver}m warn</span>
              <span style={{ color: '#ef4444' }}>{thresholds.criticalRiver}m crit</span>
            </div>
          </>
        )}
        {s.riverLevel?.flowRateCms != null && (
          <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
            Flow rate: <strong>{s.riverLevel.flowRateCms.toFixed(1)} m³/s</strong>
          </div>
        )}
      </div>

      {/* Rainfall */}
      <div style={{ marginBottom: 10, padding: '6px 8px', background: '#f1f5f9', borderRadius: 7 }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>RAINFALL (6h)</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
          {s.rainfall?.valueMm != null ? `${s.rainfall.valueMm.toFixed(1)} mm` : 'No data'}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: s.status === 'OFFLINE' ? '#94a3b8' : '#22c55e',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: s.status === 'OFFLINE' ? '#94a3b8' : '#22c55e' }}>
            {s.status}
          </span>
        </div>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>Updated {freshness}</span>
      </div>

      {s.risk === 'CRITICAL' && (
        <div style={{
          marginTop: 8, padding: '5px 8px', background: '#fef2f2', borderRadius: 6,
          border: '1px solid #fecaca', fontSize: 11, color: '#dc2626', fontWeight: 600,
        }}>
          CRITICAL — Flood risk high. Take precautions.
        </div>
      )}
      {s.risk === 'WARNING' && (
        <div style={{
          marginTop: 8, padding: '5px 8px', background: '#fff7ed', borderRadius: 6,
          border: '1px solid #fed7aa', fontSize: 11, color: '#c2410c', fontWeight: 600,
        }}>
          WARNING — Water levels elevated.
        </div>
      )}
    </div>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────
function StatsBar({ stations, updatedAt, onRefresh, loading }) {
  const counts = { NORMAL: 0, WATCH: 0, WARNING: 0, CRITICAL: 0 };
  stations.forEach((s) => { counts[s.risk] = (counts[s.risk] ?? 0) + 1; });
  const total = stations.length;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
      background: 'rgba(10,15,28,0.95)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px', gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🌊</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Nepal Flood Early Warning</div>
          <div style={{ fontSize: 10, color: '#475569' }}>{total} stations monitored</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {Object.entries(counts).filter(([, n]) => n > 0).map(([risk, n]) => (
          <div key={risk} style={{
            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
            background: RISK_COLOR[risk].hex + '18', color: RISK_COLOR[risk].hex,
            border: `1px solid ${RISK_COLOR[risk].hex}44`,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: RISK_COLOR[risk].hex, display: 'inline-block' }} />
            {n} {RISK_COLOR[risk].label}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
        {updatedAt && (
          <span style={{ fontSize: 10, color: '#475569' }}>
            {loading ? 'Refreshing…' : `Updated ${new Date(updatedAt).toLocaleTimeString()}`}
          </span>
        )}
        <button onClick={onRefresh} style={{
          background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
          color: '#00d4ff', borderRadius: 6, padding: '4px 12px', fontSize: 11,
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
        }}>
          Refresh
        </button>
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div style={{
      position: 'absolute', bottom: 24, right: 10, zIndex: 1000,
      background: 'rgba(10,15,28,0.92)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px',
    }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 1 }}>
        Risk Level
      </div>
      {Object.entries(RISK_COLOR).map(([key, rc]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: rc.hex, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#cbd5e1' }}>{rc.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PublicMapPage() {
  const [stations, setStations] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await publicApi.getMapData();
      setStations(data.stations);
      setUpdatedAt(data.updatedAt);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const mappable = stations.filter((s) => s.latitude != null && s.longitude != null);
  const noCoords  = stations.filter((s) => s.latitude == null);

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', background: '#0f172a', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header overlaid on map */}
      <StatsBar stations={stations} updatedAt={updatedAt} onRefresh={fetchData} loading={loading} />

      {error && (
        <div style={{
          position: 'absolute', top: 58, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1001, background: '#1f0303', border: '1px solid #ef4444',
          color: '#ef4444', borderRadius: 8, padding: '6px 16px', fontSize: 12,
        }}>
          API error: {error}
        </div>
      )}

      {/* Full-screen map */}
      <MapContainer
        center={[28.3949, 84.124]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mappable.map((s) => (
          <Marker key={s.id} position={[s.latitude, s.longitude]} icon={makeIcon(s)}>
            <Popup maxWidth={260} minWidth={230}>
              <DetailPopup s={s} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <Legend />

      {/* Stations without coordinates */}
      {noCoords.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 24, left: 10, zIndex: 1000,
          background: 'rgba(10,15,28,0.92)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
          padding: '10px 14px', maxWidth: 200,
        }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 1 }}>
            No GPS Set
          </div>
          {noCoords.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: RISK_COLOR[s.risk]?.hex ?? '#64748b', flexShrink: 0, display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              {s.riverLevel && (
                <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto', flexShrink: 0 }}>
                  {s.riverLevel.levelM.toFixed(1)}m
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
