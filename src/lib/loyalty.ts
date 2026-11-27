import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I/L)

/** Generate a short human-readable loyalty card code, e.g. CM-7K2M-9XQ4 */
export function generateCardCode(): string {
  const pick = (n: number) =>
    Array.from({ length: n }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');
  return `CM-${pick(4)}-${pick(4)}`;
}

/** Create a loyalty card for a user+program with a unique code (or return the existing one). */
export async function ensureLoyaltyCard(userId: string, programId: string) {
  const existing = await prisma.loyaltyCard.findUnique({
    where: { userId_programId: { userId, programId } },
  });
  if (existing) return existing;

  let code = generateCardCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await prisma.loyaltyCard.findUnique({ where: { code } });
    if (!clash) break;
    code = generateCardCode();
  }

  return prisma.loyaltyCard.create({
    data: { userId, programId, code, stamps: 0 },
  });
}

export function normalizeCardCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}
