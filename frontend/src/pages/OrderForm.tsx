import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Package, Ruler, ClipboardList, Layers, Plus, Trash2, Users, Cpu } from 'lucide-react';
import api from '../services/api';
import { FormSection } from '../components/FormSection';
import { useAuth } from '../hooks/useAuth';

const WORK_TYPE_OPTIONS = [
  'LAMINA',
  'LAMINADO',
  'BOLSA_POUCH',
  'BOLSA_CORTE_FONDO',
  'BOLSA_CORTE_LATERAL'
];

export const OrderForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    orderNumber: '',
    clientId: '',
    deliveryDate: '',
    classification: '',
    workType: WORK_TYPE_OPTIONS[0],
    hasSample: true,
    estimatedBagQty: '',
    products: [{ productId: '', plannedQty: '' }],
    unit: 'Metros',
    creatorId: user?.id?.toString() || '1',
    machineIds: [] as string[],
    operatorsText: '',
    specifications: '',
    observations: '',
    technicalSpec: {
      materialMeasure: '',
      cut: '',
      lamina: '',
      meters: '',
      tube: '',
      colorCount: '0',
      pie: '',
      cabeza: '',
      designName: '',
      printingType: 'Directa',
      tacaRight: '',
      tacaLeft: '',
      clisheAlignment: '',
      techObservations: ''
    },
    colorOrders: [
      { sequence: 1, colorName: '', formula: '', lotNumber: '', changesToConsider: '' }
    ]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, productsRes, machinesRes] = await Promise.all([
          api.get('/clients'),
          api.get('/products'),
          api.get('/machines')
        ]);

        setClients(clientsRes.data);
        setProducts(productsRes.data);
        setMachines(machinesRes.data);

        if (isEditing) {
          const orderRes = await api.get(`/orders/${id}`);
          const order = orderRes.data;

          setFormData({
            orderNumber: order.orderNumber,
            clientId: order.clientId?.toString() || '',
            deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
            classification: order.classification || '',
            workType: order.workType || WORK_TYPE_OPTIONS[0],
            hasSample: Boolean(order.hasSample),
            estimatedBagQty: order.estimatedBagQty?.toString() || '',
            products: order.products?.length > 0
              ? order.products.map((p: any) => ({ productId: p.productId.toString(), plannedQty: p.plannedQty }))
              : [{ productId: order.productId?.toString() || '', plannedQty: order.plannedQty?.toString() || '' }],
            unit: order.unit || 'Metros',
            creatorId: order.creatorId?.toString() || user?.id?.toString() || '1',
            machineIds: order.processes?.some((p: any) => p.status === 'Planificada')
              ? order.processes.filter((p: any) => p.status === 'Planificada' && p.machineId).map((p: any) => p.machineId.toString())
              : (order.machineId ? [order.machineId.toString()] : []),
            operatorsText: order.operatorsText || '',
            specifications: order.specifications || '',
            observations: order.observations || '',
            technicalSpec: {
              materialMeasure: order.technicalSpec?.materialMeasure || '',
              cut: order.technicalSpec?.cut || '',
              lamina: order.technicalSpec?.lamina || '',
              meters: order.technicalSpec?.meters?.toString() || '',
              tube: order.technicalSpec?.tube || '',
              colorCount: order.technicalSpec?.colorCount?.toString() || '0',
              pie: order.technicalSpec?.pie || '',
              cabeza: order.technicalSpec?.cabeza || '',
              designName: order.technicalSpec?.designName || '',
              printingType: order.technicalSpec?.printingType || 'Directa',
              tacaRight: order.technicalSpec?.tacaRight || '',
              tacaLeft: order.technicalSpec?.tacaLeft || '',
              clisheAlignment: order.technicalSpec?.clisheAlignment || '',
              techObservations: order.technicalSpec?.techObservations || ''
            },
            colorOrders: order.colorOrders?.length > 0
              ? order.colorOrders.map((c: any) => ({
                  sequence: c.sequence,
                  colorName: c.colorName,
                  formula: c.formula || '',
                  lotNumber: c.lotNumber || '',
                  changesToConsider: c.changesToConsider || ''
                }))
              : [{ sequence: 1, colorName: '', formula: '', lotNumber: '', changesToConsider: '' }]
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('No se pudieron cargar los datos de la orden');
      }
    };

    fetchData();
  }, [id, isEditing, user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const { name } = target;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value
        }
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value as any }));
  };

  const handleProductChange = (index: number, field: string, value: string) => {
    const nextProducts = [...formData.products];
    (nextProducts[index] as any)[field] = value;
    setFormData((prev) => ({ ...prev, products: nextProducts }));
  };

  const addProductRow = () => {
    setFormData((prev) => ({
      ...prev,
      products: [...prev.products, { productId: '', plannedQty: '' }]
    }));
  };

  const removeProductRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      products: prev.products.filter((_, currentIndex) => currentIndex !== index)
    }));
  };

  const handleColorChange = (index: number, field: string, value: string) => {
    const nextColors = [...formData.colorOrders];
    (nextColors[index] as any)[field] = value;
    setFormData((prev) => ({ ...prev, colorOrders: nextColors }));
  };

  const addColorRow = () => {
    setFormData((prev) => ({
      ...prev,
      colorOrders: [
        ...prev.colorOrders,
        { sequence: prev.colorOrders.length + 1, colorName: '', formula: '', lotNumber: '', changesToConsider: '' }
      ]
    }));
  };

  const removeColorRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      colorOrders: prev.colorOrders.filter((_, currentIndex) => currentIndex !== index)
    }));
  };

  const toggleMachine = (machineId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      machineIds: checked
        ? [...prev.machineIds, machineId]
        : prev.machineIds.filter((idValue) => idValue !== machineId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    if (!formData.operatorsText.trim()) {
      setError('Debe registrar el personal u observacion de turno que acompana la orden.');
      setLoading(false);
      return;
    }

    if (formData.machineIds.length === 0) {
      setError('Debe asignar al menos una maquina planificada.');
      setLoading(false);
      return;
    }

    try {
      if (isEditing) {
        await api.put(`/orders/${id}`, formData);
      } else {
        await api.post('/orders', formData);
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        window.location.href = '/ordenes';
      }, 1400);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar la orden');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="card" style={{ maxWidth: '780px', margin: '2rem auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Edicion restringida</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          La base administrativa y tecnica de la orden solo puede ser modificada por administracion.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
            {isEditing ? 'Editar Nota de Pedido' : 'Nueva Nota de Pedido'}
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Carga administrativa y tecnica de la orden segun el formulario real de planta.
          </p>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 2.5rem', fontWeight: 700 }}
        >
          <Save size={20} />
          <span>{loading ? 'GUARDANDO...' : 'GUARDAR ORDEN'}</span>
        </button>
      </div>

      {success && (
        <div className="card" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'var(--success)', color: 'var(--success)', marginBottom: '2rem', textAlign: 'center' }}>
          Orden guardada correctamente.
        </div>
      )}

      {error && (
        <div className="card" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--danger)', color: 'var(--danger)', marginBottom: '2rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      <FormSection title="Origen y Planificacion" icon={<Users size={24} />}>
        <div>
          <label className="label">Maquina(s) planificada(s)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
            {machines.map((machine) => (
              <label key={machine.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.machineIds.includes(machine.id.toString())}
                  onChange={(e) => toggleMachine(machine.id.toString(), e.target.checked)}
                  style={{ width: '1.1rem', height: '1.1rem' }}
                />
                <span><Cpu size={16} style={{ display: 'inline', marginRight: '0.45rem' }} />{machine.name} ({machine.code})</span>
              </label>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="label">Operador(es) / referencia de turno</label>
          <input
            name="operatorsText"
            value={formData.operatorsText}
            onChange={handleInputChange}
            className="input"
            placeholder="Ej: Turno maniana - Juan Perez / Roberto Gomez"
            required
          />
        </div>
      </FormSection>

      <FormSection title="Datos Generales" icon={<Package size={24} />}>
        <div>
          <label className="label">Numero de Orden</label>
          <input name="orderNumber" value={formData.orderNumber} onChange={handleInputChange} type="text" className="input" required />
        </div>
        <div>
          <label className="label">Cliente</label>
          <select name="clientId" value={formData.clientId} onChange={handleInputChange} className="input" required>
            <option value="">Seleccione un cliente...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name} ({client.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Fecha de Entrega</label>
          <input name="deliveryDate" value={formData.deliveryDate} onChange={handleInputChange} type="date" className="input" required />
        </div>
        <div>
          <label className="label">Clasificacion</label>
          <input name="classification" value={formData.classification} onChange={handleInputChange} type="text" className="input" placeholder="Ej: Vestor" />
        </div>
        <div>
          <label className="label">Tipo de Trabajo</label>
          <select name="workType" value={formData.workType} onChange={handleInputChange} className="input">
            {WORK_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Muestra Original</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', height: '48px' }}>
            <input type="checkbox" name="hasSample" checked={formData.hasSample} onChange={handleInputChange} />
            <span>La orden viaja con muestra fisica</span>
          </label>
        </div>
        <div>
          <label className="label">Equivalencia Esperada: Bolsas</label>
          <input
            name="estimatedBagQty"
            value={formData.estimatedBagQty}
            onChange={handleInputChange}
            type="number"
            className="input"
            placeholder="Ej: 6000"
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Productos de la Orden</h4>
          {formData.products.map((productRow, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="label">Producto Terminado</label>
                <select
                  value={productRow.productId}
                  onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Seleccione un producto...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name} ({product.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Cantidad Planificada</label>
                <input
                  value={productRow.plannedQty}
                  onChange={(e) => handleProductChange(index, 'plannedQty', e.target.value)}
                  type="text"
                  className="input"
                  placeholder="Ej: 1200 m / 6000 un"
                  required
                />
              </div>
              {formData.products.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="button" onClick={() => removeProductRow(index)} className="btn" style={{ padding: '0.8rem', color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
          <button type="button" onClick={addProductRow} className="btn" style={{ marginTop: '0.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Anadir otro producto
          </button>
        </div>
      </FormSection>

      <FormSection title="Descripcion del Trabajo" icon={<ClipboardList size={24} />}>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="label">Descripcion / Especificaciones generales</label>
          <textarea
            name="specifications"
            value={formData.specifications}
            onChange={handleInputChange}
            className="input"
            style={{ height: '110px' }}
            placeholder="Ej: Bolsa 16 x 20 x 40 / 1200 mts = 6000 bolsas"
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="label">Observaciones administrativas</label>
          <textarea
            name="observations"
            value={formData.observations}
            onChange={handleInputChange}
            className="input"
            style={{ height: '90px' }}
            placeholder="Notas internas u observaciones adicionales"
          />
        </div>
      </FormSection>

      <FormSection title="Especificacion Tecnica" icon={<Ruler size={24} />}>
        <div>
          <label className="label">Medida Material</label>
          <input name="technicalSpec.materialMeasure" value={formData.technicalSpec.materialMeasure} onChange={handleInputChange} type="text" className="input" placeholder="Ej: 16/40" />
        </div>
        <div>
          <label className="label">Corte</label>
          <input name="technicalSpec.cut" value={formData.technicalSpec.cut} onChange={handleInputChange} type="text" className="input" placeholder="Ej: 40" />
        </div>
        <div>
          <label className="label">Lamina / Material</label>
          <input name="technicalSpec.lamina" value={formData.technicalSpec.lamina} onChange={handleInputChange} type="text" className="input" placeholder="Ej: Polipropileno" />
        </div>
        <div>
          <label className="label">Metros Totales a Imprimir</label>
          <input name="technicalSpec.meters" value={formData.technicalSpec.meters} onChange={handleInputChange} type="number" className="input" placeholder="1200" />
        </div>
        <div>
          <label className="label">Tipo de Tubo</label>
          <input name="technicalSpec.tube" value={formData.technicalSpec.tube} onChange={handleInputChange} type="text" className="input" />
        </div>
        <div>
          <label className="label">Tipo de Impresion</label>
          <select name="technicalSpec.printingType" value={formData.technicalSpec.printingType} onChange={handleInputChange} className="input">
            <option value="Directa">Directa</option>
            <option value="Retroverso">Retroverso</option>
          </select>
        </div>
        <div>
          <label className="label">Cantidad de Colores</label>
          <input name="technicalSpec.colorCount" value={formData.technicalSpec.colorCount} onChange={handleInputChange} type="number" className="input" />
        </div>
        <div>
          <label className="label">Pie</label>
          <input name="technicalSpec.pie" value={formData.technicalSpec.pie} onChange={handleInputChange} type="text" className="input" />
        </div>
        <div>
          <label className="label">Cabeza</label>
          <input name="technicalSpec.cabeza" value={formData.technicalSpec.cabeza} onChange={handleInputChange} type="text" className="input" />
        </div>
        <div>
          <label className="label">Taca Derecha</label>
          <input name="technicalSpec.tacaRight" value={formData.technicalSpec.tacaRight} onChange={handleInputChange} type="text" className="input" />
        </div>
        <div>
          <label className="label">Taca Izquierda</label>
          <input name="technicalSpec.tacaLeft" value={formData.technicalSpec.tacaLeft} onChange={handleInputChange} type="text" className="input" />
        </div>
        <div>
          <label className="label">Clise Centrado Izq / Der</label>
          <input name="technicalSpec.clisheAlignment" value={formData.technicalSpec.clisheAlignment} onChange={handleInputChange} type="text" className="input" placeholder="Ej: Centrado" />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="label">Observaciones Tecnicas</label>
          <textarea
            name="technicalSpec.techObservations"
            value={formData.technicalSpec.techObservations}
            onChange={handleInputChange}
            className="input"
            style={{ height: '90px' }}
          />
        </div>
      </FormSection>

      <FormSection title="Secuencia de Colores" icon={<Layers size={24} />}>
        <div style={{ gridColumn: 'span 2' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
            <thead>
              <tr>
                <th className="label" style={{ textAlign: 'left', padding: '0.5rem' }}>#</th>
                <th className="label" style={{ textAlign: 'left', padding: '0.5rem' }}>Color</th>
                <th className="label" style={{ textAlign: 'left', padding: '0.5rem' }}>Formula</th>
                <th className="label" style={{ textAlign: 'left', padding: '0.5rem' }}>Lote</th>
                <th className="label" style={{ textAlign: 'left', padding: '0.5rem' }}>Cambios</th>
                <th className="label" style={{ textAlign: 'left', padding: '0.5rem' }}>Accion</th>
              </tr>
            </thead>
            <tbody>
              {formData.colorOrders.map((color, index) => (
                <tr key={index} style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 800 }}>{color.sequence}°</td>
                  <td style={{ padding: '0.5rem' }}>
                    <input value={color.colorName} onChange={(e) => handleColorChange(index, 'colorName', e.target.value)} type="text" className="input" />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input value={color.formula} onChange={(e) => handleColorChange(index, 'formula', e.target.value)} type="text" className="input" />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input value={color.lotNumber || ''} onChange={(e) => handleColorChange(index, 'lotNumber', e.target.value)} type="text" className="input" />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input value={color.changesToConsider || ''} onChange={(e) => handleColorChange(index, 'changesToConsider', e.target.value)} type="text" className="input" />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <button type="button" onClick={() => removeColorRow(index)} style={{ color: 'var(--danger)', background: 'none', padding: '0.5rem' }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addColorRow} className="btn" style={{ marginTop: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Anadir Color
          </button>
        </div>
      </FormSection>
    </form>
  );
};
