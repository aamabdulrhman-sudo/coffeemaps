import crypto from 'crypto';
import zlib from 'zlib';

/* ------------------------------------------------------------------ */
/* Minimal CRC32                                                        */
/* ------------------------------------------------------------------ */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/* ------------------------------------------------------------------ */
/* Minimal STORE-method ZIP writer (valid for Apple Wallet .pkpass)     */
/* ------------------------------------------------------------------ */

interface ZipEntry {
  name: string;
  data: Buffer;
}

export function buildZip(entries: ZipEntry[]): Buffer {
  const chunks: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8');
    const crc = crc32(entry.data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // local file header signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0x0800, 6); // UTF-8 flag
    local.writeUInt16LE(0, 8); // store method
    local.writeUInt16LE(0, 10); // time
    local.writeUInt16LE(0, 12); // date
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(entry.data.length, 18); // compressed size
    local.writeUInt32LE(entry.data.length, 22); // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    chunks.push(local, nameBuf, entry.data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(0, 10); // store
    centralHeader.writeUInt16LE(0, 12); // time
    centralHeader.writeUInt16LE(0, 14); // date
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(entry.data.length, 20);
    centralHeader.writeUInt32LE(entry.data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt32LE(offset, 42); // relative offset

    central.push(centralHeader, nameBuf);
    offset += local.length + nameBuf.length + entry.data.length;
  }

  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);

  return Buffer.concat([...chunks, centralBuf, eocd]);
}

/* ------------------------------------------------------------------ */
/* Minimal valid PNG generator (solid color) for the required icon      */
/* ------------------------------------------------------------------ */

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

/** Solid-color RGBA PNG (Apple Wallet requires icon.png at 29x29 minimum). */
export function createSolidPng(size: number, rgb: [number, number, number]): Buffer {
  const raw: Buffer[] = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      row[1 + x * 4] = rgb[0];
      row[2 + x * 4] = rgb[1];
      row[3 + x * 4] = rgb[2];
      row[4 + x * 4] = 255;
    }
    raw.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(Buffer.concat(raw))),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------------------------ */
/* Manifest + PKCS#7 signature (via openssl CLI, present in alpine)     */
/* ------------------------------------------------------------------ */

export function sha1Hex(data: Buffer | string): string {
  return crypto.createHash('sha1').update(data).digest('hex');
}

interface AppleWalletEnv {
  passTypeId: string;
  teamId: string;
  signerCert: string; // PEM
  signerKey: string; // PEM
  signerKeyPassword?: string;
  wwdrCert: string; // PEM
}

export function getAppleWalletEnv(): AppleWalletEnv | null {
  const passTypeId = process.env.APPLE_WALLET_PASS_TYPE_ID;
  const teamId = process.env.APPLE_WALLET_TEAM_ID;
  const signerCert = process.env.APPLE_WALLET_SIGNER_CERT;
  const signerKey = process.env.APPLE_WALLET_SIGNER_KEY;
  const wwdrCert = process.env.APPLE_WALLET_WWDR_CERT;
  if (!passTypeId || !teamId || !signerCert || !signerKey || !wwdrCert) return null;
  return {
    passTypeId,
    teamId,
    signerCert: signerCert.replace(/\\n/g, '\n'),
    signerKey: signerKey.replace(/\\n/g, '\n'),
    signerKeyPassword: process.env.APPLE_WALLET_CERT_PASSWORD,
    wwdrCert: wwdrCert.replace(/\\n/g, '\n'),
  };
}

export async function signManifest(manifestJson: string, env: AppleWalletEnv): Promise<Buffer> {
  const { execFile } = await import('child_process');
  const { mkdtemp, writeFile, readFile, rm } = await import('fs/promises');
  const { tmpdir } = await import('os');
  const path = await import('path');

  const dir = await mkdtemp(path.join(tmpdir(), 'pkpass-'));
  try {
    const manifestPath = path.join(dir, 'manifest.json');
    const certPath = path.join(dir, 'signer.pem');
    const keyPath = path.join(dir, 'signer.key');
    const wwdrPath = path.join(dir, 'wwdr.pem');
    const sigPath = path.join(dir, 'signature');

    await writeFile(manifestPath, manifestJson);
    await writeFile(certPath, env.signerCert);
    await writeFile(keyPath, env.signerKey);
    await writeFile(wwdrPath, env.wwdrCert);

    const args = [
      'smime',
      '-binary',
      '-sign',
      '-in',
      manifestPath,
      '-out',
      sigPath,
      '-outform',
      'DER',
      '-signer',
      certPath,
      '-inkey',
      keyPath,
      '-certfile',
      wwdrPath,
      ...(env.signerKeyPassword ? ['-passin', `pass:${env.signerKeyPassword}`] : []),
    ];

    await new Promise<void>((resolve, reject) => {
      execFile('openssl', args, (err) => (err ? reject(err) : resolve()));
    });

    return await readFile(sigPath);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
