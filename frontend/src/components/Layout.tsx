import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { User, Bell, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="layout-wrapper" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="main-content-wrapper" style={{ flex: 1, marginLeft: 260, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.3s' }}>
        <header className="header-wrapper" style={{ 
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
            <button 
              className="mobile-menu-btn" 
              onClick={() => setIsMobileMenuOpen(true)}
              style={{ background: 'none', color: 'var(--text-main)', display: 'none', padding: '0.5rem' }}
            >
              <Menu size={24} />
            </button>
            <h2 className="header-title" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Planta Industrial - Belén</h2>
            {user?.role === 'MACHINE' && (
               <span className="mobile-hidden" style={{ fontSize: '0.75rem', backgroundColor: 'var(--primary)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                 MAQUINA: {user.machine?.code}
               </span>
            )}
          </div>
          <div className="mobile-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)' }}>
            <Bell size={20} style={{ cursor: 'pointer' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="mobile-hidden" style={{ textAlign: 'right' }}>
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
        <main className="main-padding" style={{ padding: '2rem', flex: 1, overflowX: 'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
