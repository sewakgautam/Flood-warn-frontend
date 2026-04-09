import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApi } from '../lib/api';

export default function UnsubscribePage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    publicApi.unsubscribe(token)
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", color: '#e2e8f0',
    }}>
      <div style={{
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: 14, padding: '40px 48px', textAlign: 'center', maxWidth: 420,
      }}>
        {status === 'loading' && <div style={{ color: '#64748b' }}>Processing…</div>}
        {status === 'done' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 16 }}>✓</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 12px' }}>
              Unsubscribed
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 24px' }}>
              You won't receive any more flood alerts from this subscription.
            </p>
            <Link to="/" style={{
              background: '#00d4ff', color: '#0f172a', fontWeight: 700,
              fontSize: 13, padding: '10px 24px', borderRadius: 8, textDecoration: 'none',
            }}>
              Back to Home
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: '0 0 12px' }}>
              Link expired or invalid
            </h2>
            <Link to="/" style={{ color: '#00d4ff', fontSize: 13 }}>Back to Home</Link>
          </>
        )}
      </div>
    </div>
  );
}
