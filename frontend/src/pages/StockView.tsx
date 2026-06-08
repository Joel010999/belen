import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Droplets, Search, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';

export const StockView: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("ALL");
    const [loading, setLoading] = useState(true);

    const handleExport = async () => {
        try {
            const res = await api.get(`/export/stock`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'stock_silcar.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            alert('Error al exportar stock');
        }
    };

    useEffect(() => {
        const fetchStock = async () => {
            try {
                const [pRes, sRes] = await Promise.all([
                    api.get(`/products`),
                    api.get(`/supplies`)
                ]);
                
                const allItems = [
                    ...pRes.data.map((p: any) => ({ ...p, category: 'PRODUCTO', stockLevel: p.stock?.stockActual || 0, minStock: p.stock?.minStock || 100 })),
                    ...sRes.data.map((s: any) => ({ ...s, category: s.type || 'INSUMO', stockLevel: s.stock?.stockActual || 0, minStock: s.stock?.minStock || 100 }))
                ];
                setItems(allItems);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStock();
    }, []);

    const updateMinStock = async (item: any, newMin: string) => {
        try {
            await api.put('/stock/config', {
                productId: item.category === 'PRODUCTO' ? item.id : null,
                supplyId: item.category !== 'PRODUCTO' ? item.id : null,
                itemType: item.category,
                unit: item.unit || 'UN',
                minStock: newMin
            });
            setItems(prev => prev.map(i => i.id === item.id && i.category === item.category ? { ...i, minStock: parseFloat(newMin) } : i));
        } catch (e) {
            alert('Error al actualizar el stock mínimo');
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             item.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "ALL" || item.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Consultando inventario...</div>;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div className="header-actions-wrap" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em' }}>Stock Operativo</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Inventario centralizado de materias primas e insumos.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            type="text" 
                            className="input" 
                            placeholder="Buscar por código o nombre..." 
                            style={{ paddingLeft: '3rem', width: '300px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select 
                        className="input" 
                        style={{ width: '200px' }}
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="ALL">Todas las categorías</option>
                        <option value="PRODUCTO">Producto Terminado</option>
                        <option value="INSUMO">Insumos</option>
                        <option value="MATERIAL">Materia Prima</option>
                    </select>
                    <button 
                        onClick={handleExport}
                        className="btn"
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-main)',
                            padding: '0.75rem 1.25rem'
                        }}
                    >
                        <Download size={18} />
                        Exportar
                    </button>
                </div>
            </div>

            <div className="card table-responsive" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', backgroundColor: 'rgba(255,255,255,0.02)', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                            <th style={{ padding: '1.25rem 1.5rem' }}>Artículo</th>
                            <th>Categoría</th>
                            <th>Stock Disponible</th>
                            <th>Stock Mínimo</th>
                            <th>Estado</th>
                            <th>Precio (USD)</th>
                            <th style={{ paddingRight: '1.5rem', textAlign: 'right' }}>Última Act.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => {
                            const isLow = item.stockLevel < (item.minStock || 100);
                            return (
                                <tr key={`${item.category}-${item.id}`} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                    <td data-label="Artículo" style={{ padding: '1.25rem 1.5rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                            <p style={{ fontWeight: 800, margin: 0 }}>{item.code}</p>
                                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>{item.name}</p>
                                        </div>
                                    </td>
                                    <td data-label="Categoría">
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.25rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                                            {item.category}
                                        </span>
                                    </td>
                                    <td data-label="Stock Disponible">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{item.stockLevel.toLocaleString()}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.unit}</span>
                                        </div>
                                    </td>
                                    <td data-label="Stock Mínimo">
                                        <input 
                                            type="number" 
                                            defaultValue={item.minStock} 
                                            onBlur={(e) => updateMinStock(item, e.target.value)}
                                            className="input" 
                                            style={{ width: '80px', padding: '0.4rem', fontSize: '0.875rem' }} 
                                        />
                                    </td>
                                    <td data-label="Estado">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLow ? 'var(--danger)' : 'var(--success)' }}></div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: isLow ? 'var(--danger)' : 'var(--success)' }}>
                                                {isLow ? 'Stock Bajo' : 'Saludable'}
                                            </span>
                                        </div>
                                    </td>
                                    <td data-label="Precio (USD)" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                                        ${(Math.random() * 5 + 1).toFixed(2)}
                                    </td>
                                    <td data-label="Última Act." style={{ paddingRight: '1.5rem', textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {new Date(item.updatedAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredItems.length === 0 && (
                    <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No se encontraron artículos con los filtros seleccionados.
                    </div>
                )}
            </div>
        </div>
    );
};
