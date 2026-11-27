import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureLoyaltyCard } from '@/lib/loyalty';
import {
  buildZip,
  createSolidPng,
  getAppleWalletEnv,
  sha1Hex,
  signManifest,
} from '@/lib/wallet/pkpass';

/**
 * Apple Wallet .pkpass for the customer's universal loyalty card.
 * Enabled only when Apple Wallet certificates are configured via env vars
 * (APPLE_WALLET_PASS_TYPE_ID, APPLE_WALLET_TEAM_ID, APPLE_WALLET_SIGNER_CERT,
 *  APPLE_WALLET_SIGNER_KEY, APPLE_WALLET_WWDR_CERT, optional APPLE_WALLET_CERT_PASSWORD).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const env = getAppleWalletEnv();
    if (!env) {
      return NextResponse.json(
        { error: 'Apple Wallet is not configured on this server', enabled: false },
        { status: 501 }
      );
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
    const finalCard =
      (await prisma.loyaltyCard.findUnique({ where: { userId } })) ??
      (await ensureLoyaltyCard(userId));
    const balances = await prisma.loyaltyBalance.findMany({
      where: { cardId: finalCard.id },
      include: { program: { include: { shop: true } } },
    });
    const customerName = user?.name ?? 'CoffeeMap customer';

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: env.passTypeId,
      teamIdentifier: env.teamId,
      organizationName: 'CoffeeMap',
      description: 'CoffeeMap loyalty card',
      logoText: 'CoffeeMap',
      serialNumber: finalCard.code,
      backgroundColor: 'rgb(40, 26, 16)',
      foregroundColor: 'rgb(255, 248, 240)',
      labelColor: 'rgb(230, 180, 120)',
      barcodes: [
        {
          format: 'PKBarcodeFormatQR',
          message: finalCard.code,
          messageEncoding: 'iso-8859-1',
          altText: finalCard.code,
        },
      ],
      storeCard: {
        headerFields: [
          {
            key: 'code',
            label: 'CARD CODE',
            value: finalCard.code,
          },
        ],
        primaryFields: [
          {
            key: 'member',
            label: 'Member',
            value: customerName,
          },
        ],
        secondaryFields: [
          {
            key: 'cafes',
            label: 'Cafes joined',
            value: String(balances.length),
          },
          {
            key: 'claimed',
            label: 'Rewards claimed',
            value: String(balances.reduce((s, b) => s + b.redemptions, 0)),
          },
        ],
      },
    };

    const passJsonStr = JSON.stringify(passJson);
    const iconPng = createSolidPng(64, [194, 120, 60]);

    const files = new Map<string, Buffer>();
    files.set('pass.json', Buffer.from(passJsonStr, 'utf8'));
    files.set('icon.png', iconPng);
    files.set('icon@2x.png', iconPng);

    const manifest = JSON.stringify(
      Object.fromEntries([...files.entries()].map(([name, data]) => [name, sha1Hex(data)]))
    );

    const signature = await signManifest(manifest, env);

    const zipEntries = [...files.entries()].map(([name, data]) => ({ name, data }));
    zipEntries.push({ name: 'manifest.json', data: Buffer.from(manifest, 'utf8') });
    zipEntries.push({ name: 'signature', data: signature });

    const pkpass = buildZip(zipEntries);

    return new NextResponse(new Uint8Array(pkpass), {
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="coffeemap-card.pkpass"`,
      },
    });
  } catch (error) {
    console.error('GET /api/loyalty/wallet/apple error:', error);
    return NextResponse.json({ error: 'Failed to generate Apple Wallet pass' }, { status: 500 });
  }
}
