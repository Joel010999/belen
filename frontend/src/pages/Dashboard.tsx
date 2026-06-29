import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { SummaryCard } from '../components/SummaryCard';
import { ClipboardList, AlertCircle, FileCheck, FileOutput, Package, TrendingDown, Layers, Droplets, Scissors } from 'lucide-react';
import { getOperationalStatusLabel, getOrderOperationalStatus, getStageLabel } from '../utils/orderStage';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    openOrders: 0,
    finishedOrders: 0,
    pendingControl: 0,
    availableStock: 0,
    lowStockAlerts: 0,
    totalProcessedMeters: 0,
    totalScrapKg: 0,
    printingOrders: 0,
    laminationOrders: 0,
    refiladoOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, ordersRes, productsRes, suppliesRes] = await Promise.all([
          api.get('/orders/stats'),
          api.get('/orders'),
          api.get('/products'),
          api.get('/supplies')
        ]);

        const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
        const operationalOrders = orders.map((order: any) => ({
          ...order,
          ...getOrderOperationalStatus(order)
        }));

        const printingOrders = operationalOrders.filter((order: any) => order.operationalStatus === 'EN_IMPRESION').length;
        const laminationOrders = operationalOrders.filter((order: any) => order.operationalStatus === 'EN_LAMINACION').length;
        const refiladoOrders = operationalOrders.filter((order: any) => order.operationalStatus === 'EN_REFILADO').length;
        const pendingControl = operationalOrders.filter((order: any) => order.operationalStatus === 'PENDIENTE_CONTROL').length;
        const openOrders = operationalOrders.filter((order: any) => order.operationalStatus !== 'FINALIZADA').length;
        const finishedOrders = operationalOrders.filter((order: any) => order.operationalStatus === 'FINALIZADA').length;

        const stockItems = [
          ...productsRes.data.map((product: any) => product.stock).filter(Boolean),
          ...supplysToStocks(suppliesRes.data)
        ];

        const availableStock = stockItems.reduce((acc: number, item: any) => acc + (item?.stockActual || 0), 0);
        const lowStockAlerts = stockItems.filter((item: any) => (item?.stockActual || 0) < (item?.minStock || 100)).length;

        setStats((prev) => ({
          ...prev,
          ...(statsRes.data?.stats || {}),
          openOrders,
          finishedOrders,
          pendingControl,
          printingOrders,
          laminationOrders,
          refiladoOrders,
          availableStock,
          lowStockAlerts
        }));

        setRecentOrders(operationalOrders.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando panel...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>Panel de Control</h1>
        <p style={{ color: 'var(--text-muted)' }}>Vista viva del avance por etapa y alertas operativas.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <SummaryCard title="Ordenes Activas" value={stats.openOrders.toString()} icon={ClipboardList} color="var(--primary)" trend="En curso" />
        <SummaryCard title="Finalizadas" value={stats.finishedOrders.toString()} icon={FileCheck} color="var(--success)" trend="Cerradas" />
        <SummaryCard title="Pend. Control" value={stats.pendingControl.toString()} icon={AlertCircle} color="var(--warning)" trend="Supervisor" />
        <SummaryCard title="Stock Operativo" value={`${stats.availableStock.toLocaleString()} kg`} icon={Package} color="var(--accent)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <SummaryCard title="En Impresion" value={stats.printingOrders.toString()} icon={Layers} color="var(--primary)" />
        <SummaryCard title="En Laminacion" value={stats.laminationOrders.toString()} icon={Droplets} color="var(--accent)" />
        <SummaryCard title="En Refilado" value={stats.refiladoOrders.toString()} icon={Scissors} color="var(--warning)" />
        <SummaryCard title="Alertas Stock" value={stats.lowStockAlerts.toString()} icon={AlertCircle} color={stats.lowStockAlerts > 0 ? 'var(--danger)' : 'var(--success)'} trend={stats.lowStockAlerts > 0 ? 'Reponer' : 'OK'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <SummaryCard title="Metros Procesados" value={`${stats.totalProcessedMeters.toLocaleString()} m`} icon={FileOutput} color="var(--primary)" />
        <SummaryCard title="Chatarra / Scrap" value={`${stats.totalScrapKg.toLocaleString()} kg`} icon={TrendingDown} color="var(--warning)" trend="Material perdido" />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Package size={20} color="var(--primary)" />
          Ordenes Recientes
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem 0' }}>Orden</th>
              <th>Cliente</th>
              <th>Producto</th>
              <th>Etapa</th>
              <th>Estado Operativo</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '1rem 0', fontWeight: 700 }}>{order.orderNumber}</td>
                <td style={{ color: 'var(--text-muted)' }}>{order.client?.name}</td>
                <td>{order.product?.name || order.products?.[0]?.product?.name || '-'}</td>
                <td>{getStageLabel(order.currentStage)}</td>
                <td>
                  <span className="status-badge">{getOperationalStatusLabel(order.operationalStatus)}</span>
                </td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay ordenes recientes.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const supplysToStocks = (supplies: any[]) => supplies.map((supply) => supply.stock).filter(Boolean);
