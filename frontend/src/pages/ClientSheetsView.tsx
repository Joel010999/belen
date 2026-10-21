import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Copy,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Building,
  Layers,
  Calendar,
  UserCheck,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { ClientSheetModal } from '../components/ClientSheetModal';
import { ClientSheetPrintView } from '../components/ClientSheetPrintView';

interface ClientSummary {
  id: number;
  code: string;
  name: string;
  sheetsCount: number;
  hasSheets: boolean;
  latestSheetUpdate?: string | null;
  sheets: Array<{
    id: number;
    name: string;
    productReference?: string | null;
    updatedAt: string;
    createdAt: string;
  }>;
}

export const ClientSheetsView: React.FC = () => {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [allSheets, setAllSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with-sheets' | 'without-sheets'>('all');
  const [expandedClients, setExpandedClients] = useState<Record<number, boolean>>({});

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sheetToEdit, setSheetToEdit] = useState<any | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // Modal de impresión
  const [printSheet, setPrintSheet] = useState<any | null>(null);

  // Modal de duplicación
  const [duplicateTarget, setDuplicateTarget] = useState<any | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [isDuplicating, setIsDuplicating] = useState(false);

  // Modal de archivado
  const [archiveTarget, setArchiveTarget] = useState<any | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Notificación de éxito
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsRes, sheetsRes] = await Promise.all([
        api.get('/client-sheets/clients-summary'),
        api.get('/client-sheets')
      ]);

      const clientList: ClientSummary[] = Array.isArray(clientsRes.data) ? clientsRes.data : [];
      setClients(clientList);

      const sheetsList = Array.isArray(sheetsRes.data) ? sheetsRes.data : [];
      setAllSheets(sheetsList);

      // Por defecto, expandir clientes que tienen hojas
      const initialExpanded: Record<number, boolean> = {};
      clientList.forEach((c) => {
        initialExpanded[c.id] = c.hasSheets;
      });
      setExpandedClients(initialExpanded);
    } catch (err: any) {
      console.error('Error fetching client sheets data:', err);
      setError(err.response?.data?.error || 'No se pudieron cargar las hojas de clientes. Verifique su conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleClientExpand = (clientId: number) => {
    setExpandedClients((prev) => ({
      ...prev,
      [clientId]: !prev[clientId]
    }));
  };

  // Filtrado de clientes y hojas
  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return clients.filter((c) => {
      // Filtro por estado de hojas
      if (filterType === 'with-sheets' && !c.hasSheets) return false;
      if (filterType === 'without-sheets' && c.hasSheets) return false;

      // Filtro por texto de búsqueda
      if (!q) return true;

      const matchesClient = c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);

      // Buscar también si alguna de las hojas del cliente coincide
      const clientSheets = allSheets.filter((s) => s.clientId === c.id);
      const matchesSheet = clientSheets.some(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          s.productReference?.toLowerCase().includes(q) ||
          s.materialType?.toLowerCase().includes(q) ||
          s.cylinderSize?.toLowerCase().includes(q)
      );

      return matchesClient || matchesSheet;
    });
  }, [clients, allSheets, searchQuery, filterType]);

  // Métricas rápidas
  const totalClients = clients.length;
  const clientsWithSheets = clients.filter((c) => c.hasSheets).length;
  const clientsWithoutSheets = totalClients - clientsWithSheets;
  const totalActiveSheets = allSheets.length;

  // Acciones
  const handleOpenCreate = (clientId?: number) => {
    setSheetToEdit(null);
    setSelectedClientId(clientId || null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = async (sheetId: number) => {
    try {
      const res = await api.get(`/client-sheets/${sheetId}`);
      setSheetToEdit(res.data);
      setIsModalOpen(true);
    } catch (err: any) {
      alert('Error al cargar la hoja técnica: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleOpenPrint = async (sheetId: number) => {
    try {
      const res = await api.get(`/client-sheets/${sheetId}`);
      setPrintSheet(res.data);
    } catch (err: any) {
      alert('Error al preparar impresión: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStartDuplicate = (sheet: any) => {
    setDuplicateTarget(sheet);
    setDuplicateName(`${sheet.name} (Copia)`);
  };

  const handleConfirmDuplicate = async () => {
    if (!duplicateTarget) return;
    setIsDuplicating(true);
    try {
      const res = await api.post(`/client-sheets/${duplicateTarget.id}/duplicate`, {
        targetName: duplicateName
      });
      showToast(`Hoja duplicada exitosamente como "${res.data.name}".`);
      setDuplicateTarget(null);
      await fetchData();
    } catch (err: any) {
      alert('Error al duplicar hoja: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleStartArchive = (sheet: any) => {
    setArchiveTarget(sheet);
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      await api.delete(`/client-sheets/${archiveTarget.id}`);
      showToast(`Hoja "${archiveTarget.name}" archivada correctamente.`);
      setArchiveTarget(null);
      await fetchData();
    } catch (err: any) {
      alert('Error al archivar hoja: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsArchiving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: 'var(--success)',
          color: 'white',
          padding: '0.875rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontWeight: 600,
          fontSize: '0.9rem',
          animation: 'fadeIn 0.2s ease-in'
        }}>
          <CheckCircle2 size={20} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>
              Hojas de Clientes
            </h1>
            <span style={{
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              Módulo Independiente
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem', fontSize: '0.95rem' }}>
            Digitalización de fichas de preparación habitual por cliente: medidas, cilindros, cuerpos de impresión y ajustes técnicos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => fetchData()}
            style={{
              backgroundColor: 'rgba(51, 65, 85, 0.5)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <RefreshCw size={16} />
            Actualizar
          </button>

          <button
            onClick={() => handleOpenCreate()}
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Plus size={18} />
            Nueva Hoja Técnica
          </button>
        </div>
      </div>

      {/* Métricas Resumen */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Clientes
            </span>
            <Building size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--text-main)' }}>
            {totalClients}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Clientes registrados en Silcar
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Con Hojas Técnicas
            </span>
            <FileText size={18} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--success)' }}>
            {clientsWithSheets}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Clientes con fichas cargadas
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Sin Hojas Cargadas
            </span>
            <AlertCircle size={18} color={clientsWithoutSheets > 0 ? 'var(--warning)' : 'var(--text-muted)'} />
          </div>
          <div style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            marginTop: '0.4rem',
            color: clientsWithoutSheets > 0 ? 'var(--warning)' : 'var(--text-main)'
          }}>
            {clientsWithoutSheets}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Pendientes de digitalizar
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Fichas Activas
            </span>
            <Layers size={18} color="var(--accent)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.4rem', color: 'var(--accent)' }}>
            {totalActiveSheets}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Instrucciones técnicas guardadas
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por cliente, código, nombre de hoja, material, medidas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem 0.65rem 2.75rem',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterType('all')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: filterType === 'all' ? 'var(--primary)' : 'rgba(51, 65, 85, 0.4)',
                color: filterType === 'all' ? 'white' : 'var(--text-muted)',
                border: '1px solid ' + (filterType === 'all' ? 'var(--primary)' : 'var(--border)')
              }}
            >
              Todos ({clients.length})
            </button>

            <button
              onClick={() => setFilterType('with-sheets')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: filterType === 'with-sheets' ? 'var(--primary)' : 'rgba(51, 65, 85, 0.4)',
                color: filterType === 'with-sheets' ? 'white' : 'var(--text-muted)',
                border: '1px solid ' + (filterType === 'with-sheets' ? 'var(--primary)' : 'var(--border)')
              }}
            >
              Con Hojas ({clientsWithSheets})
            </button>

            <button
              onClick={() => setFilterType('without-sheets')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: filterType === 'without-sheets' ? 'var(--primary)' : 'rgba(51, 65, 85, 0.4)',
                color: filterType === 'without-sheets' ? 'white' : 'var(--text-muted)',
                border: '1px solid ' + (filterType === 'without-sheets' ? 'var(--primary)' : 'var(--border)')
              }}
            >
              Sin Hojas ({clientsWithoutSheets})
            </button>
          </div>
        </div>
      </div>

      {/* Estados de Carga y Error */}
      {loading && (
        <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto 1rem', display: 'block', animation: 'spin 1s linear infinite' }} />
          Cargando clientes y hojas técnicas...
        </div>
      )}

      {error && !loading && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid var(--danger)',
          color: '#fca5a5',
          padding: '1.5rem',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <p style={{ fontWeight: 600, margin: 0, marginBottom: '0.5rem' }}>{error}</p>
          <button
            onClick={() => fetchData()}
            style={{
              backgroundColor: 'var(--danger)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Listado de Clientes y sus Hojas */}
      {!loading && !error && filteredClients.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            No se encontraron clientes
          </h3>
          <p style={{ fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            No hay clientes que coincidan con la búsqueda o el filtro seleccionado.
          </p>
          <button
            onClick={() => { setSearchQuery(''); setFilterType('all'); }}
            style={{
              backgroundColor: 'rgba(51, 65, 85, 0.5)',
              border: '1px solid var(--border)',
              color: 'var(--text-main)',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.85rem'
            }}
          >
            Restablecer Filtros
          </button>
        </div>
      )}

      {!loading && !error && filteredClients.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredClients.map((client) => {
            const clientSheets = allSheets.filter((s) => s.clientId === client.id);
            const isExpanded = !!expandedClients[client.id];

            return (
              <div
                key={client.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: client.hasSheets ? '1px solid var(--border)' : '1px dashed rgba(245, 158, 11, 0.4)'
                }}
              >
                {/* Cabecera del Cliente */}
                <div style={{
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.4)',
                  borderBottom: isExpanded ? '1px solid var(--border)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: '8px',
                      backgroundColor: client.hasSheets ? 'rgba(37, 99, 235, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: client.hasSheets ? 'var(--accent)' : 'var(--warning)',
                      fontWeight: 700
                    }}>
                      <Building size={20} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                          {client.name}
                        </h3>
                        <span style={{
                          fontSize: '0.75rem',
                          backgroundColor: 'rgba(51, 65, 85, 0.6)',
                          color: 'var(--text-muted)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}>
                          {client.code}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
                        {client.hasSheets ? (
                          <span style={{
                            fontSize: '0.8rem',
                            color: 'var(--accent)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}>
                            <FileText size={14} />
                            {clientSheets.length} {clientSheets.length === 1 ? 'hoja técnica' : 'hojas técnicas'}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.8rem',
                            color: 'var(--warning)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}>
                            <AlertCircle size={14} />
                            Sin hojas cargadas
                          </span>
                        )}

                        {client.latestSheetUpdate && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Última modif.: {formatDate(client.latestSheetUpdate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      onClick={() => handleOpenCreate(client.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: 'rgba(37, 99, 235, 0.15)',
                        border: '1px solid var(--primary)',
                        color: 'var(--accent)',
                        padding: '0.45rem 0.9rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600
                      }}
                    >
                      <Plus size={14} />
                      Nueva Hoja
                    </button>

                    <button
                      onClick={() => toggleClientExpand(client.id)}
                      style={{
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        padding: '0.45rem 0.6rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.8rem',
                        border: '1px solid var(--border)'
                      }}
                    >
                      {isExpanded ? (
                        <>
                          <span>Ocultar</span>
                          <ChevronUp size={16} />
                        </>
                      ) : (
                        <>
                          <span>Ver Fichas</span>
                          <ChevronDown size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sub-listado de Hojas del Cliente */}
                {isExpanded && (
                  <div style={{ padding: '1.25rem 1.5rem', backgroundColor: 'rgba(2, 6, 23, 0.2)' }}>
                    {clientSheets.length === 0 ? (
                      <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        backgroundColor: 'rgba(15, 23, 42, 0.3)',
                        borderRadius: '8px',
                        border: '1px dashed var(--border)'
                      }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0, marginBottom: '0.75rem' }}>
                          Este cliente aún no posee hojas técnicas cargadas en el sistema.
                        </p>
                        <button
                          onClick={() => handleOpenCreate(client.id)}
                          style={{
                            backgroundColor: 'var(--primary)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem'
                          }}
                        >
                          <Plus size={14} />
                          Crear Primera Hoja Técnica
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: '1rem'
                      }}>
                        {clientSheets.map((sheet) => (
                          <div
                            key={sheet.id}
                            style={{
                              backgroundColor: 'rgba(30, 41, 59, 0.6)',
                              border: '1px solid var(--border)',
                              borderRadius: '8px',
                              padding: '1.25rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              transition: 'transform 0.15s ease, border-color 0.15s ease'
                            }}
                          >
                            <div>
                              {/* Título de la Hoja e Identificador */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <div>
                                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                                    {sheet.name}
                                  </h4>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Ref: {sheet.productReference || 'Configuración general'}
                                  </span>
                                </div>
                                <span style={{
                                  backgroundColor: 'rgba(56, 189, 248, 0.15)',
                                  color: 'var(--accent)',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700
                                }}>
                                  #{sheet.id}
                                </span>
                              </div>

                              {/* Parámetros clave en pills */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.75rem 0' }}>
                                {sheet.cylinderSize && (
                                  <span style={{
                                    backgroundColor: 'rgba(51, 65, 85, 0.5)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.7rem',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px'
                                  }}>
                                    Cil: {sheet.cylinderSize}
                                  </span>
                                )}

                                {sheet.printingMeasure && (
                                  <span style={{
                                    backgroundColor: 'rgba(51, 65, 85, 0.5)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.7rem',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px'
                                  }}>
                                    Med: {sheet.printingMeasure}
                                  </span>
                                )}

                                {sheet.materialType && (
                                  <span style={{
                                    backgroundColor: 'rgba(51, 65, 85, 0.5)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.7rem',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px'
                                  }}>
                                    Mat: {sheet.materialType}
                                  </span>
                                )}

                                <span style={{
                                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                  color: 'var(--success)',
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  fontWeight: 600
                                }}>
                                  {sheet.bodies?.length || 0} Cuerpos
                                </span>
                              </div>

                              {/* Datos de auditoría */}
                              <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                borderTop: '1px solid rgba(51, 65, 85, 0.4)',
                                paddingTop: '0.5rem',
                                marginTop: '0.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.2rem'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <Calendar size={12} />
                                  <span>Modif: {formatDate(sheet.updatedAt)}</span>
                                  {sheet.updater && (
                                    <span style={{ color: 'var(--accent)' }}>por {sheet.updater.name || sheet.updater.username}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Botonera de acciones por hoja */}
                            <div style={{
                              display: 'flex',
                              gap: '0.4rem',
                              borderTop: '1px solid var(--border)',
                              paddingTop: '0.75rem',
                              marginTop: '0.75rem',
                              flexWrap: 'wrap'
                            }}>
                              <button
                                onClick={() => handleOpenPrint(sheet.id)}
                                title="Imprimir ficha técnica limpia"
                                style={{
                                  flex: 1,
                                  minWidth: '70px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.35rem',
                                  backgroundColor: 'rgba(51, 65, 85, 0.5)',
                                  color: 'var(--text-main)',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                <Printer size={14} />
                                Imprimir
                              </button>

                              <button
                                onClick={() => handleOpenEdit(sheet.id)}
                                title="Editar configuración"
                                style={{
                                  flex: 1,
                                  minWidth: '70px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.35rem',
                                  backgroundColor: 'rgba(37, 99, 235, 0.2)',
                                  color: 'var(--accent)',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                <Edit size={14} />
                                Editar
                              </button>

                              <button
                                onClick={() => handleStartDuplicate(sheet)}
                                title="Duplicar como base para otra configuración"
                                style={{
                                  flex: 1,
                                  minWidth: '70px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.35rem',
                                  backgroundColor: 'rgba(51, 65, 85, 0.5)',
                                  color: 'var(--text-main)',
                                  padding: '0.4rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600
                                }}
                              >
                                <Copy size={14} />
                                Duplicar
                              </button>

                              <button
                                onClick={() => handleStartArchive(sheet)}
                                title="Archivar ficha técnica"
                                style={{
                                  padding: '0.4rem 0.6rem',
                                  backgroundColor: 'transparent',
                                  color: 'var(--danger)',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem'
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      {isModalOpen && (
        <ClientSheetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          sheetToEdit={sheetToEdit}
          clients={clients}
          defaultClientId={selectedClientId}
          onSuccess={(saved) => {
            showToast(`Hoja técnica "${saved.name}" guardada con éxito.`);
            fetchData();
          }}
        />
      )}

      {/* Modal de Impresión */}
      {printSheet && (
        <ClientSheetPrintView
          sheet={printSheet}
          onClose={() => setPrintSheet(null)}
        />
      )}

      {/* Dialog de Duplicación */}
      {duplicateTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem' }}>
              Duplicar Hoja Técnica
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Se copiarán todos los parámetros técnicos y los {duplicateTarget.bodies?.length || 0} cuerpos de impresión como base para una nueva configuración.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Nombre de la Nueva Hoja</label>
              <input
                type="text"
                className="input"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDuplicateTarget(null)}
                disabled={isDuplicating}
                style={{
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDuplicate}
                disabled={isDuplicating || !duplicateName.trim()}
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                {isDuplicating ? 'Duplicando...' : 'Confirmar y Duplicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog de Confirmación de Archivado */}
      {archiveTarget && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(2, 6, 23, 0.85)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, marginBottom: '0.5rem', color: 'var(--danger)' }}>
              ¿Archivar Hoja Técnica?
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              La ficha <strong>"{archiveTarget.name}"</strong> será archivada para conservar el historial sin perder información. Podrá ser consultada nuevamente si es necesario.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setArchiveTarget(null)}
                disabled={isArchiving}
                style={{
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                disabled={isArchiving}
                style={{
                  backgroundColor: 'var(--danger)',
                  color: 'white',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                {isArchiving ? 'Archivando...' : 'Sí, Archivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
