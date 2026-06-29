import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Droplet, Layers, Save, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import api from '../services/api';

export interface ConsumptionsRef {
  getConsumptionsData: () => any;
  clear: () => void;
}

interface ConsumptionsProps {
  order: any;
  onUpdate?: () => void;
  standalone?: boolean;
  lockedTab?: 'PRINTING' | 'LAMINATION';
}

export const OrderConsumptions = forwardRef<ConsumptionsRef, ConsumptionsProps>(({ order, onUpdate, standalone = true, lockedTab }, ref) => {
  const [activeTab, setActiveTab] = useState<'PRINTING' | 'LAMINATION'>(lockedTab || 'PRINTING');
  const [printingColors, setPrintingColors] = useState<any[]>([]);
  const [laminationSupplies, setLaminationSupplies] = useState<any[]>([]);
  const [realMeters, setRealMeters] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [supplies, setSupplies] = useState<any[]>([]);

  useEffect(() => {
    api.get('/supplies').then(res => setSupplies(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (lockedTab) {
      setActiveTab(lockedTab);
    }
  }, [lockedTab]);

  useEffect(() => {
    if (order?.colorOrders) {
      setPrintingColors(prev => {
        return order.colorOrders.map((c: any, index: number) => {
          const existing = prev.find(p => (c.sequence && p.sequence === c.sequence) || p.colorName === c.colorName) || prev[index];
          return {
            id: c.id,
            sequence: c.sequence,
            colorName: c.colorName,
            supplyId: c.supplyId || c.insumoId,
            loads: existing?.loads || '',
            endValue: existing?.endValue || '',
            realQty: existing?.realQty || 0
          };
        });
      });
    }
    
    setLaminationSupplies(prev => {
      if (prev.length > 0) return prev;
      return [
        { name: 'Adhesivo', supplyId: null, loads: '', endValue: '', realQty: 0 },
        { name: 'Solvente', supplyId: null, loads: '', endValue: '', realQty: 0 },
        { name: 'Reticulante', supplyId: null, loads: '', endValue: '', realQty: 0 }
      ];
    });
  }, [order?.colorOrders]);

  const parseLoads = (loadsStr: string) => {
    if (!loadsStr) return 0;
    const parts = loadsStr.replace(/,/g, '+').split('+');
    return parts.reduce((acc, val) => acc + (parseFloat(val.trim()) || 0), 0);
  };

  const handlePrintingChange = (index: number, field: string, value: string) => {
    const updated = [...printingColors];
    updated[index][field] = value;
    
    const totalLoads = parseLoads(updated[index].loads);
    const sobrante = parseFloat(updated[index].endValue) || 0;
    updated[index].realQty = Math.max(0, totalLoads - sobrante);
    
    setPrintingColors(updated);
  };

  const handleLaminationChange = (index: number, field: string, value: string) => {
    const updated = [...laminationSupplies];
    updated[index][field] = value;
    
    const totalLoads = parseLoads(updated[index].loads);
    const sobrante = parseFloat(updated[index].endValue) || 0;
    updated[index].realQty = Math.max(0, totalLoads - sobrante);
    
    setLaminationSupplies(updated);
  };

  const removeRow = (index: number) => {
    if (activeTab === 'PRINTING') {
      setPrintingColors(prev => prev.filter((_, i) => i !== index));
    } else {
      setLaminationSupplies(prev => prev.filter((_, i) => i !== index));
    }
  };

  const addRow = () => {
    if (activeTab === 'PRINTING') {
      setPrintingColors(prev => [...prev, { colorName: '', supplyId: null, loads: '', endValue: '', realQty: 0 }]);
    } else {
      setLaminationSupplies(prev => [...prev, { name: '', supplyId: null, loads: '', endValue: '', realQty: 0 }]);
    }
  };

  const getConsumptionsData = () => {
    return {
      type: activeTab,
      realMeters: realMeters ? parseFloat(realMeters) : undefined,
      consumptions: activeTab === 'PRINTING' 
        ? printingColors.filter(c => c.realQty > 0 || c.loads).map(c => ({
            colorId: c.id,
            colorName: c.colorName,
            supplyId: c.supplyId,
            loads: c.loads,
            endValue: c.endValue,
            realQty: c.realQty,
            unit: 'kg'
          }))
        : laminationSupplies.filter(c => c.realQty > 0 || c.loads).map(c => ({
            colorName: c.name,
            supplyId: c.supplyId,
            loads: c.loads,
            endValue: c.endValue,
            realQty: c.realQty,
            unit: 'kg'
          }))
    };
  };

  useImperativeHandle(ref, () => ({
    getConsumptionsData,
    clear: () => {
      setRealMeters('');
      setPrintingColors(prev => prev.map(p => ({ ...p, loads: '', endValue: '', realQty: 0 })));
      setLaminationSupplies(prev => prev.map(p => ({ ...p, loads: '', endValue: '', realQty: 0 })));
    }
  }));

  const handleSubmit = async () => {
    setLoading(true);
    setSuccess(false);
    
    const dataToSend = getConsumptionsData();

    try {
      await api.post(`/orders/${order.id}/consumptions`, dataToSend);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onUpdate) onUpdate();
      }, 2000);
    } catch (error) {
      console.error('Error saving consumptions', error);
      alert('Error al guardar consumos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}>
      <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.25rem', color: 'var(--primary)' }}>
        <Droplet /> Registro de Consumos de Operario
      </h3>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => !lockedTab && setActiveTab('PRINTING')}
          disabled={Boolean(lockedTab)}
          style={{ 
            background: 'none', border: 'none', color: activeTab === 'PRINTING' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'PRINTING' ? 800 : 500, fontSize: '1rem', cursor: lockedTab ? 'default' : 'pointer', padding: '0.5rem 1rem',
            borderBottom: activeTab === 'PRINTING' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s ease',
            opacity: lockedTab && activeTab !== 'PRINTING' ? 0.5 : 1
          }}
        >
          <Droplet size={16} style={{ display: 'inline', marginRight: '0.5rem' }}/>
          Impresión
        </button>
        <button 
          onClick={() => !lockedTab && setActiveTab('LAMINATION')}
          disabled={Boolean(lockedTab)}
          style={{ 
            background: 'none', border: 'none', color: activeTab === 'LAMINATION' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'LAMINATION' ? 800 : 500, fontSize: '1rem', cursor: lockedTab ? 'default' : 'pointer', padding: '0.5rem 1rem',
            borderBottom: activeTab === 'LAMINATION' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'all 0.2s ease',
            opacity: lockedTab && activeTab !== 'LAMINATION' ? 0.5 : 1
          }}
        >
          <Layers size={16} style={{ display: 'inline', marginRight: '0.5rem' }}/>
          Laminación / Extrusión
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>Insumo / Color</th>
              <th style={{ padding: '0.75rem' }}>Cargas (ej. 25+20)</th>
              <th style={{ padding: '0.75rem' }}>Diferencia / Fin</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Consumo Real</th>
              <th style={{ padding: '0.75rem', width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {(activeTab === 'PRINTING' ? printingColors : laminationSupplies).map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '0.75rem' }}>
                  <select 
                    value={item.supplyId || ''} 
                    onChange={(e) => {
                      const sId = e.target.value ? parseInt(e.target.value) : null;
                      const s = supplies.find(x => x.id === sId);
                      if (activeTab === 'PRINTING') {
                        const updated = [...printingColors];
                        updated[idx].supplyId = sId;
                        updated[idx].colorName = s ? s.name : '';
                        setPrintingColors(updated);
                      } else {
                        const updated = [...laminationSupplies];
                        updated[idx].supplyId = sId;
                        updated[idx].name = s ? s.name : '';
                        setLaminationSupplies(updated);
                      }
                    }}
                    className="input-field"
                    style={{ width: '100%', minWidth: '150px', padding: '0.6rem', fontSize: '0.9rem', backgroundColor: 'rgba(0,0,0,0.2)' }}
                  >
                    <option value="">Seleccione insumo...</option>
                    {(!item.supplyId && (item.colorName || item.name)) && (
                      <option value="">{item.colorName || item.name} (Seleccione insumo real)</option>
                    )}
                    {supplies.map(s => (
                      <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                    ))}
                  </select>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <input 
                    type="text" 
                    value={item.loads} 
                    onChange={(e) => activeTab === 'PRINTING' ? handlePrintingChange(idx, 'loads', e.target.value) : handleLaminationChange(idx, 'loads', e.target.value)}
                    placeholder="25+20"
                    className="input-field"
                    style={{ width: '120px', padding: '0.6rem', fontSize: '0.9rem', backgroundColor: 'rgba(0,0,0,0.2)' }}
                  />
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <input 
                    type="number" 
                    value={item.endValue} 
                    onChange={(e) => activeTab === 'PRINTING' ? handlePrintingChange(idx, 'endValue', e.target.value) : handleLaminationChange(idx, 'endValue', e.target.value)}
                    placeholder="0"
                    className="input-field"
                    style={{ width: '100px', padding: '0.6rem', fontSize: '0.9rem', backgroundColor: 'rgba(0,0,0,0.2)' }}
                  />
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: '1.2rem' }}>
                  {item.realQty} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>kg</span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                  <button 
                    onClick={() => removeRow(idx)}
                    title="Eliminar fila"
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.7, padding: '0.2rem' }}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          onClick={addRow}
          className="btn" 
          style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37, 99, 235, 0.1)', padding: '0.5rem 1rem' }}
        >
          <Plus size={16} /> Añadir Insumo Extra
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', backgroundColor: 'rgba(0,0,0,0.3)', padding: '1.2rem', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Metros Reales Producidos:</span>
          <input 
            type="number" 
            value={realMeters} 
            onChange={(e) => setRealMeters(e.target.value)} 
            className="input-field" 
            placeholder="0" 
            style={{ width: '120px', fontSize: '1rem', fontWeight: 700 }} 
          />
        </div>

        {standalone && (
          <button 
            onClick={handleSubmit}
            disabled={loading || success}
            className="btn btn-primary" 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem',
              fontSize: '1rem', fontWeight: 700,
              boxShadow: '0 4px 15px -3px rgba(37, 99, 235, 0.4)'
            }}
          >
            {loading ? (
              <span>Procesando...</span>
            ) : success ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={20} /> Confirmado</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={20} /> Confirmar Consumos</span>
            )}
          </button>
        )}
      </div>
      
      {success && standalone && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <CheckCircle2 size={20} /> Cantidades descontadas del inventario correctamente.
        </div>
      )}
    </div>
  );
});
