const REVEAL_SELECTOR = '[data-reveal-word]';
const REVEALED_CLASS = 'is-revealed';
const SECTION_SELECTOR = '.statement[data-scroll-reveal]';

function getTriggerRatio(section: HTMLElement): number {
	const raw = getComputedStyle(section).getPropertyValue('--reveal-trigger').trim();
	const ratio = Number.parseFloat(raw);
	return Number.isFinite(ratio) ? ratio : 0.5;
}

function measureOffsets(section: HTMLElement, words: HTMLElement[]): Float32Array {
	const sectionTop = section.getBoundingClientRect().top;
	const offsets = new Float32Array(words.length);

	for (let i = 0; i < words.length; i++) {
		offsets[i] = words[i].getBoundingClientRect().top - sectionTop;
	}

	return offsets;
}

function bindSection(section: HTMLElement): void {
	if (section.dataset.revealBound === 'true') return;
	section.dataset.revealBound = 'true';

	const words = [...section.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)];
	if (!words.length) return;

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		words.forEach((word) => word.classList.add(REVEALED_CLASS));
		return;
	}

	let offsets = measureOffsets(section, words);
	let triggerRatio = getTriggerRatio(section);
	let revealedCount = 0;
	let active = false;
	let ticking = false;

	const remeasure = () => {
		offsets = measureOffsets(section, words);
		triggerRatio = getTriggerRatio(section);
		revealedCount = words.reduce((count, word) => count + (word.classList.contains(REVEALED_CLASS) ? 1 : 0), 0);
	};

	const tick = () => {
		ticking = false;
		if (revealedCount >= words.length) return;

		const triggerY = window.innerHeight * triggerRatio;
		const sectionTop = section.getBoundingClientRect().top;

		for (let i = revealedCount; i < words.length; i++) {
			if (sectionTop + offsets[i] > triggerY) break;
			words[i].classList.add(REVEALED_CLASS);
			revealedCount = i + 1;
		}
	};

	const onScroll = () => {
		if (!ticking) {
			ticking = true;
			requestAnimationFrame(tick);
		}
	};

	const resizeObserver = new ResizeObserver(() => {
		remeasure();
		tick();
	});

	resizeObserver.observe(section);

	const observer = new IntersectionObserver(
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
		{ rootMargin: '20% 0px' },
	);

	observer.observe(section);

	if (document.fonts?.ready) {
		document.fonts.ready.then(() => {
			remeasure();
			tick();
		});
	}

	tick();
}

export function initScrollTextReveal(root: ParentNode = document): void {
	const sections =
		root instanceof Document
			? root.querySelectorAll<HTMLElement>(SECTION_SELECTOR)
			: root instanceof HTMLElement && root.matches(SECTION_SELECTOR)
				? [root]
				: root.querySelectorAll<HTMLElement>(SECTION_SELECTOR);

	sections.forEach(bindSection);
}
