import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Layout from './components/Layout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import StationsPage from './pages/StationsPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import StationDetailPage from './pages/StationDetailPage.jsx';
import SubmitReadingPage from './pages/SubmitReadingPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import PublicMapPage from './pages/PublicMapPage.jsx';
import UnsubscribePage from './pages/UnsubscribePage.jsx';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/map" element={<PublicMapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unsubscribe/:token" element={<UnsubscribePage />} />

          {/* Operator/Admin dashboard */}
          <Route path="/dashboard" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="stations" element={<StationsPage />} />
            <Route path="stations/:id" element={<StationDetailPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="submit" element={<SubmitReadingPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          {/* Legacy redirects */}
          <Route path="/stations" element={<Navigate to="/dashboard/stations" replace />} />
          <Route path="/alerts" element={<Navigate to="/dashboard/alerts" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
