import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, Plus, UserCheck } from 'lucide-react';

export const OperatorsView: React.FC = () => {
    const [operators, setOperators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOperators = async () => {
            try {
                const res = await api.get(`/operators`);
                setOperators(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchOperators();
    }, []);

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando personal...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Gestión de Operarios</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Panel administrativo de personal de planta.</p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} /> ALTA OPERARIO
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                            <th style={{ padding: '1.25rem' }}>Legajo</th>
                            <th>Nombre Completo</th>
                            <th>Rol</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {operators.map(o => (
                            <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1.25rem', fontWeight: 700 }}>#{o.legajo}</td>
                                <td>{o.firstName} {o.lastName}</td>
                                <td>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.2rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                                        {o.role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge status-${o.active ? 'cerrada' : 'cancelada'}`}>
                                        {o.active ? 'ACTIVO' : 'DE BAJA'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
