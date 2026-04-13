import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api.js';
import { Radio, Bell, AlertTriangle, Activity, ChevronRight, Wifi, WifiOff } from 'lucide-react';

const SEVERITY_COLOR = {
  NORMAL: 'var(--normal)', WATCH: 'var(--watch)',
  WARNING: 'var(--warning)', CRITICAL: 'var(--critical)',
};

function StatCard({ label, value, icon: Icon, color = 'var(--accent)', sub }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {label}
        </span>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
        {value ?? '—'}
      </div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function RiskBar({ score }) {
  const pct = Math.round((score ?? 0) * 100);
  const color = pct >= 100 ? 'var(--critical)' : pct >= 85 ? 'var(--warning)' : pct >= 70 ? 'var(--watch)' : 'var(--normal)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: color, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, width: 34, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const [stations, setStations] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function load() {
      try {
        const [stns, alts] = await Promise.all([api.getStations(), api.getAlerts({ page_size: 5 })]);
        setStations(stns);
        setAlerts(alts.results || []);
        const preds = {};
        await Promise.allSettled(
          stns.slice(0, 6).map(async s => {
            try { preds[s.id] = await api.predict(s.id); } catch {}
          })
        );
        setPredictions(preds);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const online = stations.filter(s => s.status === 'ONLINE').length;
  const critical = Object.values(predictions).filter(p => p.risk_level === 'CRITICAL').length;
  const warnings = Object.values(predictions).filter(p => p.risk_level === 'WARNING').length;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
          {t('dashboard.title')}
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
          {t('dashboard.subtitle')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label={t('dashboard.totalStations')} value={stations.length} icon={Radio} color="var(--accent)" sub={t('dashboard.onlineSub', { n: online })} />
        <StatCard label={t('dashboard.criticalAlerts')} value={critical} icon={AlertTriangle} color="var(--critical)" sub={t('dashboard.activeRiskZones')} />
        <StatCard label={t('dashboard.warnings')} value={warnings} icon={Activity} color="var(--warning)" sub={t('dashboard.monitoringRequired')} />
        <StatCard label={t('dashboard.recentAlerts')} value={alerts.length} icon={Bell} color="var(--watch)" sub={t('dashboard.last20')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{t('dashboard.stationRiskLevels')}</span>
            <Link to="/stations" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3 }}>
              {t('dashboard.viewAll')} <ChevronRight size={13} />
            </Link>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>{t('dashboard.loadingStations')}</div>
          ) : stations.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
              {t('dashboard.noStations')} <Link to="/stations" style={{ color: 'var(--accent)' }}>{t('dashboard.addOne')}</Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[t('dashboard.station'), t('dashboard.status'), t('dashboard.risk'), t('dashboard.score')].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stations.map(s => {
                  const pred = predictions[s.id];
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '12px 20px' }}>
                        <Link to={`/stations/${s.id}`} style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13 }}>
                          {s.name}
                        </Link>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.location}</div>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                          {s.status === 'ONLINE'
                            ? <><Wifi size={12} color="var(--normal)" /> <span style={{ color: 'var(--normal)' }}>{t('risk.ONLINE')}</span></>
                            : <><WifiOff size={12} color="var(--text-muted)" /> <span style={{ color: 'var(--text-muted)' }}>{t('risk.OFFLINE')}</span></>
                          }
                        </span>
                      </td>
                      <td style={{ padding: '12px 20px' }}>
                        {pred
                          ? <span className={`badge badge-${pred.risk_level}`}>{t(`risk.${pred.risk_level}`)}</span>
                          : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                        }
                      </td>
                      <td style={{ padding: '12px 20px', minWidth: 120 }}>
                        {pred ? <RiskBar score={pred.score} /> : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{t('dashboard.recentAlerts')}</span>
            <Link to="/alerts" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 3 }}>
              {t('dashboard.viewAll')} <ChevronRight size={13} />
            </Link>
          </div>
          <div>
            {alerts.length === 0 ? (
              <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                {t('dashboard.noRecentAlerts')}
              </div>
            ) : alerts.map(alert => (
              <div key={alert.id} style={{
                padding: '14px 20px', borderBottom: '1px solid var(--border)',
                borderLeft: `3px solid ${SEVERITY_COLOR[alert.severity] || 'var(--border)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <span className={`badge badge-${alert.severity}`}>{t(`risk.${alert.severity}`)}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {new Date(alert.createdAt || alert.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text)', lineHeight: 1.5 }}>
                  {alert.message}
                </p>
                <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                  {alert.stationId || alert.station_id}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
