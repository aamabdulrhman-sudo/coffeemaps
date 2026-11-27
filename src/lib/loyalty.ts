import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I/L)

/** Generate a short human-readable universal card code, e.g. CM-7K2M-9XQ4 */
export function generateCardCode(): string {
  const pick = (n: number) =>
    Array.from({ length: n }, () => CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)]).join('');
  return `CM-${pick(4)}-${pick(4)}`;
}

/**
 * Get (or create) the customer's ONE universal loyalty card with a unique code.
 * Every cafe scans this same code — balances are tracked per cafe separately.
 */
export async function ensureLoyaltyCard(userId: string) {
  const existing = await prisma.loyaltyCard.findUnique({ where: { userId } });
  if (existing) return existing;

  let code = generateCardCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await prisma.loyaltyCard.findUnique({ where: { code } });
    if (!clash) break;
    code = generateCardCode();
  }

  return prisma.loyaltyCard.create({ data: { userId, code } });
}

/** Get (or create) the per-cafe stamp balance on a customer's universal card. */
export async function ensureBalance(cardId: string, programId: string) {
  const existing = await prisma.loyaltyBalance.findUnique({
    where: { cardId_programId: { cardId, programId } },
  });
  if (existing) return existing;
  return prisma.loyaltyBalance.create({ data: { cardId, programId } });
}

export function normalizeCardCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}
