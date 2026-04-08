import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { Bell, Plus, X, Filter } from 'lucide-react';

const SEVERITIES = ['NORMAL', 'WATCH', 'WARNING', 'CRITICAL'];
const SEV_COLOR = { NORMAL: 'var(--normal)', WATCH: 'var(--watch)', WARNING: 'var(--warning)', CRITICAL: 'var(--critical)' };

function CreateAlertModal({ stations, onClose, onCreated }) {
  const [form, setForm] = useState({ station_id: '', severity: 'WARNING', message: '', source: 'manual' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const alert = await api.createAlert(form);
      onCreated(alert);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000aa', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: 420, padding: 28, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)' }}>
          <X size={18} />
        </button>
        <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Create Manual Alert</h3>
        {error && <div style={{ color: 'var(--critical)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">Station</label>
            <select className="input" value={form.station_id} onChange={e => setForm(f => ({ ...f, station_id: e.target.value }))} required>
              <option value="">Select station…</option>
              {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Severity</label>
            <select className="input" value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input" rows={3} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required style={{ resize: 'vertical' }} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Creating…' : 'Create Alert'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [stations, setStations] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState({ severity: '', station_id: '' });
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: PAGE_SIZE };
      if (filter.severity) params.severity = filter.severity;
      if (filter.station_id) params.station_id = filter.station_id;
      const data = await api.getAlerts(params);
      setAlerts(data.results || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { api.getStations().then(setStations).catch(console.error); }, []);
  useEffect(() => { loadAlerts(); }, [page, filter]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>Alerts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{total} total alerts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Create Alert
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 18, display: 'flex', gap: 14, alignItems: 'center' }}>
        <Filter size={14} color="var(--text-muted)" />
        <select className="input" value={filter.severity} onChange={e => { setFilter(f => ({ ...f, severity: e.target.value })); setPage(1); }} style={{ width: 'auto', minWidth: 130 }}>
          <option value="">All severities</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input" value={filter.station_id} onChange={e => { setFilter(f => ({ ...f, station_id: e.target.value })); setPage(1); }} style={{ width: 'auto', minWidth: 160 }}>
          <option value="">All stations</option>
          {stations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {(filter.severity || filter.station_id) && (
          <button className="btn btn-ghost" onClick={() => { setFilter({ severity: '', station_id: '' }); setPage(1); }} style={{ padding: '5px 10px', fontSize: 12 }}>
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Alerts list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
            <p>No alerts found</p>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Severity', 'Station', 'Message', 'Source', 'Time'].map(h => (
                    <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)', borderLeft: `3px solid ${SEV_COLOR[a.severity] || 'transparent'}` }}>
                    <td style={{ padding: '12px 18px' }}>
                      <span className={`badge badge-${a.severity}`}>{a.severity}</span>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {a.stationId || a.station_id}
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 13, color: 'var(--text)', maxWidth: 300 }}>
                      {a.message}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 7px' }}>
                        {a.source}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                      {new Date(a.createdAt || a.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '14px 18px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Page {page} of {totalPages}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" onClick={() => setPage(p => p - 1)} disabled={page === 1} style={{ padding: '5px 12px', fontSize: 12 }}>Prev</button>
                  <button className="btn btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages} style={{ padding: '5px 12px', fontSize: 12 }}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <CreateAlertModal
          stations={stations}
          onClose={() => setShowCreate(false)}
          onCreated={a => { setAlerts(prev => [a, ...prev]); setTotal(t => t + 1); }}
        />
      )}
    </div>
  );
}
