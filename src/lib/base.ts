/** Prefix site-root paths with Astro `base` (needed for GitHub Pages project sites). */
export function withBase(path: string): string {
	if (!path || path === '#') return path;
	if (/^(https?:|mailto:|tel:)/i.test(path)) return path;
	if (path.startsWith('#') && !path.startsWith('/#')) return path;

	const base = import.meta.env.BASE_URL;
	if (path === '/') return base;
	if (path.startsWith('/')) return `${base}${path.slice(1)}`;
	return `${base}${path}`;
}
