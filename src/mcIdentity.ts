import crypto from 'crypto';

export function normalizeMcName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function generateParticipantKey(name: string) {
  const normalizedName = normalizeMcName(name);

  const hash = crypto
    .createHash('sha256')
    .update(normalizedName)
    .digest('hex')
    .slice(0, 12);

  return `mc_${hash}`;
}