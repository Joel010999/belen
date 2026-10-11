import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { OrdersList } from './pages/OrdersList';
import { ImportCSV } from './pages/ImportCSV';
import { ProductionProcess } from './pages/ProductionProcess';
import { OrderForm } from './pages/OrderForm';
import { OrderDetail } from './pages/OrderDetail';
import { StockView } from './pages/StockView';
import { LoginPage } from './pages/LoginPage';
import { AuditLogs } from './pages/AuditLogs';
import { CostDashboard } from './pages/CostDashboard';
import { OrderHistory } from './pages/OrderHistory';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import './index.css';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <LoginPage />;

  return (
    <Router>
      <Layout>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ordenes" element={<OrdersList />} />
            <Route path="/produccion" element={<ProductionProcess />} />
            <Route
              path="/ordenes/nueva"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'VENDEDOR']}>
                  <OrderForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ordenes/editar/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'VENDEDOR']}>
                  <OrderForm />
                </ProtectedRoute>
              }
            />
            <Route path="/ordenes/:id" element={<OrderDetail />} />
            <Route
              path="/stock"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <StockView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transferencia"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ImportCSV />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auditoria"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/costos"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <CostDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/historial" element={<OrderHistory />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
