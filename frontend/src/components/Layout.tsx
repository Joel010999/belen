import React from 'react';
import { Sidebar } from './Sidebar';
import { User, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 260, display: 'flex', flexDirection: 'column' }}>
        <header style={{ 
          height: 64, 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          padding: '0 2rem', 
          justifyContent: 'space-between',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Planta Industrial - Belén</h2>
            {user?.role === 'MACHINE' && (
               <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                 MAQUINA: {user.machine?.code}
               </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)' }}>
            <Bell size={20} style={{ cursor: 'pointer' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>{user?.name}</p>
                <p style={{ fontSize: '0.75rem', margin: 0 }}>{user?.role === 'ADMIN' ? 'Administrador' : 'Operario de Máquina'}</p>
              </div>
              <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                 <User size={18} />
              </div>
              <button 
                onClick={logout}
                style={{ 
                  background: 'none', 
                  color: 'var(--text-muted)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  marginLeft: '0.5rem'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>
        <main style={{ padding: '2rem', flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
};
