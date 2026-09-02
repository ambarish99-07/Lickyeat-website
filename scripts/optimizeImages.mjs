/**
 * One-off: shrink the raw menu/tiffin/brand photography (copied from the reference
 * project — 2-3 MB PNGs) to web sizes so it can live in git and load fast.
 *
 *   node scripts/optimizeImages.mjs
 *
 * Menu + tiffin dish photos become <slug>.jpg (720px). Brand hero photos become
 * <slug>-hero.jpg (1400px). Brand logo PNGs are resized in place (240px, alpha
 * kept). The .png originals for the photos are deleted; the seed references .jpg.
 */
import { readdir, stat, rename, unlink } from "node:fs/promises";
import { join, extname, basename, resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require(
  resolve(
    process.cwd(),
    "node_modules/.pnpm/sharp@0.35.4_@types+node@22.20.1/node_modules/sharp/dist/index.cjs",
  ),
);

const PUBLIC = "apps/api/public";
let before = 0;
let after = 0;

async function toJpg(dir, width, quality) {
  let files = [];
  try {
    files = await readdir(dir);
  } catch {
    return;
  }
  for (const file of files) {
    const ext = extname(file).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(ext)) continue;
    const src = join(dir, file);
    const s = await stat(src);
    before += s.size;
    const out = join(dir, basename(file, ext) + ".jpg");
    const tmp = out + ".tmp";
    await sharp(src)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality, mozjpeg: true })
      .toFile(tmp);
    if (ext !== ".jpg") await unlink(src);
    await rename(tmp, out).catch(async () => {
      await unlink(out).catch(() => {});
      await rename(tmp, out);
    });
    after += (await stat(out)).size;
  }
}

async function resizePngInPlace(dir, width, quality, filter) {
  let files = [];
  try {
    files = await readdir(dir);
  } catch {
    return;
  }
  for (const file of files) {
    if (extname(file).toLowerCase() !== ".png") continue;
    if (filter && !filter(file)) continue;
    const src = join(dir, file);
    const s = await stat(src);
    before += s.size;
    const tmp = src + ".tmp";
    await sharp(src)
      .resize({ width, withoutEnlargement: true })
      .png({ quality, compressionLevel: 9, palette: true })
      .toFile(tmp);
    await unlink(src);
    await rename(tmp, src);
    after += (await stat(src)).size;
  }
}

// Hero photos -> <slug>-hero.jpg (do before logos so the filter is simple)
{
  const dir = `${PUBLIC}/brands`;
  const files = await readdir(dir);
  for (const file of files.filter((f) => f.includes("-hero") && f.endsWith(".png"))) {
    const src = join(dir, file);
    before += (await stat(src)).size;
    const out = join(dir, basename(file, ".png") + ".jpg");
    await sharp(src).rotate().resize({ width: 1400, withoutEnlargement: true }).jpeg({ quality: 72, mozjpeg: true }).toFile(out + ".tmp");
    await unlink(src);
    await rename(out + ".tmp", out);
    after += (await stat(out)).size;
  }
}

await toJpg(`${PUBLIC}/menu-images`, 720, 78);
await toJpg(`${PUBLIC}/tiffin-images`, 720, 74);
await resizePngInPlace(`${PUBLIC}/brands`, 240, 82, (f) => !f.includes("-hero"));

console.log(`optimized: ${(before / 1e6).toFixed(1)} MB -> ${(after / 1e6).toFixed(1)} MB`);
