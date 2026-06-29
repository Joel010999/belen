export const getOrderOperationalStatus = (order: any) => {
  const processes = Array.isArray(order?.processes) ? order.processes : [];
  const plannedTypes = new Set(processes.map((process: any) => process.type));

  const latestByType = (type: string) =>
    processes
      .filter((process: any) => process.type === type)
      .sort((a: any, b: any) => {
        const left = new Date(b.updatedAt || b.endTime || b.startTime || 0).getTime();
        const right = new Date(a.updatedAt || a.endTime || a.startTime || 0).getTime();
        return left - right;
      })[0];

  const latestPrinting = latestByType('IMPRESION');
  const latestLamination = latestByType('LAMINACION');
  const latestRefilado = latestByType('REFILADO');

  let operationalStatus = 'PLANIFICADA';
  let currentStage: string | null = null;

  if (order?.status === 'Finalizadas') {
    operationalStatus = 'FINALIZADA';
  } else if (order?.approvedRefilado) {
    operationalStatus = 'PENDIENTE_CONTROL';
    currentStage = 'REFILADO';
  } else if (latestRefilado) {
    operationalStatus = latestRefilado.status === 'finalizado' ? 'REFILADO_COMPLETO' : 'EN_REFILADO';
    currentStage = 'REFILADO';
  } else if (order?.approvedLamination) {
    operationalStatus = plannedTypes.has('REFILADO') ? 'PENDIENTE_REFILADO' : 'PENDIENTE_CONTROL';
    currentStage = plannedTypes.has('REFILADO') ? 'REFILADO' : 'LAMINACION';
  } else if (latestLamination) {
    operationalStatus = latestLamination.status === 'finalizado' ? 'LAMINACION_COMPLETA' : 'EN_LAMINACION';
    currentStage = 'LAMINACION';
  } else if (order?.approvedPrinting) {
    if (plannedTypes.has('LAMINACION')) {
      operationalStatus = 'PENDIENTE_LAMINACION';
      currentStage = 'LAMINACION';
    } else if (plannedTypes.has('REFILADO')) {
      operationalStatus = 'PENDIENTE_REFILADO';
      currentStage = 'REFILADO';
    } else {
      operationalStatus = 'PENDIENTE_CONTROL';
      currentStage = 'IMPRESION';
    }
  } else if (latestPrinting) {
    operationalStatus = latestPrinting.status === 'finalizado' ? 'IMPRESION_COMPLETA' : 'EN_IMPRESION';
    currentStage = 'IMPRESION';
  } else if (plannedTypes.has('IMPRESION')) {
    operationalStatus = 'PENDIENTE_IMPRESION';
    currentStage = 'IMPRESION';
  }

  return { operationalStatus, currentStage };
};

export const getOperationalStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PLANIFICADA: 'Planificada',
    PENDIENTE_IMPRESION: 'Pendiente Impresion',
    EN_IMPRESION: 'En Impresion',
    IMPRESION_COMPLETA: 'Impresion Completa',
    PENDIENTE_LAMINACION: 'Pendiente Laminacion',
    EN_LAMINACION: 'En Laminacion',
    LAMINACION_COMPLETA: 'Laminacion Completa',
    PENDIENTE_REFILADO: 'Pendiente Refilado',
    EN_REFILADO: 'En Refilado',
    REFILADO_COMPLETO: 'Refilado Completo',
    PENDIENTE_CONTROL: 'Pendiente Control',
    FINALIZADA: 'Finalizada'
  };

  return labels[status] || status;
};

export const getStageLabel = (stage: string | null) => {
  if (stage === 'IMPRESION') return 'Impresion';
  if (stage === 'LAMINACION') return 'Laminacion';
  if (stage === 'REFILADO') return 'Refilado';
  return '-';
};
