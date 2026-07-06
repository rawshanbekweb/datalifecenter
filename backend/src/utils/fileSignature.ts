import fs from 'fs/promises';

// Fayl boshidagi imzo (magic bytes) mime turiga mos kelishini tekshiradi —
// kengaytmasi o'zgartirilgan yolg'on fayllarni rad etish uchun.
const SIGNATURE_CHECKS: Record<string, (buf: Buffer) => boolean> = {
  'image/jpeg': (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/gif': (b) => b.length >= 4 && b.subarray(0, 4).toString('ascii') === 'GIF8',
  'image/webp': (b) => b.length >= 12 && b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  'video/mp4': (b) => b.length >= 12 && b.subarray(4, 8).toString('ascii') === 'ftyp',
  'video/webm': (b) => b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
};

export async function verifyFileSignature(filePath: string, mimeType: string): Promise<boolean> {
  const check = SIGNATURE_CHECKS[mimeType];
  if (!check) return false;

  const handle = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(16);
    const { bytesRead } = await handle.read(buf, 0, 16, 0);
    return check(buf.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}
