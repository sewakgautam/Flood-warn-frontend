import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { publicApi } from '../lib/api';
import LanguageToggle from '../components/LanguageToggle.jsx';

function MapNav() {
  const { t } = useTranslation();
  return (
    <nav style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1001,
      background: 'rgba(10,15,28,0.95)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 20px', height: 48,
    }}>
      <Link to="/" style={{
        display: 'flex', alignItems: 'center', gap: 8,
        textDecoration: 'none', color: '#f1f5f9',
      }}>
        <span style={{ fontSize: 16 }}>🌊</span>
        <span style={{ fontWeight: 700, fontSize: 13 }}>
          FloodWatch <span style={{ color: '#00d4ff' }}>Nepal</span>
        </span>
      </Link>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <LanguageToggle variant="light" />
        <span style={{ fontSize: 11, color: '#475569' }}>{t('map.clickStation')}</span>
        <Link to="/login" style={{
          background: '#00d4ff18', border: '1px solid #00d4ff33',
          color: '#00d4ff', fontSize: 12, fontWeight: 600,
          textDecoration: 'none', padding: '5px 12px', borderRadius: 6,
        }}>
          {t('nav.operatorLogin')}
        </Link>
      </div>
    </nav>
  );
}

function SubscribeForm({ stationId, stationName, onClose }) {
  const [email, setEmail] = useState('');
  const [severity, setSeverity] = useState('WARNING');
  const [status, setStatus] = useState('idle');
  const [msg, setMsg] = useState('');
  const { t } = useTranslation();

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await publicApi.subscribe({ email, stationId, severity });
      if (res.error) throw new Error(res.error);
      setStatus('done');
      setMsg(res.message || t('subscribe.checkEmail'));
    } catch (err) {
      setStatus('error');
      setMsg(err.message || 'Failed to subscribe');
    }
  };

  if (status === 'done') {
    return (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ fontSize: 22, marginBottom: 6 }}>✓</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#22c55e', marginBottom: 4 }}>{t('subscribe.subscribed')}</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{msg}</div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.5px', marginBottom: 8 }}>
        {t('subscribe.title', { station: stationName.toUpperCase() })}
      </div>
      <input
        type="email"
        required
        placeholder={t('subscribe.emailPlaceholder')}
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{
          width: '100%', padding: '7px 10px', borderRadius: 7, fontSize: 12,
          border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a',
          marginBottom: 8, boxSizing: 'border-box',
        }}
      />
      <select
        value={severity}
        onChange={e => setSeverity(e.target.value)}
        style={{
          width: '100%', padding: '7px 10px', borderRadius: 7, fontSize: 12,
          border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a',
          marginBottom: 10, boxSizing: 'border-box',
        }}
      >
        <option value="WATCH">{t('subscribe.watchLevel')}</option>
        <option value="WARNING">{t('subscribe.warningLevel')}</option>
        <option value="CRITICAL">{t('subscribe.criticalLevel')}</option>
      </select>
      {status === 'error' && (
        <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 8 }}>{msg}</div>
      )}
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="submit" disabled={status === 'loading'} style={{
          flex: 1, padding: '8px', borderRadius: 7, border: 'none',
          background: '#0ea5e9', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>
          {status === 'loading' ? t('subscribe.subscribing') : t('subscribe.subscribe')}
        </button>
        <button type="button" onClick={onClose} style={{
          padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0',
          background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer',
        }}>
          {t('subscribe.cancel')}
        </button>
      </div>
    </form>
  );
}

const RISK_COLOR = {
  NORMAL:   { hex: '#22c55e', bg: '#052e16', labelKey: 'risk.NORMAL'   },
  WATCH:    { hex: '#eab308', bg: '#1c1a03', labelKey: 'risk.WATCH'    },
  WARNING:  { hex: '#f97316', bg: '#1c0a03', labelKey: 'risk.WARNING'  },
  CRITICAL: { hex: '#ef4444', bg: '#1f0303', labelKey: 'risk.CRITICAL' },
};

function riskOf(s) {
  return RISK_COLOR[s.risk] ?? RISK_COLOR.NORMAL;
}

const TREND_ARROW = { RISING: '↑', FALLING: '↓', STEADY: '→' };
const TREND_COLOR = { RISING: '#ef4444', FALLING: '#22c55e', STEADY: '#94a3b8' };

