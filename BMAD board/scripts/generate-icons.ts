import { Buffer } from "buffer";
import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const RESOURCES = join(__dirname, "..", "resources");

async function generateIcons() {
  const svg = readFileSync(join(RESOURCES, "icon.svg"));

  const sizes = [16, 24, 32, 48, 64, 128, 256, 512];

  for (const size of sizes) {
    const buf = await sharp(svg).resize(size, size).png().toBuffer();
    writeFileSync(join(RESOURCES, `icon-${size}.png`), buf);
    console.log(`  icon-${size}.png`);
  }

  const png256 = await sharp(svg).resize(256, 256).png().toBuffer();
  writeFileSync(join(RESOURCES, "icon.png"), png256);
  console.log("  icon.png");

  await generateIco(await sharp(svg).resize(256, 256).png().toBuffer());
  console.log("  icon.ico");
}

async function generateIco(png256: Buffer) {
  const png16 = await sharp(readFileSync(join(RESOURCES, "icon-16.png"))).toBuffer();
  const png32 = await sharp(readFileSync(join(RESOURCES, "icon-32.png"))).toBuffer();
  const png48 = await sharp(readFileSync(join(RESOURCES, "icon-48.png"))).toBuffer();

  const icons = [
    { width: 16, height: 16, data: png16 },
    { width: 32, height: 32, data: png32 },
    { width: 48, height: 48, data: png48 },
    { width: 256, height: 256, data: png256 },
  ];

  const headerSize = 6;
  const entrySize = 16;
  const offset = headerSize + icons.length * entrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(icons.length, 4);

  const entries: Buffer[] = [];
  const imageDatas: Buffer[] = [];
  let currentOffset = offset;

  for (const icon of icons) {
    const entry = Buffer.alloc(entrySize);
    entry.writeUInt8(icon.width >= 256 ? 0 : icon.width, 0);
    entry.writeUInt8(icon.height >= 256 ? 0 : icon.height, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(icon.data.length, 8);
    entry.writeUInt32LE(currentOffset, 12);
    entries.push(entry);
    imageDatas.push(icon.data);
    currentOffset += icon.data.length;
  }

  const ico = Buffer.concat([header, ...entries, ...imageDatas]);
  writeFileSync(join(RESOURCES, "icon.ico"), ico);
}

generateIcons().catch(console.error);
