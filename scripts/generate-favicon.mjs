/**
 * Builds the favicon set from the brand mark.
 *
 *   npm run favicon
 *
 * Writes app/favicon.ico (16/32/48) and app/icon.png (512). Both are GENERATED —
 * edit this script, not the output.
 *
 * WHY THERE IS A BACKGROUND AT ALL. public/brand/mm-logo.png is a white "M" with
 * a red arrow on transparency. That is right for the site, which is always dark,
 * and wrong for a favicon: browser tab strips are light in light mode, so the M
 * would vanish and leave a tab showing nothing but a small red squiggle. Every
 * size here is composited onto --mm-base first, so the mark reads the same in
 * both browser themes and the tab is recognisably the show's.
 *
 * Rasterising happens in Chromium rather than in a pure-JS PNG decoder. Playwright
 * is already a devDependency for the e2e suite, and this way the scaling is the
 * same high-quality filter the browser uses for the logo everywhere else — a
 * hand-rolled nearest-neighbour resize of a 522x640 mark down to 16px is visibly
 * worse.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const SOURCE = new URL("../public/brand/mm-logo.png", import.meta.url);
const ICO_OUT = new URL("../app/favicon.ico", import.meta.url);
const PNG_OUT = new URL("../app/icon.png", import.meta.url);

/** --mm-base. Kept literal: styles/tokens.css is CSS and this is plain Node. */
const BASE = "#0B0B0D";
/**
 * Fraction of the square the mark spans. The arrow tip reaches the very corner of
 * the source art, so at 1 it would touch the icon's edge and read as clipped.
 */
const INSET = 0.84;
/** 48 is what Windows taskbar pins use; 16 and 32 are the tab strip. */
const ICO_SIZES = [16, 32, 48];

const logo = `data:image/png;base64,${readFileSync(SOURCE).toString("base64")}`;

const browser = await chromium.launch();
const page = await browser.newPage();

async function render(size) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0;background:${BASE}">
       <div style="width:${size}px;height:${size}px;display:grid;place-items:center">
         <img src="${logo}" style="max-width:${INSET * 100}%;max-height:${INSET * 100}%">
       </div>
     </body>`,
  );
  await page.waitForFunction(() => {
    const img = document.querySelector("img");
    return img?.complete && img.naturalWidth > 0;
  });
  return page.screenshot({ type: "png" });
}

const pngs = [];
for (const size of ICO_SIZES) pngs.push(await render(size));
writeFileSync(PNG_OUT, await render(512));
await browser.close();

/**
 * Assemble the .ico container.
 *
 * Entries carry PNG payloads rather than raw BMP/DIB bitmaps. The ICO format
 * allows either; PNG is a fraction of the bytes and every browser released this
 * side of IE10 reads it, which is the only audience a favicon.ico still has.
 *
 * The width and height bytes are single bytes where 0 means 256 — irrelevant at
 * these sizes, but the reason they are not simply the number.
 */
const HEADER = 6;
const ENTRY = 16;
const dir = Buffer.alloc(HEADER + ENTRY * pngs.length);
dir.writeUInt16LE(0, 0); // reserved
dir.writeUInt16LE(1, 2); // 1 = icon
dir.writeUInt16LE(pngs.length, 4);

let offset = dir.length;
pngs.forEach((png, i) => {
  const at = HEADER + i * ENTRY;
  const size = ICO_SIZES[i];
  dir.writeUInt8(size % 256, at);
  dir.writeUInt8(size % 256, at + 1);
  dir.writeUInt8(0, at + 2); // palette size; 0 for truecolour
  dir.writeUInt8(0, at + 3); // reserved
  dir.writeUInt16LE(1, at + 4); // colour planes
  dir.writeUInt16LE(32, at + 6); // bits per pixel
  dir.writeUInt32LE(png.length, at + 8);
  dir.writeUInt32LE(offset, at + 12);
  offset += png.length;
});

writeFileSync(ICO_OUT, Buffer.concat([dir, ...pngs]));
console.log(`wrote app/favicon.ico (${ICO_SIZES.join(", ")}) and app/icon.png (512)`);
