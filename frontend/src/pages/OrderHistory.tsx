import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, Download, History } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

export const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/orders');
      // Filtramos para quedarnos solo con las finalizadas
      setOrders(res.data.filter((o: any) => o.status === 'Finalizadas'));
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/orders/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ordenes_historico_silcar.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Error al exportar órdenes');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClient = filterClient === '' || order.client?.name.toLowerCase().includes(filterClient.toLowerCase());
    const matchesProduct = filterProduct === '' || order.product?.name.toLowerCase().includes(filterProduct.toLowerCase());
    
    const orderDate = new Date(order.createdAt);
    const matchesDateFrom = !filterDateFrom || orderDate >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || orderDate <= new Date(filterDateTo);

    return matchesSearch && matchesClient && matchesProduct && matchesDateFrom && matchesDateTo;
  });

  return (
    <div className="fade-in">
      <div className="header-actions-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={36} color="#8b5cf6" /> Histórico de Órdenes
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Búsqueda avanzada de órdenes finalizadas.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleExport} 
            className="btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Download size={20} />
            Exportar Resultados
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Filtros de Búsqueda</h4>
        <div className="grid-filter" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="N° de Orden..." 
              className="input"
              style={{ width: '100%', paddingLeft: '45px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <input 
              type="text" 
              placeholder="Cliente..." 
              className="input"
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
          />
          <input 
              type="text" 
              placeholder="Producto..." 
              className="input"
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
          />
          <input 
            type="date" 
            title="Fecha Desde"
            className="input" 
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
          />
          <input 
            type="date" 
            title="Fecha Hasta"
            className="input" 
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
          />
        </div>
      </div>

      <div className="card table-responsive" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
           <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando histórico...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ padding: '1.25rem' }}>N° Orden</th>
                <th>Fecha Cierre</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Kg Consumidos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const totalKg = order.consumptions?.reduce((acc: number, c: any) => acc + (c.realQty || 0), 0) || 0;
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="hover-row">
                    <td data-label="N° Orden" style={{ padding: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{order.orderNumber}</td>
                    <td data-label="Fecha Cierre" style={{ fontSize: '0.85rem' }}>{order.closedAt ? new Date(order.closedAt).toLocaleDateString() : new Date(order.updatedAt).toLocaleDateString()}</td>
                    <td data-label="Cliente" style={{ color: 'var(--text-muted)' }}>{order.client?.name}</td>
                    <td data-label="Producto">{order.product?.name}</td>
                    <td data-label="Kg Consumidos">{totalKg.toFixed(2)} kg</td>
                    <td data-label="Acciones">
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to={`/ordenes/${order.id}`} style={{ color: 'var(--text-muted)', background: 'none' }} title="Ver Detalle"><Eye size={18} /></Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron órdenes finalizadas con estos filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
