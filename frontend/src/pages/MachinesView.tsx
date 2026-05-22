import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings, Plus, Monitor } from 'lucide-react';

export const MachinesView: React.FC = () => {
    const [machines, setMachines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMachines = async () => {
            try {
                const res = await api.get(`/machines`);
                setMachines(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMachines();
    }, []);

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando máquinas...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Configuración de Máquinas</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Gestión de activos físicos de la planta.</p>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={20} /> AÑADIR MÁQUINA
                </button>
            </div>

            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {machines.map(m => (
                    <div key={m.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '1rem', borderRadius: '12px' }}>
                            <Monitor size={32} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{m.name}</h3>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TIPO: {m.type}</p>
                            <div style={{ marginTop: '0.5rem' }}>
                                <span className={`status-badge status-${m.active ? 'cerrada' : 'cancelada'}`} style={{ fontSize: '0.65rem' }}>
                                    {m.active ? 'ACTIVA' : 'INACTIVA'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
