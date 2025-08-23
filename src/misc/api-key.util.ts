import * as crypto from 'crypto';

const SECRET = process.env.API_SECRET || 'super-secret';

export function generateApiKey(
  resellerEmail: string,
  ttlSeconds: number,
): string {
  const expiration = Math.floor(Date.now() / 1000) + ttlSeconds;

  // Encode email safely
  const emailBase64 = Buffer.from(resellerEmail, 'utf8').toString('base64');

  const payload = `${emailBase64}.${expiration}`;
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(payload)
    .digest('hex');

  return `${payload}.${signature}`;
}

export function verifyApiKey(apiKey: string): {
  valid: boolean;
  expired?: boolean;
  resellerEmail?: string;
} {
  try {
    const parts = apiKey.split('.');
    if (parts.length !== 3) return { valid: false };

    const [emailBase64, exp, signature] = parts;

    const expectedSignature = crypto
      .createHmac('sha256', SECRET)
      .update(`${emailBase64}.${exp}`)
      .digest('hex');

    if (signature !== expectedSignature) return { valid: false };

    const now = Math.floor(Date.now() / 1000);
    if (parseInt(exp) < now) return { valid: false, expired: true };

    // Decode email
    const resellerEmail = Buffer.from(emailBase64, 'base64').toString('utf8');

    return { valid: true, resellerEmail };
  } catch {
    return { valid: false };
  }
}
