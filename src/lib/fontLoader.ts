// Lazy-loads a single Google Font family by injecting a <link> tag.
// Safe to call multiple times — deduplicates by slug.

const loaded = new Set<string>();
const pending = new Map<string, Promise<void>>();

export function loadFont(slug: string): Promise<void> {
  if (!slug) return Promise.resolve();
  if (loaded.has(slug)) return Promise.resolve();
  if (pending.has(slug)) return pending.get(slug)!;

  const p = new Promise<void>((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${slug}&display=swap`;
    link.onload = () => {
      loaded.add(slug);
      pending.delete(slug);
      resolve();
    };
    link.onerror = () => {
      pending.delete(slug);
      resolve(); // Resolve anyway — don't break the UI on network failure
    };
    document.head.appendChild(link);
  });

  pending.set(slug, p);
  return p;
}

export function isFontLoaded(slug: string): boolean {
  return !slug || loaded.has(slug);
}
