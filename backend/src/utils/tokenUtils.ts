import crypto from 'crypto';

export interface TokenPayload {
  userId: number;
  username: string;
  role: string;
  machineId?: number | null;
  iat: number;
  exp: number;
}

const TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours

const getSecretKey = (): string => {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CONFIGURACIÓN INSEGURA: JWT_SECRET o AUTH_SECRET debe estar configurado en producción.');
    }
    return 'silcar-industrial-os-secret-key-2026';
  }
  return secret;
};

/**
 * Creates a signed base64url token.
 * Format: <header>.<payload>.<signature>
 */
export function createSessionToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + TOKEN_EXPIRY_SECONDS;
  const fullPayload: TokenPayload = { ...payload, iat, exp };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', getSecretKey())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies and decodes a signed session token.
 * Returns null if invalid or expired.
 */
export function verifySessionToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', getSecretKey())
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expSigBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expSigBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expSigBuf)) return null;

  try {
    const payload: TokenPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}
