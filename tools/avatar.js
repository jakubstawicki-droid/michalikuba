#!/usr/bin/env node
/**
 * avatar.js — przycina portret do kwadratowego avatara WebP.
 *
 * Kadr: kwadrat o boku = krótsza krawędź.
 *  - obraz PIONOWY: wyrównany do GÓRY z odstępem (domyślnie 10% wysokości),
 *    bo twarze na portretach są w górnej części kadru; poziomo wyśrodkowany.
 *  - obraz POZIOMY / kwadrat: wyśrodkowany w obu osiach.
 * Skalowanie: Lanczos3. Wyjście: WebP.
 * Oryginał NIE jest nadpisywany — piszemy pod nową nazwą.
 *
 * Użycie:
 *   node tools/avatar.js <input> <output> [topPercent=10] [size=400] [quality=82]
 *
 * Przykłady:
 *   node tools/avatar.js img/jakub.webp  img/jakub-400.webp
 *   node tools/avatar.js img/michal.webp img/michal-400.webp 14   # więcej luzu nad głową
 */
const path = require("path");
const sharp = require("sharp");

async function main() {
  const [input, output, topPctArg, sizeArg, qualityArg] = process.argv.slice(2);
  if (!input || !output) {
    console.error("Użycie: node tools/avatar.js <input> <output> [topPercent=10] [size=400] [quality=82]");
    process.exit(1);
  }
  if (path.resolve(input) === path.resolve(output)) {
    console.error("BŁĄD: output nie może być tym samym plikiem co input (nie nadpisujemy oryginałów).");
    process.exit(1);
  }

  const topPercent = topPctArg !== undefined ? Number(topPctArg) : 10;
  const size = sizeArg !== undefined ? Number(sizeArg) : 400;
  const quality = qualityArg !== undefined ? Number(qualityArg) : 82;

  const img = sharp(input, { failOn: "error" });
  const meta = await img.metadata();
  const W = meta.width, H = meta.height;
  const side = Math.min(W, H);

  // pozycja kadru
  const left = Math.round((W - side) / 2); // poziomo zawsze do środka
  let top;
  if (H > W) {
    // pionowy: odstęp od góry, potem clamp, by nie wyjść poza dół
    top = Math.round((topPercent / 100) * H);
    top = Math.max(0, Math.min(top, H - side));
  } else {
    // poziomy / kwadrat: do środka
    top = Math.round((H - side) / 2);
  }

  await img
    .extract({ left, top, width: side, height: side })
    .resize(size, size, { kernel: "lanczos3" })
    .webp({ quality })
    .toFile(output);

  console.log(
    `${path.basename(input)} (${W}x${H}, ${H > W ? "pionowy" : W > H ? "poziomy" : "kwadrat"})` +
    ` -> ${path.basename(output)} ${size}x${size} q${quality}` +
    ` | kadr: left=${left} top=${top} side=${side}` +
    (H > W ? ` (odstęp od góry ${topPercent}%)` : ` (wyśrodkowany)`)
  );
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
