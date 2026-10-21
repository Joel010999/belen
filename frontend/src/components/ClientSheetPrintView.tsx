import React from 'react';
import { Printer, X } from 'lucide-react';

interface PrintBody {
  id?: number;
  bodyOrder: number;
  colorName: string;
  inkReference?: string | null;
  brandOrCode?: string | null;
  specificParams?: string | null;
  observations?: string | null;
}

interface ClientSheetPrintData {
  id: number;
  name: string;
  productReference?: string | null;
  cylinderSize?: string | null;
  printingMeasure?: string | null;
  materialType?: string | null;
  speed?: string | null;
  tunnelTemp?: string | null;
  coilDisposition?: string | null;
  orientationDisplacement?: string | null;
  generalObservations?: string | null;
  technicalNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: number;
    code: string;
    name: string;
  };
  creator?: {
    id: number;
    name: string;
    username: string;
  } | null;
  updater?: {
    id: number;
    name: string;
    username: string;
  } | null;
  bodies?: PrintBody[];
}

interface Props {
  sheet: ClientSheetPrintData;
  onClose: () => void;
}

export const ClientSheetPrintView: React.FC<Props> = ({ sheet, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="client-sheet-print-modal-overlay">
      <style>{`
        .client-sheet-print-modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(2, 6, 23, 0.85);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          overflow-y: auto;
          padding: 2rem 1rem;
        }

        .print-actions-bar {
          width: 100%;
          max-width: 900px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          background: #1e293b;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          border: 1px solid #334155;
        }

        .print-document-paper {
          width: 100%;
          max-width: 900px;
          background: #ffffff;
          color: #0f172a;
          padding: 2.5rem;
          border-radius: 6px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.4;
        }

        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 1rem;
          margin-bottom: 1.5rem;
        }

        .print-company-title {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #0f172a;
          margin: 0;
        }

        .print-doc-badge {
          font-size: 0.85rem;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #475569;
        }

        .print-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem 1.5rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
        }

        .print-meta-item strong {
          display: inline-block;
          color: #475569;
          font-size: 0.8rem;
          text-transform: uppercase;
          margin-right: 0.5rem;
        }

        .print-meta-item span {
          font-size: 0.95rem;
          font-weight: 600;
          color: #0f172a;
        }

        .print-section-title {
          font-size: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #1e293b;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 0.35rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }

        .print-params-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
        }

        .print-params-table th,
        .print-params-table td {
          border: 1px solid #cbd5e1;
          padding: 0.55rem 0.75rem;
          text-align: left;
          font-size: 0.875rem;
        }

        .print-params-table th {
          background-color: #f1f5f9;
          font-weight: 700;
          color: #334155;
          width: 32%;
        }

        .print-params-table td {
          background-color: #ffffff;
          color: #0f172a;
          font-weight: 500;
        }

        .print-bodies-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
        }

        .print-bodies-table th {
          background-color: #0f172a;
          color: #ffffff;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 0.6rem 0.75rem;
          text-align: left;
          border: 1px solid #0f172a;
        }

        .print-bodies-table td {
          border: 1px solid #cbd5e1;
          padding: 0.55rem 0.75rem;
          font-size: 0.875rem;
          color: #0f172a;
        }

        .print-notes-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: #1e293b;
          min-height: 60px;
          white-space: pre-wrap;
          margin-bottom: 1.25rem;
        }

        .print-footer-signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 1px dashed #cbd5e1;
        }

        .signature-line {
          width: 45%;
          text-align: center;
          font-size: 0.8rem;
          color: #475569;
        }

        .signature-rule {
          border-bottom: 1px solid #0f172a;
          margin-bottom: 0.5rem;
          height: 35px;
        }

        /* REGLAS ESTRICTAS DE IMPRESIÓN */
        @media print {
          body * {
            visibility: hidden !important;
          }
          .client-sheet-print-modal-overlay,
          .client-sheet-print-modal-overlay * {
            visibility: visible !important;
          }
          .client-sheet-print-modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-actions-bar {
            display: none !important;
          }
          .print-document-paper {
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .print-bodies-table th {
            background-color: #0f172a !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-params-table th {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Barra de acciones para vista en pantalla */}
      <div className="print-actions-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Vista previa de impresión</span>
          <span style={{ color: '#38bdf8', fontWeight: 600, fontSize: '0.9rem' }}>{sheet.name}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            <Printer size={16} />
            Imprimir Hoja
          </button>
          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#334155',
              color: '#f8fafc',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}
          >
            <X size={16} />
            Cerrar
          </button>
        </div>
      </div>

      {/* Documento Físico Formateado */}
      <div className="print-document-paper" id="client-sheet-printable-area">
        {/* Cabecera */}
        <div className="print-header">
          <div>
            <h1 className="print-company-title">SILCAR</h1>
            <div className="print-doc-badge">Ficha Técnica de Preparación — Hoja de Cliente</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
              FICHA #{sheet.id.toString().padStart(4, '0')}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Módulo Independiente de Preparación
            </div>
          </div>
        </div>

        {/* Metadatos de Identificación */}
        <div className="print-meta-grid">
          <div className="print-meta-item">
            <strong>Cliente:</strong>
            <span>{sheet.client?.name || 'Cliente no asignado'} ({sheet.client?.code || '-'})</span>
          </div>
          <div className="print-meta-item">
            <strong>Identificador Hoja:</strong>
            <span>{sheet.name}</span>
          </div>
          <div className="print-meta-item">
            <strong>Prod. Referencia:</strong>
            <span>{sheet.productReference || 'Configuración general habitual'}</span>
          </div>
          <div className="print-meta-item">
            <strong>Última Modif.:</strong>
            <span>{formatDate(sheet.updatedAt)} {sheet.updater ? `(${sheet.updater.name})` : ''}</span>
          </div>
        </div>

        {/* Parámetros de Preparación */}
        <div className="print-section-title">1. Parámetros Técnicos de Preparación en Máquina</div>
        <table className="print-params-table">
          <tbody>
            <tr>
              <th>Cilindro y Medidas</th>
              <td>{sheet.cylinderSize || 'No especificado'}</td>
              <th>Medidas Impresión / Material</th>
              <td>{sheet.printingMeasure || 'No especificado'}</td>
            </tr>
            <tr>
              <th>Material Base y Tipo</th>
              <td>{sheet.materialType || 'No especificado'}</td>
              <th>Velocidad de Trabajo</th>
              <td>{sheet.speed || 'No especificada'}</td>
            </tr>
            <tr>
              <th>Temperatura del Túnel</th>
              <td>{sheet.tunnelTemp || 'No especificada'}</td>
              <th>Disposición de la Bobina</th>
              <td>{sheet.coilDisposition || 'No especificada'}</td>
            </tr>
            <tr>
              <th>Orientación / Desplazamientos</th>
              <td colSpan={3}>{sheet.orientationDisplacement || 'No especificado'}</td>
            </tr>
          </tbody>
        </table>

        {/* Cuerpos de Impresión y Colores */}
        <div className="print-section-title">
          2. Cuerpos de Impresión, Tintas y Secuencia ({sheet.bodies?.length || 0} Cuerpos)
        </div>
        <table className="print-bodies-table">
          <thead>
            <tr>
              <th style={{ width: '8%', textAlign: 'center' }}>Cuerpo</th>
              <th style={{ width: '22%' }}>Color</th>
              <th style={{ width: '22%' }}>Tinta / Referencia</th>
              <th style={{ width: '20%' }}>Marca / Identif.</th>
              <th style={{ width: '28%' }}>Parámetros Específicos / Obs.</th>
            </tr>
          </thead>
          <tbody>
            {sheet.bodies && sheet.bodies.length > 0 ? (
              sheet.bodies.map((body, idx) => (
                <tr key={body.id || idx}>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{body.bodyOrder}</td>
                  <td style={{ fontWeight: 600 }}>{body.colorName}</td>
                  <td>{body.inkReference || '-'}</td>
                  <td>{body.brandOrCode || '-'}</td>
                  <td>
                    {body.specificParams ? (
                      <div style={{ fontSize: '0.8rem', color: '#1e293b' }}>
                        <strong>Parámetros:</strong> {body.specificParams}
                      </div>
                    ) : null}
                    {body.observations ? (
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        <strong>Obs:</strong> {body.observations}
                      </div>
                    ) : null}
                    {!body.specificParams && !body.observations ? '-' : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '1rem' }}>
                  No se registraron cuerpos de impresión para esta ficha técnica.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Observaciones Técnicas Específicas */}
        <div className="print-section-title">3. Indicaciones y Observaciones Técnicas (Ajustes de Polímero / Cliente)</div>
        <div className="print-notes-box">
          {sheet.technicalNotes || 'Sin observaciones técnicas adicionales registradas.'}
        </div>

        {/* Observaciones Generales */}
        {sheet.generalObservations ? (
          <>
            <div className="print-section-title">4. Observaciones Generales</div>
            <div className="print-notes-box">
              {sheet.generalObservations}
            </div>
          </>
        ) : null}

        {/* Firmas de Control */}
        <div className="print-footer-signatures">
          <div className="signature-line">
            <div className="signature-rule"></div>
            <div>Encargado de Planta / Preparación</div>
          </div>
          <div className="signature-line">
            <div className="signature-rule"></div>
            <div>Operario Responsable en Máquina</div>
          </div>
        </div>
      </div>
    </div>
  );
};
