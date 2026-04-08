import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Layout from './components/Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import StationsPage from './pages/StationsPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import StationDetailPage from './pages/StationDetailPage.jsx';
import SubmitReadingPage from './pages/SubmitReadingPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import PublicMapPage from './pages/PublicMapPage.jsx';

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
          <Route path="/map" element={<PublicMapPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="stations" element={<StationsPage />} />
            <Route path="stations/:id" element={<StationDetailPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="submit" element={<SubmitReadingPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
