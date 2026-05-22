import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Option {
  id: string | number;
  name: string;
  code?: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (id: string) => void;
  placeholder: string;
  label?: string;
  required?: boolean;
  name: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder, 
  name,
  required 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => String(o.id) === String(value));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.code && o.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <div 
        className="input" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          borderColor: isOpen ? 'var(--primary)' : 'var(--border)'
        }}
      >
        <span style={{ color: selectedOption ? 'inherit' : 'var(--text-muted)' }}>
          {selectedOption ? `${selectedOption.name} (${selectedOption.code})` : placeholder}
        </span>
        <ChevronDown size={18} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {isOpen && (
        <div className="card" style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          zIndex: 1000, 
          marginTop: '0.5rem', 
          padding: '0.5rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              autoFocus
              type="text" 
              className="input" 
              placeholder="Escribe para buscar..." 
              style={{ padding: '0.4rem 0.5rem 0.4rem 2rem', fontSize: '0.85rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div 
                  key={option.id}
                  onClick={() => {
                    onChange(String(option.id));
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  style={{ 
                    padding: '0.6rem 0.75rem', 
                    borderRadius: '4px', 
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    backgroundColor: String(value) === String(option.id) ? 'var(--primary)' : 'transparent',
                    color: String(value) === String(option.id) ? 'white' : 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    if (String(value) !== String(option.id)) {
                      e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (String(value) !== String(option.id)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <p style={{ fontWeight: 700, margin: 0 }}>{option.name}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: 0 }}>Código: {option.code}</p>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
      {/* Hidden input for form requirement */}
      <input type="hidden" name={name} value={value} required={required} />
    </div>
  );
};
