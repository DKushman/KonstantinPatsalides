// Kategorie-Filter für die Projekte-Seite.
// Single-Select, Multi-Kategorie-Match, reflowt das alternierende
// small/large-Muster anhand der sichtbaren Position. Progressive Enhancement:
// ohne JS bleibt die Default-Ansicht („Alle") vollständig sichtbar.

const SIZE_PATTERN = ['small', 'large', 'large', 'small'] as const;
const FADE_MS = 180;

export function initProjectsFilter(): void {
	const root = document.querySelector<HTMLElement>('[data-work-filter]');
	if (!root) return;

	const grid = root.querySelector<HTMLElement>('[data-work-grid]');
	const chips = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-work-chip]'));
	const cards = grid
		? Array.from(grid.querySelectorAll<HTMLElement>('[data-work-card]'))
		: [];

	if (!grid || chips.length === 0 || cards.length === 0) return;

	const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const applyLayout = (active: string): void => {
		let visibleIndex = 0;
		for (const card of cards) {
			const cats = (card.dataset.categories ?? '').split(' ');
			const match = active === 'alle' || cats.includes(active);
			card.hidden = !match;
			card.classList.remove('work-card--small', 'work-card--large');
			if (match) {
				card.classList.add(`work-card--${SIZE_PATTERN[visibleIndex % SIZE_PATTERN.length]}`);
				visibleIndex += 1;
			}
		}
	};

	let current = 'alle';

	const select = (chip: HTMLButtonElement): void => {
		const next = chip.dataset.workChip ?? 'alle';
		if (next === current) return;
		current = next;

		for (const c of chips) {
			const on = c === chip;
			c.classList.toggle('is-active', on);
			c.setAttribute('aria-pressed', String(on));
		}

		if (prefersReducedMotion) {
			applyLayout(next);
			return;
		}

		grid.classList.add('is-filtering');
		window.setTimeout(() => {
			applyLayout(next);
			requestAnimationFrame(() => grid.classList.remove('is-filtering'));
		}, FADE_MS);
	};

	for (const chip of chips) {
		chip.addEventListener('click', () => select(chip));
	}
}
