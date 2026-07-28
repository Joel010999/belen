import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { Play, Save, Layers, Droplets, Scissors, AlertTriangle, TimerReset, PackageCheck, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { FormSection } from '../components/FormSection';
import { OrderConsumptions } from '../components/OrderConsumptions';
import { useAuth } from '../hooks/useAuth';
import type { LucideIcon } from 'lucide-react';

type StageType = 'IMPRESION' | 'LAMINACION' | 'REFILADO' | 'CONFECCION';

const STAGES: { key: StageType; label: string; icon: LucideIcon }[] = [
  { key: 'IMPRESION', label: 'Impresion', icon: Layers },
  { key: 'LAMINACION', label: 'Laminacion', icon: Droplets },
  { key: 'REFILADO', label: 'Refilado', icon: Scissors },
  { key: 'CONFECCION', label: 'Confeccion', icon: PackageCheck }
];

const getLogDurationMinutes = (log: any) => {
  const start = new Date(log.startTime).getTime();
  const end = new Date(log.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round((end - start) / 60000);
};

const getInputDurationMinutes = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return 0;
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  if ([startHours, startMinutes, endHours, endMinutes].some((value) => Number.isNaN(value))) return 0;
  const startTotal = startHours * 60 + startMinutes;
  const endTotal = endHours * 60 + endMinutes;
  return endTotal > startTotal ? endTotal - startTotal : 0;
};

const formatDuration = (minutes: number) => {
  if (!minutes) return '0 min';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours && remainingMinutes) return `${hours} h ${remainingMinutes} min`;
  if (hours) return `${hours} h`;
  return `${remainingMinutes} min`;
};

const formatLogDate = (value: string) => new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC'
}).format(new Date(value));

const formatLogTime = (value: string) => new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC'
}).format(new Date(value));

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
  dePie: false,
  deCabeza: false,
  deTripa: false,
  anchoEspira: '',
  controlName: '',
  tacaDerIzq: '',
  finalAnchoEspira: '',
  finalExitSense: '',
  bobbinCountName: ''
});

const createInitialMaterialLot = () => ({
  lotNumber: '',
  kg: '',
  initialMeters: '',
  addedMeters: '',
  finalMeters: '',
  observations: ''
});

const createInitialOutputBobbin = (index = 1) => ({
  label: `Bobina ${index}`,
  kg: '',
  notes: ''
});

