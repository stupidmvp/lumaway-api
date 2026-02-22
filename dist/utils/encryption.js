"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptApiKey = encryptApiKey;
exports.decryptApiKey = decryptApiKey;
const crypto_1 = require("crypto");
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
function getKey() {
    const secret = process.env.LLM_KEY_ENCRYPTION_SECRET;
    if (!secret)
        throw new Error('LLM_KEY_ENCRYPTION_SECRET environment variable is not set');
    return (0, crypto_1.scryptSync)(secret, 'lumaway-llm-keys', 32);
}
/**
 * Encrypt an API key using AES-256-GCM.
 * Returns format: iv:authTag:ciphertext (all base64)
 */
function encryptApiKey(plaintext) {
    const iv = (0, crypto_1.randomBytes)(IV_LENGTH);
    const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}
/**
 * Decrypt an API key encrypted with encryptApiKey.
 */
function decryptApiKey(encoded) {
    const parts = encoded.split(':');
    if (parts.length !== 3)
        throw new Error('Invalid encrypted key format');
    const [ivB64, tagB64, dataB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(tag);
    return decipher.update(data).toString('utf8') + decipher.final('utf8');
}
