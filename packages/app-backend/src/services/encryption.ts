import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

/**
 * Encrypt sensitive data (e.g., passwords) using AES-256-GCM
 */
export function encrypt(text: string): string {
  if (!text) return '';

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  // Return: iv + tag + encrypted (all in hex)
  return iv.toString('hex') + tag.toString('hex') + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) return '';

  try {
    const key = Buffer.from(ENCRYPTION_KEY.substring(0, 64), 'hex');

    // Extract iv, tag, and encrypted text
    const ivHex = encryptedData.substring(0, IV_LENGTH * 2);
    const tagHex = encryptedData.substring(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2);
    const encrypted = encryptedData.substring((IV_LENGTH + TAG_LENGTH) * 2);

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generate a secure hash for file integrity checking
 */
export function hashFile(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Generate a secure hash for strings
 */
export function hashString(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}
