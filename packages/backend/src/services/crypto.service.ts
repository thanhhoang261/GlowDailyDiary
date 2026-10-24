import crypto from 'crypto';

const MASTER_SECRET =
  process.env.DIARY_ENCRYPTION_SECRET ||
  process.env.JWT_SECRET ||
  'glow_diary_super_secure_vault_secret_key_2026_daily_joy_aes';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM
const ENCRYPTED_PREFIX = 'enc:v1:';

/**
 * Derive a unique, deterministic 256-bit encryption key for a given user using HKDF
 */
export function getUserEncryptionKey(userId: string): Buffer {
  if (!userId) {
    throw new Error('User ID is required to derive encryption key');
  }
  const derivedKey = crypto.hkdfSync(
    'sha256',
    MASTER_SECRET,
    userId,
    'glow-diary-user-entry-encryption-v1',
    32
  );
  return Buffer.from(derivedKey);
}

/**
 * Check if a text is already encrypted with our AES-256-GCM format
 */
export function isEncrypted(text: string | null | undefined): boolean {
  return Boolean(text && text.startsWith(ENCRYPTED_PREFIX));
}

/**
 * Encrypt plain text for a specific user using AES-256-GCM
 * Output format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encryptForUser(userId: string, plainText: string | null | undefined): string {
  if (plainText === null || plainText === undefined || plainText === '') {
    return '';
  }

  // Already encrypted
  if (isEncrypted(plainText)) {
    return plainText;
  }

  try {
    const key = getUserEncryptionKey(userId);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(plainText, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${ENCRYPTED_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
  } catch (err: any) {
    console.error(`[Crypto] Encryption error for user ${userId}:`, err.message);
    throw new Error('Failed to encrypt diary content');
  }
}

/**
 * Decrypt cipher text for a specific user using AES-256-GCM
 * If the content is not encrypted (legacy plain text), return as is for backward compatibility.
 */
export function decryptForUser(userId: string, cipherText: string | null | undefined): string {
  if (cipherText === null || cipherText === undefined || cipherText === '') {
    return '';
  }

  // Not encrypted (legacy plain text), return directly
  if (!isEncrypted(cipherText)) {
    return cipherText;
  }

  try {
    const parts = cipherText.split(':');
    // Format: enc : v1 : iv : tag : cipher
    if (parts.length < 5) {
      console.warn('[Crypto] Malformed encrypted payload structure');
      return '';
    }

    const ivHex = parts[2];
    const tagHex = parts[3];
    const cipherHex = parts[4];

    const key = getUserEncryptionKey(userId);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));

    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err: any) {
    console.warn(`[Crypto] Decryption failed for user ${userId}:`, err.message);
    return '🔒 [Nội dung đã được mã hoá bảo mật - Không thể giải mã với quyền này]';
  }
}