function makeIcon(station, riskLabels) {
  const rc = riskOf(station);
  const level = station.riverLevel?.levelM;
  const levelText = level != null ? `${level.toFixed(2)} m` : '— m';
  const isOffline = station.status === 'OFFLINE';
  const isCritical = station.risk === 'CRITICAL';
  const label = isOffline ? (riskLabels['OFFLINE'] ?? 'Offline') : (riskLabels[station.risk] ?? rc.labelKey);

  const trendArrow = station.trend ? TREND_ARROW[station.trend] ?? '' : '';
  const trendColor = station.trend ? TREND_COLOR[station.trend] ?? '#94a3b8' : rc.hex;

  const pulse = isCritical
    ? `<span style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:50%;background:${rc.hex};opacity:0.5;animation:pulse 1.4s infinite;"></span>`
    : '';

  const html = `
    <div style="position:relative;font-family:'DM Sans','Space Mono',monospace;user-select:none;">
      ${pulse}
      <div style="background:${rc.bg};border:2px solid ${rc.hex};border-radius:10px 10px 10px 2px;padding:5px 9px 4px;min-width:82px;box-shadow:0 2px 12px rgba(0,0,0,0.55);backdrop-filter:blur(4px);">
        <div style="display:flex;align-items:baseline;gap:4px;">
          <div style="font-size:15px;font-weight:700;color:${rc.hex};letter-spacing:-0.3px;line-height:1;margin-bottom:3px;">${levelText}</div>
          ${trendArrow ? `<span style="font-size:13px;font-weight:700;color:${trendColor};line-height:1;">${trendArrow}</span>` : ''}
        </div>
        <div style="font-size:9.5px;color:rgba(255,255,255,0.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:96px;line-height:1.1;margin-bottom:3px;">${station.name}</div>
        <div style="display:flex;align-items:center;gap:4px;">
          <span style="width:6px;height:6px;border-radius:50%;background:${isOffline ? '#64748b' : rc.hex};flex-shrink:0;display:inline-block;"></span>
          <span style="font-size:9px;font-weight:600;color:${isOffline ? '#64748b' : rc.hex};text-transform:uppercase;letter-spacing:0.5px;">${label}</span>
        </div>
      </div>
      <div style="width:0;height:0;border-left:5px solid transparent;border-right:0px solid transparent;border-top:7px solid ${rc.hex};margin-left:2px;"></div>
    </div>
    <style>@keyframes pulse{0%,100%{transform:scale(1);opacity:0.5;}50%{transform:scale(2.2);opacity:0;}}</style>
  `;

  return L.divIcon({ html, className: '', iconAnchor: [10, 0], popupAnchor: [45, -10] });
}

function DetailPopup({ s }) {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const { t } = useTranslation();
  const rc = riskOf(s);
  const level = s.riverLevel?.levelM;
  const thresholds = s.thresholds;
  const pct = level && thresholds
    ? Math.min((level / (thresholds.criticalRiver * 1.2)) * 100, 100)
    : 0;

  const lastSeen = s.lastSeenAt ? new Date(s.lastSeenAt) : null;
  const minutesAgo = lastSeen ? Math.floor((Date.now() - lastSeen) / 60000) : null;
  const freshness = minutesAgo == null
    ? t('map.noData')
    : minutesAgo < 60
      ? `${minutesAgo}m ago`
      : minutesAgo < 1440
        ? `${Math.floor(minutesAgo / 60)}h ago`
        : lastSeen.toLocaleDateString();

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', width: 230, color: '#0f172a' }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
          <strong style={{ fontSize: 13, lineHeight: 1.3, flex: 1 }}>{s.name}</strong>
          <span style={{
            flexShrink: 0, padding: '1px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700,
            background: rc.hex + '22', color: rc.hex, border: `1px solid ${rc.hex}44`,
          }}>{t(rc.labelKey)}</span>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.location}</div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}>{t('map.waterLevel')}</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: rc.hex, fontFamily: 'Space Mono, monospace', lineHeight: 1 }}>
            {level != null ? `${level.toFixed(2)}m` : '—'}
          </span>
        </div>
        {level != null && thresholds && (
          <>
            <div style={{ background: '#e2e8f0', borderRadius: 4, height: 7, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: rc.hex, borderRadius: 4 }} />
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
            {t('map.flowRate')} <strong>{s.riverLevel.flowRateCms.toFixed(1)} m³/s</strong>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 10, padding: '6px 8px', background: '#f1f5f9', borderRadius: 7 }}>
        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{t('map.rainfall6h')}</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
          {s.rainfall?.valueMm != null ? `${s.rainfall.valueMm.toFixed(1)} mm` : t('map.noData')}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: s.status === 'OFFLINE' ? '#94a3b8' : '#22c55e',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: s.status === 'OFFLINE' ? '#94a3b8' : '#22c55e' }}>
              {t(`risk.${s.status}`)}
            </span>
          </div>
          {s.trend && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: TREND_COLOR[s.trend] ?? '#94a3b8',
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              {TREND_ARROW[s.trend]} {t(`map.trend.${s.trend}`)}
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>{t('map.updated', { time: freshness })}</span>
      </div>

      {s.risk === 'CRITICAL' && (
        <div style={{ marginTop: 8, padding: '5px 8px', background: '#fef2f2', borderRadius: 6, border: '1px solid #fecaca', fontSize: 11, color: '#dc2626', fontWeight: 600 }}>
          {t('map.criticalMsg')}
        </div>
      )}
      {s.risk === 'WARNING' && (
        <div style={{ marginTop: 8, padding: '5px 8px', background: '#fff7ed', borderRadius: 6, border: '1px solid #fed7aa', fontSize: 11, color: '#c2410c', fontWeight: 600 }}>
          {t('map.warningMsg')}
        </div>
      )}

      {!showSubscribe ? (
        <button
          onClick={() => setShowSubscribe(true)}
          style={{
            marginTop: 10, width: '100%', padding: '8px', borderRadius: 7,
            border: '1px solid #0ea5e944', background: '#0ea5e912',
            color: '#0ea5e9', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {t('map.getAlertsBtn')}
        </button>
      ) : (
        <SubscribeForm stationId={s.id} stationName={s.name} onClose={() => setShowSubscribe(false)} />
      )}
    </div>
  );
}

function StatsBar({ stations, updatedAt, onRefresh, loading }) {
  const { t } = useTranslation();
  const counts = { NORMAL: 0, WATCH: 0, WARNING: 0, CRITICAL: 0 };
  stations.forEach((s) => { counts[s.risk] = (counts[s.risk] ?? 0) + 1; });
  const total = stations.length;

  return (
    <div style={{
      background: 'rgba(10,15,28,0.95)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 16px', gap: 12, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 18 }}>🌊</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{t('map.nepalFlood')}</div>
          <div style={{ fontSize: 10, color: '#475569' }}>{t('map.stationsMonitored', { count: total })}</div>
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
            {n} {t(RISK_COLOR[risk].labelKey)}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
        {updatedAt && (
          <span style={{ fontSize: 10, color: '#475569' }}>
            {loading ? t('map.refreshing') : t('map.updated', { time: new Date(updatedAt).toLocaleTimeString() })}
          </span>
        )}
        <button onClick={onRefresh} style={{
          background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)',
          color: '#00d4ff', borderRadius: 6, padding: '4px 12px', fontSize: 11,
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600,
        }}>
          {t('map.refresh')}
        </button>
      </div>
    </div>
  );
}

