#!/usr/bin/env node
/**
 * Membuat `.next` milik root repo terlihat dari setiap paket bersama.
 *
 * Konteks: bila "Root Directory" di Vercel diarahkan ke sebuah paket
 * (mis. `packages/ui`), build tetap berhasil karena script paket meneruskan ke
 * root repo lewat `pnpm -w`. Namun Vercel lalu mencari hasil build di
 * `<Root Directory>/.next`, yaitu `packages/ui/.next` — padahal Next.js
 * menulisnya di `<root repo>/.next`. Deploy gagal dengan:
 *
 *   The Next.js output directory ".next" was not found at
 *   "/vercel/path0/packages/ui/.next"
 *
 * Solusinya: buat symlink di tiap paket yang menunjuk ke `.next` root repo,
 * sehingga Vercel menemukan hasil build tak peduli folder mana yang dijadikan
 * Root Directory.
 *
 * Script ini dijalankan otomatis lewat `postbuild` setelah tiap build.
 */
import { existsSync, lstatSync, symlinkSync, rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagesDir = path.join(root, 'packages');
const nextDir = path.join(root, '.next');

if (!existsSync(nextDir)) {
  // Build belum menghasilkan .next; tidak ada yang perlu ditautkan.
  process.exit(0);
}

if (!existsSync(packagesDir)) {
  process.exit(0);
}

const { readdirSync } = await import('node:fs');
const paket = readdirSync(packagesDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

let dibuat = 0;

for (const nama of paket) {
  const tautan = path.join(packagesDir, nama, '.next');
  const kedalaman = path.relative(path.join(packagesDir, nama), root) || '.';
  const target = path.join(kedalaman, '.next');

  try {
    // Buang tautan lama agar target selalu benar.
    if (existsSync(tautan) || lstatSync(tautan, { throwIfNoEntry: false })) {
      rmSync(tautan, { recursive: true, force: true });
    }
    // Symlink relatif: tetap benar walau repo dipindah ke /vercel/path0.
    symlinkSync(target, tautan, 'dir');
    dibuat += 1;
  } catch (err) {
    console.warn('  ! gagal menautkan packages/' + nama + '/.next: ' + err.message);
  }
}

if (dibuat > 0) {
  console.log('✓ .next root repo ditautkan ke ' + dibuat + ' paket:');
  console.log('  ' + paket.join(', '));
}
