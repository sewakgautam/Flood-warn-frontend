import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { ArrowLeft, RefreshCw, Zap } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: p.color }}>
          {p.value?.toFixed(2)} {unit}
        </div>
      ))}
    </div>
  );
};

function PredictionPanel({ stationId }) {
  const [pred, setPred] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try { setPred(await api.predict(stationId)); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { run(); }, [stationId]);

  const COLOR = { NORMAL: 'var(--normal)', WATCH: 'var(--watch)', WARNING: 'var(--warning)', CRITICAL: 'var(--critical)' };
  const color = COLOR[pred?.risk_level] || 'var(--text-muted)';

  return (
    <div className="card" style={{ borderColor: pred ? color + '40' : 'var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 14 }}>Flood Risk Prediction</span>
        <button className="btn btn-ghost" onClick={run} disabled={loading} style={{ padding: '5px 10px', fontSize: 12 }}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {pred ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              flex: 1, padding: '16px', borderRadius: 10,
              background: color + '14', border: `1px solid ${color}30`,
              textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color }}>{pred.risk_level}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Risk Level</div>
            </div>
            <div style={{ flex: 1, padding: '16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700, color }}>{Math.round(pred.score * 100)}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Risk Score</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            {[
              { label: 'Rainfall (6h)', value: `${pred.current_mm} mm`, sub: `threshold: ${pred.threshold_mm} mm` },
              { label: 'River Level', value: `${pred.river_level_m} m`, sub: `critical: ${pred.critical_level_m} m` },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', borderLeft: `3px solid ${color}` }}>
            <Zap size={12} style={{ marginRight: 5, color }} />
            {pred.recommendation}
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10, fontFamily: 'var(--font-mono)' }}>
            Evaluated: {new Date(pred.evaluated_at).toLocaleString()}
          </div>
        </>
      ) : loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Running prediction…</div>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data available</div>
      )}
    </div>
  );
}

export default function StationDetailPage() {
  const { id } = useParams();
  const [station, setStation] = useState(null);
  const [rainfall, setRainfall] = useState([]);
  const [riverLevels, setRiverLevels] = useState([]);

  useEffect(() => {
    api.getStation(id).then(setStation).catch(console.error);
    api.getRainfall({ station_id: id, limit: 48 }).then(data => {
      setRainfall([...data].reverse().map(r => ({
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: r.valueMm,
      })));
    }).catch(console.error);
    api.getRiverLevels({ station_id: id, limit: 48 }).then(data => {
      setRiverLevels([...data].reverse().map(r => ({
        time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: r.levelM,
      })));
    }).catch(console.error);
  }, [id]);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/stations" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>
          <ArrowLeft size={14} /> Back to Stations
        </Link>
        {station && (
          <>
            <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>{station.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{station.location}</p>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Rainfall chart */}
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>Rainfall (mm) — last 48 readings</h3>
            {rainfall.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={rainfall}>
                  <defs>
                    <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip unit="mm" />} />
                  <Area type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={2} fill="url(#rainGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No rainfall data
              </div>
            )}
          </div>

          {/* River level chart */}
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 14 }}>River Level (m) — last 48 readings</h3>
            {riverLevels.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={riverLevels}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip unit="m" />} />
                  <Line type="monotone" dataKey="value" stroke="var(--warning)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No river level data
              </div>
            )}
          </div>
        </div>

        <PredictionPanel stationId={id} />
      </div>
    </div>
  );
}
