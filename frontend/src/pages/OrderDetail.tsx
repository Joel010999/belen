import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import {
  ClipboardList as Clipboard,
  Ruler,
  Layers,
  ArrowLeft,
  FileText,
  Cpu,
  Edit,
  ShieldCheck,
  CheckSquare,
  FlaskConical,
  Truck,
  Plus,
  Trash2
} from 'lucide-react';
import { FormSection } from '../components/FormSection';

const STAGES = [
  { value: 'IMPRESION', label: 'Impresion', field: 'approvedPrinting' },
  { value: 'LAMINACION', label: 'Laminacion', field: 'approvedLamination' },
  { value: 'REFILADO', label: 'Refilado', field: 'approvedRefilado' },
  { value: 'CONFECCION', label: 'Confeccion', field: 'approvedConfeccion' }
];

const CONTROL_CHECKLIST_ITEMS = [
  { time: 'Campo', controlName: 'Nombre encargado', checked: false, value: '' },
  { time: 'Control', controlName: 'Texto', checked: false, value: '' },
  { time: 'Control', controlName: 'Corte', checked: false, value: '' },
  { time: 'Control', controlName: 'Tono', checked: false, value: '' },
  { time: 'Control', controlName: 'Ancho material', checked: false, value: '' },
  { time: 'Campo', controlName: 'Observacion', checked: false, value: '' },
  { time: 'Campo', controlName: 'Producto', checked: false, value: '' },
  { time: 'Campo', controlName: 'Nombre', checked: false, value: '' }
];

const LAMINATION_CHECKLIST_ITEMS = [
  { time: 'Campo', controlName: 'Nombre encargado', checked: false, value: '' },
  { time: 'Control', controlName: 'Carga 0.022', checked: false, value: '' },
  { time: 'Control', controlName: 'Ancho', checked: false, value: '' },
  { time: 'Control', controlName: 'Tipo material', checked: false, value: '' },
  { time: 'Control', controlName: 'Sin agujas', checked: false, value: '' }
];

const REFILADO_CHECKLIST_ITEMS = [
  { time: 'Campo', controlName: 'Nombre control', checked: false, value: '' },
  { time: 'Control', controlName: 'Taca der-izq', checked: false, value: '' },
  { time: 'Control', controlName: 'Ancho espira', checked: false, value: '' },
  { time: 'Control', controlName: 'Sentido de salida', checked: false, value: '' }
];

const CONFECCION_CHECKLIST_ITEMS = [
  { time: 'Campo', controlName: 'Supervisor', checked: false, value: '' },
  { time: 'Control', controlName: 'Sellado central', checked: false, value: '' },
  { time: 'Control', controlName: 'Sellado base', checked: false, value: '' },
  { time: 'Control', controlName: 'Imagen centrada', checked: false, value: '' },
  { time: 'Control', controlName: 'Temp de maq', checked: false, value: '' },
  { time: 'Control', controlName: 'Teflon en condiciones', checked: false, value: '' }
];

const CHECKLIST_BOOLEAN_FIELDS = new Set([
  'Texto',
  'Corte',
  'Tono',
  'Ancho material',
  'Carga 0.022',
  'Ancho',
  'Tipo material',
  'Sin agujas',
  'Taca der-izq',
  'Ancho espira',
  'Sentido de salida',
  'Sellado central',
  'Sellado base',
  'Imagen centrada',
  'Temp de maq',
  'Teflon en condiciones'
]);

const CHECKLIST_TEMPLATES: Record<string, typeof CONTROL_CHECKLIST_ITEMS> = {
  IMPRESION: CONTROL_CHECKLIST_ITEMS,
  LAMINACION: LAMINATION_CHECKLIST_ITEMS,
  REFILADO: REFILADO_CHECKLIST_ITEMS,
  CONFECCION: CONFECCION_CHECKLIST_ITEMS
};

const getChecklistTemplate = (stage: string) => (
  CHECKLIST_TEMPLATES[stage] || CONTROL_CHECKLIST_ITEMS
).map((item) => ({ ...item }));

