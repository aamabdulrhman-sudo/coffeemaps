import { NextResponse } from 'next/server';

/** Which native wallet integrations are configured on this server (env-gated). */
export async function GET() {
  const apple =
    Boolean(process.env.APPLE_WALLET_PASS_TYPE_ID) &&
    Boolean(process.env.APPLE_WALLET_TEAM_ID) &&
    Boolean(process.env.APPLE_WALLET_SIGNER_CERT) &&
    Boolean(process.env.APPLE_WALLET_SIGNER_KEY) &&
    Boolean(process.env.APPLE_WALLET_WWDR_CERT);

  const google =
    Boolean(process.env.GOOGLE_WALLET_ISSUER_ID) &&
    Boolean(process.env.GOOGLE_WALLET_CLIENT_EMAIL) &&
    Boolean(process.env.GOOGLE_WALLET_PRIVATE_KEY);

  return NextResponse.json({ apple, google });
}
