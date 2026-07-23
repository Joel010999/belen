import React, { useState } from 'react';
import api from '../services/api';
import { Upload, Download, FileText, CheckCircle2, History, AlertCircle, Package, Users, DollarSign } from 'lucide-react';

const getCurrentMonth = () => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
};

export const ImportCSV: React.FC = () => {
  const [importing, setImporting] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [alegonMonth, setAlegonMonth] = useState(getCurrentMonth());

  const handleImport = async (type: string, file: File) => {
    setImporting(type);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('userId', '1');

    try {
      const res = await api.post(`/import/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult({
        type,
        read: res.data.readCount,
        inserted: res.data.insertedCount,
        updated: res.data.updatedCount,
        errors: res.data.errorCount,
        log: res.data.errorLog
      });
    } catch (err: any) {
      setResult({
        type,
        errors: 1,
        log: err.response?.data?.error || err.message
      });
    } finally {
      setImporting(null);
    }
  };

  const handleExport = async (type: string) => {
    try {
      const endpoint = type === 'STOCK' ? 'stock' : type === 'PRECIOS' ? 'products' : 'clients';
      const filename = type === 'STOCK' ? 'stock_silcar.csv' : type === 'PRECIOS' ? 'productos_precios_silcar.csv' : 'clientes_silcar.csv';
      
      const res = await api.get(`/export/${endpoint}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(`Error al exportar ${type}`);
    }
  };

  const handleAlegonExport = async (type: 'factura' | 'detalle') => {
    try {
      const filename = type === 'factura' ? 'Factura_palm.txt' : 'Detalle_palm.txt';
      const res = await api.get(`/orders/export-alegon/${type}`, {
        params: { month: alegonMonth },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(`Error al exportar ${type === 'factura' ? 'Factura_palm' : 'Detalle_palm'}`);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>Transferencia de Datos</h1>
        <p style={{ color: 'var(--text-muted)' }}>Sincronización bidireccional con el sistema de gestión central.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* BLOCK 1: IMPORTACIONES */}
        <div>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
            <Upload size={24} />
            Importación de Datos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ImportCard 
              title="Importar Stock" 
              icon={<Package />} 
              description="Actualiza niveles de inventario desde archivo de stock."
              onUpload={(file: File) => handleImport('STOCK', file)}
              loading={importing === 'STOCK'}
            />
            <ImportCard 
              title="Importar Precios" 
              icon={<DollarSign />} 
              description="Sincroniza lista de precios de insumos y productos."
              onUpload={(file: File) => handleImport('PRODUCTO', file)}
              loading={importing === 'PRODUCTO'}
            />
            <ImportCard 
              title="Importar Clientes" 
              icon={<Users />} 
              description="Actualiza la base maestra de clientes y direcciones."
              onUpload={(file: File) => handleImport('CLIENTE', file)}
              loading={importing === 'CLIENTE'}
            />
          </div>
        </div>

        {/* BLOCK 2: EXPORTACIONES */}
        <div>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--success)' }}>
            <Download size={24} />
            Exportación de Datos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ExportCard 
              title="Exportar Stock" 
              icon={<Package />} 
              onClick={() => handleExport('STOCK')}
            />
            <ExportCard 
              title="Exportar Precios" 
              icon={<DollarSign />} 
              onClick={() => handleExport('PRECIOS')}
            />
            <ExportCard 
              title="Exportar Clientes" 
              icon={<Users />} 
              onClick={() => handleExport('CLIENTES')}
            />
          </div>

          <div className="card" style={{ marginTop: '1.5rem', padding: '1.25rem', border: '1px solid rgba(34, 197, 94, 0.25)', backgroundColor: 'rgba(34, 197, 94, 0.06)' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.12)', borderRadius: '8px', color: 'var(--success)' }}>
                <FileText size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 800, margin: 0 }}>Exportacion Alegon / Silcar</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Genera Factura_palm.txt y Detalle_palm.txt sin encabezados.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label className="label">Mes a exportar</label>
                <input type="month" className="input" value={alegonMonth} onChange={(e) => setAlegonMonth(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn" style={{ padding: '0.6rem 1rem', border: '1px solid var(--success)', color: 'var(--success)' }} onClick={() => handleAlegonExport('factura')}>
                Descargar Factura_palm.txt
              </button>
              <button className="btn" style={{ padding: '0.6rem 1rem', border: '1px solid var(--success)', color: 'var(--success)' }} onClick={() => handleAlegonExport('detalle')}>
                Descargar Detalle_palm.txt
              </button>
            </div>
          </div>

          {result && (
            <div className="card" style={{ marginTop: '2rem', border: `1px solid ${result.errors > 0 ? 'var(--warning)' : 'var(--success)'}`, backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {result.errors > 0 ? <AlertCircle color="var(--warning)" size={18} /> : <CheckCircle2 color="var(--success)" size={18} />}
                Resultado: {result.type}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                <StatMini label="Leídos" value={result.read} />
                <StatMini label="Nuevos" value={result.inserted} color="var(--success)" />
                <StatMini label="Actualiz." value={result.updated} color="var(--primary)" />
                <StatMini label="Errores" value={result.errors} color="var(--danger)" />
              </div>
              {result.log && (
                <pre style={{ marginTop: '1rem', fontSize: '0.7rem', padding: '0.5rem', backgroundColor: '#000', color: 'var(--danger)', borderRadius: '4px', maxHeight: '80px', overflow: 'auto' }}>
                  {result.log}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ImportCard = ({ title, icon, description, onUpload, loading }: any) => (
  <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: 'var(--primary)' }}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div>
        <p style={{ fontWeight: 800, margin: 0 }}>{title}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{description}</p>
      </div>
    </div>
    <label className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
      {loading ? 'Subiendo...' : 'Subir Archivo'}
      <input type="file" style={{ display: 'none' }} accept=".csv,.txt" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} disabled={loading} />
    </label>
  </div>
);

const ExportCard = ({ title, icon, onClick }: any) => (
  <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem' }}>
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div style={{ padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: 'var(--success)' }}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <p style={{ fontWeight: 800, margin: 0 }}>{title}</p>
    </div>
    <button className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', border: '1px solid var(--success)', color: 'var(--success)' }} onClick={onClick}>
      Exportar CSV
    </button>
  </div>
);

const StatMini = ({ label, value, color }: any) => (
  <div style={{ textAlign: 'center', padding: '0.5rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px' }}>
    <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase' }}>{label}</p>
    <p style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, color: color || 'inherit' }}>{value || 0}</p>
  </div>
);

