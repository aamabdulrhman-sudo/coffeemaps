import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureLoyaltyCard } from '@/lib/loyalty';

/**
 * Google Wallet "Save to Google Wallet" link for the customer's universal card.
 * Enabled only when a Google Wallet issuer service account is configured via env:
 * GOOGLE_WALLET_ISSUER_ID, GOOGLE_WALLET_CLIENT_EMAIL, GOOGLE_WALLET_PRIVATE_KEY.
 */
function getGoogleWalletEnv() {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  const clientEmail = process.env.GOOGLE_WALLET_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!issuerId || !clientEmail || !privateKey) return null;
  return { issuerId, clientEmail, privateKey };
}

function signJwt(claims: object, privateKey: string): string {
  const encode = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header = encode({ alg: 'RS256', typ: 'JWT' });
  const payload = encode(claims);
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(`${header}.${payload}`)
    .sign(privateKey)
    .toString('base64url');
  return `${header}.${payload}.${signature}`;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const env = getGoogleWalletEnv();
    if (!env) {
      return NextResponse.json(
        { error: 'Google Wallet is not configured on this server', enabled: false },
        { status: 501 }
      );
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const finalCard =
      (await prisma.loyaltyCard.findUnique({ where: { userId } })) ??
      (await ensureLoyaltyCard(userId));
    const balancesCount = await prisma.loyaltyBalance.count({ where: { cardId: finalCard.id } });

    const now = Math.floor(Date.now() / 1000);
    const objectId = `${env.issuerId}.loyaltyObject-${userId.replace(/[^\w-]/g, '')}`;

    const claims = {
      iss: env.clientEmail,
      aud: 'google',
      typ: 'savetowallet',
      iat: now,
      exp: now + 3600,
      payload: {
        loyaltyClasses: [
          {
            id: `${env.issuerId}.loyaltyClass.coffeemap`,
            issuerName: 'CoffeeMap',
            programName: 'Loyalty Card',
            reviewStatus: 'UNDER_REVIEW',
          },
        ],
        loyaltyObjects: [
          {
            id: objectId,
            classId: `${env.issuerId}.loyaltyClass.coffeemap`,
            issuerName: 'CoffeeMap',
            accountName: user?.name ?? 'CoffeeMap customer',
            accountId: finalCard.code,
            state: 'ACTIVE',
            barcode: {
              type: 'QR_CODE',
              value: finalCard.code,
              alternateText: finalCard.code,
            },
            loyaltyPoints: {
              label: 'Cafes joined',
              balance: { string: String(balancesCount) },
            },
          },
        ],
      },
    };

    const jwt = signJwt(claims, env.privateKey);
    const saveUrl = `https://pay.google.com/gp/v/save?jwt=${jwt}`;

    return NextResponse.json({ url: saveUrl, enabled: true });
  } catch (error) {
    console.error('GET /api/loyalty/wallet/google error:', error);
    return NextResponse.json({ error: 'Failed to generate Google Wallet link' }, { status: 500 });
  }
}
