import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CheckCircle, AlertTriangle, FileSearch, Save } from 'lucide-react';
import { FormSection } from '../components/FormSection';

export const QualityControl: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [operators, setOperators] = useState<any[]>([]);
    
    const [checklist, setChecklist] = useState([
        { item: 'Texto', conforme: false, valor: '', obs: '' },
        { item: 'Corte', conforme: false, valor: '', obs: '' },
        { item: 'Tono', conforme: false, valor: '', obs: '' },
        { item: 'Ancho Material', conforme: false, valor: '', obs: '' },
        { item: 'Producto', conforme: false, valor: '', obs: '' },
    ]);

    useEffect(() => {
        const fetchNeededData = async () => {
            try {
                const [ordersRes, opsRes] = await Promise.all([
                    api.get(`/orders`),
                    api.get(`/operators`)
                ]);
                setOrders(ordersRes.data.filter((o: any) => o.status === 'EN_PROCESO'));
                setOperators(opsRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchNeededData();
    }, []);

    const handleCheckChange = (index: number, field: string, value: any) => {
        const newChecklist = [...checklist];
        (newChecklist[index] as any)[field] = value;
        setChecklist(newChecklist);
    };

    const handleSave = async () => {
        if (!selectedOrder) return alert("Seleccione una orden");
        try {
            await api.post(`/orders/${selectedOrder.id}/finalize`);
            alert("Control de calidad aprobado y orden finalizada. Stock actualizado.");
            window.location.reload();
        } catch (err) {
            alert("Error al finalizar la orden");
        }
    };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>Control de Calidad</h1>
                <p style={{ color: 'var(--text-muted)' }}>Verificación final de parámetros técnicos por lote.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="card">
                        <label className="label">Seleccionar Orden en Planta</label>
                        <select className="input" onChange={(e) => setSelectedOrder(orders.find(o => o.id === parseInt(e.target.value)))}>
                            <option value="">Seleccione...</option>
                            {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.product?.name}</option>)}
                        </select>
                    </div>

                    {selectedOrder && (
                        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Detalle de Orden</h4>
                            <p style={{ fontSize: '0.875rem' }}>Cliente: <b>{selectedOrder.client?.name}</b></p>
                            <p style={{ fontSize: '0.875rem' }}>Producto: <b>{selectedOrder.product?.name}</b></p>
                            <p style={{ fontSize: '0.875rem' }}>Cant. Obj: <b>{selectedOrder.plannedQty}</b></p>
                        </div>
                    )}
                </div>

                <div>
                    <FormSection title="Checklist de Inspección" icon={<FileSearch size={24} />}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '0.5rem' }}>ÍTEM</th>
                                        <th>CONFORME</th>
                                        <th>OBSERVACIONES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {checklist.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem 0.5rem', fontWeight: 700 }}>{item.item}</td>
                                            <td>
                                                <input type="checkbox" checked={item.conforme} onChange={(e) => handleCheckChange(idx, 'conforme', e.target.checked)} style={{ width: '20px', height: '20px' }} />
                                            </td>
                                            <td><input className="input" style={{ padding: '0.4rem' }} value={item.obs} onChange={(e) => handleCheckChange(idx, 'obs', e.target.value)} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>RECHAZAR</button>
                                <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={20} /> APROBAR Y GUARDAR
                                </button>
                            </div>
                        </div>
                    </FormSection>
                </div>
            </div>
        </div>
    );
};
