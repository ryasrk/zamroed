import { describe, expect, it } from 'vitest';

import sitemap from './sitemap';
import robots from './robots';
import manifest from './manifest';

/**
 * SEO surfaces must be true, not merely present. A sitemap that advertises a
 * route which 404s wastes crawl budget and reports broken pages, so these tests
 * assert the invariants that keep the ZAMROED sitemap honest.
 */

/** Every route the ZAMROED app actually serves (static + prerendered articles). */
const REAL_ROUTES = new Set([
  '/',
  '/sejarah',
  '/program',
  '/volunteer',
  '/liputan-aksi',
]);

const BASE = 'https://zamroed.id';

describe('sitemap', () => {
  const entries = sitemap();

  it('lists every real route of this app', () => {
    const paths = entries.map((e) => e.url.replace(BASE, ''));
    for (const route of REAL_ROUTES) {
      expect(paths).toContain(route);
    }
  });

  it('does not leak the sibling brand\u2019s routes', () => {
    // Jagatirta river monitoring lives on jagatirta.id. Advertising /lokasi/*
    // here would send crawlers to seven 404s.
    for (const entry of entries) {
      expect(entry.url).not.toContain('/lokasi');
    }
  });

  it('only advertises URLs this app serves, or an article detail page', () => {
    for (const entry of entries) {
      const path = entry.url.replace(BASE, '');
      const isRealRoute = REAL_ROUTES.has(path);
      const isArticleDetail = /^\/liputan-aksi\/[a-z0-9-]+$/.test(path);
      expect(isRealRoute || isArticleDetail).toBe(true);
    }
  });

  it('builds absolute URLs on the ZAMROED domain', () => {
    for (const entry of entries) {
      expect(entry.url.startsWith(BASE + '/')).toBe(true);
    }
  });

  it('gives every entry a lastModified date, a change frequency and a priority', () => {
    for (const entry of entries) {
      expect(entry.lastModified).toBeInstanceOf(Date);
      expect(entry.changeFrequency).toBeTruthy();
      expect(typeof entry.priority).toBe('number');
      expect(entry.priority).toBeGreaterThan(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    }
  });

  it('ranks the home page highest', () => {
    const home = entries.find((e) => e.url === BASE + '/');
    expect(home?.priority).toBe(1);
  });

  it('has no duplicate URLs', () => {
    const urls = entries.map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('includes a detail entry for every published article', () => {
    const details = entries.filter((e) => /^\/liputan-aksi\/.+/.test(e.url.replace(BASE, '')));
    expect(details.length).toBeGreaterThanOrEqual(6);
  });
});

describe('robots', () => {
  const r = robots();

  it('allows crawling of the public site', () => {
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    expect(rules[0]!.userAgent).toBe('*');
    expect(rules[0]!.allow).toBe('/');
  });

  it('keeps private surfaces out of the index', () => {
    const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
    const disallow = ([] as string[]).concat(rules[0]!.disallow ?? []);
    expect(disallow).toContain('/api/');
    expect(disallow).toContain('/admin/');
  });

  it('points crawlers at the absolute sitemap URL', () => {
    expect(r.sitemap).toBe(BASE + '/sitemap.xml');
  });
});

describe('manifest', () => {
  const m = manifest();

  it('identifies the app with an Indonesian locale and a short name', () => {
    expect(m.name).toBe('ZAMROED Bergerak');
    expect(m.short_name).toBe('ZAMROED');
    expect(m.lang).toBe('id');
  });

  it('is installable: standalone display with a start URL', () => {
    expect(m.display).toBe('standalone');
    expect(m.start_url).toBe('/');
  });

  it('uses the ZAMROED brand colours', () => {
    expect(m.theme_color).toBe('#047857');
    expect(m.background_color).toBe('#F8FAFC');
  });

  it('ships the icon sizes required for install prompts', () => {
    const icons = m.icons ?? [];
    const sizes = icons.map((i) => i.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    for (const icon of icons) {
      expect(icon.src).toMatch(/^\/icons\/.+\.png$/);
      expect(icon.type).toBe('image/png');
    }
  });

  it('describes the movement in Indonesian', () => {
    expect(m.description).toMatch(/kedaulatan ekologi|solidaritas/i);
  });
});
