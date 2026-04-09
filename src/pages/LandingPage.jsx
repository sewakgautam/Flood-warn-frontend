import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { publicApi } from '../lib/api';

function Navbar() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #1e293b',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', height: 56,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: '#00d4ff', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 15,
        }}>
          🌊
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', letterSpacing: '-0.3px' }}>
          FloodWatch <span style={{ color: '#00d4ff' }}>Nepal</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link to="/map" style={{
          color: '#94a3b8', fontSize: 13, fontWeight: 500,
          textDecoration: 'none', padding: '6px 14px', borderRadius: 7,
          transition: 'all 0.12s',
        }}
          onMouseEnter={e => e.target.style.color = '#f1f5f9'}
          onMouseLeave={e => e.target.style.color = '#94a3b8'}
        >
          Live Map
        </Link>
        <Link to="/login" style={{
          background: '#00d4ff18', border: '1px solid #00d4ff44',
          color: '#00d4ff', fontSize: 13, fontWeight: 600,
          textDecoration: 'none', padding: '6px 16px', borderRadius: 8,
        }}>
          Operator Login
        </Link>
      </div>
    </nav>
  );
}

function StatCard({ label, value, sub, color = '#00d4ff' }) {
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155', borderRadius: 12,
      padding: '20px 24px', minWidth: 150,
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: '-1px', lineHeight: 1 }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', letterSpacing: '0.5px', marginTop: 6 }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155', borderRadius: 12,
      padding: '24px', flex: '1 1 260px',
    }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{desc}</div>
    </div>
  );
}

export default function LandingPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    publicApi.getMapData()
      .then(d => {
        const total = d.stations.length;
        const online = d.stations.filter(s => s.status === 'ONLINE').length;
        const alerts = d.stations.filter(s => s.risk === 'WARNING' || s.risk === 'CRITICAL').length;
        const critical = d.stations.filter(s => s.risk === 'CRITICAL').length;
        setStats({ total, online, alerts, critical });
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: '#e2e8f0',
    }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        paddingTop: 140, paddingBottom: 80, paddingLeft: 32, paddingRight: 32,
        maxWidth: 900, margin: '0 auto', textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-block', background: '#00d4ff18', border: '1px solid #00d4ff33',
          color: '#00d4ff', fontSize: 11, fontWeight: 700, letterSpacing: '2px',
          padding: '5px 14px', borderRadius: 99, marginBottom: 24,
        }}>
          LIVE · NEPAL FLOOD EARLY WARNING
        </div>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 54px)', fontWeight: 800, lineHeight: 1.1,
          color: '#f1f5f9', margin: '0 0 20px', letterSpacing: '-1.5px',
        }}>
          Real-Time Flood Monitoring<br />
          <span style={{ color: '#00d4ff' }}>Across Nepal</span>
        </h1>
        <p style={{
          fontSize: 17, color: '#94a3b8', lineHeight: 1.7,
          maxWidth: 600, margin: '0 auto 36px',
        }}>
          Live river levels and rainfall data from {stats?.total ?? '295'}+ monitoring stations.
          Subscribe to get email alerts when your nearby river reaches warning levels.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/map" style={{
            background: '#00d4ff', color: '#0f172a', fontWeight: 700,
            fontSize: 14, padding: '12px 28px', borderRadius: 10,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            View Live Map →
          </Link>
          <Link to="/map#subscribe" style={{
            background: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
            fontWeight: 600, fontSize: 14, padding: '12px 28px', borderRadius: 10,
            textDecoration: 'none',
          }}>
            Get Email Alerts
          </Link>
        </div>
      </section>

      {/* Live stats */}
      <section style={{ padding: '0 32px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <StatCard label="MONITORING STATIONS" value={stats?.total} sub="across Nepal" color="#00d4ff" />
          <StatCard label="ONLINE NOW" value={stats?.online} sub="reporting live" color="#22c55e" />
          <StatCard label="ACTIVE ALERTS" value={stats?.alerts} sub="above warning level" color="#f97316" />
          <StatCard label="CRITICAL" value={stats?.critical} sub="immediate attention" color="#ef4444" />
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '0 32px 80px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '2px', marginBottom: 10 }}>
            FEATURES
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' }}>
            Everything you need to stay safe
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <FeatureCard
            icon="📡"
            title="Real-Time River Levels"
            desc="Water level data from 295+ DHM monitoring stations updated every 30 minutes. Track river height against warning and danger thresholds."
          />
          <FeatureCard
            icon="🌧️"
            title="Rainfall Monitoring"
            desc="6-hour accumulated rainfall readings from stations across all major river basins in Nepal including Koshi, Gandaki, and Karnali."
          />
          <FeatureCard
            icon="📧"
            title="Email Alert Subscriptions"
            desc="Subscribe to any station and receive an email the moment water levels reach Watch, Warning, or Critical thresholds. No account needed."
          />
          <FeatureCard
            icon="🗺️"
            title="Interactive Map"
            desc="Color-coded live map showing risk levels across Nepal. Click any station for detailed readings, charts, and historical data."
          />
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: '60px 32px 80px', maxWidth: 800, margin: '0 auto', textAlign: 'center',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '2px', marginBottom: 10 }}>
          HOW TO GET ALERTS
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f1f5f9', margin: '0 0 40px', letterSpacing: '-0.5px' }}>
          3 steps, no account required
        </h2>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { n: '1', title: 'Open the Map', desc: 'Go to the live map and find the river station nearest to you.' },
            { n: '2', title: 'Click Get Alerts', desc: 'Click on any station marker and press the "Get Alerts" button.' },
            { n: '3', title: 'Enter Your Email', desc: 'Enter your email and choose your alert threshold. Done.' },
          ].map(step => (
            <div key={step.n} style={{
              flex: '1 1 200px', background: '#1e293b', border: '1px solid #334155',
              borderRadius: 12, padding: '24px',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: '#00d4ff18',
                border: '2px solid #00d4ff44', color: '#00d4ff', fontWeight: 800,
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px',
              }}>{step.n}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>{step.title}</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 36 }}>
          <Link to="/map" style={{
            background: '#00d4ff', color: '#0f172a', fontWeight: 700,
            fontSize: 14, padding: '13px 32px', borderRadius: 10,
            textDecoration: 'none',
          }}>
            Open Live Map →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1e293b', padding: '24px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontSize: 12, color: '#475569' }}>
          FloodWatch Nepal · Data from DHM (Department of Hydrology and Meteorology)
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link to="/map" style={{ fontSize: 12, color: '#475569', textDecoration: 'none' }}>Live Map</Link>
          <Link to="/login" style={{ fontSize: 12, color: '#475569', textDecoration: 'none' }}>Operator Login</Link>
        </div>
      </footer>
    </div>
  );
}
