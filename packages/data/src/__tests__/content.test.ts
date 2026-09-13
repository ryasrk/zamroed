import { describe, expect, it } from 'vitest';

import { getArticleBySlug, articles } from '../articles';
import { milestones } from '../milestones';
import { zamroedPrograms } from '../programs';

/**
 * These suites guard the mock content layer that every page imports.
 * They assert both the lookup API and the data INTEGRITY that pages rely on:
 * a broken slug, a duplicated id, or an out-of-range telemetry value would
 * otherwise surface as a silently broken page rather than a failing test.
 */

const RIVER_SLUGS = [
  'cisadane',
  'citarum',
  'brantas',
  'bengawan-solo',
  'mahakam',
  'barito',
  'musi',
] as const;







describe('articles — kontrak data', () => {
  it('ships a non-trivial corpus', () => {
    expect(articles.length).toBeGreaterThanOrEqual(6);
  });

  it('gives every article a unique id and slug', () => {
    expect(new Set(articles.map((a) => a.id)).size).toBe(articles.length);
    expect(new Set(articles.map((a) => a.slug)).size).toBe(articles.length);
  });

  it('provides a slug that is URL-safe', () => {
    for (const article of articles) {
      expect(article.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('provides every field the article page and cards render', () => {
    for (const article of articles) {
      expect(article.title.length).toBeGreaterThan(10);
      expect(article.excerpt.length).toBeGreaterThan(30);
      expect(article.body.length).toBeGreaterThanOrEqual(3);
      expect(article.author).toBeTruthy();
      expect(article.category).toBeTruthy();
      expect(article.coverImage).toMatch(/^\/images\/.+\.jpg$/);
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.tags.length).toBeGreaterThan(0);
      expect(article.readMinutes).toBeGreaterThan(0);
      expect(article.totalViews).toBeGreaterThanOrEqual(0);
    }
  });

  it('does not leave an empty paragraph in any body', () => {
    // The article page renders body verbatim; a blank paragraph would show a gap.
    for (const article of articles) {
      for (const paragraph of article.body) {
        expect(paragraph.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it('sorts publishedAt as a real ISO date', () => {
    for (const article of articles) {
      expect(Number.isNaN(Date.parse(article.publishedAt))).toBe(false);
    }
  });

  it('carries a valid video URL when one is attached', () => {
    for (const article of articles) {
      if (article.videoUrl !== undefined) {
        expect(article.videoUrl).toMatch(/^https?:\/\//);
      }
    }
  });

  it('covers more than one category so the news filter has something to filter', () => {
    expect(new Set(articles.map((a) => a.category)).size).toBeGreaterThan(1);
  });
});

describe('getArticleBySlug', () => {
  it('returns the matching article for every slug', () => {
    for (const article of articles) {
      expect(getArticleBySlug(article.slug)?.id).toBe(article.id);
    }
  });

  it('returns undefined for an unknown slug', () => {
    expect(getArticleBySlug('nope')).toBeUndefined();
    expect(getArticleBySlug('')).toBeUndefined();
  });
});

describe('milestones — kontrak data', () => {
  it('tells the movement story in order', () => {
    expect(milestones.length).toBeGreaterThanOrEqual(5);
    const years = milestones.map((m) => Number(m.year));
    for (const year of years) {
      expect(Number.isFinite(year)).toBe(true);
    }
    expect([...years].sort((a, b) => a - b)).toEqual(years);
  });

  it('gives every milestone a unique id and non-empty narrative', () => {
    expect(new Set(milestones.map((m) => m.id)).size).toBe(milestones.length);
    for (const milestone of milestones) {
      expect(milestone.title).toBeTruthy();
      expect(milestone.phase).toBeTruthy();
      expect(milestone.narrative.length).toBeGreaterThan(40);
    }
  });

  it('references only images that the app ships', () => {
    for (const milestone of milestones) {
      if (milestone.image !== undefined) {
        expect(milestone.image).toMatch(/^\/images\/[\w-]+\.jpg$/);
      }
    }
  });

  it('uses a small set of named phases so the timeline can badge them', () => {
    const phases = new Set(milestones.map((m) => m.phase));
    expect(phases.size).toBeGreaterThan(0);
    expect(phases.size).toBeLessThanOrEqual(5);
  });
});

describe('programs — kontrak data', () => {
  it('lists four pillars for each organisation', () => {
    expect(jagatirtaPrograms).toHaveLength(4);
    expect(zamroedPrograms).toHaveLength(4);
  });

  it('gives every programme a unique id, slug, icon and description', () => {
    for (const list of [jagatirtaPrograms, zamroedPrograms]) {
      expect(new Set(list.map((p) => p.id)).size).toBe(list.length);
      expect(new Set(list.map((p) => p.slug)).size).toBe(list.length);
      for (const program of list) {
        expect(program.title).toBeTruthy();
        expect(program.description.length).toBeGreaterThan(40);
        expect(program.icon).toMatch(/^[A-Z][A-Za-z0-9]*$/); // lucide names may carry a digit, e.g. Trash2
      }
    }
  });

  it('uses distinct slugs across the two organisations', () => {
    // Both sets render on their own site, but distinct slugs keep future
    // cross-linking unambiguous.
    const all = [...jagatirtaPrograms, ...zamroedPrograms].map((p) => p.slug);
    expect(new Set(all).size).toBe(all.length);
  });
});

describe('campaigns — kontrak data', () => {
  it('ships at least one fundraising and one petition campaign', () => {
    expect(campaigns.length).toBeGreaterThanOrEqual(2);
    expect(campaigns.some((c) => c.type === 'dana')).toBe(true);
    expect(campaigns.some((c) => c.type === 'petisi')).toBe(true);
  });

  it('keeps progress within the target', () => {
    for (const campaign of campaigns) {
      expect(campaign.target).toBeGreaterThan(0);
      expect(campaign.raised).toBeGreaterThanOrEqual(0);
      expect(campaign.raised).toBeLessThanOrEqual(campaign.target);
    }
  });

  it('gives every campaign a unique id and slug plus a description', () => {
    expect(new Set(campaigns.map((c) => c.id)).size).toBe(campaigns.length);
    expect(new Set(campaigns.map((c) => c.slug)).size).toBe(campaigns.length);
    for (const campaign of campaigns) {
      expect(campaign.title).toBeTruthy();
      expect(campaign.description.length).toBeGreaterThan(20);
    }
  });

  it('scales fundraising targets in rupiah, not raw counts', () => {
    for (const campaign of campaigns.filter((c) => c.type === 'dana')) {
      expect(campaign.target).toBeGreaterThan(1_000_000);
    }
  });
});
