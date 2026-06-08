import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, Download } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export const OrdersList: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMachine, setFilterMachine] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const fetchData = async () => {
    try {
      const [ordersRes, machinesRes] = await Promise.all([
        api.get('/orders'),
        api.get('/machines')
      ]);
      setOrders(ordersRes.data);
      setMachines(machinesRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExport = async () => {
    try {
      const res = await api.get('/orders/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ordenes_silcar.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error al exportar órdenes');
    }
  };

  const handleDelete = async (id: number) => {
    if (user?.role !== 'ADMIN') {
      alert('Solo el administrador puede eliminar órdenes');
      return;
    }
    if (window.confirm('¿Está seguro de eliminar esta orden?')) {
      try {
        await api.delete(`/orders/${id}`);
        fetchData();
      } catch (err) {
        alert('Error al eliminar la orden');
      }
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
    
    const matchesDate = !filterDate || new Date(order.createdAt).toLocaleDateString() === new Date(filterDate).toLocaleDateString();
    
    const matchesMachine = filterMachine === 'ALL' || order.processes?.some((p: any) => p.machineId === parseInt(filterMachine));

    return matchesSearch && matchesStatus && matchesDate && matchesMachine;
  });

  return (
    <div>
      <div className="header-actions-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>Órdenes de Producción</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión integrada de pedidos y especificaciones.</p>
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
          {(user?.role === 'ADMIN' || user?.role === 'MACHINE') && (
            <Link to="/ordenes/nueva" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', padding: '0.75rem 1.5rem' }}>
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
              placeholder="Buscar por N° o cliente..." 
              className="input"
              style={{ width: '100%', paddingLeft: '45px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">Todos los estados</option>
            <option value="EN_PROCESO">En Proceso</option>
            <option value="FINALIZADA">Finalizada</option>
          </select>
          <select className="input" value={filterMachine} onChange={(e) => setFilterMachine(e.target.value)}>
            <option value="ALL">Todas las máquinas</option>
            {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input 
            type="date" 
            className="input" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
      </div>

      <div className="card table-responsive" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
           <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando órdenes...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1.25rem' }}>N° Orden</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-row">
                  <td data-label="N° Orden" style={{ padding: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{order.orderNumber}</td>
                  <td data-label="Cliente" style={{ color: 'var(--text-muted)' }}>{order.client?.name}</td>
                  <td data-label="Producto">{order.product?.name}</td>
                  <td data-label="Fecha" style={{ fontSize: '0.85rem' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td data-label="Estado">
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td data-label="Acciones">
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/ordenes/${order.id}`} style={{ color: 'var(--text-muted)', background: 'none' }} title="Ver Detalle"><Eye size={18} /></Link>
                      <Link to={`/ordenes/editar/${order.id}`} style={{ color: 'var(--primary)', background: 'none' }} title="Editar Orden"><Edit size={18} /></Link>
                      <button onClick={() => handleDelete(order.id)} style={{ color: 'var(--danger)', background: 'none' }} title="Eliminar"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron órdenes.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
