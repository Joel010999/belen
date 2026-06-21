import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, Filter, ShieldCheck, Download, Trash2, AlertTriangle } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredLogs(logs);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const filtered = logs.filter(log => 
      log.action.toLowerCase().includes(lower) || 
      log.entity.toLowerCase().includes(lower) || 
      (log.userId && log.userId.toString().includes(lower)) ||
      (log.details && log.details.toLowerCase().includes(lower))
    );
    setFilteredLogs(filtered);
  }, [searchTerm, logs]);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit');
      setLogs(res.data);
      setFilteredLogs(res.data);
    } catch (error) {
      console.error('Error fetching audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
        const res = await api.get(`/audit/export`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `auditoria_silcar_${format(new Date(), 'yyyy_MM')}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (err) {
        alert('Error al exportar auditoría');
    }
  };

  const handlePurge = async () => {
    if (!window.confirm('¡ATENCIÓN! ¿Está seguro que desea VACIAR todo el historial de auditoría? Se recomienda haber exportado los datos previamente.')) return;
    try {
        await api.delete('/audit');
        alert('Historial vaciado exitosamente.');
        fetchLogs();
    } catch (err) {
        alert('Error al vaciar la auditoría');
    }
  };

  const isEndOfMonth = new Date().getDate() >= 25;
  const isHighVolume = logs.length >= 1000;
  const showWarning = isEndOfMonth || isHighVolume;

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': return '#10b981';
      case 'UPDATE': return '#3b82f6';
      case 'DELETE': return '#ef4444';
      default: return '#8b5cf6';
    }
  };

  return (
    <div className="fade-in" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={32} color="#8b5cf6" />
            Auditoría del Sistema
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Registro inmutable de todas las acciones y modificaciones en la base de datos.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={handleExport} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={20} /> Exportar
          </button>
          <button onClick={handlePurge} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444' }}>
            <Trash2 size={20} /> Vaciar
          </button>
        </div>
      </div>

      {showWarning && (
        <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.15)', borderLeft: '4px solid #eab308', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', borderRadius: '4px' }}>
          <AlertTriangle size={24} color="#eab308" />
          <div>
            <h4 style={{ color: '#eab308', margin: 0, fontWeight: 'bold' }}>Mantenimiento Sugerido</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>
              {isHighVolume ? 'El sistema ha registrado un alto volumen de logs.' : 'Estamos próximos a fin de mes.'} Se recomienda <b>Exportar</b> los registros actuales como comprobante y luego <b>Vaciar</b> el historial para mantener la base de datos veloz.
            </p>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)' }} />
            <input 
              type="text" 
              placeholder="Buscar por acción, entidad, usuario o detalles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '3rem', width: '100%' }}
            />
          </div>
          <button className="btn-secondary" onClick={fetchLogs} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} /> Actualizar
          </button>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Cargando registros...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'rgba(255,255,255,0.6)' }}>
                <th style={{ padding: '1rem' }}>Fecha y Hora</th>
                <th style={{ padding: '1rem' }}>Acción</th>
                <th style={{ padding: '1rem' }}>Entidad</th>
                <th style={{ padding: '1rem' }}>Usuario ID</th>
                <th style={{ padding: '1rem' }}>Detalles Técnicos</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem' }}>
                    {format(new Date(log.date), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '999px', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold',
                      backgroundColor: `${getActionColor(log.action)}20`,
                      color: getActionColor(log.action)
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{log.entity}</td>
                  <td style={{ padding: '1rem' }}>{log.userId || log.userStr || 'Sistema'}</td>
                  <td style={{ padding: '1rem', maxWidth: '400px' }}>
                    <div style={{
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      overflowX: 'auto',
                      whiteSpace: 'nowrap',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem'
                    }}>
                      {log.details}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    No se encontraron registros que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
