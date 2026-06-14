import crypto from 'crypto';

/** DES-ECB encryption with PKCS7 padding — matches Chaoxing login encryption */
export function desEncrypt(text: string, key: string): string {
  const keyBuffer = Buffer.from(key, 'utf8');
  // DES uses 8-byte key
  const desKey = keyBuffer.subarray(0, 8);
  const cipher = crypto.createCipheriv('des-ecb', desKey, null);
  cipher.setAutoPadding(true); // PKCS7 by default
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}
