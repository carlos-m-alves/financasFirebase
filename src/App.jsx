import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import { FilterProvider } from './context/FilterContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivacyProvider } from './context/PrivacyContext';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import StockDetail from './pages/StockDetail';
import Login from './pages/Login';

function ProtectedLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="login-page">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/stock/:ticker" element={<StockDetail />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PrivacyProvider>
          <FilterProvider>
            <AppRoutes />
          </FilterProvider>
        </PrivacyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
