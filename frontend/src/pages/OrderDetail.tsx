import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { ClipboardList as Clipboard, Ruler, Layers, ArrowLeft, FileText, Cpu, Edit, ShieldCheck, CheckSquare, FlaskConical } from 'lucide-react';
import { FormSection } from '../components/FormSection';
import { OrderConsumptions } from '../components/OrderConsumptions';

const STAGES = [
  { value: 'IMPRESION', label: 'Impresion' },
  { value: 'LAMINACION', label: 'Laminacion' },
  { value: 'REFILADO', label: 'Refilado' }
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

  const openChecklistModal = () => {
    loadChecklistStage(checklistStage);
    setShowChecklistModal(true);
  };

  const openQualityModal = () => {
    loadQualityStage(qualityStage);
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
        <div style={{ display: 'flex', gap: '1rem' }}>
          {order.status !== 'Finalizadas' && (
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
            <div style={{ gridColumn: 'span 2', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Especificaciones / Observaciones</p>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'pre-line' }}>{order.specifications || order.observations || '-'}</p>
            </div>
          </FormSection>

          <FormSection title="Aprobaciones y Control" icon={<ShieldCheck size={24} />}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', gridColumn: 'span 2' }}>
              <ApprovalCheck orderId={order.id} field="approvedPrinting" label="Impresion" initial={order.approvedPrinting} />
              <ApprovalCheck orderId={order.id} field="approvedLamination" label="Laminacion" initial={order.approvedLamination} />
              <ApprovalCheck orderId={order.id} field="approvedRefilado" label="Refilado" initial={order.approvedRefilado} />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                onClick={openChecklistModal}
              className="btn"
              style={{ flex: 1, padding: '0.9rem 1rem', border: '1px solid var(--primary)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckSquare size={18} />
                <span>Checklist de Proceso</span>
              </span>
            </button>
            <button
              onClick={openQualityModal}
              className="btn"
              style={{ flex: 1, padding: '0.9rem 1rem', border: '1px solid var(--primary)', color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FlaskConical size={18} />
                <span>Control de Calidad</span>
              </span>
            </button>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
              <StatusInfo
                title="Checklists guardados"
                value={order.checklists?.length ? `${order.checklists.length} registro(s)` : 'Sin registros'}
                detail={order.checklists?.length ? order.checklists.map((item: any) => getStageLabel(item.stage)).join(', ') : undefined}
              />
              <StatusInfo
                title="Controles de calidad"
                value={order.qualityControls?.length ? `${order.qualityControls.length} registro(s)` : 'Sin registros'}
                detail={order.qualityControls?.length ? order.qualityControls.map((item: any) => getStageLabel(item.stage)).join(', ') : undefined}
              />
            </div>
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
        <ModalShell title="Checklist de Proceso" onClose={() => setShowChecklistModal(false)}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <div>
                <label className="label">Etapa</label>
                <select className="input" value={checklistStage} onChange={(e) => loadChecklistStage(e.target.value)}>
                  {STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>{stage.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {checklistItems.map((item, index) => (
                <div key={`${item.controlName}-${index}`} className="card" style={{ padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.4fr auto', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      className="input"
                      value={item.time}
                      onChange={(e) => updateChecklistItem(setChecklistItems, checklistItems, index, 'time', e.target.value)}
                      placeholder="Momento"
                    />
                    <input
                      className="input"
                      value={item.controlName}
                      onChange={(e) => updateChecklistItem(setChecklistItems, checklistItems, index, 'controlName', e.target.value)}
                      placeholder="Control"
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={(e) => updateChecklistItem(setChecklistItems, checklistItems, index, 'checked', e.target.checked)}
                      />
                      OK
                    </label>
                  </div>
                  <input
                    className="input"
                    style={{ marginTop: '0.75rem' }}
                    value={item.value}
                    onChange={(e) => updateChecklistItem(setChecklistItems, checklistItems, index, 'value', e.target.value)}
                    placeholder="Observaciones o valor medido"
                  />
                </div>
              ))}
            </div>

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
        <ModalShell title="Control de Calidad" onClose={() => setShowQualityModal(false)}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="label">Etapa</label>
                <select className="input" value={qualityStage} onChange={(e) => loadQualityStage(e.target.value)}>
                  {STAGES.map((stage) => (
                    <option key={stage.value} value={stage.value}>{stage.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Resultado</label>
                <select className="input" value={qualityStatus} onChange={(e) => setQualityStatus(e.target.value)}>
                  <option value="APROBADO">Aprobado</option>
                  <option value="OBSERVADO">Observado</option>
                  <option value="RECHAZADO">Rechazado</option>
                </select>
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

const StatusInfo = ({ title, value, detail }: { title: string, value: string, detail?: string }) => (
  <div style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '0.9rem 1rem', backgroundColor: 'rgba(255,255,255,0.02)' }}>
    <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>{title}</p>
    <p style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</p>
    {detail && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{detail}</p>}
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

const ApprovalCheck = ({ orderId, field, label, initial }: any) => {
  const [checked, setChecked] = useState(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setChecked(initial);
  }, [initial]);

  const toggle = async () => {
    setLoading(true);
    try {
      await api.put(`/orders/${orderId}`, { [field]: !checked });
      setChecked(!checked);
    } catch (e) {
      console.error(e);
      alert('No se pudo guardar la aprobacion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
      <input type="checkbox" checked={checked} onChange={toggle} disabled={loading} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</span>
    </label>
  );
};

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
