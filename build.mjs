// Builds the profile's images from tokens.json: the banner (dark and light)
// and the app icons. Run: node build.mjs <path to the omuk.dev repo>
//
// Every colour, font and size comes from tokens.json. The check at the end
// fails when this file or the README holds a colour or a size of its own.

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = process.argv[2];
if (!site) throw new Error('Give the path to the omuk.dev repo.');

const T = JSON.parse(readFileSync(join(here, 'tokens.json'), 'utf8'));
const out = join(here, 'profile', 'assets');
mkdirSync(join(out, 'icons'), { recursive: true });

/** The Omuk mark (22 × 22): an octagon with an octagon cut from its middle. */
const MARK =
  'M7 2h8l5 5v8l-5 5H7l-5-5V7zm2 5L7 9v4l2 2h4l2-2V9l-2-2z';

/**
 * The banner. [frame] gives a taller canvas (the social preview): the content
 * moves down by its shift, and the large faint word moves further down.
 */
function banner(theme, frame = { height: T.banner.height, shift: 0, ghostDrop: 0 }) {
  const c = T.color[theme];
  const b = T.banner;
  const markY = b.markTop;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${b.width}" height="${frame.height}" viewBox="0 0 ${b.width} ${frame.height}" role="img" aria-label="Omuk: free, private apps for Mac and Android">
  <rect width="${b.width}" height="${frame.height}" fill="${c.canvas}"/>
  <g transform="translate(0 ${frame.shift})">
  <text x="${b.width - b.ghostRight - b.ghostWidth}" y="${b.ghostBaseline + frame.ghostDrop}" textLength="${b.ghostWidth}" lengthAdjust="spacingAndGlyphs" font-family="${T.font.sans}" font-size="${b.ghostSize}" font-weight="${b.ghostWeight}" fill="${c.ghost}">omuk</text>
  <path transform="translate(${b.gutter} ${markY}) scale(${b.markScale})" d="${MARK}" fill="${c.fg}" fill-rule="evenodd"/>
  <text x="${b.gutter}" y="${b.wordmarkBaseline}" font-family="${T.font.sans}" font-size="${b.wordmarkSize}" font-weight="${b.wordmarkWeight}" letter-spacing="${b.wordmarkTracking}" fill="${c.fg}">omuk</text>
  <text x="${b.gutter}" y="${b.taglineBaseline}" font-family="${T.font.sans}" font-size="${b.taglineSize}" fill="${c.body}">Free, private apps for Mac and Android.</text>
  <circle cx="${b.gutter + b.dotRadius}" cy="${b.metaBaseline - b.metaSize / 3}" r="${b.dotRadius}" fill="${c.available}"/>
  <text x="${b.gutter + b.dotRadius * 4}" y="${b.metaBaseline}" font-family="${T.font.mono}" font-size="${b.metaSize}" letter-spacing="${b.metaTracking}" fill="${c.muted}">NO ADS · NO ACCOUNT · NO ANALYTICS</text>
  </g>
</svg>
`;
}

/** Lucide glyphs (24 × 24 grid) for the apps that have no icon file yet. */
const GLYPHS = {
  airshot: [
    'M3 7V5a2 2 0 0 1 2-2h2',
    'M17 3h2a2 2 0 0 1 2 2v2',
    'M21 17v2a2 2 0 0 1-2 2h-2',
    'M7 21H5a2 2 0 0 1-2-2v-2',
  ],
  klipboard: [
    'M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z',
    'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
  ],
  postvault: [
    'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z',
    'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12',
    'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17',
  ],
};

function glyphIcon(slug) {
  const { tile, ink } = T.app[slug];
  const s = T.icon.size;
  const r = Math.round(s * T.icon.radiusRatio);
  const g = s * T.icon.glyphRatio;
  const scale = g / 24;
  const offset = (s - g) / 2;
  const paths = GLYPHS[slug].map((d) => `<path d="${d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${r}" fill="${tile}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${ink}" stroke-width="${T.icon.glyphStroke}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
</svg>
`;
}

for (const theme of ['dark', 'light']) {
  writeFileSync(join(out, `banner-${theme}.svg`), banner(theme));
}
// The social preview (GitHub: Settings → Social preview). Render it to PNG to upload.
writeFileSync(join(here, 'social-preview.svg'), banner('dark', T.social));
for (const slug of Object.keys(GLYPHS)) {
  writeFileSync(join(out, 'icons', `${slug}.svg`), glyphIcon(slug));
}
const apps = join(site, 'public', 'apps');
copyFileSync(join(apps, 'flume', 'icon.png'), join(out, 'icons', 'flume.png'));
copyFileSync(join(apps, 'airbridge', 'icon.png'), join(out, 'icons', 'airbridge.png'));
copyFileSync(join(apps, 'gallery', 'icon.svg'), join(out, 'icons', 'gallery.svg'));

// The README, from its template, with the image addresses and sizes filled in.
const readme = readFileSync(join(here, 'README.template.md'), 'utf8').replace(
  /{{(\w+)}}/g,
  (_, key) => String(T.readme[key]),
);
writeFileSync(join(here, 'profile', 'README.md'), readme);

// The check: no colour or size written outside tokens.json.
const LITERAL = /#[0-9a-fA-F]{3,8}\b|rgba?\(|style="|font-size="\d|(width|height)="\d+"/;
for (const file of ['build.mjs', 'README.template.md']) {
  const lines = readFileSync(join(here, file), 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes('const LITERAL')) return;
    if (LITERAL.test(line)) {
      throw new Error(`${file}:${i + 1} has a literal value; put it in tokens.json.`);
    }
  });
}
console.log('Built the banner and icons. No literal values found.');
