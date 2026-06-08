const SECTION_SELECTOR = '.steps[data-steps-scroll]';
const STEP_SELECTOR = '[data-step-item]';
const VISIBLE_CLASS = 'is-visible';

// Lerp factor: how fast current chases target each frame (0–1).
// 0.09 = silky smooth trail without feeling laggy.
const LERP = 0.09;
const EPSILON = 0.0003; // settle threshold — stop rAF when close enough

function calcTarget(sectionTop: number, sectionHeight: number): number {
	const viewH = window.innerHeight;
	const traveled = window.scrollY + viewH - sectionTop;
	const total = viewH + sectionHeight;
	return Math.min(1, Math.max(0, traveled / total));
}

function bindSection(section: HTMLElement): void {
	if (section.dataset.stepsBound === 'true') return;
	section.dataset.stepsBound = 'true';

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		section.querySelectorAll<HTMLElement>(STEP_SELECTOR).forEach((el) =>
			el.classList.add(VISIBLE_CLASS),
		);
		section.style.setProperty('--steps-progress', '1');
		return;
	}

	// ── Spine lerp loop ────────────────────────────────────────────────────────
	let sectionTop = 0;
	let sectionHeight = 0;
	let target = 0;
	let current = 0;
	let rafId = 0;
	let inViewport = false;

	const measure = () => {
		const rect = section.getBoundingClientRect();
		sectionTop = rect.top + window.scrollY;
		sectionHeight = section.offsetHeight;
	};

	const loop = () => {
		// Lerp: exponential decay toward target
		current += (target - current) * LERP;

		// Snap to target when close enough to avoid infinite micro-updates
		if (Math.abs(target - current) < EPSILON) {
			current = target;
			section.style.setProperty('--steps-progress', String(current));
			rafId = 0;
			return; // stop loop — will restart on next scroll event
		}

		section.style.setProperty('--steps-progress', current.toFixed(4));
		rafId = requestAnimationFrame(loop);
	};

	const startLoop = () => {
		if (!rafId) rafId = requestAnimationFrame(loop);
	};

	const onScroll = () => {
		target = calcTarget(sectionTop, sectionHeight);
		startLoop();
	};

	new ResizeObserver(() => {
		measure();
		target = calcTarget(sectionTop, sectionHeight);
		startLoop();
	}).observe(section);

	new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting && !inViewport) {
				inViewport = true;
				window.addEventListener('scroll', onScroll, { passive: true });
				target = calcTarget(sectionTop, sectionHeight);
				startLoop();
				return;
			}
			if (!entry.isIntersecting && inViewport) {
				inViewport = false;
				window.removeEventListener('scroll', onScroll);
				// cancel any in-flight frame when out of view
				if (rafId) {
					cancelAnimationFrame(rafId);
					rafId = 0;
				}
			}
		},
		{ rootMargin: '15% 0px' },
	).observe(section);

	measure();
	target = calcTarget(sectionTop, sectionHeight);
	startLoop();

	// ── Per-step reveal (fire-once IntersectionObserver) ──────────────────────
	const stepObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add(VISIBLE_CLASS);
					stepObserver.unobserve(entry.target);
				}
			});
		},
		{ threshold: 0.2 },
	);

	section.querySelectorAll<HTMLElement>(STEP_SELECTOR).forEach((item) =>
		stepObserver.observe(item),
	);
}

export function initStepsScroll(root: ParentNode = document): void {
	root.querySelectorAll<HTMLElement>(SECTION_SELECTOR).forEach(bindSection);
}
