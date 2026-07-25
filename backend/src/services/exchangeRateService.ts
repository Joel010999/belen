import prisma from '../lib/prisma';

const RATE_KEY = 'usdOfficialExchangeRate';
const RATE_DATE_KEY = 'usdOfficialExchangeRateDate';
const RATE_SOURCE_KEY = 'usdOfficialExchangeRateSource';

export type ExchangeRateResult = {
  rate: number | null;
  source: 'BCRA' | 'CACHE' | 'MANUAL' | 'UNAVAILABLE';
  date: string | null;
  error?: string;
};

const toDateParam = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseExchangeRate = (value: any) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).replace(',', '.').trim();
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getSetting = async (key: string) => {
  return prisma.systemSetting.findUnique({ where: { key } });
};

const setSetting = async (key: string, value: string) => {
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
};

const readStoredRate = async (source: ExchangeRateResult['source'] = 'CACHE', error?: string): Promise<ExchangeRateResult> => {
  const [rateSetting, dateSetting, sourceSetting] = await Promise.all([
    getSetting(RATE_KEY),
    getSetting(RATE_DATE_KEY),
    getSetting(RATE_SOURCE_KEY)
  ]);

  const rate = parseExchangeRate(rateSetting?.value);
  if (!rate) {
    return { rate: null, source: 'UNAVAILABLE', date: null, error };
  }

  return {
    rate,
    source: sourceSetting?.value === 'MANUAL' ? 'MANUAL' : source,
    date: dateSetting?.value || null,
    error
  };
};

const persistRate = async (rate: number, date: string, source: 'BCRA' | 'MANUAL') => {
  await Promise.all([
    setSetting(RATE_KEY, String(rate)),
    setSetting(RATE_DATE_KEY, date),
    setSetting(RATE_SOURCE_KEY, source)
  ]);
};

export const fetchOfficialUsdRate = async (): Promise<ExchangeRateResult> => {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 20);

  const params = new URLSearchParams({
    fechaDesde: toDateParam(from),
    fechaHasta: toDateParam(today),
    limit: '30'
  });

  const url = `https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD?${params.toString()}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`BCRA respondio ${response.status}`);
  }

  const payload = await response.json() as any;
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const sorted = [...results].sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));

  for (const row of sorted) {
    const detail = Array.isArray(row?.detalle) ? row.detalle[0] : null;
    const rate = parseExchangeRate(detail?.tipoCotizacion);
    if (rate) {
      const date = String(row.fecha || toDateParam(today));
      await persistRate(rate, date, 'BCRA');
      return { rate, source: 'BCRA', date };
    }
  }

  throw new Error('BCRA no devolvio cotizacion USD usable');
};

export const getCurrentUsdExchangeRate = async (): Promise<ExchangeRateResult> => {
  try {
    return await fetchOfficialUsdRate();
  } catch (error: any) {
    return readStoredRate('CACHE', error?.message || 'No se pudo consultar BCRA');
  }
};

export const saveManualUsdExchangeRate = async (value: any): Promise<ExchangeRateResult> => {
  const rate = parseExchangeRate(value);
  if (!rate) {
    throw new Error('La cotizacion debe ser un numero mayor a cero');
  }

  const date = toDateParam(new Date());
  await persistRate(rate, date, 'MANUAL');
  return { rate, source: 'MANUAL', date };
};
