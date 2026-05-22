import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { AuthProvider, useAuth } from './hooks/useAuth';
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
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ordenes" element={<OrdersList />} />
          <Route path="/ordenes/nueva" element={<OrderForm />} />
          <Route path="/ordenes/editar/:id" element={<OrderForm />} />
          <Route path="/ordenes/:id" element={<OrderDetail />} />
          <Route path="/control" element={<QualityControl />} />
          <Route path="/stock" element={<StockView />} />
          <Route path="/transferencia" element={<ImportCSV />} />
        </Routes>
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
