import crypto from 'crypto';

/**
 * Hashes a password using crypto.scrypt with a random salt.
 * Format: scrypt:<salt>:<hash>
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derivedKey}`;
}

/**
 * Verifies a password against a stored value.
 * Supports:
 * 1. scrypt:<salt>:<hash> (new secure hashes)
 * 2. Plain text password (legacy fallback for progressive migration)
 */
export function verifyPassword(password: string, storedHashOrPlain: string): boolean {
  if (!password || !storedHashOrPlain) return false;

  if (storedHashOrPlain.startsWith('scrypt:')) {
    const parts = storedHashOrPlain.split(':');
    if (parts.length !== 3) return false;
    const [, salt, expectedHash] = parts;
    try {
      const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
      const expectedBuffer = Buffer.from(expectedHash, 'hex');
      const derivedBuffer = Buffer.from(derivedKey, 'hex');
      if (expectedBuffer.length !== derivedBuffer.length) return false;
      return crypto.timingSafeEqual(expectedBuffer, derivedBuffer);
    } catch {
      return false;
    }
  }

  // Fallback for legacy plain text passwords
  const passBuf = Buffer.from(password);
  const storedBuf = Buffer.from(storedHashOrPlain);
  if (passBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(passBuf, storedBuf);
}

/**
 * Checks if the stored password needs an upgrade to scrypt
 */
export function needsPasswordUpgrade(storedHashOrPlain: string): boolean {
  return !storedHashOrPlain.startsWith('scrypt:');
}
