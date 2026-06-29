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
  FlaskConical
} from 'lucide-react';
import { FormSection } from '../components/FormSection';
import { OrderConsumptions } from '../components/OrderConsumptions';

const STAGES = [
  { value: 'IMPRESION', label: 'Impresion', field: 'approvedPrinting' },
  { value: 'LAMINACION', label: 'Laminacion', field: 'approvedLamination' },
  { value: 'REFILADO', label: 'Refilado', field: 'approvedRefilado' }
];

const DEFAULT_CHECKLIST_ITEMS = [
  { time: 'Inicio', controlName: 'Revision visual', checked: false, value: '' },
  { time: 'Proceso', controlName: 'Registro de parametros', checked: false, value: '' },
  { time: 'Proceso', controlName: 'Validacion de material', checked: false, value: '' },
  { time: 'Final', controlName: 'Liberacion de etapa', checked: false, value: '' }
];

const getStageLabel = (stage: string) => STAGES.find((item) => item.value === stage)?.label || stage;

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [checklistStage, setChecklistStage] = useState('IMPRESION');
  const [checklistItems, setChecklistItems] = useState(DEFAULT_CHECKLIST_ITEMS);
  const [qualityStage, setQualityStage] = useState('IMPRESION');
  const [qualityStatus, setQualityStatus] = useState('APROBADO');
  const [qualityObservations, setQualityObservations] = useState('');
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [savingQuality, setSavingQuality] = useState(false);
  const [savingInspection, setSavingInspection] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    inspectorName: '',
    productNameObserved: '',
    textOk: false,
    cutOk: false,
    toneOk: false,
    materialWidthOk: false,
    observations: '',
    signedOff: false
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

    setChecklistItems(DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item })));
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
    if (!window.confirm('Esta seguro de finalizar y cerrar esta orden? Esta accion sumara el stock final al inventario y registrara la fecha de cierre.')) return;
    try {
      await api.post(`/orders/${order.id}/finalize`);
      refreshOrder();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al finalizar orden');
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

  const handleInspectionFieldChange = (field: string, value: string | boolean) => {
    setInspectionForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveFinalInspection = async () => {
    setSavingInspection(true);
    try {
      await api.post(`/orders/${order.id}/final-inspections`, inspectionForm);
      setInspectionForm({
        inspectorName: '',
        productNameObserved: '',
        textOk: false,
        cutOk: false,
        toneOk: false,
        materialWidthOk: false,
        observations: '',
        signedOff: false
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
          {user?.role === 'ADMIN' && order.status !== 'Finalizadas' && (
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
                <span>FINALIZAR ORDEN</span>
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
            <DataField label="Tubo" value={order?.technicalSpec?.tube} />
            <DataField label="Tipo Impresion" value={order?.technicalSpec?.printingType} />
            <DataField label="Pie" value={order?.technicalSpec?.pie} />
            <DataField label="Cabeza" value={order?.technicalSpec?.cabeza} />
            <DataField label="Taca Derecha" value={order?.technicalSpec?.tacaRight} />
            <DataField label="Taca Izquierda" value={order?.technicalSpec?.tacaLeft} />
            <DataField label="Clise Centrado" value={order?.technicalSpec?.clisheAlignment} />
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
              {STAGES.map((stage) => (
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

          <FormSection title="Inspecciones Finales" icon={<ShieldCheck size={24} />}>
            <div style={{ gridColumn: 'span 2' }}>
              {order.finalInspections?.length > 0 ? (
                order.finalInspections.map((inspection: any) => (
                  <div key={inspection.id} className="card" style={{ marginBottom: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <strong>{inspection.inspectorName || inspection.inspectorUser?.name || 'Inspector sin nombre'}</strong>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(inspection.date).toLocaleString()}</span>
                    </div>
                    <p style={{ marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                      Producto: {inspection.productNameObserved || '-'} | Texto: {inspection.textOk ? 'OK' : 'NO'} | Corte: {inspection.cutOk ? 'OK' : 'NO'} | Tono: {inspection.toneOk ? 'OK' : 'NO'} | Ancho Mat.: {inspection.materialWidthOk ? 'OK' : 'NO'}
                    </p>
                    <p style={{ marginTop: '0.4rem' }}>{inspection.observations || 'Sin observaciones'}</p>
                    {inspection.signedOff && <span className="status-badge" style={{ marginTop: '0.35rem' }}>Firmada</span>}
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Todavia no hay inspecciones finales cargadas.</p>
              )}
            </div>

            {user?.role === 'ADMIN' && (
              <>
                <div>
                  <label className="label">Nombre del inspector</label>
                  <input className="input" value={inspectionForm.inspectorName} onChange={(e) => handleInspectionFieldChange('inspectorName', e.target.value)} />
                </div>
                <div>
                  <label className="label">Producto observado</label>
                  <input className="input" value={inspectionForm.productNameObserved} onChange={(e) => handleInspectionFieldChange('productNameObserved', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {[
                    ['textOk', 'Texto'],
                    ['cutOk', 'Corte'],
                    ['toneOk', 'Tono'],
                    ['materialWidthOk', 'Ancho Mat.']
                  ].map(([field, label]) => (
                    <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <input
                        type="checkbox"
                        checked={(inspectionForm as any)[field]}
                        onChange={(e) => handleInspectionFieldChange(field, e.target.checked)}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <input
                      type="checkbox"
                      checked={inspectionForm.signedOff}
                      onChange={(e) => handleInspectionFieldChange('signedOff', e.target.checked)}
                    />
                    <span>Firma final</span>
                  </label>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Observaciones</label>
                  <textarea
                    className="input"
                    style={{ minHeight: '100px', resize: 'vertical' }}
                    value={inspectionForm.observations}
                    onChange={(e) => handleInspectionFieldChange('observations', e.target.value)}
                  />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn btn-primary" onClick={saveFinalInspection} disabled={savingInspection}>
                    <span>{savingInspection ? 'Guardando...' : 'Guardar Inspeccion'}</span>
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

      <OrderConsumptions order={order} onUpdate={refreshOrder} />

      {showChecklistModal && (
        <ModalShell title={`Checklist de ${getStageLabel(checklistStage)}`} onClose={() => setShowChecklistModal(false)}>
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            {checklistItems.map((item, index) => (
              <div key={`${item.controlName}-${index}`} className="card" style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div>
                    <p style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{item.time}</p>
                    <p style={{ fontSize: '1rem', fontWeight: 700 }}>{item.controlName}</p>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => updateChecklistItem(setChecklistItems, checklistItems, index, 'checked', e.target.checked)}
                    />
                    De acuerdo
                  </label>
                </div>
                <input
                  className="input"
                  value={item.value}
                  onChange={(e) => updateChecklistItem(setChecklistItems, checklistItems, index, 'value', e.target.value)}
                  placeholder="Observaciones opcionales"
                />
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
