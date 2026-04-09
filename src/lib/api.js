const BASE = import.meta.env.VITE_API_URL || '/v1';

function getToken() {
  return localStorage.getItem('fw_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status });
  }

  return res.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),

  // Stations
  getStations: () => request('/stations'),
  getStation: (id) => request(`/stations/${id}`),
  createStation: (data) =>
    request('/stations', { method: 'POST', body: JSON.stringify(data) }),

  // Readings
  getRainfall: (params = {}) =>
    request('/rainfall?' + new URLSearchParams(params)),
  postRainfall: (data) =>
    request('/rainfall', { method: 'POST', body: JSON.stringify(data) }),
  getRiverLevels: (params = {}) =>
    request('/river-level?' + new URLSearchParams(params)),
  postRiverLevel: (data) =>
    request('/river-level', { method: 'POST', body: JSON.stringify(data) }),

  // Alerts
  getAlerts: (params = {}) =>
    request('/alerts?' + new URLSearchParams(params)),
  createAlert: (data) =>
    request('/alerts', { method: 'POST', body: JSON.stringify(data) }),

  // Predict
  predict: (stationId, windowHours = 6) =>
    request(`/predict/${stationId}?window_hours=${windowHours}`),

  // Subscriptions
  getSubscriptions: (params = {}) =>
    request('/subscriptions?' + new URLSearchParams(params)),
  createSubscription: (data) =>
    request('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
};

// Public (no auth)
export const publicApi = {
  getMapData: () =>
    fetch(`${BASE}/public/map-data`).then((r) => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    }),
  getStations: () =>
    fetch(`${BASE}/public/stations`).then((r) => {
      if (!r.ok) throw new Error(r.statusText);
      return r.json();
    }),
  subscribe: (data) =>
    fetch(`${BASE}/public/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),
  unsubscribe: (token) =>
    fetch(`${BASE}/public/unsubscribe/${token}`, { method: 'DELETE' }).then((r) => r.json()),
};

// Admin
export const adminApi = {
  getSyncStatus: () => request('/admin/sync-status'),
  getRainfallReadings: (params = {}) => request('/admin/rainfall?' + new URLSearchParams(params)),
  getRiverReadings: (params = {}) => request('/admin/river-levels?' + new URLSearchParams(params)),
  updateRainfall: (id, data) => request(`/admin/rainfall/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateRiverLevel: (id, data) => request(`/admin/river-levels/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRainfall: (id) => request(`/admin/rainfall/${id}`, { method: 'DELETE' }),
  deleteRiverLevel: (id) => request(`/admin/river-levels/${id}`, { method: 'DELETE' }),
};
