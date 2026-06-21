import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Factory, 
  ShieldCheck, 
  Package, 
  FileUp, 
  FileDown, 
  Palette, 
  Settings, 
  Users, 
  UserSquare2,
  X,
  History
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './Sidebar.module.css';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['ADMIN', 'MACHINE'] },
  { icon: ClipboardList, label: 'Órdenes de Producción', path: '/ordenes', roles: ['ADMIN', 'MACHINE'] },
  { icon: History, label: 'Histórico de Órdenes', path: '/historial', roles: ['ADMIN', 'MACHINE'] },
  { icon: Package, label: 'Stock Operativo', path: '/stock', roles: ['ADMIN'] },
  { divider: true, roles: ['ADMIN'] },
  { icon: FileUp, label: 'Importación / Exportación', path: '/transferencia', roles: ['ADMIN'] },
  { icon: ShieldCheck, label: 'Auditoría del Sistema', path: '/auditoria', roles: ['ADMIN'] },
  { icon: LayoutDashboard, label: 'Rentabilidad y Costos', path: '/costos', roles: ['ADMIN'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const filteredItems = menuItems.filter(item => 
    !item.roles || item.roles.map(r => r.toUpperCase()).includes((user?.role || '').toUpperCase())
  );

  return (
    <>
      {isOpen && (
        <div 
          className={styles.overlay} 
          onClick={onClose}
        />
      )}
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.logo}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>SILCAR</h1>
              <span>Industrial OS</span>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>
        <nav className={styles.nav}>
          {filteredItems.map((item, index) => {
            if ('divider' in item) {
              return <div key={`divider-${index}`} className={styles.divider} />;
            }
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={onClose}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                {Icon && <Icon size={20} />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
