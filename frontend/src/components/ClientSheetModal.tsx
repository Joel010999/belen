import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Save, Layers, Settings, FileText, AlertCircle } from 'lucide-react';
import api from '../services/api';

export interface BodyItem {
  id?: number;
  bodyOrder: number;
  colorName: string;
  inkReference: string;
  brandOrCode: string;
  specificParams: string;
  observations: string;
}

export interface ClientSheetFormData {
  id?: number;
  clientId: number | string;
  name: string;
  productReference: string;
  cylinderSize: string;
  printingMeasure: string;
  materialType: string;
  speed: string;
  tunnelTemp: string;
  coilDisposition: string;
  orientationDisplacement: string;
  generalObservations: string;
  technicalNotes: string;
  bodies: BodyItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sheetToEdit?: any | null;
  clients: Array<{ id: number; code: string; name: string }>;
  defaultClientId?: number | null;
  onSuccess: (savedSheet: any) => void;
}

export const ClientSheetModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sheetToEdit,
  clients,
  defaultClientId,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'id' | 'prep' | 'bodies' | 'notes'>('id');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<ClientSheetFormData>({
    clientId: defaultClientId || '',
    name: '',
    productReference: '',
    cylinderSize: '',
    printingMeasure: '',
    materialType: '',
    speed: '',
    tunnelTemp: '',
    coilDisposition: '',
    orientationDisplacement: '',
    generalObservations: '',
    technicalNotes: '',
    bodies: []
  });

  useEffect(() => {
    if (sheetToEdit) {
      setFormData({
        id: sheetToEdit.id,
        clientId: sheetToEdit.clientId || defaultClientId || '',
        name: sheetToEdit.name || '',
        productReference: sheetToEdit.productReference || '',
        cylinderSize: sheetToEdit.cylinderSize || '',
        printingMeasure: sheetToEdit.printingMeasure || '',
        materialType: sheetToEdit.materialType || '',
        speed: sheetToEdit.speed || '',
        tunnelTemp: sheetToEdit.tunnelTemp || '',
        coilDisposition: sheetToEdit.coilDisposition || '',
        orientationDisplacement: sheetToEdit.orientationDisplacement || '',
        generalObservations: sheetToEdit.generalObservations || '',
        technicalNotes: sheetToEdit.technicalNotes || '',
        bodies: Array.isArray(sheetToEdit.bodies)
          ? sheetToEdit.bodies.map((b: any, idx: number) => ({
              id: b.id,
              bodyOrder: typeof b.bodyOrder === 'number' ? b.bodyOrder : idx + 1,
              colorName: b.colorName || '',
              inkReference: b.inkReference || '',
              brandOrCode: b.brandOrCode || '',
              specificParams: b.specificParams || '',
              observations: b.observations || ''
            }))
          : []
      });
    } else {
      setFormData({
        clientId: defaultClientId || (clients[0]?.id ? String(clients[0].id) : ''),
        name: '',
        productReference: '',
        cylinderSize: '',
        printingMeasure: '',
        materialType: '',
        speed: '',
        tunnelTemp: '',
        coilDisposition: '',
        orientationDisplacement: '',
        generalObservations: '',
        technicalNotes: '',
        bodies: [
          { bodyOrder: 1, colorName: '', inkReference: '', brandOrCode: '', specificParams: '', observations: '' }
        ]
      });
    }
    setActiveTab('id');
    setErrorMessage(null);
  }, [sheetToEdit, defaultClientId, clients, isOpen]);

  if (!isOpen) return null;

  const handleFieldChange = (field: keyof ClientSheetFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddBody = () => {
    setFormData((prev) => {
      const nextOrder = prev.bodies.length + 1;
      return {
        ...prev,
        bodies: [
          ...prev.bodies,
          {
            bodyOrder: nextOrder,
            colorName: '',
            inkReference: '',
            brandOrCode: '',
            specificParams: '',
            observations: ''
          }
        ]
      };
    });
  };

  const handleRemoveBody = (index: number) => {
    setFormData((prev) => {
      const updated = prev.bodies.filter((_, i) => i !== index);
      const reordered = updated.map((b, i) => ({ ...b, bodyOrder: i + 1 }));
      return { ...prev, bodies: reordered };
    });
  };

  const handleMoveBody = (index: number, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.bodies.length) return prev;

      const newBodies = [...prev.bodies];
      const temp = newBodies[index];
      newBodies[index] = newBodies[targetIndex];
      newBodies[targetIndex] = temp;

      const reordered = newBodies.map((b, i) => ({ ...b, bodyOrder: i + 1 }));
      return { ...prev, bodies: reordered };
    });
  };

  const handleBodyFieldChange = (index: number, field: keyof BodyItem, value: any) => {
    setFormData((prev) => {
      const newBodies = [...prev.bodies];
      newBodies[index] = { ...newBodies[index], [field]: value };
      return { ...prev, bodies: newBodies };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedClientId = parseInt(String(formData.clientId));
    if (isNaN(parsedClientId)) {
      setErrorMessage('Debe seleccionar un cliente existente');
      setActiveTab('id');
      return;
    }

    if (!formData.name || formData.name.trim().length === 0) {
      setErrorMessage('El nombre identificador de la hoja es obligatorio (ej: "Configuración habitual")');
      setActiveTab('id');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        clientId: parsedClientId
      };

      let response;
      if (formData.id) {
        response = await api.put(`/client-sheets/${formData.id}`, payload);
      } else {
        response = await api.post('/client-sheets', payload);
      }

      onSuccess(response.data);
      onClose();
    } catch (err: any) {
      console.error('Error saving sheet:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Error al guardar la hoja técnica';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div className="card modal-content" style={{
        width: '100%',
        maxWidth: 960,
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}>
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'rgba(15, 23, 42, 0.6)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
              {formData.id ? 'Editar Hoja Técnica de Cliente' : 'Nueva Hoja Técnica de Cliente'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.2rem' }}>
              Módulo independiente de preparación industrial para el encargado de planta
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              color: 'var(--text-muted)',
              padding: '0.4rem',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div style={{
            margin: '1rem 1.75rem 0',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--danger)',
            color: '#fca5a5',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '0.875rem'
          }}>
            <AlertCircle size={18} color="var(--danger)" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem 1.75rem 0',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('id')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              background: activeTab === 'id' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
              color: activeTab === 'id' ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === 'id' ? '2px solid var(--primary)' : '2px solid transparent',
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            <FileText size={16} />
            1. Identificación
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prep')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              background: activeTab === 'prep' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
              color: activeTab === 'prep' ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === 'prep' ? '2px solid var(--primary)' : '2px solid transparent',
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Settings size={16} />
            2. Preparación
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bodies')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              background: activeTab === 'bodies' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
              color: activeTab === 'bodies' ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === 'bodies' ? '2px solid var(--primary)' : '2px solid transparent',
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            <Layers size={16} />
            3. Cuerpos y Tintas ({formData.bodies.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1rem',
              background: activeTab === 'notes' ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
              color: activeTab === 'notes' ? 'var(--accent)' : 'var(--text-muted)',
              borderBottom: activeTab === 'notes' ? '2px solid var(--primary)' : '2px solid transparent',
              borderRadius: '6px 6px 0 0',
              fontWeight: 600,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap'
            }}
          >
            <FileText size={16} />
            4. Observaciones Técnicas
          </button>
        </div>

        {/* Form Body with Scroll */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
            {/* TAB 1: IDENTIFICACIÓN */}
            {activeTab === 'id' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label className="label">Cliente Asociado *</label>
                    <select
                      className="input"
                      value={formData.clientId}
                      onChange={(e) => handleFieldChange('clientId', e.target.value)}
                      required
                    >
                      <option value="">-- Seleccione un cliente --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      Se asocia al catálogo de clientes existente de Silcar.
                    </span>
                  </div>

                  <div>
                    <label className="label">Nombre Identificador de la Hoja *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej: Configuración habitual, Producto A, Bolsa 30x40"
                      value={formData.name}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                      Permite diferenciar varias hojas de un mismo cliente.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="label">Identificador o Producto de Referencia</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej: Bolsa alta densidad con manija troquelada / Código interno del cliente"
                    value={formData.productReference}
                    onChange={(e) => handleFieldChange('productReference', e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                    Referencia técnica comercial para el encargado y los operarios.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 2: PARÁMETROS DE PREPARACIÓN */}
            {activeTab === 'prep' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label className="label">Cilindro y sus Medidas</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej: Z=68 / Desarrollo 420mm / Cilindro 48"
                      value={formData.cylinderSize}
                      onChange={(e) => handleFieldChange('cylinderSize', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label">Medidas de Impresión y Material</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej: Ancho 400mm x Paso 420mm"
                      value={formData.printingMeasure}
                      onChange={(e) => handleFieldChange('printingMeasure', e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label className="label">Material Base y Tipo de Material</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej: BOPP Perlado 30 micras / Polietileno BD cristal"
                      value={formData.materialType}
                      onChange={(e) => handleFieldChange('materialType', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label">Velocidad de Trabajo</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej: 120 m/min"
                      value={formData.speed}
                      onChange={(e) => handleFieldChange('speed', e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label className="label">Temperatura del Túnel</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej: 50°C a 55°C"
                      value={formData.tunnelTemp}
                      onChange={(e) => handleFieldChange('tunnelTemp', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label">Ubicación y Disposición de Bobina</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Ej: Bobinado externo, frente hacia afuera"
                      value={formData.coilDisposition}
                      onChange={(e) => handleFieldChange('coilDisposition', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Desplazamientos, Posición y Orientación</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej: Clisé centrado, taca derecha a 15mm, de pie"
                    value={formData.orientationDisplacement}
                    onChange={(e) => handleFieldChange('orientationDisplacement', e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Observaciones Generales de Preparación</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Notas generales de preparación..."
                    value={formData.generalObservations}
                    onChange={(e) => handleFieldChange('generalObservations', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: CUERPOS DE IMPRESIÓN Y COLORES */}
            {activeTab === 'bodies' && (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Cuerpos de Impresión y Tintas</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                      Cantidad variable de cuerpos. Puede agregar, editar, reordenar y eliminar según la hoja.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBody}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      backgroundColor: 'rgba(37, 99, 235, 0.15)',
                      border: '1px solid var(--primary)',
                      color: 'var(--accent)',
                      padding: '0.5rem 0.9rem',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    <Plus size={16} />
                    Agregar Cuerpo
                  </button>
                </div>

                {formData.bodies.length === 0 ? (
                  <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    border: '1px dashed var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-muted)'
                  }}>
                    No hay cuerpos de impresión cargados. Haga clic en "+ Agregar Cuerpo" para registrar el primer cuerpo.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {formData.bodies.map((body, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.7)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                          paddingBottom: '0.5rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{
                              backgroundColor: 'var(--primary)',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {body.bodyOrder}
                            </span>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              Cuerpo de Impresión #{body.bodyOrder}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button
                              type="button"
                              onClick={() => handleMoveBody(index, 'up')}
                              disabled={index === 0}
                              title="Subir orden"
                              style={{
                                background: 'transparent',
                                color: index === 0 ? 'var(--border)' : 'var(--text-muted)',
                                padding: '0.3rem',
                                borderRadius: '4px'
                              }}
                            >
                              <ArrowUp size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleMoveBody(index, 'down')}
                              disabled={index === formData.bodies.length - 1}
                              title="Bajar orden"
                              style={{
                                background: 'transparent',
                                color: index === formData.bodies.length - 1 ? 'var(--border)' : 'var(--text-muted)',
                                padding: '0.3rem',
                                borderRadius: '4px'
                              }}
                            >
                              <ArrowDown size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveBody(index)}
                              title="Eliminar cuerpo"
                              style={{
                                background: 'transparent',
                                color: 'var(--danger)',
                                padding: '0.3rem',
                                borderRadius: '4px',
                                marginLeft: '0.5rem'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Campos del cuerpo */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          <div>
                            <label className="label" style={{ fontSize: '0.7rem' }}>Color *</label>
                            <input
                              type="text"
                              className="input"
                              style={{ padding: '0.5rem 0.75rem' }}
                              placeholder="Ej: Cyan, Blanco fondo, Rojo 032"
                              value={body.colorName}
                              onChange={(e) => handleBodyFieldChange(index, 'colorName', e.target.value)}
                              required
                            />
                          </div>

                          <div>
                            <label className="label" style={{ fontSize: '0.7rem' }}>Tinta o Referencia</label>
                            <input
                              type="text"
                              className="input"
                              style={{ padding: '0.5rem 0.75rem' }}
                              placeholder="Ej: Pantone 286C / Ref 104"
                              value={body.inkReference}
                              onChange={(e) => handleBodyFieldChange(index, 'inkReference', e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="label" style={{ fontSize: '0.7rem' }}>Marca / Identificación</label>
                            <input
                              type="text"
                              className="input"
                              style={{ padding: '0.5rem 0.75rem' }}
                              placeholder="Ej: Siegwerk / Anilox 360 l/cm"
                              value={body.brandOrCode}
                              onChange={(e) => handleBodyFieldChange(index, 'brandOrCode', e.target.value)}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                          <div>
                            <label className="label" style={{ fontSize: '0.7rem' }}>Parámetros Específicos</label>
                            <input
                              type="text"
                              className="input"
                              style={{ padding: '0.5rem 0.75rem' }}
                              placeholder="Ej: Viscosidad 22s Copa 4 / Volumen 4.5 cm3/m2"
                              value={body.specificParams}
                              onChange={(e) => handleBodyFieldChange(index, 'specificParams', e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="label" style={{ fontSize: '0.7rem' }}>Observaciones del Cuerpo</label>
                            <input
                              type="text"
                              className="input"
                              style={{ padding: '0.5rem 0.75rem' }}
                              placeholder="Ej: Doble pasada / Agregar retardante"
                              value={body.observations}
                              onChange={(e) => handleBodyFieldChange(index, 'observations', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: OBSERVACIONES TÉCNICAS */}
            {activeTab === 'notes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label className="label">
                    Indicaciones Técnicas Detalladas (Ajustes de Polímero / Particularidades del Cliente)
                  </label>
                  <textarea
                    className="input"
                    rows={8}
                    placeholder="Registre aquí indicaciones amplias como:&#10;- Ajustes de espesor de polímero / clisé&#10;- Cintas bi-faz recomendadas (densidad dura/blanda)&#10;- Particularidades del cliente o excepciones de preparación&#10;- Advertencias de tono o registro fino"
                    value={formData.technicalNotes}
                    onChange={(e) => handleFieldChange('technicalNotes', e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                    Campo amplio para digitalizar las instrucciones reales del encargado de planta.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'rgba(15, 23, 42, 0.6)'
          }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  const tabs: Array<'id' | 'prep' | 'bodies' | 'notes'> = ['id', 'prep', 'bodies', 'notes'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex > 0) setActiveTab(tabs[currentIndex - 1]);
                }}
                disabled={activeTab === 'id'}
                style={{
                  background: 'none',
                  color: activeTab === 'id' ? 'var(--border)' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem'
                }}
              >
                Anterior
              </button>

              <button
                type="button"
                onClick={() => {
                  const tabs: Array<'id' | 'prep' | 'bodies' | 'notes'> = ['id', 'prep', 'bodies', 'notes'];
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) setActiveTab(tabs[currentIndex + 1]);
                }}
                disabled={activeTab === 'notes'}
                style={{
                  background: 'none',
                  color: activeTab === 'notes' ? 'var(--border)' : 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem'
                }}
              >
                Siguiente
              </button>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                style={{
                  backgroundColor: '#334155',
                  color: '#f8fafc',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 600,
                  fontSize: '0.875rem'
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSaving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  padding: '0.6rem 1.5rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  opacity: isSaving ? 0.7 : 1
                }}
              >
                <Save size={16} />
                {isSaving ? 'Guardando...' : formData.id ? 'Guardar Cambios' : 'Crear Hoja Técnica'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
