#!/usr/bin/env node
/**
 * Memastikan build Vercel berjalan dari root repo yang benar.
 *
 * Bila "Root Directory" di dashboard Vercel diarahkan ke subfolder lain
 * (mis. `packages/ui`), `next build` gagal dengan pesan Next.js yang samar:
 * "Couldn't find any `pages` or `app` directory". Pesan itu tidak menyebut
 * penyebabnya, sehingga sulit ditelusuri dari log Vercel.
 *
 * Script ini dijalankan sebelum `next build` dan mengubah situasi tersebut
 * menjadi pesan yang menyebut penyebab aslinya secara eksplisit.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Dua lokasi diperiksa:
//  - cwd        : dari mana Vercel MENJALANKAN build (Root Directory)
//  - scriptRoot : root repo tempat file ini berada
// Keduanya harus menunjuk folder yang memuat app/.
const scriptRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cwd = process.cwd();

const appInCwd = existsSync(path.join(cwd, 'app'));
const appInScriptRoot = existsSync(path.join(scriptRoot, 'app'));

// Kondisi normal: Vercel menjalankan script dari root repo ini.
if (appInCwd) {
  console.log('✓ Root deploy benar — direktori app/ ditemukan.');
  console.log('  ' + cwd);
  process.exit(0);
}

const line = '='.repeat(66);
console.error('');
console.error(line);
console.error('BUILD GAGAL: root repo ini tidak memuat direktori app/');
console.error(line);
console.error('');
console.error('Build dijalankan dari:');
console.error('  ' + cwd);
console.error('');
console.error('Folder app/ sebenarnya ada di:');
console.error('  ' + scriptRoot + (appInScriptRoot ? '  (benar)' : '  (tidak ada di sana juga)'));
console.error('');

// Deteksi pola khas: root yang salah adalah salah satu paket bersama.
const salah = [
  ['packages/ui', 'paket design system'],
  ['packages/data', 'paket data'],
  ['packages/gis-map', 'paket peta'],
  ['packages/config', 'paket konfigurasi'],
  ['packages/testing', 'paket utilitas tes'],
  ['ui', 'paket design system'],
];

let ketemu = false;
for (const [rel, ket] of salah) {
  if (existsSync(path.join(cwd, rel)) || path.basename(cwd) === path.basename(rel)) {
    console.error('Root Directory di dashboard Vercel kemungkinan diisi');
    console.error('"' + rel + '" (' + ket + '), bukan root repo.');
    ketemu = true;
    break;
  }
}

if (!ketemu) {
  console.error('Root Directory di dashboard Vercel kemungkinan diisi dengan');
  console.error('nama folder yang bukan root repo, atau dikosongkan dengan nilai salah.');
}

console.error('');
console.error('Perbaikan (Vercel → Project → Settings → General):');
console.error('  Root Directory  : kosongkan  (jangan diisi apa pun)');
console.error('  Build Command   : kosongkan  (biarkan memakai script vercel-build)');
console.error('  Install Command : pnpm install --frozen-lockfile');
console.error('');
console.error('Lalu redeploy tanpa build cache:');
console.error('  Deployments → ⋯ → Redeploy → hilangkan centang "Use existing Build Cache"');
console.error(line);
console.error('');

process.exit(1);
