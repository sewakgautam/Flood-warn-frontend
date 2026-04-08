import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { CheckCircle, CloudRain, Waves } from 'lucide-react';

function ReadingForm({ type, stations, onSubmit }) {
  const isRain = type === 'rainfall';
  const [form, setForm] = useState({
    station_id: '',
    timestamp: new Date().toISOString().slice(0, 16),
    value: '',
    extra: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isRain) {
        await api.postRainfall({
          station_id: form.station_id,
          timestamp: new Date(form.timestamp).toISOString(),
          value_mm: parseFloat(form.value),
          ...(form.extra && { duration_minutes: parseInt(form.extra) }),
        });
      } else {
        await api.postRiverLevel({
          station_id: form.station_id,
          timestamp: new Date(form.timestamp).toISOString(),
          level_m: parseFloat(form.value),
          ...(form.extra && { flow_rate_cms: parseFloat(form.extra) }),
        });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setForm(f => ({ ...f, value: '', extra: '' }));
      if (onSubmit) onSubmit();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const color = isRain ? 'var(--accent)' : 'var(--warning)';
  const Icon = isRain ? CloudRain : Waves;

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: 15 }}>{isRain ? 'Rainfall Reading' : 'River Level Reading'}</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isRain ? 'Submit rainfall measurement (mm)' : 'Submit water level reading (m)'}</p>
        </div>
      </div>

      {success && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, background: 'var(--normal-dim)',
          border: '1px solid var(--normal)', borderRadius: 8, padding: '10px 14px', marginBottom: 16,
          color: 'var(--normal)', fontSize: 13,
        }}>
          <CheckCircle size={14} /> Reading submitted successfully. Prediction task enqueued.
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--critical)', fontSize: 13, marginBottom: 14, background: 'var(--critical-dim)', border: '1px solid var(--critical)', borderRadius: 8, padding: '10px 14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label className="label">Station</label>
          <select className="input" value={form.station_id} onChange={e => setForm(f => ({ ...f, station_id: e.target.value }))} required>
            <option value="">Select station…</option>
            {stations.map(s => <option key={s.id} value={s.id}>{s.name} — {s.location}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Timestamp</label>
          <input className="input" type="datetime-local" value={form.timestamp} onChange={e => setForm(f => ({ ...f, timestamp: e.target.value }))} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label className="label">{isRain ? 'Rainfall (mm)' : 'Level (m)'}</label>
            <input className="input mono" type="number" step="0.01" min="0" max={isRain ? 500 : 20}
              placeholder={isRain ? '42.5' : '3.85'}
              value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required />
          </div>
          <div>
            <label className="label">{isRain ? 'Duration (min, optional)' : 'Flow Rate CMS (optional)'}</label>
            <input className="input mono" type="number" step="0.01" min="0"
              placeholder={isRain ? '60' : '120.4'}
              value={form.extra} onChange={e => setForm(f => ({ ...f, extra: e.target.value }))} />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 4 }}>
          {loading ? 'Submitting…' : 'Submit Reading'}
        </button>
      </form>
    </div>
  );
}

export default function SubmitReadingPage() {
  const [stations, setStations] = useState([]);

  useEffect(() => { api.getStations().then(setStations).catch(console.error); }, []);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>Submit Sensor Data</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
          Manually submit readings — triggers automated flood risk prediction
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ReadingForm type="rainfall" stations={stations} />
        <ReadingForm type="river" stations={stations} />
      </div>

      <div className="card" style={{ marginTop: 20, background: 'var(--bg-card2)', borderColor: 'var(--border)' }}>
        <h4 style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>API Usage</h4>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
          For automated sensor submission, POST directly to the API:
        </p>
        <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', overflowX: 'auto' }}>
{`POST /v1/rainfall
Authorization: Bearer <token>

{
  "station_id": "STN-001",
  "timestamp": "2026-04-06T08:30:00Z",
  "value_mm": 42.5,
  "duration_minutes": 60
}`}
        </pre>
      </div>
    </div>
  );
}
