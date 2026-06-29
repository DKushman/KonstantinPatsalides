/**
 * Lebenslauf-Sektion: Sticky-Zwei-Spalten-Scroll.
 *
 * Desktop: Die Section ist hoch, der innere Block bleibt sticky. Über den
 * Scroll-Fortschritt gleitet die Überschriften-Spalte, die zentrale Überschrift
 * wird hervorgehoben (Opacity 0.5 → 1) und das rechte Panel wechselt.
 *
 * Das Einrasten pro Station übernimmt natives CSS-Scroll-Snap (.cv__rail /
 * .cv__stop) — kompositorgesteuert, ohne Main-Thread-Blockade. Dieses Skript
 * liest nur passiv den Scroll-Fortschritt und animiert die Optik (rAF).
 *
 * Mobile: Sticky wird aufgelöst, jede Station erscheint als gestapelte Karte
 * mit sanftem Fade-in beim Scrollen.
 */

const SECTION_SELECTOR = '.cv[data-cv]';
const NAV_SELECTOR = '.cv__nav';
const TRACK_SELECTOR = '.cv__nav-track';
const HEADING_SELECTOR = '[data-cv-heading]';
const PANEL_SELECTOR = '[data-cv-panel]';

const DESKTOP_MQ = '(min-width: 48.0625rem)';
const REDUCE_MQ = '(prefers-reduced-motion: reduce)';

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

function bindSection(section: HTMLElement): void {
	if (section.dataset.cvBound === 'true') return;
	section.dataset.cvBound = 'true';

	const nav = section.querySelector<HTMLElement>(NAV_SELECTOR);
	const track = section.querySelector<HTMLElement>(TRACK_SELECTOR);
	const headings = [...section.querySelectorAll<HTMLElement>(HEADING_SELECTOR)];
	const panels = [...section.querySelectorAll<HTMLElement>(PANEL_SELECTOR)];
	const count = headings.length;

	if (!nav || !track || count === 0) return;

	const desktopMq = window.matchMedia(DESKTOP_MQ);
	const reduceMq = window.matchMedia(REDUCE_MQ);

	let sectionTop = 0;
	let range = 1;
	let navHalf = 0;
	let centers: number[] = [];
	let pending = false;
	let listening = false;
	let activeIndex = -1;

	const setActive = (index: number): void => {
		if (index === activeIndex) return;
		activeIndex = index;
		for (let i = 0; i < panels.length; i++) {
			panels[i].classList.toggle('is-active', i === index);
		}
	};

	const measure = (): void => {
		const rect = section.getBoundingClientRect();
		sectionTop = rect.top + window.scrollY;
		range = Math.max(1, section.offsetHeight - window.innerHeight);
		navHalf = nav.clientHeight / 2;
		centers = headings.map((h) => h.offsetTop + h.offsetHeight / 2);
	};

	const apply = (): void => {
		pending = false;

		const progress = clamp01((window.scrollY - sectionTop) / range);
		const pos = progress * (count - 1);
		const lower = Math.floor(pos);
		const upper = Math.min(count - 1, lower + 1);
		const frac = pos - lower;
		const center = centers[lower] + (centers[upper] - centers[lower]) * frac;

		track.style.transform = `translate3d(0, ${(navHalf - center).toFixed(2)}px, 0)`;

		for (let i = 0; i < headings.length; i++) {
			const distance = Math.min(1, Math.abs(i - pos));
			headings[i].style.opacity = (1 - distance * 0.5).toFixed(3);
		}

		setActive(Math.round(pos));
	};

	const onScroll = (): void => {
		if (pending) return;
		pending = true;
		requestAnimationFrame(apply);
	};

	const resizeObserver = new ResizeObserver(() => {
		if (!listening) return;
		measure();
		apply();
	});

	const enableDesktop = (): void => {
		if (listening) return;
		listening = true;
		measure();
		resizeObserver.observe(section);
		window.addEventListener('scroll', onScroll, { passive: true });
		apply();
	};

	const disableDesktop = (): void => {
		if (!listening) return;
		listening = false;
		pending = false;
		resizeObserver.disconnect();
		window.removeEventListener('scroll', onScroll);
		track.style.transform = '';
		headings.forEach((h) => {
			h.style.opacity = '';
		});
	};

	// Mobile: Karten beim Scrollen einblenden.
	const revealObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					revealObserver.unobserve(entry.target);
				}
			});
		},
		{ threshold: 0.2, rootMargin: '0px 0px -12% 0px' },
	);

	const syncMode = (): void => {
		if (reduceMq.matches) {
			disableDesktop();
			panels.forEach((p) => p.classList.add('is-visible'));
			setActive(0);
			return;
		}

		if (desktopMq.matches) {
			revealObserver.disconnect();
			panels.forEach((p) => p.classList.remove('is-visible'));
			enableDesktop();
		} else {
			disableDesktop();
			setActive(-1);
			panels.forEach((p) => revealObserver.observe(p));
		}
	};

	desktopMq.addEventListener('change', syncMode);
	reduceMq.addEventListener('change', syncMode);

	syncMode();
}

export function initAboutCv(root: ParentNode = document): void {
	root.querySelectorAll<HTMLElement>(SECTION_SELECTOR).forEach(bindSection);
}
