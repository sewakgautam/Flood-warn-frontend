import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Radio, Plus, Wifi, WifiOff, X, ChevronRight } from 'lucide-react';

function AddStationModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', location: '', latitude: '', longitude: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const station = await api.createStation({
        name: form.name,
        location: form.location,
        ...(form.latitude && { latitude: parseFloat(form.latitude) }),
        ...(form.longitude && { longitude: parseFloat(form.longitude) }),
      });
      onCreated(station);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000000aa',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div className="card" style={{ width: 400, padding: 28, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: 'var(--text-muted)' }}>
          <X size={18} />
        </button>
        <h3 style={{ fontWeight: 600, marginBottom: 20 }}>Add Station</h3>
        {error && <div style={{ color: 'var(--critical)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="label">Station Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          <div><label className="label">Location</label><input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label className="label">Latitude</label><input className="input" type="number" step="any" value={form.latitude} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} /></div>
            <div><label className="label">Longitude</label><input className="input" type="number" step="any" value={form.longitude} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} /></div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center', marginTop: 4 }}>
            {loading ? 'Creating…' : 'Create Station'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    api.getStations().then(setStations).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 700 }}>Stations</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            {stations.length} registered · {stations.filter(s => s.status === 'ONLINE').length} online
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add Station
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {stations.map(s => (
            <Link key={s.id} to={`/stations/${s.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{
                display: 'flex', alignItems: 'center', gap: 16,
                transition: 'border-color 0.15s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: s.status === 'ONLINE' ? 'var(--normal-dim)' : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {s.status === 'ONLINE'
                    ? <Wifi size={18} color="var(--normal)" />
                    : <WifiOff size={18} color="var(--text-muted)" />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.location}</div>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {s.id}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500,
                    color: s.status === 'ONLINE' ? 'var(--normal)' : 'var(--text-muted)',
                  }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: s.status === 'ONLINE' ? 'var(--normal)' : 'var(--text-dim)',
                    }} />
                    {s.status}
                  </span>
                </div>
                <ChevronRight size={16} color="var(--text-dim)" />
              </div>
            </Link>
          ))}
          {stations.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <Radio size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p>No stations registered yet.</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowAdd(true)}>
                <Plus size={14} /> Add your first station
              </button>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <AddStationModal
          onClose={() => setShowAdd(false)}
          onCreated={s => setStations(prev => [...prev, s])}
        />
      )}
    </div>
  );
}
