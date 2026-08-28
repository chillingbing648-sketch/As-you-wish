// Font catalog for AS YOU WISH Font Studio.
// Metadata only — no network calls. Fonts are lazy-loaded on first use.

export type FontCategory =
  | 'Sans' | 'Serif' | 'Editorial' | 'Handwritten' | 'Script' | 'Display'
  | 'Mono' | 'Retro' | 'Elegant' | 'Cute' | 'Academic' | 'Decorative';

export interface FontEntry {
  name: string;
  cssFamily: string;
  slug: string;
  category: FontCategory;
  weights: number[];
}

export const FONT_CATEGORIES: FontCategory[] = [
  'Sans', 'Serif', 'Editorial', 'Handwritten', 'Script', 'Display',
  'Mono', 'Retro', 'Elegant', 'Cute', 'Academic', 'Decorative',
];

export const FONT_CATALOG: FontEntry[] = [
  // Elegant
  { name: 'Cinzel',             cssFamily: "'Cinzel', serif",                slug: 'Cinzel:wght@400;600;700',                   category: 'Elegant',     weights: [400, 600, 700] },
  { name: 'Italianno',          cssFamily: "'Italianno', cursive",           slug: 'Italianno',                                 category: 'Elegant',     weights: [400] },
  { name: 'Marcellus',          cssFamily: "'Marcellus', serif",             slug: 'Marcellus',                                 category: 'Elegant',     weights: [400] },
  { name: 'Montserrat',         cssFamily: "'Montserrat', sans-serif",       slug: 'Montserrat:wght@300;400;600;700',          category: 'Elegant',     weights: [300, 400, 600, 700] },
  { name: 'Cormorant Upright',  cssFamily: "'Cormorant Upright', serif",     slug: 'Cormorant+Upright:wght@400;600;700',        category: 'Elegant',     weights: [400, 600, 700] },

  { name: 'Caveat',             cssFamily: "'Caveat', cursive",              slug: 'Caveat:wght@500;600',                       category: 'Handwritten', weights: [500, 600] },
  { name: 'Kalam',              cssFamily: "'Kalam', cursive",               slug: 'Kalam:wght@300;400;700',                    category: 'Handwritten', weights: [300, 400, 700] },
  { name: 'Indie Flower',       cssFamily: "'Indie Flower', cursive",        slug: 'Indie+Flower',                              category: 'Handwritten', weights: [400] },
  { name: 'Shadows Into Light', cssFamily: "'Shadows Into Light', cursive",  slug: 'Shadows+Into+Light',                        category: 'Handwritten', weights: [400] },
  { name: 'Patrick Hand',       cssFamily: "'Patrick Hand', cursive",        slug: 'Patrick+Hand',                              category: 'Handwritten', weights: [400] },
  { name: 'Reenie Beanie',      cssFamily: "'Reenie Beanie', cursive",       slug: 'Reenie+Beanie',                             category: 'Handwritten', weights: [400] },
  { name: 'Just Another Hand',  cssFamily: "'Just Another Hand', cursive",   slug: 'Just+Another+Hand',                         category: 'Handwritten', weights: [400] },
  { name: 'Rock Salt',          cssFamily: "'Rock Salt', cursive",           slug: 'Rock+Salt',                                 category: 'Handwritten', weights: [400] },
  { name: 'Dancing Script',     cssFamily: "'Dancing Script', cursive",      slug: 'Dancing+Script:wght@400;700',               category: 'Script',      weights: [400, 700] },
  { name: 'Great Vibes',        cssFamily: "'Great Vibes', cursive",         slug: 'Great+Vibes',                               category: 'Script',      weights: [400] },
  { name: 'Pacifico',           cssFamily: "'Pacifico', cursive",            slug: 'Pacifico',                                  category: 'Script',      weights: [400] },
  { name: 'Satisfy',            cssFamily: "'Satisfy', cursive",             slug: 'Satisfy',                                   category: 'Script',      weights: [400] },
  { name: 'Pinyon Script',      cssFamily: "'Pinyon Script', cursive",       slug: 'Pinyon+Script',                             category: 'Script',      weights: [400] },
  { name: 'Alex Brush',         cssFamily: "'Alex Brush', cursive",          slug: 'Alex+Brush',                                category: 'Script',      weights: [400] },
  { name: 'Fraunces',           cssFamily: "'Fraunces', serif",              slug: 'Fraunces:opsz,wght@9..144,400;9..144,600',  category: 'Serif',       weights: [400, 600] },
  { name: 'Playfair Display',   cssFamily: "'Playfair Display', serif",      slug: 'Playfair+Display:wght@400;600;700',         category: 'Serif',       weights: [400, 600, 700] },
  { name: 'Lora',               cssFamily: "'Lora', serif",                  slug: 'Lora:wght@400;500;600;700',                 category: 'Serif',       weights: [400, 500, 600, 700] },
  { name: 'Cormorant Garamond', cssFamily: "'Cormorant Garamond', serif",    slug: 'Cormorant+Garamond:wght@300;400;500;600',   category: 'Serif',       weights: [300, 400, 500, 600] },
  { name: 'Libre Baskerville',  cssFamily: "'Libre Baskerville', serif",     slug: 'Libre+Baskerville:wght@400;700',            category: 'Serif',       weights: [400, 700] },
  { name: 'Cardo',              cssFamily: "'Cardo', serif",                 slug: 'Cardo:wght@400;700',                        category: 'Serif',       weights: [400, 700] },
  { name: 'DM Sans',            cssFamily: "'DM Sans', sans-serif",          slug: 'DM+Sans:wght@400;500;600;700',              category: 'Sans',        weights: [400, 500, 600, 700] },
  { name: 'Inter',              cssFamily: "'Inter', sans-serif",            slug: 'Inter:wght@400;500;600;700',                category: 'Sans',        weights: [400, 500, 600, 700] },
  { name: 'Outfit',             cssFamily: "'Outfit', sans-serif",           slug: 'Outfit:wght@300;400;500;600;700',           category: 'Sans',        weights: [300, 400, 500, 600, 700] },
  { name: 'Plus Jakarta Sans',  cssFamily: "'Plus Jakarta Sans', sans-serif", slug: 'Plus+Jakarta+Sans:wght@400;500;600;700',   category: 'Sans',        weights: [400, 500, 600, 700] },
  { name: 'Nunito',             cssFamily: "'Nunito', sans-serif",           slug: 'Nunito:wght@300;400;500;600;700',           category: 'Sans',        weights: [300, 400, 500, 600, 700] },
  { name: 'Quicksand',          cssFamily: "'Quicksand', sans-serif",        slug: 'Quicksand:wght@400;500;600;700',            category: 'Sans',        weights: [400, 500, 600, 700] },
  { name: 'Poppins',            cssFamily: "'Poppins', sans-serif",          slug: 'Poppins:wght@300;400;500;600;700',          category: 'Sans',        weights: [300, 400, 500, 600, 700] },
  { name: 'Abril Fatface',      cssFamily: "'Abril Fatface', display",       slug: 'Abril+Fatface',                             category: 'Display',     weights: [400] },
  { name: 'Bebas Neue',         cssFamily: "'Bebas Neue', display",          slug: 'Bebas+Neue',                                category: 'Display',     weights: [400] },
  { name: 'Oswald',             cssFamily: "'Oswald', display",              slug: 'Oswald:wght@400;500;600;700',               category: 'Display',     weights: [400, 500, 600, 700] },
  { name: 'Anton',              cssFamily: "'Anton', display",               slug: 'Anton',                                     category: 'Display',     weights: [400] },
  { name: 'Righteous',          cssFamily: "'Righteous', display",           slug: 'Righteous',                                 category: 'Display',     weights: [400] },
  { name: 'Merriweather',       cssFamily: "'Merriweather', serif",          slug: 'Merriweather:wght@300;400;700',             category: 'Editorial',   weights: [300, 400, 700] },
  { name: 'Source Serif 4',     cssFamily: "'Source Serif 4', serif",        slug: 'Source+Serif+4:wght@300;400;600;700',       category: 'Editorial',   weights: [300, 400, 600, 700] },
  { name: 'Crimson Text',       cssFamily: "'Crimson Text', serif",          slug: 'Crimson+Text:wght@400;600;700',             category: 'Editorial',   weights: [400, 600, 700] },
  { name: 'Spectral',           cssFamily: "'Spectral', serif",              slug: 'Spectral:wght@300;400;500;600;700',         category: 'Editorial',   weights: [300, 400, 500, 600, 700] },
  { name: 'JetBrains Mono',     cssFamily: "'JetBrains Mono', monospace",    slug: 'JetBrains+Mono:wght@400;500;700',           category: 'Mono',        weights: [400, 500, 700] },
  { name: 'Fira Code',          cssFamily: "'Fira Code', monospace",         slug: 'Fira+Code:wght@400;500;700',                category: 'Mono',        weights: [400, 500, 700] },
  { name: 'Space Mono',         cssFamily: "'Space Mono', monospace",        slug: 'Space+Mono:wght@400;700',                   category: 'Mono',        weights: [400, 700] },
  { name: 'Courier Prime',      cssFamily: "'Courier Prime', monospace",     slug: 'Courier+Prime:wght@400;700',                category: 'Mono',        weights: [400, 700] },
  { name: 'Alfa Slab One',      cssFamily: "'Alfa Slab One', display",       slug: 'Alfa+Slab+One',                             category: 'Retro',       weights: [400] },
  { name: 'Teko',               cssFamily: "'Teko', sans-serif",             slug: 'Teko:wght@400;500;600;700',                 category: 'Retro',       weights: [400, 500, 600, 700] },
  { name: 'Michroma',           cssFamily: "'Michroma', sans-serif",         slug: 'Michroma',                                  category: 'Retro',       weights: [400] },
  { name: 'Orbitron',           cssFamily: "'Orbitron', sans-serif",         slug: 'Orbitron:wght@400;500;600;700',             category: 'Retro',       weights: [400, 500, 600, 700] },
  { name: 'Black Han Sans',     cssFamily: "'Black Han Sans', sans-serif",   slug: 'Black+Han+Sans',                            category: 'Retro',       weights: [400] },
  { name: 'Boogaloo',           cssFamily: "'Boogaloo', display",            slug: 'Boogaloo',                                  category: 'Decorative',  weights: [400] },
  { name: 'Luckiest Guy',       cssFamily: "'Luckiest Guy', display",        slug: 'Luckiest+Guy',                              category: 'Decorative',  weights: [400] },
  { name: 'Fredoka One',        cssFamily: "'Fredoka One', display",         slug: 'Fredoka+One',                               category: 'Decorative',  weights: [400] },
  { name: 'Lilita One',         cssFamily: "'Lilita One', display",          slug: 'Lilita+One',                                category: 'Decorative',  weights: [400] },
  { name: 'Titan One',          cssFamily: "'Titan One', display",           slug: 'Titan+One',                                 category: 'Decorative',  weights: [400] },
  { name: 'Baloo 2',            cssFamily: "'Baloo 2', display",             slug: 'Baloo+2:wght@400;500;600;700',              category: 'Cute',        weights: [400, 500, 600, 700] },
  { name: 'Comic Neue',         cssFamily: "'Comic Neue', cursive",          slug: 'Comic+Neue:wght@400;700',                   category: 'Cute',        weights: [400, 700] },
  { name: 'Chewy',              cssFamily: "'Chewy', display",               slug: 'Chewy',                                     category: 'Cute',        weights: [400] },
  { name: 'Sniglet',            cssFamily: "'Sniglet', display",             slug: 'Sniglet:wght@400;800',                      category: 'Cute',        weights: [400, 800] },
  { name: 'Bubblegum Sans',     cssFamily: "'Bubblegum Sans', display",      slug: 'Bubblegum+Sans',                            category: 'Cute',        weights: [400] },
  { name: 'EB Garamond',        cssFamily: "'EB Garamond', serif",           slug: 'EB+Garamond:wght@400;500;600;700',          category: 'Academic',    weights: [400, 500, 600, 700] },
  { name: 'Amiri',              cssFamily: "'Amiri', serif",                 slug: 'Amiri:wght@400;700',                        category: 'Academic',    weights: [400, 700] },
  { name: 'GFS Didot',          cssFamily: "'GFS Didot', serif",             slug: 'GFS+Didot',                                 category: 'Academic',    weights: [400] },
  { name: 'Vollkorn',           cssFamily: "'Vollkorn', serif",              slug: 'Vollkorn:wght@400;500;600;700',             category: 'Academic',    weights: [400, 500, 600, 700] },
];

export const PRELOADED_FONTS = new Set(['Caveat', 'DM Sans', 'Fraunces']);

export function getFontByCssFamily(cssFamily: string): FontEntry | undefined {
  return FONT_CATALOG.find((f) => f.cssFamily === cssFamily);
}
