/**
 * fix-contrast-ratios.ts
 *
 * Recalculates all contrast ratios in color-palettes.json using
 * the exact WCAG 2.1 formula and updates the file with correct values.
 *
 * Usage: npx tsx scripts/fix-contrast-ratios.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// WCAG 2.1 contrast calculation - exact implementation
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

function sRGBtoLinear(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.03928
    ? srgb / 12.92
    : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const R = sRGBtoLinear(r);
  const G = sRGBtoLinear(g);
  const B = sRGBtoLinear(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function contrastRatio(hex1: string, hex2: string): number {
  const L1 = relativeLuminance(hex1);
  const L2 = relativeLuminance(hex2);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getWcagRating(ratio: number, isLargeText: boolean = false): string {
  if (isLargeText) {
    if (ratio >= 4.5) return 'AAA';
    if (ratio >= 3.0) return 'AA';
    return 'Fail';
  } else {
    if (ratio >= 7.0) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3.0) return 'AA-Large';
    return 'Fail';
  }
}

function roundToOneDecimal(n: number): number {
  return Math.round(n * 10) / 10;
}

async function main() {
  const palettesPath = path.join(__dirname, '../design-catalog/color-palettes.json');
  const data = JSON.parse(fs.readFileSync(palettesPath, 'utf-8'));

  let fixCount = 0;

  // Fix each palette
  for (const palette of data.palettes) {
    // Fix individual color wcag ratings
    for (const color of palette.colors) {
      if (color.wcag) {
        const onWhite = roundToOneDecimal(contrastRatio(color.hex, '#ffffff'));
        const onBlack = roundToOneDecimal(contrastRatio(color.hex, '#000000'));

        if (color.wcag.onWhite !== onWhite) {
          console.log(`  Fixed ${palette.id}/${color.name}: onWhite ${color.wcag.onWhite} → ${onWhite}`);
          color.wcag.onWhite = onWhite;
          fixCount++;
        }
        if (color.wcag.onBlack !== onBlack) {
          console.log(`  Fixed ${palette.id}/${color.name}: onBlack ${color.wcag.onBlack} → ${onBlack}`);
          color.wcag.onBlack = onBlack;
          fixCount++;
        }

        // Update ratings
        color.wcag.ratingOnWhite = getWcagRating(onWhite);
        color.wcag.ratingOnBlack = getWcagRating(onBlack);
      }
    }

    // Fix combinations
    if (palette.combinations) {
      for (const combo of palette.combinations) {
        const ratio = roundToOneDecimal(contrastRatio(combo.foreground, combo.background));
        const rating = getWcagRating(ratio);

        if (combo.contrastRatio !== ratio) {
          console.log(`  Fixed ${palette.id} combo ${combo.foreground}/${combo.background}: ${combo.contrastRatio} → ${ratio}`);
          combo.contrastRatio = ratio;
          fixCount++;
        }

        if (combo.rating !== rating) {
          console.log(`  Fixed ${palette.id} combo rating: ${combo.rating} → ${rating}`);
          combo.rating = rating;
          fixCount++;
        }
      }
    }
  }

  // Write back
  fs.writeFileSync(palettesPath, JSON.stringify(data, null, 2) + '\n');

  console.log(`\n✅ Fixed ${fixCount} contrast values`);
}

main().catch(console.error);
