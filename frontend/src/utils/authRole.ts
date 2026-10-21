export type AppRole = 'ADMIN' | 'MACHINE' | 'ENCARGADO_PLANTA' | 'VENDEDOR';

export const normalizeRole = (role?: string): AppRole => {
  const normalized = String(role || 'ADMIN')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (!normalized || normalized.includes('ADMIN')) return 'ADMIN';

  if (normalized.includes('ENCARGADO')) return 'ENCARGADO_PLANTA';
  if (normalized.includes('VENDEDOR')) return 'VENDEDOR';

  if (
    normalized === 'MACHINE' ||
    normalized.includes('MAQUINA') ||
    normalized.includes('OPERARIO') ||
    normalized.includes('PLANTA') ||
    normalized.includes('IMPRES') ||
    normalized.includes('LAMIN') ||
    normalized.includes('REFIL') ||
    normalized.includes('CONFE')
  ) {
    return 'MACHINE';
  }

  return 'MACHINE';
};
