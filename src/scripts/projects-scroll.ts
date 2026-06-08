const SECTION_SELECTOR = '.projects[data-projects-scroll]';
const ENTRY_LEAD = 0.2;

function bindSection(section: HTMLElement): void {
	if (section.dataset.projectsBound === 'true') return;
	section.dataset.projectsBound = 'true';

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		section.classList.add('is-reduced-motion');
		return;
	}

	let top = 0;
	let range = 1;
	let lead = 0;
	let last = -1;
	let active = false;
	let ticking = false;

	const measure = () => {
		const rect = section.getBoundingClientRect();
		top = rect.top + window.scrollY;
		lead = window.innerHeight * ENTRY_LEAD;
		range = Math.max(section.offsetHeight - window.innerHeight, 1);
		last = -1;
	};

	const tick = () => {
		ticking = false;
		const progress = Math.min(1, Math.max(0, (window.scrollY - top + lead) / (range + lead)));

		if (progress === last) return;
		last = progress;
		section.style.setProperty('--scroll-progress', String(progress));
	};

	const onScroll = () => {
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(tick);
		}
	};

	new ResizeObserver(() => {
		measure();
		tick();
	}).observe(section);

	new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting && !active) {
				active = true;
				window.addEventListener('scroll', onScroll, { passive: true });
				tick();
				return;
			}

			if (!entry.isIntersecting && active) {
				active = false;
				window.removeEventListener('scroll', onScroll);
			}
		},
		{ rootMargin: '25% 0px' },
	).observe(section);

	measure();
	tick();
}

export function initProjectsScroll(root: ParentNode = document): void {
	root.querySelectorAll<HTMLElement>(SECTION_SELECTOR).forEach(bindSection);
}
