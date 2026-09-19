import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const OUT = new URL("../assets/images/", import.meta.url).pathname;

const INK = "#0B0F14";
const INK_DEEP = "#070A0E";
const EMERALD_LIGHT = "#6EE7B7";
const EMERALD = "#10B981";
const EMERALD_DEEP = "#047857";
const CHEVRON_LIGHT = ["#F4F7FA", "#93A1AE"];
const CHEVRON_DARK = ["#18202A", "#4A5966"];

const LEFT_CHEVRON = "M338 360 L196 512 L338 664";
const RIGHT_CHEVRON = "M686 360 L828 512 L686 664";
const SLASH = "M584 292 L440 732";

function defs({ chevron }) {
  return `
    <linearGradient id="slash" x1="584" y1="292" x2="440" y2="732" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${EMERALD_LIGHT}"/>
      <stop offset="0.55" stop-color="${EMERALD}"/>
      <stop offset="1" stop-color="${EMERALD_DEEP}"/>
    </linearGradient>
    <linearGradient id="chevron" x1="0" y1="360" x2="0" y2="664" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${chevron[0]}"/>
      <stop offset="1" stop-color="${chevron[1]}"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>`;
}

function mark({ scale, chevron = CHEVRON_LIGHT, glow = true }) {
  const offset = 512 * (1 - scale);
  return `
    <g transform="translate(${offset} ${offset}) scale(${scale})">
      ${glow ? `<path d="${SLASH}" stroke="${EMERALD}" stroke-width="96" stroke-linecap="round" opacity="0.55" filter="url(#glow)"/>` : ""}
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="${LEFT_CHEVRON}" stroke="url(#chevron)" stroke-width="68"/>
        <path d="${RIGHT_CHEVRON}" stroke="url(#chevron)" stroke-width="68"/>
        <path d="${SLASH}" stroke="url(#slash)" stroke-width="76"/>
      </g>
    </g>`;
}

function silhouette({ scale }) {
  const offset = 512 * (1 - scale);
  return `
    <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="#FFFFFF" stroke-linecap="round" stroke-linejoin="round">
      <path d="${LEFT_CHEVRON}" stroke-width="80"/>
      <path d="${RIGHT_CHEVRON}" stroke-width="80"/>
      <path d="${SLASH}" stroke-width="88"/>
    </g>`;
}

function background() {
  return `
    <radialGradient id="aura" cx="512" cy="470" r="560" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${EMERALD}" stop-opacity="0.30"/>
      <stop offset="0.45" stop-color="${EMERALD_DEEP}" stop-opacity="0.10"/>
      <stop offset="1" stop-color="${INK}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="base" x1="0" y1="0" x2="0" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#121820"/>
      <stop offset="1" stop-color="${INK_DEEP}"/>
    </linearGradient>`;
}

const BACKGROUND_LAYERS = `
  <rect width="1024" height="1024" fill="url(#base)"/>
  <rect width="1024" height="1024" fill="url(#aura)"/>`;

function svg(content, extraDefs = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024"><defs>${extraDefs}</defs>${content}</svg>`;
}

const assets = {
  "icon.png": { size: 1024, svg: svg(BACKGROUND_LAYERS + mark({ scale: 0.86 }), background() + defs({ chevron: CHEVRON_LIGHT })) },
  "favicon.png": { size: 48, svg: svg(BACKGROUND_LAYERS + mark({ scale: 1, glow: false }), background() + defs({ chevron: CHEVRON_LIGHT })) },
  "android-icon-background.png": { size: 1024, svg: svg(BACKGROUND_LAYERS, background()) },
  "android-icon-foreground.png": { size: 1024, svg: svg(mark({ scale: 0.76 }), defs({ chevron: CHEVRON_LIGHT })) },
  "android-icon-monochrome.png": { size: 1024, svg: svg(silhouette({ scale: 0.76 })) },
  "notification-icon.png": { size: 96, svg: svg(silhouette({ scale: 1.26 })) },
  "splash-icon.png": { size: 512, svg: svg(mark({ scale: 1, chevron: CHEVRON_DARK }), defs({ chevron: CHEVRON_DARK })) },
  "splash-icon-dark.png": { size: 512, svg: svg(mark({ scale: 1 }), defs({ chevron: CHEVRON_LIGHT })) },
};

const workdir = mkdtempSync(join(tmpdir(), "devhub-brand-"));
try {
  for (const [name, { size, svg: source }] of Object.entries(assets)) {
    const input = join(workdir, `${name}.svg`);
    writeFileSync(input, source);
    execFileSync("magick", ["-background", "none", "-density", "384", input, "-resize", `${size}x${size}`, "-strip", join(OUT, name)]);
    console.log(`${name} ${size}x${size}`);
  }
} finally {
  rmSync(workdir, { recursive: true, force: true });
}
