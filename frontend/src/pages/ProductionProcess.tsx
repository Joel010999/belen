import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Play, Square, Save, AlertTriangle, Layers, Droplets, Scissors, Clipboard } from 'lucide-react';
import { FormSection } from '../components/FormSection';

export const ProductionProcess: React.FC = () => {
    const [activeStage, setActiveStage] = useState<'IMPRESION' | 'LAMINACION' | 'REFILADO'>('IMPRESION');
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrderId, setSelectedOrderId] = useState<string>("");
    const [machines, setMachines] = useState<any[]>([]);
    const [operators, setOperators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRunning, setIsRunning] = useState(false);

    // Dynamic State per Stage
    const [stageData, setStageData] = useState({
        machineId: "",
        operatorId: "",
        exitSense: "Sentido A",
        processedMeters: "",
        coilDiameter: "",
        coilCount: "",
        mixProportion: "",
        scrapKg: "0",
        observations: ""
    });

    useEffect(() => {
        const fetchFloorData = async () => {
            try {
                const [ordersRes, mRes, opRes] = await Promise.all([
                    api.get(`/orders`),
                    api.get(`/machines`),
                    api.get(`/operators`)
                ]);
                setOrders(ordersRes.data.filter((o: any) => o.status !== 'CERRADA'));
                setMachines(mRes.data);
                setOperators(opRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFloorData();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setStageData({ ...stageData, [e.target.name]: e.target.value });
    };

    const handleSaveProcess = async () => {
        if (!selectedOrderId) return alert("Seleccione una orden");
        try {
            const payload = {
                orderId: selectedOrderId,
                type: activeStage,
                machineId: stageData.machineId,
                operatorId: stageData.operatorId,
                scrapKg: stageData.scrapKg,
                observations: stageData.observations,
                specificData: {
                    exitSense: stageData.exitSense,
                    processedMeters: stageData.processedMeters,
                    coilDiameter: stageData.coilDiameter,
                    coilCount: stageData.coilCount,
                    mixProportion: stageData.mixProportion
                }
            };
            await api.post(`/orders/processes`, payload);
            alert("Etapa guardada correctamente");
            setIsRunning(false);
        } catch (err) {
            alert("Error al guardar proceso");
        }
    };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando planta...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Operación en Planta</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Registro de actividad productiva en tiempo real.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: '300px' }}>
                        <label className="label">Seleccionar Orden</label>
                        <select className="input" value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
                            <option value="">Seleccione OP...</option>
                            {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.product?.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
                <StageTab active={activeStage === 'IMPRESION'} onClick={() => setActiveStage('IMPRESION')} icon={<Layers />} title="IMPRESIÓN" step="1" />
                <StageTab active={activeStage === 'LAMINACION'} onClick={() => setActiveStage('LAMINACION')} icon={<Droplets />} title="LAMINACIÓN" step="2" />
                <StageTab active={activeStage === 'REFILADO'} onClick={() => setActiveStage('REFILADO')} icon={<Scissors />} title="REFILADO" step="3" />
            </div>

            <div className="card" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', flex: 1 }}>
                        <div>
                            <label className="label">Máquina</label>
                            <select name="machineId" value={stageData.machineId} onChange={handleInputChange} className="input">
                                <option value="">Seleccionar máquina...</option>
                                {machines.filter(m => m.type === activeStage).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Operario</label>
                            <select name="operatorId" value={stageData.operatorId} onChange={handleInputChange} className="input">
                                <option value="">Seleccionar operario...</option>
                                {operators.map(o => <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>)}
                            </select>
                        </div>
                    </div>
                    <div style={{ paddingLeft: '2rem' }}>
                        {!isRunning ? (
                            <button onClick={() => setIsRunning(true)} className="btn btn-primary" style={{ backgroundColor: 'var(--success)', height: '100%', padding: '0 2rem' }}>
                                <Play size={20} /> INICIAR
                            </button>
                        ) : (
                            <button onClick={() => setIsRunning(false)} className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', height: '100%', padding: '0 2rem' }}>
                                <Square size={20} /> DETENER
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {(activeStage === 'IMPRESION' || activeStage === 'REFILADO') && (
                            <div>
                                <label className="label">Sentido Salida Cliente</label>
                                <select name="exitSense" value={stageData.exitSense} onChange={handleInputChange} className="input">
                                    <option>Sentido A</option>
                                    <option>Sentido B</option>
                                </select>
                            </div>
                        )}
                        {activeStage === 'LAMINACION' && (
                            <div>
                                <label className="label">Proporción de Mezcla</label>
                                <input name="mixProportion" value={stageData.mixProportion} onChange={handleInputChange} className="input" placeholder="Ej: 100:15" />
                            </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="label">Metros Procesados</label>
                                <input name="processedMeters" value={stageData.processedMeters} onChange={handleInputChange} type="number" className="input" placeholder="0.00" />
                            </div>
                            <div>
                                <label className="label">Scrap (Kg)</label>
                                <input name="scrapKg" value={stageData.scrapKg} onChange={handleInputChange} type="number" className="input" style={{ borderColor: 'var(--danger)' }} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="label">Observaciones de Turno</label>
                        <textarea name="observations" value={stageData.observations} onChange={handleInputChange} className="input" style={{ height: '120px' }} placeholder="Detalles de fallas, cambios de bobinas, etc."></textarea>
                    </div>
                </div>

                <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleSaveProcess} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 3rem' }}>
                        <Save size={20} /> REGISTRAR AVANCE
                    </button>
                </div>
            </div>
        </div>
    );
};

const StageTab = ({ active, onClick, icon, title, step }: any) => (
    <button 
        onClick={onClick}
        className="btn" 
        style={{ 
            flex: 1, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
            backgroundColor: active ? 'var(--primary)' : 'var(--bg-card)',
            color: active ? 'white' : 'var(--text-muted)',
            border: active ? 'none' : '1px solid var(--border)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
    >
        {React.cloneElement(icon, { size: 28 })}
        <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.7, margin: 0 }}>ETAPA {step}</p>
            <p style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0 }}>{title}</p>
        </div>
    </button>
);