const APPROVAL_FIELDS: Record<StageType, string> = {
  IMPRESION: 'approvedPrinting',
  LAMINACION: 'approvedLamination',
  REFILADO: 'approvedRefilado',
  CONFECCION: 'approvedConfeccion'
};

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
  const [materialLots, setMaterialLots] = useState([createInitialMaterialLot()]);
  const [refiladoOutputBobbins, setRefiladoOutputBobbins] = useState([createInitialOutputBobbin()]);
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
    setOrders(ordersRes.data.filter((order: any) => order.status !== 'Finalizadas' && order.status !== 'Entregadas'));
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
    setMaterialLots([createInitialMaterialLot()]);
    setRefiladoOutputBobbins([createInitialOutputBobbin()]);
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
  const currentStageTotalMinutes = useMemo(() => (
    currentStageLogs.reduce((acc: number, log: any) => acc + getLogDurationMinutes(log), 0)
  ), [currentStageLogs]);
  const currentInputDurationMinutes = useMemo(() => (
    getInputDurationMinutes(timeLogData.startTime, timeLogData.endTime)
  ), [timeLogData.startTime, timeLogData.endTime]);
  const plannedStages = useMemo(() => {
    const processTypes = new Set((selectedOrder?.processes || []).map((process: any) => process.type));
    return STAGES.map((stage) => stage.key).filter((stage) => processTypes.has(stage));
  }, [selectedOrder]);
  const stageProcess = useMemo(() => {
    const processes = selectedOrder?.processes?.filter((process: any) => process.type === activeStage && process.status !== 'Planificada') || [];
    return processes.sort((a: any, b: any) => {
      const left = new Date(b.endTime || b.startTime || 0).getTime();
      const right = new Date(a.endTime || a.startTime || 0).getTime();
      return left - right;
    })[0];
  }, [activeStage, selectedOrder]);
  const isStagePlanned = plannedStages.includes(activeStage);
  const isStageInProcess = stageProcess?.status === 'en_proceso';
  const isStageFinished = Boolean(selectedOrder?.[APPROVAL_FIELDS[activeStage]]) || stageProcess?.status === 'finalizado';
  const allPlannedStagesFinished = plannedStages.length > 0 && plannedStages.every((stage) => {
    const process = selectedOrder?.processes
      ?.filter((item: any) => item.type === stage && item.status !== 'Planificada')
      ?.sort((a: any, b: any) => new Date(b.endTime || b.startTime || 0).getTime() - new Date(a.endTime || a.startTime || 0).getTime())[0];
    return Boolean(selectedOrder?.[APPROVAL_FIELDS[stage]]) || process?.status === 'finalizado';
  });
  const canMarkProductFinished = Boolean(
    selectedOrder &&
    selectedOrder.status !== 'Finalizadas' &&
    selectedOrder.status !== 'Entregadas' &&
    allPlannedStagesFinished
  );

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

  const updateMaterialLot = (index: number, field: string, value: string) => {
    setMaterialLots((prev) => prev.map((lot, lotIndex) => lotIndex === index ? { ...lot, [field]: value } : lot));
  };

  const addMaterialLot = () => {
    setMaterialLots((prev) => [...prev, createInitialMaterialLot()]);
  };

  const removeMaterialLot = (index: number) => {
    setMaterialLots((prev) => prev.length === 1 ? [createInitialMaterialLot()] : prev.filter((_, lotIndex) => lotIndex !== index));
  };

  const updateOutputBobbin = (index: number, field: string, value: string) => {
    setRefiladoOutputBobbins((prev) => prev.map((bobbin, bobbinIndex) => bobbinIndex === index ? { ...bobbin, [field]: value } : bobbin));
  };

  const addOutputBobbin = () => {
    setRefiladoOutputBobbins((prev) => [...prev, createInitialOutputBobbin(prev.length + 1)]);
  };

  const removeOutputBobbin = (index: number) => {
    setRefiladoOutputBobbins((prev) => (
      prev.length === 1 ? [createInitialOutputBobbin()] : prev.filter((_, bobbinIndex) => bobbinIndex !== index)
    ));
  };

  const totalOutputKg = useMemo(() => (
    refiladoOutputBobbins.reduce((acc, bobbin) => acc + (parseFloat(bobbin.kg) || 0), 0)
  ), [refiladoOutputBobbins]);

  const handleStageAction = async (action: 'START' | 'FINISH') => {
    if (!selectedOrderId) {
      setError('Seleccione una orden antes de avanzar la etapa.');
      return;
    }

    if (!isStagePlanned) {
      setError(`La etapa ${activeStage.toLowerCase()} no esta planificada para esta orden.`);
      return;
    }

    setSaving(true);
    setError(null);
    setProcessSuccess(null);

    try {
      await api.post(`/orders/${selectedOrderId}/stage-action`, {
        stage: activeStage,
        action,
        machineId: stageData.machineId || undefined,
        operatorId: stageData.operatorId || undefined
      });
      await fetchSelectedOrder(selectedOrderId);
      await fetchOrders();
      setProcessSuccess(action === 'START'
        ? `${activeStage.toLowerCase()} marcada en proceso.`
        : `${activeStage.toLowerCase()} terminada. Ya puede continuar la siguiente etapa planificada.`
      );
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo actualizar el estado de la etapa.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkProductFinished = async () => {
    if (!selectedOrderId) return;

    if (!window.confirm('Marcar esta orden como producto terminado? Esto suma el producto terminado al stock.')) return;

    setSaving(true);
    setError(null);
    setProcessSuccess(null);

    try {
      await api.post(`/orders/${selectedOrderId}/finalize`);
      await fetchSelectedOrder(selectedOrderId);
      await fetchOrders();
      setProcessSuccess('Producto terminado registrado. Marcos/administracion luego puede marcarlo como entregado.');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo marcar producto terminado.');
    } finally {
      setSaving(false);
    }
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

      const lotsToSave = materialLots
        .filter((lot) => lot.lotNumber.trim())
        .map((lot) => ({
          lotNumber: lot.lotNumber.trim(),
          kg: lot.kg || 0,
          initialMeters: lot.initialMeters || 0,
          addedMeters: lot.addedMeters || 0,
          finalMeters: lot.finalMeters || 0,
          observations: lot.observations || undefined
        }));

      if (lotsToSave.length > 0) {
        payload.materialLots = lotsToSave;
      }

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
          dePie: stageData.dePie,
          deCabeza: stageData.deCabeza,
          anchoEspira: stageData.anchoEspira || undefined,
          coilDiameter: stageData.coilDiameter || undefined,
          processedMeters: stageData.processedMeters || undefined,
          coilCount: stageData.coilCount || undefined,
          controlName: stageData.controlName || undefined,
          tacaDerIzq: stageData.tacaDerIzq || undefined,
          finalAnchoEspira: stageData.finalAnchoEspira || undefined,
          finalExitSense: stageData.finalExitSense || undefined,
          bobbinCountName: stageData.bobbinCountName || undefined,
          outputBobbins: refiladoOutputBobbins
            .filter((bobbin) => bobbin.kg)
            .map((bobbin, index) => ({
              label: bobbin.label.trim() || `Bobina ${index + 1}`,
              kg: bobbin.kg || 0,
              notes: bobbin.notes || undefined
            }))
        };
      }

      await api.post('/orders/processes', payload);
      await fetchSelectedOrder(selectedOrderId);
      await fetchOrders();
      setProcessSuccess(
        canUseConsumptions
          ? `Etapa ${activeStage.toLowerCase()} registrada. Si ahora confirmas consumos, el stock se actualiza en el momento.`
          : `Etapa ${activeStage.toLowerCase()} registrada correctamente.`
      );
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

          <div className="card" style={{ marginTop: '1.5rem', border: '1px solid rgba(37, 99, 235, 0.25)', backgroundColor: 'rgba(37, 99, 235, 0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.3rem' }}>Estado de {activeStage.toLowerCase()}</p>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                  {!isStagePlanned
                    ? 'Etapa no planificada'
                    : isStageFinished
                      ? 'Etapa terminada'
                      : isStageInProcess
                        ? 'En proceso'
                        : 'Pendiente de inicio'}
                </h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem', fontSize: '0.9rem' }}>
                  {isStagePlanned
                    ? 'Primero se pone en proceso, despues se cargan datos/consumos y al final se marca terminada.'
                    : 'Esta orden no tiene esta etapa dentro de su planificacion.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleStageAction('START')}
                  disabled={saving || !isStagePlanned || isStageInProcess || isStageFinished}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.85rem 1.2rem' }}
                >
                  <Play size={18} />
                  Poner en proceso
                </button>
                <button
                  className="btn"
                  onClick={() => handleStageAction('FINISH')}
                  disabled={saving || !isStageInProcess}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.85rem 1.2rem', border: '1px solid var(--success)', color: 'var(--success)' }}
                >
                  <CheckCircle2 size={18} />
                  Marcar etapa terminada
                </button>
                <button
                  className="btn"
                  onClick={handleMarkProductFinished}
                  disabled={saving || !canMarkProductFinished}
                  title={allPlannedStagesFinished ? 'Marcar producto terminado' : 'Completa todas las etapas planificadas primero'}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.85rem 1.2rem', border: '1px solid #f59e0b', color: '#fbbf24', opacity: canMarkProductFinished ? 1 : 0.45 }}
                >
                  <PackageCheck size={18} />
                  Producto terminado
                </button>
              </div>
            </div>
          </div>

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
                    <label className="label">Ancho espira</label>
                    <input name="anchoEspira" value={stageData.anchoEspira} onChange={handleInputChange} type="number" className="input" placeholder="0" />
                  </div>
                  <div>
                    <label className="label">Diametro bobinas CMM</label>
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
                      <input type="checkbox" name="dePie" checked={stageData.dePie} onChange={handleInputChange} />
                      De pie
                    </label>
                  </div>
                  <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Control de salida refiladora</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                      <div>
                        <label className="label">Nombre control</label>
                        <input name="controlName" value={stageData.controlName} onChange={handleInputChange} type="text" className="input" />
                      </div>
                      <div>
                        <label className="label">Taca der-izq</label>
                        <input name="tacaDerIzq" value={stageData.tacaDerIzq} onChange={handleInputChange} type="text" className="input" />
                      </div>
                      <div>
                        <label className="label">Ancho espira salida</label>
                        <input name="finalAnchoEspira" value={stageData.finalAnchoEspira} onChange={handleInputChange} type="number" className="input" />
                      </div>
                      <div>
                        <label className="label">Sentido de salida final</label>
                        <input name="finalExitSense" value={stageData.finalExitSense} onChange={handleInputChange} type="text" className="input" />
                      </div>
                      <div>
                        <label className="label">Nombre</label>
                        <input name="bobbinCountName" value={stageData.bobbinCountName} onChange={handleInputChange} type="text" className="input" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Lotes / bobinas usadas</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Numero de lote o bobina que carga el operario al iniciar o continuar la etapa.
                  </p>
                </div>
                <button type="button" className="btn" onClick={addMaterialLot} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Plus size={16} />
                  Agregar lote
                </button>
              </div>

              <div style={{ display: 'grid', gap: '0.85rem' }}>
                {materialLots.map((lot, index) => (
                  <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                    <div>
                      <label className="label">Lote / bobina</label>
                      <input
                        value={lot.lotNumber}
                        onChange={(e) => updateMaterialLot(index, 'lotNumber', e.target.value)}
                        className="input"
                        placeholder={`Bobina ${index + 1}`}
                      />
                    </div>
                    <div>
                      <label className="label">Kg</label>
                      <input
                        value={lot.kg}
                        onChange={(e) => updateMaterialLot(index, 'kg', e.target.value)}
                        type="number"
                        className="input"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="label">Metros usados</label>
                      <input
                        value={lot.initialMeters}
                        onChange={(e) => updateMaterialLot(index, 'initialMeters', e.target.value)}
                        type="number"
                        className="input"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="label">Observacion</label>
                      <input
                        value={lot.observations}
                        onChange={(e) => updateMaterialLot(index, 'observations', e.target.value)}
                        className="input"
                        placeholder="Opcional"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMaterialLot(index)}
                      title="Quitar lote"
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.65rem' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {activeStage === 'REFILADO' && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Bobinas de salida</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      Registra cuantos kilos salen por bobina en refilado. Total: <strong>{totalOutputKg.toFixed(2)} kg</strong>
                    </p>
                  </div>
                  <button type="button" className="btn" onClick={addOutputBobbin} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Plus size={16} />
                    Agregar bobina
                  </button>
                </div>

                <div style={{ display: 'grid', gap: '0.85rem' }}>
                  {refiladoOutputBobbins.map((bobbin, index) => (
                    <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', alignItems: 'end' }}>
                      <div>
                        <label className="label">Bobina</label>
                        <input
                          value={bobbin.label}
                          onChange={(e) => updateOutputBobbin(index, 'label', e.target.value)}
                          className="input"
                          placeholder={`Bobina ${index + 1}`}
                        />
                      </div>
                      <div>
                        <label className="label">Kg salida</label>
                        <input
                          value={bobbin.kg}
                          onChange={(e) => updateOutputBobbin(index, 'kg', e.target.value)}
                          type="number"
                          className="input"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="label">Nota</label>
                        <input
                          value={bobbin.notes}
                          onChange={(e) => updateOutputBobbin(index, 'notes', e.target.value)}
                          className="input"
                          placeholder="Opcional"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeOutputBobbin(index)}
                        title="Quitar bobina"
                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.65rem' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                {isStageInProcess
                  ? 'Registra aqui datos de la etapa. Los consumos se confirman aparte y descuentan stock en el momento.'
                  : 'Primero marca la etapa como en proceso para poder cargar datos operativos.'}
              </div>
              <button onClick={handleSaveProcess} disabled={saving || !isStageInProcess} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1.6rem' }}>
                {saving ? <Play size={18} /> : <Save size={18} />}
                <span>{saving ? 'GUARDANDO...' : 'REGISTRAR ETAPA'}</span>
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <TimerReset size={20} color="var(--primary)" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Horas trabajadas / paradas de {activeStage.toLowerCase()}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Carga una fila por cada tramo trabajado, parada o reanudacion. Puede haber varios dias y distintos operarios.
                  </p>
                </div>
              </div>
              <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', borderRadius: '12px', padding: '0.75rem 1rem', minWidth: '180px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Total etapa</p>
                <strong style={{ color: 'var(--primary)', fontSize: '1.25rem' }}>{formatDuration(currentStageTotalMinutes)}</strong>
              </div>
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

            <div style={{ marginTop: '0.85rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Duracion de esta fila: <strong style={{ color: currentInputDurationMinutes ? 'var(--primary)' : 'var(--text-muted)' }}>{formatDuration(currentInputDurationMinutes)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button onClick={handleSaveTimeLog} disabled={savingTimeLog} className="btn btn-primary">
                {savingTimeLog ? 'Guardando...' : 'Guardar horas'}
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
                        {formatLogDate(log.date)} {formatLogTime(log.startTime)} - {formatLogTime(log.endTime)}
                      </span>
                    </div>
                    <p style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                      {log.description || 'Sin descripcion'} - Duracion: <strong>{formatDuration(getLogDurationMinutes(log))}</strong>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {canUseConsumptions && !isStageInProcess && (
            <div className="card" style={{ marginTop: '1.5rem', color: 'var(--text-muted)' }}>
              Para cargar consumos de {activeStage.toLowerCase()}, primero marca la etapa como en proceso.
            </div>
          )}

          {canUseConsumptions && isStageInProcess && (
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
