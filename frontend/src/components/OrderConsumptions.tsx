import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Droplet, Layers, Save, CheckCircle2, Plus, Trash2, DollarSign, RefreshCw } from 'lucide-react';
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
  const [exchangeRate, setExchangeRate] = useState('');
  const [exchangeRateSource, setExchangeRateSource] = useState('');
  const [exchangeRateDate, setExchangeRateDate] = useState('');
  const [exchangeRateLoading, setExchangeRateLoading] = useState(false);

  const savedUser = typeof window !== 'undefined' ? localStorage.getItem('silcar_user') : null;
  let currentUser: any = null;
  try {
    currentUser = savedUser ? JSON.parse(savedUser) : null;
  } catch {
    currentUser = null;
  }
  const canEditExchangeRate = currentUser?.role === 'ADMIN';

  useEffect(() => {
    api.get('/supplies').then(res => setSupplies(res.data)).catch(console.error);
  }, []);

  const fetchExchangeRate = async () => {
    setExchangeRateLoading(true);
    try {
      const res = await api.get('/exchange-rate/usd-official');
      if (res.data?.rate) {
        setExchangeRate(String(res.data.rate));
        setExchangeRateSource(res.data.source || '');
        setExchangeRateDate(res.data.date || '');
      }
    } catch (error) {
      console.error('Error fetching exchange rate', error);
    } finally {
      setExchangeRateLoading(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
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

  const parseNumber = (value: any) => {
    const parsed = parseFloat(String(value ?? '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const formatCurrency = (value: number, currency: 'USD' | 'ARS') => {
    if (!Number.isFinite(value)) return '-';

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'USD' ? 2 : 0
    }).format(value);
  };

  const getSupplyPrice = (item: any) => {
    const supply = supplies.find((s) => s.id === item.supplyId);
    const price = Number(supply?.price);
    return Number.isFinite(price) ? price : 0;
  };

  const getItemCostUsd = (item: any) => {
    const price = getSupplyPrice(item);
    return price ? (Number(item.realQty) || 0) * price : 0;
  };

  const getItemCostArs = (item: any) => getItemCostUsd(item) * parseNumber(exchangeRate);

  const formatSavedCostArs = (consumption: any) => {
    const savedArs = Number(consumption.calculatedCostArs);
    if (Number.isFinite(savedArs) && savedArs !== 0) return formatCurrency(savedArs, 'ARS');

    const savedUsd = Number(consumption.calculatedCost);
    const savedRate = Number(consumption.exchangeRate);
    if (Number.isFinite(savedUsd) && Number.isFinite(savedRate) && savedRate > 0) {
      return formatCurrency(savedUsd * savedRate, 'ARS');
    }

    return '-';
  };

  const handlePrintingChange = (index: number, field: string, value: string) => {
    const updated = [...printingColors];
    updated[index][field] = value;
    
    const totalLoads = parseLoads(updated[index].loads);
    const sobrante = parseFloat(updated[index].endValue) || 0;
    updated[index].realQty = totalLoads - sobrante;
    
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
    const shouldSendRow = (item: any) => {
      const hasMovement = item.realQty !== 0 || String(item.loads || '').trim().length > 0;
      const hasIdentifiableSupply = Boolean(item.supplyId) || String(item.colorName || item.name || '').trim().length > 0;
      return hasMovement && hasIdentifiableSupply;
    };

    return {
      type: activeTab,
      realMeters: realMeters ? parseFloat(realMeters) : undefined,
      exchangeRate: parseNumber(exchangeRate) || undefined,
      consumptions: activeTab === 'PRINTING' 
        ? printingColors.filter(shouldSendRow).map(c => ({
            colorId: c.id,
            colorName: c.colorName,
            supplyId: c.supplyId,
            loads: c.loads,
            endValue: c.endValue,
            realQty: c.realQty,
            unit: 'kg'
          }))
        : laminationSupplies.filter(shouldSendRow).map(c => ({
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
    if (dataToSend.consumptions.length === 0 && !dataToSend.realMeters) {
      alert('No hay consumos validos para guardar. Selecciona un insumo antes de confirmar.');
      setLoading(false);
      return;
    }

    try {
      await api.post(`/orders/${order.id}/consumptions`, dataToSend);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        if (onUpdate) onUpdate();
      }, 2000);
    } catch (error: any) {
      console.error('Error saving consumptions', error);
      alert(error?.response?.data?.error || 'Error al guardar consumos');
    } finally {
      setLoading(false);
    }
  };

  const currentRows = activeTab === 'PRINTING' ? printingColors : laminationSupplies;
  const totalKg = currentRows.reduce((acc, item) => acc + (Number(item.realQty) || 0), 0);
  const totalUsd = currentRows.reduce((acc, item) => acc + getItemCostUsd(item), 0);
  const totalArs = currentRows.reduce((acc, item) => acc + getItemCostArs(item), 0);
  const savedConsumptions = Array.isArray(order?.consumptions) ? order.consumptions : [];

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

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 320px) 1fr auto', gap: '1rem', alignItems: 'end', marginBottom: '1.5rem', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '14px', padding: '1rem' }}>
        <div>
          <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={16} /> Dolar usado para calculo
          </label>
          <input
            type="number"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            disabled={!canEditExchangeRate}
            className="input-field"
            placeholder="Cotizacion USD"
            style={{ width: '100%', fontSize: '1rem', fontWeight: 800 }}
          />
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-main)' }}>Fuente:</strong> {exchangeRateSource || 'Sin consultar'}
          {exchangeRateDate ? ` | Fecha BCRA: ${new Date(`${exchangeRateDate}T00:00:00`).toLocaleDateString()}` : ''}
          <br />
          {canEditExchangeRate
            ? 'Administracion puede corregir la cotizacion antes de guardar si hace falta.'
            : 'Los usuarios de maquina usan la cotizacion automatica, sin modificar valores contables.'}
        </div>
        <button
          type="button"
          onClick={fetchExchangeRate}
          disabled={exchangeRateLoading}
          className="btn"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
        >
          <RefreshCw size={16} /> {exchangeRateLoading ? 'Actualizando...' : 'Actualizar BCRA'}
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
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Precio USD</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total USD</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total ARS</th>
              <th style={{ padding: '0.75rem', width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((item, idx) => (
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
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, color: item.realQty < 0 ? 'var(--success)' : 'var(--primary)', fontSize: '1.2rem' }}>
                  {item.realQty} <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>kg</span>
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {getSupplyPrice(item) ? formatCurrency(getSupplyPrice(item), 'USD') : '-'}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-muted)' }}>
                  {getItemCostUsd(item) ? formatCurrency(getItemCostUsd(item), 'USD') : '-'}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 800, color: getItemCostArs(item) < 0 ? 'var(--success)' : 'var(--primary)' }}>
                  {getItemCostArs(item) ? formatCurrency(getItemCostArs(item), 'ARS') : '-'}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Total kg carga actual</p>
          <strong style={{ fontSize: '1.35rem', color: totalKg < 0 ? 'var(--success)' : 'var(--primary)' }}>{totalKg.toFixed(2)} kg</strong>
        </div>
        <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Subtotal USD</p>
          <strong style={{ fontSize: '1.35rem' }}>{formatCurrency(totalUsd, 'USD')}</strong>
        </div>
        <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700 }}>Total en pesos</p>
          <strong style={{ fontSize: '1.35rem', color: totalArs < 0 ? 'var(--success)' : 'var(--primary)' }}>{formatCurrency(totalArs, 'ARS')}</strong>
        </div>
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

      {savedConsumptions.length > 0 && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '14px', border: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <h4 style={{ marginBottom: '0.85rem', color: 'var(--text-main)' }}>Consumos ya registrados</h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.6rem' }}>Insumo</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Kg</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Precio USD</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Subtotal USD</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Dolar usado</th>
                  <th style={{ padding: '0.6rem', textAlign: 'right' }}>Total ARS</th>
                </tr>
              </thead>
              <tbody>
                {savedConsumptions.map((consumption: any) => (
                  <tr key={consumption.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.6rem' }}>{consumption.supply?.name || `Insumo ${consumption.supplyId}`}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right', color: consumption.realQty < 0 ? 'var(--success)' : 'var(--text-main)' }}>{Number(consumption.realQty || 0).toFixed(2)} {consumption.unit || 'kg'}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right' }}>{consumption.unitPrice ? formatCurrency(Number(consumption.unitPrice), 'USD') : '-'}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right' }}>{consumption.calculatedCost ? formatCurrency(Number(consumption.calculatedCost), 'USD') : '-'}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right' }}>{consumption.exchangeRate ? formatCurrency(Number(consumption.exchangeRate), 'ARS') : '-'}</td>
                    <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 800, color: Number(consumption.calculatedCostArs || 0) < 0 ? 'var(--success)' : 'var(--primary)' }}>{formatSavedCostArs(consumption)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
          <CheckCircle2 size={20} /> Inventario actualizado correctamente.
        </div>
      )}
    </div>
  );
});