function Legend() {
  const { t } = useTranslation();
  return (
    <div style={{
      position: 'absolute', bottom: 24, right: 10, zIndex: 1000,
      background: 'rgba(10,15,28,0.92)', backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px',
    }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 1 }}>
        {t('map.riskLevel')}
      </div>
      {Object.entries(RISK_COLOR).map(([key, rc]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: rc.hex, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#cbd5e1' }}>{t(rc.labelKey)}</span>
        </div>
      ))}
    </div>
  );
}

function visibleAtZoom(zoom) {
  if (zoom <= 7) return ['CRITICAL'];
  if (zoom <= 9) return ['WARNING', 'CRITICAL'];
  return ['NORMAL', 'WATCH', 'WARNING', 'CRITICAL'];
}

function ZoomTracker({ onZoom }) {
  useMapEvents({ zoomend: (e) => onZoom(e.target.getZoom()) });
  return null;
}

export default function PublicMapPage() {
  const [stations, setStations] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [zoom, setZoom] = useState(7);
  const { t, i18n } = useTranslation();

  // Build risk label map for DivIcons (they render outside React so need plain strings)
  const riskLabels = {
    NORMAL: t('risk.NORMAL'),
    WATCH: t('risk.WATCH'),
    WARNING: t('risk.WARNING'),
    CRITICAL: t('risk.CRITICAL'),
    OFFLINE: t('risk.OFFLINE'),
  };

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

  // Re-render markers when language changes
  const langKey = i18n.language;

  const allowed   = visibleAtZoom(zoom);
  const mappable  = stations.filter((s) => s.latitude != null && s.longitude != null && allowed.includes(s.risk ?? 'NORMAL'));
  const noCoords  = stations.filter((s) => s.latitude == null);

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', background: '#0f172a', fontFamily: 'DM Sans, sans-serif' }}>
      <MapNav />
      <div style={{ position: 'absolute', top: 48, left: 0, right: 0, zIndex: 1000 }}>
        <StatsBar stations={stations} updatedAt={updatedAt} onRefresh={fetchData} loading={loading} />
      </div>

      {error && (
        <div style={{
          position: 'absolute', top: 58, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1001, background: '#1f0303', border: '1px solid #ef4444',
          color: '#ef4444', borderRadius: 8, padding: '6px 16px', fontSize: 12,
        }}>
          {t('map.apiError', { msg: error })}
        </div>
      )}

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

        <ZoomTracker onZoom={setZoom} />
        {mappable.map((s) => (
          <Marker
            key={`${s.id}-${langKey}`}
            position={[s.latitude, s.longitude]}
            icon={makeIcon(s, riskLabels)}
          >
            <Popup maxWidth={260} minWidth={230}>
              <DetailPopup s={s} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <Legend />

      {noCoords.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 24, left: 10, zIndex: 1000,
          background: 'rgba(10,15,28,0.92)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
          padding: '10px 14px', maxWidth: 200,
        }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', marginBottom: 7, textTransform: 'uppercase', letterSpacing: 1 }}>
            {t('map.noGps')}
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
