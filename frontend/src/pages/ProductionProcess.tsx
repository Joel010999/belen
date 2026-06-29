import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Play, Save, Layers, Droplets, Scissors, AlertTriangle, TimerReset } from 'lucide-react';
import { FormSection } from '../components/FormSection';
import { OrderConsumptions } from '../components/OrderConsumptions';
import { useAuth } from '../hooks/useAuth';
import type { LucideIcon } from 'lucide-react';

type StageType = 'IMPRESION' | 'LAMINACION' | 'REFILADO';

const STAGES: { key: StageType; label: string; icon: LucideIcon }[] = [
  { key: 'IMPRESION', label: 'Impresion', icon: Layers },
  { key: 'LAMINACION', label: 'Laminacion', icon: Droplets },
  { key: 'REFILADO', label: 'Refilado', icon: Scissors }
];

const createInitialStageData = () => ({
  machineId: '',
  operatorId: '',
  exitSense: '',
  processedMeters: '',
  coilDiameter: '',
  coilCount: '',
  mixProportion: '',
  scrapKg: '0',
  observations: '',
  tacaRight: '',
  tacaLeft: '',
  deCabeza: false,
  deTripa: false
});

export const ProductionProcess: React.FC = () => {
  const { user } = useAuth();
  const [activeStage, setActiveStage] = useState<StageType>('IMPRESION');
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [machines, setMachines] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTimeLog, setSavingTimeLog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processSuccess, setProcessSuccess] = useState<string | null>(null);
  const [stageData, setStageData] = useState(createInitialStageData());
  const [timeLogData, setTimeLogData] = useState({
    operatorId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    if (user?.role === 'MACHINE' && user.machine?.type) {
      const normalizedType = String(user.machine.type).toUpperCase() as StageType;
      if (STAGES.some((stage) => stage.key === normalizedType)) {
        setActiveStage(normalizedType);
        setStageData((prev) => ({ ...prev, machineId: user.machine?.id?.toString() || prev.machineId }));
      }
    }
  }, [user?.machine?.id, user?.machine?.type, user?.role]);

  const fetchOrders = async () => {
    const ordersRes = await api.get('/orders');
    setOrders(ordersRes.data.filter((order: any) => order.status !== 'Finalizadas'));
  };

  const fetchSelectedOrder = async (orderId: string) => {
    if (!orderId) {
      setSelectedOrder(null);
      return;
    }
    const orderRes = await api.get(`/orders/${orderId}`);
    setSelectedOrder(orderRes.data);
  };

  useEffect(() => {
    const fetchFloorData = async () => {
      try {
        const [machinesRes, operatorsRes] = await Promise.all([
          api.get('/machines'),
          api.get('/operators')
        ]);
        setMachines(machinesRes.data);
        setOperators(operatorsRes.data);
        await fetchOrders();
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la operacion de planta.');
      } finally {
        setLoading(false);
      }
    };

    fetchFloorData();
  }, []);

  useEffect(() => {
    fetchSelectedOrder(selectedOrderId).catch((err) => {
      console.error(err);
      setError('No se pudo cargar el detalle de la orden seleccionada.');
    });
  }, [selectedOrderId]);

  useEffect(() => {
    setStageData((prev) => ({
      ...createInitialStageData(),
      machineId: user?.role === 'MACHINE' && user.machine?.type?.toUpperCase() === activeStage
        ? user.machine.id.toString()
        : ''
    }));
    setProcessSuccess(null);
    setTimeLogData({
      operatorId: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      startTime: '',
      endTime: ''
    });
  }, [activeStage, user?.machine?.id, user?.machine?.type, user?.role]);

  const StageIcon = useMemo(() => STAGES.find((stage) => stage.key === activeStage)?.icon || Layers, [activeStage]);
  const currentMachineLocked = user?.role === 'MACHINE' && user.machine?.type?.toUpperCase() === activeStage;
  const canUseConsumptions = activeStage === 'IMPRESION' || activeStage === 'LAMINACION';
  const currentStageLogs = useMemo(() => {
    const stageProcess = selectedOrder?.processes?.filter((process: any) => process.type === activeStage) || [];
    return stageProcess.flatMap((process: any) => process.timeLogs || []);
  }, [activeStage, selectedOrder]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const { name } = target;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
    setStageData((prev) => ({ ...prev, [name]: value as any }));
  };

  const handleTimeLogChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTimeLogData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProcess = async () => {
    if (!selectedOrderId) {
      setError('Seleccione una orden antes de registrar la etapa.');
      return;
    }

    if (!stageData.machineId) {
      setError('Debe indicar la maquina de la etapa.');
      return;
    }

    setSaving(true);
    setError(null);
    setProcessSuccess(null);

    try {
      const payload: any = {
        orderId: selectedOrderId,
        type: activeStage,
        machineId: stageData.machineId,
        operatorId: stageData.operatorId || undefined,
        scrapKg: stageData.scrapKg,
        observations: stageData.observations,
        specificData: {}
      };

      if (activeStage === 'IMPRESION') {
        payload.specificData = {
          exitSense: stageData.exitSense || undefined,
          processedMeters: stageData.processedMeters || undefined,
          coilDiameter: stageData.coilDiameter || undefined,
          coilCount: stageData.coilCount || undefined
        };
      }

      if (activeStage === 'LAMINACION') {
        payload.specificData = {
          mixProportion: stageData.mixProportion || undefined,
          processedMeters: stageData.processedMeters || undefined
        };
      }

      if (activeStage === 'REFILADO') {
        payload.specificData = {
          exitSense: stageData.exitSense || undefined,
          tacaRight: stageData.tacaRight || undefined,
          tacaLeft: stageData.tacaLeft || undefined,
          deCabeza: stageData.deCabeza,
          deTripa: stageData.deTripa,
          coilDiameter: stageData.coilDiameter || undefined,
          processedMeters: stageData.processedMeters || undefined,
          coilCount: stageData.coilCount || undefined
        };
      }

      await api.post('/orders/processes', payload);
      await fetchSelectedOrder(selectedOrderId);
      await fetchOrders();
      setProcessSuccess(`Etapa ${activeStage.toLowerCase()} registrada. Si ahora confirmas consumos, el stock se descuenta en el momento.`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo registrar el avance de la etapa.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTimeLog = async () => {
    if (!selectedOrderId) {
      setError('Selecciona una orden antes de cargar tiempos.');
      return;
    }

    setSavingTimeLog(true);
    setError(null);

    try {
      await api.post(`/orders/${selectedOrderId}/time-logs`, {
        stage: activeStage,
        ...timeLogData
      });
      await fetchSelectedOrder(selectedOrderId);
      setTimeLogData((prev) => ({
        ...prev,
        description: '',
        startTime: '',
        endTime: ''
      }));
      setProcessSuccess(`Tiempo de ${activeStage.toLowerCase()} registrado correctamente.`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo registrar el tiempo de la etapa.');
    } finally {
      setSavingTimeLog(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando planta...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>Operacion en Planta</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Registra el avance real por etapa y descuenta stock al confirmar consumos.
          </p>
        </div>
        <div style={{ minWidth: '320px' }}>
          <label className="label">Orden asignada</label>
          <select className="input" value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)}>
            <option value="">Seleccione una orden...</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.orderNumber} - {order.client?.name} - {order.product?.name || order.products?.[0]?.product?.name || 'Sin producto'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {STAGES.map((stage) => {
          const isLocked = user?.role === 'MACHINE' && user.machine?.type?.toUpperCase() !== stage.key;
          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => !isLocked && setActiveStage(stage.key)}
              className="btn"
              disabled={isLocked}
              style={{
                flex: 1,
                minWidth: '220px',
                padding: '1rem 1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                backgroundColor: activeStage === stage.key ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                color: activeStage === stage.key ? 'white' : 'var(--text-muted)',
                border: activeStage === stage.key ? 'none' : '1px solid var(--border)',
                opacity: isLocked ? 0.4 : 1
              }}
            >
              <stage.icon size={22} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, opacity: 0.7, margin: 0 }}>ETAPA</p>
                <p style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>{stage.label}</p>
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="card" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--danger)', color: 'var(--danger)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {processSuccess && (
        <div className="card" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success)', color: 'var(--success)', marginBottom: '1.5rem' }}>
          {processSuccess}
        </div>
      )}

      {!selectedOrder && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          Selecciona una orden para ver su ficha tecnica y registrar la etapa.
        </div>
      )}

      {selectedOrder && (
        <>
          <FormSection title="Referencia de la Orden" icon={<StageIcon size={22} />}>
            <div>
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Orden</p>
              <p style={{ fontWeight: 800 }}>{selectedOrder.orderNumber}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Cliente</p>
              <p style={{ fontWeight: 700 }}>{selectedOrder.client?.name || '-'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Producto</p>
              <p style={{ fontWeight: 700 }}>
                {selectedOrder.product?.name || selectedOrder.products?.[0]?.product?.name || '-'}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Trabajo</p>
              <p style={{ fontWeight: 700 }}>{selectedOrder.workType ? String(selectedOrder.workType).replaceAll('_', ' ') : '-'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Metros Planificados</p>
              <p style={{ fontWeight: 700 }}>{selectedOrder.technicalSpec?.meters || '-'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Muestra</p>
              <p style={{ fontWeight: 700 }}>{selectedOrder.hasSample ? 'Si' : 'No'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Material</p>
              <p style={{ fontWeight: 700 }}>{selectedOrder.technicalSpec?.lamina || '-'}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Configuracion</p>
              <p style={{ fontWeight: 700 }}>
                {selectedOrder.technicalSpec?.printingType || '-'} / Pie {selectedOrder.technicalSpec?.pie || '-'} / Cabeza {selectedOrder.technicalSpec?.cabeza || '-'}
              </p>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.3rem' }}>Descripcion</p>
              <p style={{ whiteSpace: 'pre-line' }}>{selectedOrder.specifications || selectedOrder.observations || '-'}</p>
            </div>
          </FormSection>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <StageIcon size={22} color="var(--primary)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Registro de {activeStage.toLowerCase()}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="label">Maquina</label>
                <select
                  name="machineId"
                  value={stageData.machineId}
                  onChange={handleInputChange}
                  className="input"
                  disabled={currentMachineLocked}
                >
                  <option value="">Seleccionar maquina...</option>
                  {machines
                    .filter((machine) => String(machine.type).toUpperCase() === activeStage)
                    .map((machine) => (
                      <option key={machine.id} value={machine.id}>{machine.name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="label">Operario</label>
                <select name="operatorId" value={stageData.operatorId} onChange={handleInputChange} className="input">
                  <option value="">Seleccionar operario...</option>
                  {operators.map((operator) => (
                    <option key={operator.id} value={operator.id}>{operator.firstName} {operator.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Metros reales</label>
                <input name="processedMeters" value={stageData.processedMeters} onChange={handleInputChange} type="number" className="input" placeholder="0" />
              </div>
              <div>
                <label className="label">Scrap (kg)</label>
                <input name="scrapKg" value={stageData.scrapKg} onChange={handleInputChange} type="number" className="input" />
              </div>

              {(activeStage === 'IMPRESION' || activeStage === 'REFILADO') && (
                <div>
                  <label className="label">Sentido de salida</label>
                  <input name="exitSense" value={stageData.exitSense} onChange={handleInputChange} type="text" className="input" placeholder="Ej: Cliente hacia arriba" />
                </div>
              )}

              {activeStage === 'IMPRESION' && (
                <>
                  <div>
                    <label className="label">Diametro bobina</label>
                    <input name="coilDiameter" value={stageData.coilDiameter} onChange={handleInputChange} type="number" className="input" />
                  </div>
                  <div>
                    <label className="label">Cantidad de bobinas</label>
                    <input name="coilCount" value={stageData.coilCount} onChange={handleInputChange} type="number" className="input" />
                  </div>
                </>
              )}

              {activeStage === 'LAMINACION' && (
                <div>
                  <label className="label">Proporcion de mezcla</label>
                  <input name="mixProportion" value={stageData.mixProportion} onChange={handleInputChange} type="text" className="input" placeholder="Ej: 100:15" />
                </div>
              )}

              {activeStage === 'REFILADO' && (
                <>
                  <div>
                    <label className="label">Taca derecha</label>
                    <input name="tacaRight" value={stageData.tacaRight} onChange={handleInputChange} type="text" className="input" />
                  </div>
                  <div>
                    <label className="label">Taca izquierda</label>
                    <input name="tacaLeft" value={stageData.tacaLeft} onChange={handleInputChange} type="text" className="input" />
                  </div>
                  <div>
                    <label className="label">Diametro bobina</label>
                    <input name="coilDiameter" value={stageData.coilDiameter} onChange={handleInputChange} type="number" className="input" />
                  </div>
                  <div>
                    <label className="label">Cantidad de bobinas</label>
                    <input name="coilCount" value={stageData.coilCount} onChange={handleInputChange} type="number" className="input" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" name="deCabeza" checked={stageData.deCabeza} onChange={handleInputChange} />
                      De cabeza
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" name="deTripa" checked={stageData.deTripa} onChange={handleInputChange} />
                      De tripa
                    </label>
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: '1.2rem' }}>
              <label className="label">Observaciones operativas / paradas registradas</label>
              <textarea
                name="observations"
                value={stageData.observations}
                onChange={handleInputChange}
                className="input"
                style={{ minHeight: '110px', resize: 'vertical' }}
                placeholder="Ej: 08:15 paro por rotura de cuchilla / 09:05 reinicio / cambio de bobina"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                <TimerReset size={16} />
                Registra aqui el avance de etapa. Los consumos se confirman aparte y descuentan stock en el momento.
              </div>
              <button onClick={handleSaveProcess} disabled={saving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1.6rem' }}>
                {saving ? <Play size={18} /> : <Save size={18} />}
                <span>{saving ? 'GUARDANDO...' : 'REGISTRAR ETAPA'}</span>
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <TimerReset size={20} color="var(--primary)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Paradas y tiempos de {activeStage.toLowerCase()}</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="label">Operario del evento</label>
                <select name="operatorId" value={timeLogData.operatorId} onChange={handleTimeLogChange} className="input">
                  <option value="">Seleccionar operario...</option>
                  {operators.map((operator) => (
                    <option key={operator.id} value={operator.id}>{operator.firstName} {operator.lastName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Fecha</label>
                <input name="date" type="date" value={timeLogData.date} onChange={handleTimeLogChange} className="input" />
              </div>
              <div>
                <label className="label">Hora inicio</label>
                <input name="startTime" type="time" value={timeLogData.startTime} onChange={handleTimeLogChange} className="input" />
              </div>
              <div>
                <label className="label">Hora fin</label>
                <input name="endTime" type="time" value={timeLogData.endTime} onChange={handleTimeLogChange} className="input" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="label">Descripcion del evento</label>
                <input
                  name="description"
                  value={timeLogData.description}
                  onChange={handleTimeLogChange}
                  className="input"
                  placeholder="Ej: paro por rotura / cambio de bobina / ajuste"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={handleSaveTimeLog} disabled={savingTimeLog} className="btn btn-primary">
                {savingTimeLog ? 'Guardando...' : 'Guardar Tiempo'}
              </button>
            </div>

            <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              {currentStageLogs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Todavia no hay eventos registrados en esta etapa.</p>
              ) : (
                currentStageLogs.map((log: any) => (
                  <div key={log.id} style={{ padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <strong>{log.operator ? `${log.operator.firstName} ${log.operator.lastName}` : 'Sin operario'}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {new Date(log.date).toLocaleDateString()} {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(log.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}>{log.description || 'Sin descripcion'}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {canUseConsumptions && (
            <OrderConsumptions
              order={selectedOrder}
              onUpdate={() => fetchSelectedOrder(selectedOrderId)}
              lockedTab={activeStage === 'IMPRESION' ? 'PRINTING' : 'LAMINATION'}
            />
          )}
        </>
      )}
    </div>
  );
};
