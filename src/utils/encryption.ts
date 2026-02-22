import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey(): Buffer {
    const secret = process.env.LLM_KEY_ENCRYPTION_SECRET;
    if (!secret) throw new Error('LLM_KEY_ENCRYPTION_SECRET environment variable is not set');
    return scryptSync(secret, 'lumaway-llm-keys', 32);
}

/**
 * Encrypt an API key using AES-256-GCM.
 * Returns format: iv:authTag:ciphertext (all base64)
 */
export function encryptApiKey(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

/**
 * Decrypt an API key encrypted with encryptApiKey.
 */
export function decryptApiKey(encoded: string): string {
    const parts = encoded.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted key format');
    const [ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    return decipher.update(data).toString('utf8') + decipher.final('utf8');
}
