import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Download } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getOperationalStatusLabel, getOrderOperationalStatus, getStageLabel } from '../utils/orderStage';

const getCurrentMonth = () => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
};

export const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [filterMachine, setFilterMachine] = useState('ALL');
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const fetchData = async () => {
    try {
      const [ordersRes, machinesRes] = await Promise.all([
        api.get('/orders', { params: { month: filterMonth } }),
        api.get('/machines')
      ]);
      const enrichedOrders = ordersRes.data.map((order: any) => ({
        ...order,
        ...getOrderOperationalStatus(order)
      }));
      setOrders(enrichedOrders);
      setMachines(machinesRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [filterMonth]);

  const handleExport = async () => {
    try {
      const res = await api.get('/orders/export-csv', {
        params: { month: filterMonth },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ordenes_${filterMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Error al exportar ordenes');
    }
  };

  const handleDelete = async (id: number) => {
    if (user?.role !== 'ADMIN') {
      alert('Solo el administrador puede eliminar ordenes');
      return;
    }
    if (window.confirm('Estas seguro de eliminar esta orden?')) {
      try {
        await api.delete(`/orders/${id}`);
        fetchData();
      } catch {
        alert('Error al eliminar la orden');
      }
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'ACTIVE'
          ? order.operationalStatus !== 'FINALIZADA'
          : order.operationalStatus === filterStatus;

    const matchesMachine =
      filterMachine === 'ALL' || order.processes?.some((process: any) => process.machineId === parseInt(filterMachine, 10));

    return matchesSearch && matchesStatus && matchesMachine;
  });

  return (
    <div>
      <div className="header-actions-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>Ordenes de Produccion</h1>
          <p style={{ color: 'var(--text-muted)' }}>Seguimiento en vivo del avance por etapa.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={handleExport}
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)'
            }}
          >
            <Download size={20} />
            Exportar CSV
          </button>
          {user?.role === 'ADMIN' && (
            <Link
              to="/ordenes/nueva"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.75rem 1.5rem' }}
            >
              <Plus size={20} />
              Nueva Orden
            </Link>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div className="grid-filter" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por N o cliente..."
              className="input"
              style={{ width: '100%', paddingLeft: '45px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">Historico completo</option>
            <option value="ACTIVE">En curso</option>
            <option value="EN_IMPRESION">En impresion</option>
            <option value="EN_LAMINACION">En laminacion</option>
            <option value="EN_REFILADO">En refilado</option>
            <option value="PENDIENTE_CONTROL">Pendiente control</option>
            <option value="FINALIZADA">Finalizadas</option>
          </select>
          <select className="input" value={filterMachine} onChange={(e) => setFilterMachine(e.target.value)}>
            <option value="ALL">Todas las maquinas</option>
            {machines.map((machine) => (
              <option key={machine.id} value={machine.id}>{machine.name}</option>
            ))}
          </select>
          <input type="month" className="input" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
        </div>
      </div>

      <div className="card table-responsive" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando ordenes...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1.25rem' }}>N Orden</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Fecha</th>
                <th>Etapa</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-row">
                  <td data-label="N Orden" style={{ padding: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{order.orderNumber}</td>
                  <td data-label="Cliente" style={{ color: 'var(--text-muted)' }}>{order.client?.name}</td>
                  <td data-label="Producto">{order.product?.name || order.products?.[0]?.product?.name || '-'}</td>
                  <td data-label="Fecha" style={{ fontSize: '0.85rem' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td data-label="Etapa">{getStageLabel(order.currentStage)}</td>
                  <td data-label="Estado">
                    <span className="status-badge">{getOperationalStatusLabel(order.operationalStatus)}</span>
                  </td>
                  <td data-label="Acciones">
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/ordenes/${order.id}`} style={{ color: 'var(--text-muted)', background: 'none' }} title="Ver Detalle">
                        <Eye size={18} />
                      </Link>
                      {user?.role === 'ADMIN' && (
                        <>
                          <Link to={`/ordenes/editar/${order.id}`} style={{ color: 'var(--primary)', background: 'none' }} title="Editar Orden">
                            <Edit size={18} />
                          </Link>
                          <button onClick={() => handleDelete(order.id)} style={{ color: 'var(--danger)', background: 'none' }} title="Eliminar">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron ordenes para el mes seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
