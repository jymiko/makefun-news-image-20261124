import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_DIMENSION = 1024;
const ROOT_DIR = dirname(fileURLToPath(import.meta.url));
const SOURCE_IMAGE = join(ROOT_DIR, 'entry.png');
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const TARGET_IMAGE = join(OUTPUT_DIR, 'entry.png');

function verifyImage(buf: Buffer): void {
  if (buf.length === 0 || buf.length > MAX_IMAGE_BYTES) {
    throw new Error(`Image size ${buf.length} bytes exceeds the 1 MiB limit.`);
  }

  const isPng =
    buf.length >= 24 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a;

  if (isPng) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width === 0 || height === 0 || width > MAX_DIMENSION || height > MAX_DIMENSION) {
      throw new Error(`PNG dimensions ${width}x${height} exceed ${MAX_DIMENSION}x${MAX_DIMENSION}.`);
    }
    return;
  }

  const isJpeg =
    buf.length >= 4 &&
    buf[0] === 0xff &&
    buf[1] === 0xd8 &&
    buf[buf.length - 2] === 0xff &&
    buf[buf.length - 1] === 0xd9;

  if (!isJpeg) {
    throw new Error('entry.png must be a complete PNG or JPEG image.');
  }
}

const imageBytes = readFileSync(SOURCE_IMAGE);
verifyImage(imageBytes);

mkdirSync(OUTPUT_DIR, { recursive: true, mode: 0o755 });
writeFileSync(TARGET_IMAGE, imageBytes, { mode: 0o644 });
chmodSync(TARGET_IMAGE, 0o644);
