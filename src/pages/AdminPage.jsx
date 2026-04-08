import { useState, useEffect } from 'react';
import { adminApi, api } from '../lib/api.js';
import {
  RefreshCw, Edit2, Trash2, Check, X, Wifi, WifiOff,
  CloudRain, Waves, Bot, User, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

// ─── Inline Edit Cell ──────────────────────────────────────────────────────────
function EditableCell({ value, onSave, unit, min, max, step = '0.01' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);

  const handleSave = () => {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= min && n <= max) {
      onSave(n);
      setEditing(false);
    }
  };

  if (!editing) {
    return (
      <span
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        onClick={() => setEditing(true)}
        title="Click to edit"
      >
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          {value ?? '—'} {unit}
        </span>
        <Edit2 size={11} color="var(--text-dim)" />
      </span>
    );
  }

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <input
        className="input mono"
        type="number"
        step={step}
        min={min}
        max={max}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
        autoFocus
        style={{ width: 90, padding: '3px 8px', fontSize: 12 }}
      />
      <button onClick={handleSave} style={{ background: 'none', border: 'none', color: 'var(--normal)', cursor: 'pointer' }}>
        <Check size={14} />
      </button>
      <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
        <X size={14} />
      </button>
    </span>
  );
}

// ─── Sync Status Panel ─────────────────────────────────────────────────────────
function SyncStatusPanel() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.getSyncStatus()
      .then(setStations)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const autoSync = stations.filter(s => s.isAutoSync);
  const manual = stations.filter(s => !s.isAutoSync);

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: 15 }}>Sync Status</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            {autoSync.length} auto-synced (DHM/Open-Meteo) · {manual.length} manual stations
          </p>
        </div>
        <button className="btn btn-ghost" onClick={load} style={{ padding: '6px 12px', fontSize: 12 }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {stations.map(s => (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--bg)', border: '1px solid var(--border)',
            }}>
              {/* Online indicator */}
              <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: s.status === 'ONLINE' ? 'var(--normal)' : 'var(--text-dim)' }} />

              {/* Source badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontWeight: 700, padding: '2px 7px',
                borderRadius: 4, flexShrink: 0,
                background: s.isAutoSync ? 'var(--accent-dim)' : 'var(--border)',
                color: s.isAutoSync ? 'var(--accent)' : 'var(--text-muted)',
              }}>
                {s.isAutoSync ? <><Bot size={9} /> DHM</> : <><User size={9} /> Manual</>}
              </span>

              {/* Name */}
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                {s.name}
              </span>

              {/* Latest readings */}
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {s.latestRiverLevel
                  ? `💧 ${s.latestRiverLevel.levelM}m`
                  : '—'
                }
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {s.latestRainfall
                  ? `🌧 ${s.latestRainfall.valueMm}mm`
                  : '—'
                }
              </span>

              {/* Last seen */}
              <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                {s.lastSeenAt
                  ? new Date(s.lastSeenAt).toLocaleTimeString()
                  : 'never'
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Readings Table ────────────────────────────────────────────────────────────
function ReadingsTable({ type, stations }) {
  const isRain = type === 'rainfall';
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stationFilter, setStationFilter] = useState('');
  const [saving, setSaving] = useState({});
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expanded, setExpanded] = useState(true);

  const load = (sid = stationFilter) => {
    setLoading(true);
    const fn = isRain ? adminApi.getRainfallReadings : adminApi.getRiverReadings;
    fn(sid ? { station_id: sid, limit: 100 } : { limit: 50 })
      .then(setReadings)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpdate = async (id, field, value) => {
    setSaving(s => ({ ...s, [id]: true }));
    setError('');
    try {
      const fn = isRain ? adminApi.updateRainfall : adminApi.updateRiverLevel;
      await fn(id, { [field]: value });
      setReadings(prev => prev.map(r => r.id === id ? { ...r, [field === 'value_mm' ? 'valueMm' : field === 'level_m' ? 'levelM' : field === 'flow_rate_cms' ? 'flowRateCms' : field]: value } : r));
    } catch (err) {
      setError(`Failed to update: ${err.message}`);
    } finally {
      setSaving(s => ({ ...s, [id]: false }));
    }
  };

  const handleDelete = async (id) => {
    try {
      const fn = isRain ? adminApi.deleteRainfall : adminApi.deleteRiverLevel;
      await fn(id);
      setReadings(prev => prev.filter(r => r.id !== id));
      setConfirmDelete(null);
    } catch (err) {
      setError(`Failed to delete: ${err.message}`);
    }
  };

  const Icon = isRain ? CloudRain : Waves;
  const color = isRain ? 'var(--accent)' : 'var(--warning)';

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: expanded ? '1px solid var(--border)' : 'none',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={15} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>
            {isRain ? 'Rainfall Readings' : 'River Level Readings'}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
            {readings.length} records
          </span>
        </div>

        {/* Station filter */}
        <select
          className="input"
          value={stationFilter}
          onChange={e => { setStationFilter(e.target.value); load(e.target.value); }}
          style={{ width: 'auto', minWidth: 180, fontSize: 12 }}
        >
          <option value="">All stations</option>
          {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <button className="btn btn-ghost" onClick={() => load()} style={{ padding: '5px 10px', fontSize: 12 }}>
          <RefreshCw size={12} />
        </button>
        <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {!expanded ? null : loading ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
      ) : (
        <>
          {error && (
            <div style={{ padding: '10px 20px', background: 'var(--critical-dim)', color: 'var(--critical)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Station', 'Timestamp', isRain ? 'Rainfall (mm)' : 'Level (m)', isRain ? 'Duration (min)' : 'Flow (m³/s)', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {readings.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', opacity: saving[r.id] ? 0.6 : 1 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {r.station?.name || r.stationId}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {isRain ? (
                        <EditableCell
                          value={r.valueMm}
                          unit="mm"
                          min={0} max={500}
                          onSave={v => handleUpdate(r.id, 'value_mm', v)}
                        />
                      ) : (
                        <EditableCell
                          value={r.levelM}
                          unit="m"
                          min={0} max={20}
                          onSave={v => handleUpdate(r.id, 'level_m', v)}
                        />
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {isRain ? (
                        <EditableCell
                          value={r.durationMinutes}
                          unit="min"
                          min={1} max={1440} step="1"
                          onSave={v => handleUpdate(r.id, 'duration_minutes', v)}
                        />
                      ) : (
                        <EditableCell
                          value={r.flowRateCms}
                          unit="m³/s"
                          min={0} max={100000}
                          onSave={v => handleUpdate(r.id, 'flow_rate_cms', v)}
                        />
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      {confirmDelete === r.id ? (
                        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: 'var(--critical)' }}>Delete?</span>
                          <button onClick={() => handleDelete(r.id)} style={{ background: 'var(--critical-dim)', border: '1px solid var(--critical)', borderRadius: 4, color: 'var(--critical)', padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>Yes</button>
                          <button onClick={() => setConfirmDelete(null)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text-muted)', padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>No</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDelete(r.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }} title="Delete reading">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {readings.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      No readings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const [stations, setStations] = useState([]);

  useEffect(() => {
    api.getStations().then(setStations).catch(console.error);
  }, []);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>Admin Panel</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Monitor auto-sync status · manually edit or delete any reading
        </p>
      </div>

      <div style={{
        display: 'flex', gap: 10, alignItems: 'center',
        padding: '12px 16px', borderRadius: 8,
        background: 'var(--accent-dim)', border: '1px solid var(--accent)30',
        marginBottom: 24, fontSize: 13, color: 'var(--accent)',
      }}>
        <Bot size={15} />
        <span>Auto-sync pulls live data from <strong>DHM Nepal</strong> (river levels) and <strong>Open-Meteo</strong> (rainfall + discharge) automatically. Click any value below to manually override it.</span>
      </div>

      <SyncStatusPanel />

      <ReadingsTable type="rainfall" stations={stations} />
      <ReadingsTable type="river" stations={stations} />
    </div>
  );
}
