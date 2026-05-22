import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ClipboardList as Clipboard, Ruler, Layers, ArrowLeft, Play, FileText, Cpu, Users, Edit } from 'lucide-react';
import { FormSection } from '../components/FormSection';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orderRes = await api.get(`/orders/${id}`);
        setOrder(orderRes.data);
      } catch (err) {
        console.error("Error fetching order data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando orden...</div>;
  if (!order) return <div style={{ padding: '3rem', textAlign: 'center' }}>Orden no encontrada.</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/ordenes" style={{ color: 'var(--text-muted)' }}><ArrowLeft size={24} /></Link>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Orden #{order.orderNumber}</h1>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status.replace('_', ' ')}</span>
              <span style={{ color: 'var(--text-muted)' }}>Cliente: <b>{order.client?.name}</b></span>
            </div>
          </div>
        </div>
        <Link 
          to={`/ordenes/editar/${order.id}`} 
          className="btn btn-primary" 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '0.75rem', 
            padding: '1rem 2rem', fontSize: '1rem', fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)'
          }}
        >
          <Edit size={20} /> EDITAR ORDEN
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <FormSection title="Origen de la Orden" icon={<Cpu size={24} />}>
            <DataField label="Máquina de Creación" value={order.machine ? `${order.machine.name} (${order.machine.code})` : 'Administración'} />
            <div style={{ gridColumn: 'span 2' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Operadores de Turno (Creación)</p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {order.operatorsText ? (
                  <span className="status-badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                    {order.operatorsText}
                  </span>
                ) : (
                  order.operators?.map((op: any) => (
                    <span key={op.id} className="status-badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                      {op.operator.firstName} {op.operator.lastName}
                    </span>
                  ))
                )}
                {!order.operatorsText && (!order.operators || order.operators.length === 0) && <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No registrados</span>}
              </div>
            </div>
          </FormSection>

          <FormSection title="Especificación Técnica" icon={<Ruler size={24} />}>
            <DataField label="Medida Material" value={order?.technicalSpec?.materialMeasure} />
            <DataField label="Corte" value={order?.technicalSpec?.cut} />
            <DataField label="Lámina / Material" value={order?.technicalSpec?.lamina} />
            <DataField label="Metros Previstos" value={order?.technicalSpec?.meters ? order.technicalSpec.meters + ' m' : '-'} />
            <DataField label="Tubo" value={order?.technicalSpec?.tube} />
            <DataField label="Tipo Impresión" value={order?.technicalSpec?.printingType} />
            <DataField label="Pie" value={order?.technicalSpec?.pie} />
            <DataField label="Clisé Centro" value={order?.technicalSpec?.cliseCenter} />
          </FormSection>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--primary)" /> 
                Resumen de Lote
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.875rem' }}>Producto: <b>{order.product?.name}</b></p>
                <p style={{ fontSize: '0.875rem' }}>Objetivo: <b>{order.plannedQty.toLocaleString()} {order.unit}</b></p>
                <p style={{ fontSize: '0.875rem' }}>Fecha Alta: <b>{new Date(order.createdAt).toLocaleDateString()}</b></p>
            </div>
          </div>

          <FormSection title="Secuencia de Colores" icon={<Layers size={24} />}>
             <div style={{ gridColumn: 'span 2' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.5rem' }}>#</th>
                            <th>Color</th>
                            <th>Fórmula</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.colorOrders?.map((color: any) => (
                            <tr key={color.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.6rem 0.5rem', fontWeight: 800, color: 'var(--primary)' }}>{color.sequence}°</td>
                                <td>{color.colorName}</td>
                                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{color.formula || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </FormSection>

          {order.processes && order.processes.length > 0 && (
            <div className="card">
              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clipboard size={18} color="var(--primary)" /> 
                  Actividad de Producción
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {order.processes?.map((p: any) => (
                  <div key={p.id} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>{p.type}</span>
                      <span style={{ color: 'var(--primary)' }}>{p.scrapKg} kg scrap</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>Maq: {p.machine?.name} - Op: {p.operator?.firstName}</p>
                    
                    {p.materialLots && p.materialLots.length > 0 && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>Lotes de Material:</p>
                        {p.materialLots.map((l: any) => (
                          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                            <span>Lote: {l.lotNumber}</span>
                            <span>{l.totalUsedMeters} m</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DataField = ({ label, value }: { label: string, value: string }) => (
    <div>
        <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{label}</p>
        <p style={{ fontSize: '1rem', fontWeight: 600 }}>{value || '-'}</p>
    </div>
);
