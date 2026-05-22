import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Package, Ruler, ClipboardList, Layers, Plus, Trash2, Users, Cpu, Play, Droplets, Scissors } from 'lucide-react';
import api from '../services/api';
import { FormSection } from '../components/FormSection';
import { useAuth } from '../hooks/useAuth';

const StageTab = ({ active, onClick, icon, title, step, disabled }: any) => (
  <button 
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn" 
      style={{ 
          flex: 1, padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
          backgroundColor: active ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
          color: active ? 'white' : 'var(--text-muted)',
          border: active ? 'none' : '1px solid var(--border)',
          transition: 'all 0.2s ease',
          opacity: disabled ? 0.3 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
      }}
  >
      {React.cloneElement(icon, { size: 20 })}
      <div style={{ textAlign: 'left' }}>
          <p style={{ fontSize: '0.55rem', fontWeight: 800, opacity: 0.7, margin: 0 }}>PASO {step}</p>
          <p style={{ fontSize: '0.875rem', fontWeight: 800, margin: 0 }}>{title}</p>
      </div>
  </button>
);

export const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [supplies, setSupplies] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    orderNumber: '',
    clientId: '',
    productId: '',
    plannedQty: '',
    unit: 'Metros',
    creatorId: user?.id?.toString() || '1', 
    machineId: user?.machine?.id?.toString() || '',
    operatorIds: [] as string[],
    operatorsText: '',
    technicalSpec: {
      materialMeasure: '',
      cut: '',
      lamina: '',
      meters: '',
      tube: '',
      colorCount: '0',
      pie: '',
      designName: '',
      cabeza: '',
      printingType: 'Directa',
      cliseCenter: '',
      cliseLeft: '',
      cliseRight: '',
    },
    colorOrders: [
      { sequence: 1, colorName: '', formula: '', insumoId: '' }
    ],
    observations: ''
  });

  // Production Stage State
  const [activeStage, setActiveStage] = useState<'IMPRESION' | 'LAMINACION' | 'REFILADO'>('IMPRESION');
  const [stageData, setStageData] = useState({
      machineId: user?.machine?.id?.toString() || "",
      operatorId: "",
      exitSense: "Sentido A",
      processedMeters: "",
      scrapKg: "",
      observations: ""
  });
  const [materialLots, setMaterialLots] = useState<any[]>([
    { lotNumber: '', kg: '', initialMeters: '', addedMeters: '0', finalMeters: '0', totalUsed: 0, observations: '' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, productsRes, suppliesRes, operatorsRes, machinesRes] = await Promise.all([
          api.get(`/clients`),
          api.get(`/products`),
          api.get(`/supplies`),
          api.get(`/operators`),
          api.get(`/machines`)
        ]);
        setClients(clientsRes.data);
        setProducts(productsRes.data);
        setSupplies(suppliesRes.data);
        setOperators(operatorsRes.data);
        setMachines(machinesRes.data);

        if (isEditing) {
          const orderRes = await api.get(`/orders/${id}`);
          const order = orderRes.data;
          
          setFormData({
            orderNumber: order.orderNumber,
            clientId: order.clientId?.toString() || '',
            productId: order.productId?.toString() || '',
            plannedQty: order.plannedQty?.toString() || '',
            unit: order.unit || 'Metros',
            creatorId: order.creatorId?.toString() || '1',
            machineId: order.machineId?.toString() || '',
            operatorIds: order.operators?.map((o: any) => o.operatorId.toString()) || [],
            operatorsText: order.operatorsText || '',
            observations: order.technicalSpec?.observations || '',
            technicalSpec: {
              materialMeasure: order.technicalSpec?.materialMeasure || '',
              cut: order.technicalSpec?.cut || '',
              lamina: order.technicalSpec?.lamina || '',
              meters: order.technicalSpec?.meters?.toString() || '',
              tube: order.technicalSpec?.tube || '',
              colorCount: order.technicalSpec?.colorCount?.toString() || '0',
              pie: order.technicalSpec?.pie || '',
              designName: order.technicalSpec?.designName || '',
              cabeza: order.technicalSpec?.cabeza || '',
              printingType: order.technicalSpec?.printingType || 'Directa',
              cliseCenter: order.technicalSpec?.cliseCenter || '',
              cliseLeft: order.technicalSpec?.cliseLeft || '',
              cliseRight: order.technicalSpec?.cliseRight || '',
            },
            colorOrders: order.colorOrders?.length > 0 ? order.colorOrders.map((c: any) => ({
              sequence: c.sequence,
              colorName: c.colorName,
              formula: c.formula || '',
              insumoId: c.supplyId?.toString() || ''
            })) : [{ sequence: 1, colorName: '', formula: '', insumoId: '' }]
          });
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();

    if (user?.role === 'MACHINE' && user.machine) {
        setActiveStage(user.machine.type as any);
    }
  }, [id, isEditing, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleStageInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setStageData({ ...stageData, [e.target.name]: e.target.value });
  };

  const handleColorChange = (index: number, field: string, value: string) => {
    const newColors = [...formData.colorOrders];
    (newColors[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, colorOrders: newColors }));
  };

  const addColorRow = () => {
    setFormData(prev => ({
      ...prev,
      colorOrders: [
        ...prev.colorOrders,
        { sequence: prev.colorOrders.length + 1, colorName: '', formula: '', insumoId: '' }
      ]
    }));
  };

  const removeColorRow = (index: number) => {
    const newColors = formData.colorOrders.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, colorOrders: newColors }));
  };

  const addMaterialRow = () => {
    setMaterialLots([...materialLots, { lotNumber: '', kg: '', initialMeters: '', addedMeters: '0', finalMeters: '0', totalUsed: 0, observations: '' }]);
  };

  const removeMaterialRow = (index: number) => {
    setMaterialLots(materialLots.filter((_, i) => i !== index));
  };

  const handleMaterialChange = (index: number, field: string, value: string) => {
    const newLots = [...materialLots];
    newLots[index][field] = value;
    const initial = parseFloat(newLots[index].initialMeters) || 0;
    const added = parseFloat(newLots[index].addedMeters) || 0;
    const final = parseFloat(newLots[index].finalMeters) || 0;
    newLots[index].totalUsed = Math.max(0, initial + added - final);
    setMaterialLots(newLots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!formData.operatorsText || formData.operatorsText.trim().length === 0) {
      setError("Debe seleccionar al menos un operador.");
      setLoading(false);
      return;
    }

    try {
      let savedOrderId = id;
      if (isEditing) {
        await api.put(`/orders/${id}`, formData);
      } else {
        const res = await api.post(`/orders`, formData);
        savedOrderId = res.data.id;
      }

      // Si cargaron datos de produccion
      if (stageData.processedMeters || stageData.scrapKg || materialLots[0].lotNumber !== '') {
          const payload = {
            orderId: savedOrderId,
            type: activeStage,
            machineId: stageData.machineId || formData.machineId,
            operatorId: stageData.operatorId,
            scrapKg: stageData.scrapKg,
            observations: stageData.observations,
            materialLots: (activeStage === 'IMPRESION' || activeStage === 'LAMINACION') ? materialLots.filter(l => l.lotNumber !== '') : [],
            specificData: {
              exitSense: stageData.exitSense,
              processedMeters: stageData.processedMeters,
            }
          };
          await api.post(`/orders/processes`, payload);
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        window.location.href = '/ordenes';
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al guardar la orden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isEditing ? 'Editar Nota de Pedido' : 'Nueva Nota de Pedido'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Digitalización y avance de producción.</p>
        </div>
        <button 
          type="submit"
          className="btn btn-primary" 
          disabled={loading}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            padding: '1rem 2.5rem',
            fontSize: '1rem',
            fontWeight: 700,
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)'
          }}
        >
          {loading ? 'GUARDANDO...' : <><Save size={20} /> GUARDAR ORDEN</>}
        </button>
      </div>

      {success && (
        <div className="card" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success)', color: 'var(--success)', marginBottom: '2rem', textAlign: 'center' }}>
          ¡Orden guardada correctamente!
        </div>
      )}

      {error && (
        <div className="card" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--danger)', color: 'var(--danger)', marginBottom: '2rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <FormSection title="Origen y Personal" icon={<Users size={24} />}>
        <div>
          <label className="label">Máquina</label>
          {user?.role === 'MACHINE' ? (
            <div className="input" style={{ backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={16} /> {user.machine?.name} ({user.machine?.code})
            </div>
          ) : (
            <select name="machineId" value={formData.machineId} onChange={handleInputChange} className="input" required>
              <option value="">Seleccione una máquina...</option>
              {machines.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code})</option>)}
            </select>
          )}
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="label">Operador(es) de Turno (Escriba los nombres)</label>
          <input 
            name="operatorsText" 
            value={formData.operatorsText} 
            onChange={handleInputChange} 
            className="input" 
            placeholder="Ej: Juan Pérez, Roberto Gómez" 
            required 
          />
        </div>
      </FormSection>

      <FormSection title="Datos Generales" icon={<Package size={24} />}>
        <div>
          <label className="label">Número de Orden</label>
          <input name="orderNumber" value={formData.orderNumber} onChange={handleInputChange} type="text" className="input" placeholder="Ej: OP-24-1234" required />
        </div>
        <div>
          <label className="label">Cliente</label>
          <select name="clientId" value={formData.clientId} onChange={handleInputChange} className="input" required>
            <option value="">Seleccione un cliente...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>
        </div>
        <div>
          <label className="label">Producto Terminado</label>
          <select name="productId" value={formData.productId} onChange={handleInputChange} className="input" required>
            <option value="">Seleccione un producto...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Cantidad Planificada</label>
          <input name="plannedQty" value={formData.plannedQty} onChange={handleInputChange} type="number" className="input" placeholder="0.00" required />
        </div>
      </FormSection>

      <FormSection title="Especificación Técnica" icon={<Ruler size={24} />}>
        <div>
          <label className="label">Medida Material</label>
          <input name="technicalSpec.materialMeasure" value={formData.technicalSpec.materialMeasure} onChange={handleInputChange} type="text" className="input" placeholder="Ej: 390/20" />
        </div>
        <div>
          <label className="label">Corte</label>
          <input name="technicalSpec.cut" value={formData.technicalSpec.cut} onChange={handleInputChange} type="text" className="input" placeholder="Ej: 36" />
        </div>
        <div>
          <label className="label">Lámina / Material</label>
          <input name="technicalSpec.lamina" value={formData.technicalSpec.lamina} onChange={handleInputChange} type="text" className="input" placeholder="Ej: BOPP Cristal" />
        </div>
        <div>
          <label className="label">Metros Previstos</label>
          <input name="technicalSpec.meters" value={formData.technicalSpec.meters} onChange={handleInputChange} type="number" className="input" placeholder="0.00" />
        </div>
        <div>
          <label className="label">Tipo Tubo</label>
          <input name="technicalSpec.tube" value={formData.technicalSpec.tube} onChange={handleInputChange} type="text" className="input" placeholder="Ej: 3 pulgadas" />
        </div>
        <div>
          <label className="label">Posición (Pie)</label>
          <input name="technicalSpec.pie" value={formData.technicalSpec.pie} onChange={handleInputChange} type="text" className="input" placeholder="Referencia pie" />
        </div>
      </FormSection>

      <FormSection title="Detalles de Impresión" icon={<Layers size={24} />}>
        <div>
          <label className="label">Cantidad de Colores</label>
          <input name="technicalSpec.colorCount" value={formData.technicalSpec.colorCount} onChange={handleInputChange} type="number" className="input" />
        </div>
        <div>
          <label className="label">Tipo de Impresión</label>
          <select name="technicalSpec.printingType" value={formData.technicalSpec.printingType} onChange={handleInputChange} className="input">
            <option value="Directa">Directa</option>
            <option value="Retroverso">Retroverso</option>
          </select>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
            <label className="label">Clisé (Izq | Centro | Der)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <input name="technicalSpec.cliseLeft" value={formData.technicalSpec.cliseLeft} onChange={handleInputChange} type="text" className="input" placeholder="Izquierda" />
                <input name="technicalSpec.cliseCenter" value={formData.technicalSpec.cliseCenter} onChange={handleInputChange} type="text" className="input" placeholder="Centro" />
                <input name="technicalSpec.cliseRight" value={formData.technicalSpec.cliseRight} onChange={handleInputChange} type="text" className="input" placeholder="Derecha" />
            </div>
        </div>
      </FormSection>

      <FormSection title="Secuencia de Colores" icon={<Layers size={24} />}>
        <div style={{ gridColumn: 'span 2' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
            <thead>
              <tr>
                <th className="label" style={{ textAlign: 'left', padding: '0.5rem' }}>#</th>
                <th className="label" style={{ textAlign: 'left', padding: '0.5rem' }}>Nombre del Color</th>
                <th className="label" style={{ textAlign: 'left', padding: '0.5rem' }}>Fórmula Manual</th>
                <th className="label" style={{ textAlign: 'left', padding: '0.5rem' }}>Insumo ID</th>
                <th className="label" style={{ textAlign: 'left', padding: '0.5rem' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {formData.colorOrders.map((color, index) => (
                <tr key={index} className="card-item" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 800 }}>{color.sequence}°</td>
                  <td style={{ padding: '0.5rem' }}>
                    <input 
                      value={color.colorName} 
                      onChange={(e) => handleColorChange(index, 'colorName', e.target.value)}
                      type="text" className="input" placeholder="Negro, Cyan, etc." 
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input 
                      value={color.formula} 
                      onChange={(e) => handleColorChange(index, 'formula', e.target.value)}
                      type="text" className="input" placeholder="Fórmula..." 
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <select 
                      value={color.insumoId} 
                      onChange={(e) => handleColorChange(index, 'insumoId', e.target.value)}
                      className="input"
                    >
                      <option value="">Seleccionar...</option>
                      {supplies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <button 
                      type="button"
                      onClick={() => removeColorRow(index)}
                      style={{ color: 'var(--danger)', background: 'none', padding: '0.5rem' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button 
            type="button"
            onClick={addColorRow}
            className="btn" 
            style={{ marginTop: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37, 99, 235, 0.1)' }}
          >
            <Plus size={18} /> Añadir Color
          </button>
        </div>
      </FormSection>

      <FormSection title="Control de Producción en Planta" icon={<Play size={24} />}>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <StageTab 
                  active={activeStage === 'IMPRESION'} 
                  onClick={() => user?.role === 'ADMIN' && setActiveStage('IMPRESION')} 
                  icon={<Layers />} 
                  title="IMPRESIÓN" 
                  step="1" 
                  disabled={user?.role === 'MACHINE' && user.machine?.type !== 'IMPRESION'}
                />
                <StageTab 
                  active={activeStage === 'LAMINACION'} 
                  onClick={() => user?.role === 'ADMIN' && setActiveStage('LAMINACION')} 
                  icon={<Droplets />} 
                  title="LAMINACIÓN" 
                  step="2" 
                  disabled={user?.role === 'MACHINE' && user.machine?.type !== 'LAMINACION'}
                />
                <StageTab 
                  active={activeStage === 'REFILADO'} 
                  onClick={() => user?.role === 'ADMIN' && setActiveStage('REFILADO')} 
                  icon={<Scissors />} 
                  title="REFILADO" 
                  step="3" 
                  disabled={user?.role === 'MACHINE' && user.machine?.type !== 'REFILADO'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                    <label className="label">Máquina Usada (Producción)</label>
                    <select 
                      name="machineId" 
                      value={stageData.machineId} 
                      onChange={handleStageInputChange} 
                      className="input"
                    >
                        <option value="">Seleccionar máquina...</option>
                        {machines.filter(m => m.type === activeStage).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label">Operario de Producción</label>
                    <select name="operatorId" value={stageData.operatorId} onChange={handleStageInputChange} className="input">
                        <option value="">Seleccionar operario...</option>
                        {operators.map(o => <option key={o.id} value={o.id}>{o.firstName} {o.lastName}</option>)}
                    </select>
                </div>
                {(activeStage === 'IMPRESION' || activeStage === 'REFILADO') && (
                    <div>
                        <label className="label">Sentido Salida</label>
                        <select name="exitSense" value={stageData.exitSense} onChange={handleStageInputChange} className="input">
                            <option>Sentido A</option>
                            <option>Sentido B</option>
                        </select>
                    </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="label">Metros Procesados</label>
                        <input name="processedMeters" value={stageData.processedMeters} onChange={handleStageInputChange} type="number" className="input" placeholder="0" />
                    </div>
                    <div>
                        <label className="label">Scrap Generado (Kg)</label>
                        <input name="scrapKg" value={stageData.scrapKg} onChange={handleStageInputChange} type="number" className="input" placeholder="0" />
                    </div>
                </div>

                {(activeStage === 'IMPRESION' || activeStage === 'LAMINACION') && (
                  <div style={{ gridColumn: 'span 2', marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>Material Utilizado / Lotes</h4>
                      <button type="button" onClick={addMaterialRow} className="btn" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
                        <Plus size={14} /> Agregar Lote
                      </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                            <th style={{ padding: '0.5rem' }}>Lote</th>
                            <th>Kg</th>
                            <th>Inic. (m)</th>
                            <th>Agreg. (m)</th>
                            <th>Sobr. (m)</th>
                            <th>Total (m)</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {materialLots.map((lot, idx) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '0.5rem 0.2rem' }}><input className="input" style={{ padding: '0.3rem', fontSize: '0.75rem' }} value={lot.lotNumber} onChange={(e) => handleMaterialChange(idx, 'lotNumber', e.target.value)} placeholder="N° Lote" /></td>
                              <td style={{ width: '60px' }}><input className="input" style={{ padding: '0.3rem', fontSize: '0.75rem' }} value={lot.kg} onChange={(e) => handleMaterialChange(idx, 'kg', e.target.value)} type="number" /></td>
                              <td style={{ width: '80px' }}><input className="input" style={{ padding: '0.3rem', fontSize: '0.75rem' }} value={lot.initialMeters} onChange={(e) => handleMaterialChange(idx, 'initialMeters', e.target.value)} type="number" /></td>
                              <td style={{ width: '80px' }}><input className="input" style={{ padding: '0.3rem', fontSize: '0.75rem' }} value={lot.addedMeters} onChange={(e) => handleMaterialChange(idx, 'addedMeters', e.target.value)} type="number" /></td>
                              <td style={{ width: '80px' }}><input className="input" style={{ padding: '0.3rem', fontSize: '0.75rem' }} value={lot.finalMeters} onChange={(e) => handleMaterialChange(idx, 'finalMeters', e.target.value)} type="number" /></td>
                              <td style={{ fontWeight: 800, color: 'var(--primary)', textAlign: 'center' }}>{lot.totalUsed}</td>
                              <td style={{ textAlign: 'right' }}>
                                <button type="button" onClick={() => removeMaterialRow(idx)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Observaciones Adicionales / Novedades de Turno</label>
                  <textarea name="observations" value={stageData.observations} onChange={handleStageInputChange} className="input" style={{ height: '80px' }} placeholder="Opcional. Detalle aquí si hubo roturas, demoras, etc."></textarea>
                </div>
              </div>
            </div>
      </FormSection>
    </form>
  );
};
