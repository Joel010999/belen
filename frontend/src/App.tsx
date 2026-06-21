import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { OrdersList } from './pages/OrdersList';
import { ImportCSV } from './pages/ImportCSV';
import { ProductionProcess } from './pages/ProductionProcess';
import { OrderForm } from './pages/OrderForm';
import { OrderDetail } from './pages/OrderDetail';
import { QualityControl } from './pages/QualityControl';
import { StockView } from './pages/StockView';
import { MachinesView } from './pages/MachinesView';
import { OperatorsView } from './pages/OperatorsView';
import { LoginPage } from './pages/LoginPage';
import { AuditLogs } from './pages/AuditLogs';
import { CostDashboard } from './pages/CostDashboard';
import { OrderHistory } from './pages/OrderHistory';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Placeholder components for other routes
const Placeholder = ({ title }: { title: string }) => (
  <div>
    <h1 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '1rem' }}>{title}</h1>
    <div className="card">
      <p>Esta sección está en desarrollo para el sistema industrial Belén.</p>
    </div>
  </div>
);

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Router>
      <Layout>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ordenes" element={<OrdersList />} />
            <Route path="/ordenes/nueva" element={<OrderForm />} />
            <Route path="/ordenes/editar/:id" element={<OrderForm />} />
            <Route path="/ordenes/:id" element={<OrderDetail />} />
            <Route path="/control" element={<QualityControl />} />
            <Route path="/stock" element={<StockView />} />
            <Route path="/transferencia" element={<ImportCSV />} />
            <Route path="/auditoria" element={<AuditLogs />} />
            <Route path="/costos" element={<CostDashboard />} />
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