const getStageLabel = (stage: string) => STAGES.find((item) => item.value === stage)?.label || stage;

const getLogDurationMinutes = (log: any) => {
  const start = new Date(log.startTime).getTime();
  const end = new Date(log.endTime).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round((end - start) / 60000);
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

const createFinishedControlItem = () => ({
  productNameObserved: '',
  orderNumberOk: false,
  labelOk: false,
  receiptOk: false,
  observations: ''
});

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [checklistStage, setChecklistStage] = useState('IMPRESION');
  const [checklistItems, setChecklistItems] = useState(getChecklistTemplate('IMPRESION'));
  const [qualityStage, setQualityStage] = useState('IMPRESION');
  const [qualityStatus, setQualityStatus] = useState('APROBADO');
  const [qualityObservations, setQualityObservations] = useState('');
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [savingQuality, setSavingQuality] = useState(false);
  const [savingInspection, setSavingInspection] = useState(false);
  const [finishedControlForm, setFinishedControlForm] = useState({
    inspectorName: '',
    items: [createFinishedControlItem()]
  });
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orderRes = await api.get(`/orders/${id}`);
        setOrder(orderRes.data);
      } catch (err) {
        console.error('Error fetching order data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const refreshOrder = async () => {
    try {
      const orderRes = await api.get(`/orders/${id}`);
      setOrder(orderRes.data);
    } catch (err) {
      console.error('Error refreshing order data:', err);
    }
  };

  const loadChecklistStage = (stage: string) => {
    setChecklistStage(stage);
    const existingChecklist = order?.checklists?.find((item: any) => item.stage === stage);
    if (existingChecklist) {
      setChecklistItems(
        existingChecklist.items.map((item: any) => ({
          time: item.time || '',
          controlName: item.controlName || '',
          checked: Boolean(item.checked),
          value: item.value || ''
        }))
      );
      return;
    }

    setChecklistItems(getChecklistTemplate(stage));
  };

  const loadQualityStage = (stage: string) => {
    setQualityStage(stage);
    const existingControl = order?.qualityControls?.find((item: any) => item.stage === stage);
    if (!existingControl) {
      setQualityStatus('APROBADO');
      setQualityObservations('');
      return;
    }

    try {
      const parsed = JSON.parse(existingControl.data);
      setQualityStatus(parsed.status || 'APROBADO');
      setQualityObservations(parsed.observations || '');
    } catch {
      setQualityStatus('APROBADO');
      setQualityObservations(existingControl.data || '');
    }
  };

  const openChecklistModal = (stage: string) => {
    loadChecklistStage(stage);
    setShowChecklistModal(true);
  };

  const openQualityModal = (stage: string) => {
    loadQualityStage(stage);
    setShowQualityModal(true);
  };

  const handleFinalize = async () => {
    if (!window.confirm('Marcar esta orden como producto terminado? Esta accion suma el producto terminado al inventario y registra la fecha de cierre.')) return;
    try {
      await api.post(`/orders/${order.id}/finalize`);
      refreshOrder();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al finalizar orden');
    }
  };

  const handleMarkDelivered = async () => {
    if (!window.confirm('Marcar esta orden como producto entregado?')) return;
    try {
      await api.patch(`/orders/${order.id}/status`, { status: 'Entregadas' });
      refreshOrder();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al marcar como entregada');
    }
  };

  const saveChecklist = async () => {
    setSavingChecklist(true);
    try {
      await api.post(`/orders/${order.id}/checklists`, {
        stage: checklistStage,
        items: checklistItems
      });
      await refreshOrder();
      setShowChecklistModal(false);
    } catch (e: any) {
      alert(e.response?.data?.error || 'No se pudo guardar el checklist');
    } finally {
      setSavingChecklist(false);
    }
  };

  const saveQualityControl = async () => {
    setSavingQuality(true);
    try {
      await api.post(`/orders/${order.id}/quality-controls`, {
        stage: qualityStage,
        controlData: {
          status: qualityStatus,
          observations: qualityObservations
        }
      });
      await refreshOrder();
      setShowQualityModal(false);
    } catch (e: any) {
      alert(e.response?.data?.error || 'No se pudo guardar el control de calidad');
    } finally {
      setSavingQuality(false);
    }
  };

  const handleFinishedControlFieldChange = (field: string, value: string) => {
    setFinishedControlForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateFinishedControlItem = (index: number, field: string, value: string | boolean) => {
    setFinishedControlForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)
    }));
  };

  const addFinishedControlItem = () => {
    setFinishedControlForm((prev) => ({
      ...prev,
      items: [...prev.items, createFinishedControlItem()]
    }));
  };

  const removeFinishedControlItem = (index: number) => {
    setFinishedControlForm((prev) => ({
      ...prev,
      items: prev.items.length === 1 ? [createFinishedControlItem()] : prev.items.filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const saveFinalInspection = async () => {
    setSavingInspection(true);
    try {
      const itemsToSave = finishedControlForm.items.filter((item) => (
        item.productNameObserved.trim() || item.orderNumberOk || item.labelOk || item.receiptOk || item.observations.trim()
      ));

      if (!finishedControlForm.inspectorName.trim() || itemsToSave.length === 0) {
        alert('Carga nombre de encargado y al menos un producto para controlar.');
        return;
      }

      await Promise.all(itemsToSave.map((item) => api.post(`/orders/${order.id}/final-inspections`, {
        inspectorName: finishedControlForm.inspectorName,
        productNameObserved: item.productNameObserved,
        orderNumberOk: item.orderNumberOk,
        labelOk: item.labelOk,
        receiptOk: item.receiptOk,
        observations: item.observations
      })));
      setFinishedControlForm({
        inspectorName: '',
        items: [createFinishedControlItem()]
      });
      await refreshOrder();
    } catch (e: any) {
      alert(e.response?.data?.error || 'No se pudo guardar la inspeccion final');
    } finally {
      setSavingInspection(false);
    }
  };

  if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando orden...</div>;
  if (!order) return <div style={{ padding: '3rem', textAlign: 'center' }}>Orden no encontrada.</div>;

  const machineStage = user?.machine?.type ? String(user.machine.type).toUpperCase() : null;
  const visibleStages = user?.role === 'MACHINE' && machineStage
    ? STAGES.filter((stage) => stage.value === machineStage)
    : STAGES;

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
              {order.workType && <span style={{ color: 'var(--text-muted)' }}>Tipo: <b>{String(order.workType).replaceAll('_', ' ')}</b></span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {user?.role === 'ADMIN' && order.status !== 'Finalizadas' && order.status !== 'Entregadas' && (
            <button
              onClick={handleFinalize}
              className="btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '1rem 2rem', fontSize: '1rem', fontWeight: 700,
                backgroundColor: '#10b981', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '8px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck size={20} />
                <span>PRODUCTO TERMINADO</span>
              </span>
            </button>
          )}
          {user?.role === 'ADMIN' && order.status === 'Finalizadas' && (
            <button
              onClick={handleMarkDelivered}
              className="btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '1rem 2rem', fontSize: '1rem', fontWeight: 700,
                backgroundColor: '#f59e0b', color: '#111827', border: 'none', cursor: 'pointer', borderRadius: '8px'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Truck size={20} />
                <span>PRODUCTO ENTREGADO</span>
              </span>
            </button>
          )}
          {user?.role === 'ADMIN' && (
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Edit size={20} />
                <span>EDITAR ORDEN</span>
              </span>
            </Link>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <FormSection title="Origen de la Orden" icon={<Cpu size={24} />}>
            <DataField label="Maquina de Creacion" value={order.machine ? `${order.machine.name} (${order.machine.code})` : 'Administracion'} />
            <DataField label="Clasificacion" value={order.classification} />
            <DataField label="Muestra Original" value={order.hasSample ? 'Si' : 'No'} />
            <DataField label="Trabajo" value={order.workType ? String(order.workType).replaceAll('_', ' ') : '-'} />
            <div style={{ gridColumn: 'span 2' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Operadores de Turno (Creacion)</p>
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

          <FormSection title="Especificacion Tecnica" icon={<Ruler size={24} />}>
            <DataField label="Medida Material" value={order?.technicalSpec?.materialMeasure} />
            <DataField label="Corte" value={order?.technicalSpec?.cut} />
            <DataField label="Lamina / Material" value={order?.technicalSpec?.lamina} />
            <DataField label="Metros Previstos" value={order?.technicalSpec?.meters ? `${order.technicalSpec.meters} m` : '-'} />
            <DataField label="Impresión en" value={order?.technicalSpec?.tube} />
            <DataField label="Tipo Impresion" value={order?.technicalSpec?.printingType} />
            <DataField label="Sentido salida impresion" value={order?.technicalSpec?.printingExitSense} />
            <DataField label="Diametro bobina impresion" value={order?.technicalSpec?.printingCoilDiameter} />
            <DataField label="Pie" value={order?.technicalSpec?.pie ? 'Marcado' : 'Sin marcar'} />
            <DataField label="Cabeza" value={order?.technicalSpec?.cabeza ? 'Marcado' : 'Sin marcar'} />
            <DataField label="Taca Derecha" value={order?.technicalSpec?.tacaRight ? 'Marcado' : 'Sin marcar'} />
            <DataField label="Taca Izquierda" value={order?.technicalSpec?.tacaLeft ? 'Marcado' : 'Sin marcar'} />
            <DataField label="Clise Centrado" value={order?.technicalSpec?.clisheAlignment} />
            <div style={{ gridColumn: 'span 2', borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Refiladora corte</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
                <DataField label="Sentido salida" value={order?.technicalSpec?.refiladoExitSense} />
                <DataField label="De pie" value={order?.technicalSpec?.refiladoDePie ? 'Si' : 'No'} />
                <DataField label="De cabeza" value={order?.technicalSpec?.refiladoDeCabeza ? 'Si' : 'No'} />
                <DataField label="Taca derecha" value={order?.technicalSpec?.refiladoTacaRight} />
                <DataField label="Taca izquierda" value={order?.technicalSpec?.refiladoTacaLeft} />
                <DataField label="Ancho espira" value={order?.technicalSpec?.refiladoAnchoEspira} />
                <DataField label="Diametro" value={order?.technicalSpec?.refiladoCoilDiameter} />
                <DataField label="Metros" value={order?.technicalSpec?.refiladoMeters} />
              </div>
            </div>
            <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Especificaciones / Observaciones</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'pre-line' }}>{order.specifications || order.observations || '-'}</p>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Observaciones Tecnicas</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'pre-line' }}>{order?.technicalSpec?.techObservations || '-'}</p>
            </div>
          </FormSection>

          <FormSection title="Aprobaciones y Control" icon={<ShieldCheck size={24} />}>
            <div style={{ gridColumn: 'span 2', marginBottom: '0.25rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Cada etapa se completa por separado. Primero revisas la etapa, luego guardas checklist y control de calidad solo si hace falta.
              </p>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'grid', gap: '1rem' }}>
              {visibleStages.map((stage) => (
                <StageCard
                  key={stage.value}
                  order={order}
                  stage={stage}
                  onOpenChecklist={() => openChecklistModal(stage.value)}
                  onOpenQuality={() => openQualityModal(stage.value)}
                  onRefresh={refreshOrder}
                />
              ))}
            </div>
          </FormSection>

          <FormSection title="Control de Producto Terminado" icon={<ShieldCheck size={24} />}>
            <div style={{ gridColumn: 'span 2' }}>
              {order.finalInspections?.length > 0 ? (
                order.finalInspections.map((inspection: any) => (
                  <div key={inspection.id} className="card" style={{ marginBottom: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <strong>{inspection.inspectorName || inspection.inspectorUser?.name || 'Encargado sin nombre'}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(inspection.date).toLocaleString()}</span>
                    </div>
                    <p style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                      Producto: {inspection.productNameObserved || '-'} | N de orden: {inspection.orderNumberOk ? 'OK' : 'NO'} | Etiqueta: {inspection.labelOk ? 'OK' : 'NO'} | Comprobante: {inspection.receiptOk ? 'OK' : 'NO'}
                    </p>
                    {(inspection.textOk || inspection.cutOk || inspection.toneOk || inspection.materialWidthOk || inspection.signatureName || inspection.signedOff) && (
                      <p style={{ marginTop: '0.35rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        Control anterior: Texto {inspection.textOk ? 'OK' : 'NO'} / Corte {inspection.cutOk ? 'OK' : 'NO'} / Tono {inspection.toneOk ? 'OK' : 'NO'} / Ancho Mat. {inspection.materialWidthOk ? 'OK' : 'NO'}
                      </p>
                    )}
                    <p style={{ marginTop: '0.4rem' }}>{inspection.observations || 'Sin observaciones'}</p>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Todavia no hay controles de producto terminado cargados.</p>
              )}
            </div>

            {user?.role === 'ADMIN' && (
              <>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Nombre encargado</label>
                  <input
                    className="input"
                    value={finishedControlForm.inspectorName}
                    onChange={(e) => handleFinishedControlFieldChange('inspectorName', e.target.value)}
                    placeholder="Encargado del control antes de salida"
                  />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'grid', gap: '0.85rem' }}>
                  {finishedControlForm.items.map((item, index) => (
                    <div key={index} style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.025)', display: 'grid', gap: '0.85rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr) auto', gap: '0.85rem', alignItems: 'end' }}>
                        <div>
                          <label className="label">Producto</label>
                          <input
                            className="input"
                            value={item.productNameObserved}
                            onChange={(e) => updateFinishedControlItem(index, 'productNameObserved', e.target.value)}
                            placeholder={`Producto ${index + 1}`}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFinishedControlItem(index)}
                          title="Quitar producto"
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.65rem' }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {[
                          ['orderNumberOk', 'N de orden'],
                          ['labelOk', 'Etiqueta'],
                          ['receiptOk', 'Comprobante']
                        ].map(([field, label]) => (
                          <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}>
                            <input
                              type="checkbox"
                              checked={(item as any)[field]}
                              onChange={(e) => updateFinishedControlItem(index, field, e.target.checked)}
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                      <div>
                        <label className="label">Observacion</label>
                        <textarea
                          className="input"
                          style={{ minHeight: '80px', resize: 'vertical' }}
                          value={item.observations}
                          onChange={(e) => updateFinishedControlItem(index, 'observations', e.target.value)}
                          placeholder="Observacion opcional del producto"
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" className="btn" onClick={addFinishedControlItem} style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                    <Plus size={16} />
                    Agregar producto
                  </button>
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={saveFinalInspection} disabled={savingInspection}>
                    <span>{savingInspection ? 'Guardando...' : 'Guardar control'}</span>
                  </button>
                </div>
              </>
            )}
          </FormSection>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="var(--primary)" />
              Resumen de Lote
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ fontSize: '0.875rem' }}>Fecha Alta: <b>{new Date(order.createdAt).toLocaleDateString()}</b></p>
              {order.deliveryDate && (
                <p style={{ fontSize: '0.875rem' }}>Fecha Entrega: <b>{new Date(order.deliveryDate).toLocaleDateString()}</b></p>
              )}
              {order.estimatedBagQty && (
                <p style={{ fontSize: '0.875rem' }}>Bolsas estimadas: <b>{order.estimatedBagQty.toLocaleString()}</b></p>
              )}
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                {order.products?.length > 0 ? order.products.map((p: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem' }}>Producto {idx + 1}: <b>{p.product?.name}</b></p>
                    <p style={{ fontSize: '0.875rem' }}>Objetivo: <b>{p.plannedQty}</b></p>
                  </div>
                )) : (
                  <div>
                    <p style={{ fontSize: '0.875rem' }}>Producto: <b>{order.product?.name}</b></p>
                    <p style={{ fontSize: '0.875rem' }}>Objetivo: <b>{order.plannedQty}</b></p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <FormSection title="Secuencia de Colores" icon={<Layers size={24} />}>
            <div style={{ gridColumn: 'span 2' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>#</th>
                    <th>Color</th>
                    <th>Formula</th>
                    <th>N Lote</th>
                    <th>Cambios</th>
                  </tr>
                </thead>
                <tbody>
                  {order.colorOrders?.map((color: any) => (
                    <tr key={color.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem 0.5rem', fontWeight: 800, color: 'var(--primary)' }}>{color.sequence}°</td>
                      <td>{color.colorName}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{color.formula || '-'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{color.lotNumber || '-'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{color.changesToConsider || '-'}</td>
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
                Actividad de Produccion
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {order.processes?.map((p: any) => (
                  <div key={p.id} style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                      <span>{p.type}</span>
                      <span style={{ color: 'var(--primary)' }}>{p.scrapKg} kg scrap</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>Maq: {p.machine?.name} - Op: {p.operator?.firstName}</p>

                    {p.timeLogs && p.timeLogs.length > 0 && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                          Horas trabajadas: {formatDuration(p.timeLogs.reduce((acc: number, log: any) => acc + getLogDurationMinutes(log), 0))}
                        </p>
                        {p.timeLogs.map((log: any) => (
                          <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.2rem 0' }}>
                            <span>
                              {log.operator ? `${log.operator.firstName} ${log.operator.lastName}` : 'Sin operario'} - {log.description || 'Sin descripcion'}
                            </span>
                            <span>
                              {formatLogDate(log.date)} {formatLogTime(log.startTime)}-{formatLogTime(log.endTime)} ({formatDuration(getLogDurationMinutes(log))})
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {p.scrapEntries && p.scrapEntries.length > 0 && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>Scrap registrado:</p>
                        {p.scrapEntries.map((entry: any) => (
                          <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', gap: '1rem' }}>
                            <span>{entry.description || 'Scrap'}</span>
                            <span>{entry.kg} kg</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {p.type !== 'REFILADO' && p.type !== 'CONFECCION' && p.materialLots && p.materialLots.length > 0 && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>Lotes de Material:</p>
                        {p.materialLots.map((l: any) => (
                          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                            <span>Lote: {l.lotNumber}</span>
                            <span>{l.kg || 0} kg / {l.totalUsedMeters} kg usados</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {p.metricEntries && p.metricEntries.length > 0 && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>Produccion acumulada:</p>
                        {p.metricEntries.map((entry: any) => (
                          <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', gap: '1rem' }}>
                            <span>{entry.description || 'Tramo'}</span>
                            <span>{entry.meters || 0} m / {entry.scrapKg || 0} kg scrap{entry.coilCount ? ` / ${entry.coilCount} bobinas` : ''}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {p.refiladoData && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'grid', gap: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <p style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>Datos refiladora:</p>
                        <span>Sentido salida cliente: {p.refiladoData.exitSense || '-'}</span>
                        <span>Taca der/izq: {p.refiladoData.tacaRight || '-'} / {p.refiladoData.tacaLeft || '-'}</span>
                        <span>De pie: {p.refiladoData.dePie ? 'Si' : 'No'} | De cabeza: {p.refiladoData.deCabeza ? 'Si' : 'No'}</span>
                        <span>Ancho espira: {p.refiladoData.anchoEspira ?? '-'}</span>
                        <span>Diametro bobina: {p.refiladoData.coilDiameter ?? '-'} | Metros: {p.refiladoData.processedMeters ?? '-'}</span>
                        <span>Control salida: {p.refiladoData.controlName || '-'} | Taca der-izq: {p.refiladoData.tacaDerIzq || '-'}</span>
                        <span>Ancho espira salida: {p.refiladoData.finalAnchoEspira ?? '-'} | Sentido salida final: {p.refiladoData.finalExitSense || '-'}</span>
                        <span>Cantidad bobinas: {p.refiladoData.coilCount ?? '-'} | Nombre: {p.refiladoData.bobbinCountName || '-'}</span>
                      </div>
                    )}

                    {p.refiladoData?.outputBobbins && p.refiladoData.outputBobbins.length > 0 && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>Bobinas de salida:</p>
                        {p.refiladoData.outputBobbins.map((bobbin: any) => (
                          <div key={bobbin.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', gap: '1rem' }}>
                            <span>{bobbin.label} - {bobbin.productName || 'Sin producto'}</span>
                            <span>{bobbin.kg} kg</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {p.confeccionData?.outputs && p.confeccionData.outputs.length > 0 && (
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>Confeccion:</p>
                        {p.confeccionData.outputs.map((output: any) => (
                          <div key={output.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', gap: '1rem' }}>
                            <span>{output.productName}</span>
                            <span>{Number(output.bagQty || 0).toLocaleString('es-AR')} bolsas</span>
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
      {showChecklistModal && (
        <ModalShell title={`Checklist de ${getStageLabel(checklistStage)}`} onClose={() => setShowChecklistModal(false)}>
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {checklistItems.map((item, index) => (
              <div key={`${item.controlName}-${index}`} style={{ display: 'grid', gridTemplateColumns: CHECKLIST_BOOLEAN_FIELDS.has(item.controlName) ? 'minmax(180px, 1fr) auto' : 'minmax(180px, 1fr) 2fr', gap: '0.85rem', alignItems: 'center', padding: '0.85rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{item.time}</p>
                  <p style={{ fontSize: '1rem', fontWeight: 800 }}>{item.controlName}</p>
                </div>
                {CHECKLIST_BOOLEAN_FIELDS.has(item.controlName) ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifySelf: 'end' }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => updateChecklistItem(setChecklistItems, checklistItems, index, 'checked', e.target.checked)}
                    />
                    Conforme
                  </label>
                ) : (
                  <input
                    className="input"
                    value={item.value}
                    onChange={(e) => updateChecklistItem(setChecklistItems, checklistItems, index, 'value', e.target.value)}
                    placeholder={item.controlName}
                  />
                )}
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" onClick={() => setShowChecklistModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveChecklist} disabled={savingChecklist}>
                <span>{savingChecklist ? 'Guardando...' : 'Guardar Checklist'}</span>
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {showQualityModal && (
        <ModalShell title={`Control de Calidad de ${getStageLabel(qualityStage)}`} onClose={() => setShowQualityModal(false)}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label className="label">Resultado</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {['APROBADO', 'OBSERVADO', 'RECHAZADO'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className="btn"
                    onClick={() => setQualityStatus(option)}
                    style={{
                      padding: '0.9rem 1rem',
                      border: qualityStatus === option ? '1px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: qualityStatus === option ? 'rgba(37, 99, 235, 0.18)' : 'rgba(255,255,255,0.02)',
                      color: qualityStatus === option ? 'var(--text-main)' : 'var(--text-muted)'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Observaciones</label>
              <textarea
                className="input"
                style={{ minHeight: '140px', resize: 'vertical' }}
                value={qualityObservations}
                onChange={(e) => setQualityObservations(e.target.value)}
                placeholder="Detalle del control realizado, desvio encontrado o aprobacion final"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" onClick={() => setShowQualityModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={saveQualityControl} disabled={savingQuality}>
                <span>{savingQuality ? 'Guardando...' : 'Guardar Control'}</span>
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

const DataField = ({ label, value }: { label: string, value: string }) => (
  <div>
    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{label}</p>
    <p style={{ fontSize: '1rem', fontWeight: 600 }}>{value || '-'}</p>
  </div>
);

const ModalShell = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2, 6, 23, 0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1.5rem' }}>
    <div className="card" style={{ width: 'min(860px, 100%)', maxHeight: '85vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{title}</h3>
        <button className="btn" onClick={onClose}>Cerrar</button>
      </div>
      {children}
    </div>
  </div>
);

const StageCard = ({
  order,
  stage,
  onOpenChecklist,
  onOpenQuality,
  onRefresh
}: {
  order: any,
  stage: { value: string; label: string; field: string };
  onOpenChecklist: () => void;
  onOpenQuality: () => void;
  onRefresh: () => Promise<void>;
}) => {
  const approved = Boolean(order?.[stage.field]);
  const checklistSaved = order?.checklists?.some((item: any) => item.stage === stage.value);
  const qualitySaved = order?.qualityControls?.some((item: any) => item.stage === stage.value);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '14px', padding: '1rem 1.1rem', backgroundColor: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.85rem' }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{stage.label}</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
            Marca la etapa como aprobada y carga solo lo necesario.
          </p>
        </div>
        <ApprovalToggle orderId={order.id} field={stage.field} checked={approved} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
        <MiniStatus label="Aprobacion" ok={approved} />
        <MiniStatus label="Checklist" ok={checklistSaved} />
        <MiniStatus label="Calidad" ok={qualitySaved} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn" onClick={onOpenChecklist} style={{ border: '1px solid var(--border)', color: 'var(--text-main)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckSquare size={16} />
            <span>{checklistSaved ? 'Editar checklist' : 'Cargar checklist'}</span>
          </span>
        </button>
        <button className="btn" onClick={onOpenQuality} style={{ border: '1px solid var(--border)', color: 'var(--text-main)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FlaskConical size={16} />
            <span>{qualitySaved ? 'Editar calidad' : 'Cargar calidad'}</span>
          </span>
        </button>
      </div>
    </div>
  );
};

const ApprovalToggle = ({ orderId, field, checked, disabled }: { orderId: number; field: string; checked: boolean; disabled?: boolean }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(checked);
  const isDisabled = disabled || user?.role !== 'ADMIN';

  useEffect(() => {
    setValue(checked);
  }, [checked]);

  const toggle = async () => {
    setLoading(true);
    try {
      await api.put(`/orders/${orderId}`, { [field]: !value });
      setValue(!value);
    } catch (e) {
      console.error(e);
      alert('No se pudo guardar la aprobacion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="btn"
      onClick={toggle}
      disabled={loading || isDisabled}
      style={{
        minWidth: '150px',
        border: value ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid var(--border)',
        backgroundColor: value ? 'rgba(34, 197, 94, 0.16)' : 'rgba(255,255,255,0.03)',
        color: value ? '#86efac' : 'var(--text-main)',
        opacity: isDisabled ? 0.5 : 1
      }}
    >
      <span>{loading ? 'Guardando...' : value ? 'Etapa aprobada' : 'Marcar aprobada'}</span>
    </button>
  );
};

const MiniStatus = ({ label, ok }: { label: string; ok: boolean }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.45rem',
      padding: '0.35rem 0.7rem',
      borderRadius: '999px',
      border: '1px solid var(--border)',
      backgroundColor: ok ? 'rgba(34, 197, 94, 0.12)' : 'rgba(255,255,255,0.03)',
      color: ok ? '#86efac' : 'var(--text-muted)',
      fontSize: '0.78rem',
      fontWeight: 700
    }}
  >
    <span style={{ width: '8px', height: '8px', borderRadius: '999px', backgroundColor: ok ? '#22c55e' : '#64748b' }} />
    {label}
  </span>
);

const updateChecklistItem = (
  setChecklistItems: React.Dispatch<React.SetStateAction<any[]>>,
  checklistItems: any[],
  index: number,
  field: string,
  value: any
) => {
  const updated = [...checklistItems];
  updated[index] = {
    ...updated[index],
    [field]: value
  };
  setChecklistItems(updated);
};
