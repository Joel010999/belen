import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export const CostDashboard: React.FC = () => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/orders/stats/costs');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching cost stats', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPlanned = stats.reduce((acc, curr) => acc + curr.plannedKg, 0);
  const totalReal = stats.reduce((acc, curr) => acc + curr.realKg, 0);
  const totalDiff = totalReal - totalPlanned;
  const globalDiffPercent = totalPlanned > 0 ? (totalDiff / totalPlanned) * 100 : 0;

  return (
    <div className="fade-in" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={32} color="#10b981" />
            Rentabilidad y Costos
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)' }}>Análisis de Insumos Planificados vs Consumo Real</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Planificado</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalPlanned.toFixed(2)} kg</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #8b5cf6' }}>
          <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Consumido</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{totalReal.toFixed(2)} kg</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${totalDiff > 0 ? '#ef4444' : '#10b981'}` }}>
          <h3 style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Desviación Global</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem', color: totalDiff > 0 ? '#ef4444' : '#10b981' }}>
            {totalDiff > 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            {globalDiffPercent.toFixed(2)}%
          </p>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>({Math.abs(totalDiff).toFixed(2)} kg {totalDiff > 0 ? 'de más' : 'ahorrados'})</span>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Calculando rentabilidad...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'rgba(255,255,255,0.6)' }}>
                <th style={{ padding: '1rem' }}>Orden</th>
                <th style={{ padding: '1rem' }}>Fecha</th>
                <th style={{ padding: '1rem' }}>Estado</th>
                <th style={{ padding: '1rem' }}>Planificado</th>
                <th style={{ padding: '1rem' }}>Consumido</th>
                <th style={{ padding: '1rem' }}>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{stat.orderNumber}</td>
                  <td style={{ padding: '1rem' }}>{format(new Date(stat.date), "dd/MM/yyyy")}</td>
                  <td style={{ padding: '1rem' }}>{stat.status}</td>
                  <td style={{ padding: '1rem' }}>{stat.plannedKg.toFixed(2)} kg</td>
                  <td style={{ padding: '1rem' }}>{stat.realKg.toFixed(2)} kg</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      backgroundColor: stat.differencePercent > 10 ? 'rgba(239, 68, 68, 0.2)' : stat.differencePercent < -10 ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                      color: stat.differencePercent > 10 ? '#ef4444' : stat.differencePercent < -10 ? '#10b981' : '#fff'
                    }}>
                      {stat.difference > 0 ? '+' : ''}{stat.differencePercent.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              {stats.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                    No hay suficientes datos de consumos para mostrar estadísticas.
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
