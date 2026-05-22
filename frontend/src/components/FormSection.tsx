import React from 'react';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, children, icon }) => {
  return (
    <div className="card" style={{ 
      marginBottom: '2rem', 
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      borderLeft: '4px solid var(--primary)'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        marginBottom: '1.5rem' 
      }}>
        {icon && <span style={{ color: 'var(--primary)' }}>{icon}</span>}
        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 700, 
          letterSpacing: '-0.025em',
          textTransform: 'uppercase',
          margin: 0
        }}>
          {title}
        </h3>
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '1.5rem' 
      }}>
        {children}
      </div>
    </div>
  );
};
