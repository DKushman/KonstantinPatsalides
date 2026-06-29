// Netzwerk-Seite: Umschalten zwischen Raster- und Listenansicht sowie das
// Auf-/Zuklappen der Mitglieder-Zitate. Progressive Enhancement – ohne JS
// bleibt die Rasteransicht vollständig sichtbar.

export function initNetzwerkView(): void {
	const root = document.querySelector<HTMLElement>('[data-net]');
	if (!root) return;

	// Doppelte Initialisierung vermeiden: `astro:page-load` feuert (durch die
	// View Transitions) auch beim ersten Laden, sonst würden Listener doppelt
	// gebunden und das Auf-/Zuklappen würde sich selbst aufheben.
	if (root.dataset.netInit === 'true') return;
	root.dataset.netInit = 'true';

	const grid = root.querySelector<HTMLElement>('[data-net-grid]');
	const viewButtons = Array.from(
		root.querySelectorAll<HTMLButtonElement>('[data-net-view]'),
	);
	if (!grid || viewButtons.length === 0) return;

	const setView = (view: 'grid' | 'list'): void => {
		grid.dataset.view = view;
		for (const btn of viewButtons) {
			const on = btn.dataset.netView === view;
			btn.classList.toggle('is-active', on);
			btn.setAttribute('aria-pressed', String(on));
		}
		if (view === 'list') closeAllQuotes();
	};

	for (const btn of viewButtons) {
		btn.addEventListener('click', () => {
			const view = btn.dataset.netView === 'list' ? 'list' : 'grid';
			setView(view);
		});
	}

	const cards = Array.from(grid.querySelectorAll<HTMLElement>('.net-card'));

	const closeAllQuotes = (except?: HTMLElement): void => {
		for (const card of cards) {
			if (card === except) continue;
			card.classList.remove('is-open');
			const more = card.querySelector<HTMLButtonElement>('.net-card__more');
			const quote = card.querySelector<HTMLElement>('.net-card__quote');
			more?.setAttribute('aria-expanded', 'false');
			if (quote) quote.hidden = true;
		}
	};

	for (const card of cards) {
		const more = card.querySelector<HTMLButtonElement>('.net-card__more');
		const quote = card.querySelector<HTMLElement>('.net-card__quote');
		if (!more || !quote) continue;

		more.addEventListener('click', () => {
			const open = card.classList.contains('is-open');
			if (open) {
				card.classList.remove('is-open');
				more.setAttribute('aria-expanded', 'false');
				quote.hidden = true;
			} else {
				closeAllQuotes(card);
				quote.hidden = false;
				// Reflow erzwingen, damit die Opacity-Transition greift.
				void quote.offsetHeight;
				card.classList.add('is-open');
				more.setAttribute('aria-expanded', 'true');
			}
		});
	}

	root.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') closeAllQuotes();
	});
}
