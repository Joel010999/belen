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
  UserSquare2 
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './Sidebar.module.css';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['ADMIN', 'MACHINE'] },
  { icon: ClipboardList, label: 'Órdenes de Producción', path: '/ordenes', roles: ['ADMIN', 'MACHINE'] },
  { icon: ShieldCheck, label: 'Control Final', path: '/control', roles: ['ADMIN', 'MACHINE'] },
  { icon: Package, label: 'Stock Operativo', path: '/stock', roles: ['ADMIN'] },
  { divider: true, roles: ['ADMIN'] },
  { icon: FileUp, label: 'Importación / Exportación', path: '/transferencia', roles: ['ADMIN'] },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const filteredItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <h1>BELEN</h1>
        <span>Industrial OS</span>
      </div>
      <nav className={styles.nav}>
        {filteredItems.map((item, index) => {
          if ('divider' in item) {
            return <div key={`divider-${index}`} className={styles.divider} />;
          }
          const Icon = item.icon!;
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
