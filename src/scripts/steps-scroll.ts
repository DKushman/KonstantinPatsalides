/** Vier Farben für Steps-Spine & Nav-Gradient — eine Quelle */
export const STEP_GRADIENT_COLORS = [
	'#c9a84c',
	'#a89050',
	'#3d4d7a',
	'#1a2c6e',
] as const;

const SECTION_SELECTOR = '.steps[data-steps-scroll]';
const TRACK_SELECTOR = '.steps__track';
const STEP_SELECTOR = '[data-step-item]';
const REEL_SELECTOR = '[data-steps-reel]';
const VISIBLE_CLASS = 'is-visible';

const MOBILE_MQ = '(max-width: 48rem)';

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

function isMobile(): boolean {
	return window.matchMedia(MOBILE_MQ).matches;
}

function calcTrackProgress(trackTop: number, trackHeight: number): number {
	const viewH = window.innerHeight;
	const traveled = window.scrollY + viewH - trackTop;
	return clamp01(traveled / (viewH + trackHeight));
}

function calcReelScale(reelTop: number): number {
	const viewH = window.innerHeight;
	const traveled = window.scrollY + viewH - reelTop;
	return clamp01(traveled / viewH);
}

function bindSection(section: HTMLElement): void {
	if (section.dataset.stepsBound === 'true') return;
	section.dataset.stepsBound = 'true';

	const track = section.querySelector<HTMLElement>(TRACK_SELECTOR);
	const reel = section.querySelector<HTMLElement>(REEL_SELECTOR);
	const reelVideo = reel?.querySelector<HTMLElement>('.steps__reel-video');
	const mobile = isMobile();

	if (reel && mobile) {
		reel.classList.add('steps__reel--static');
	}

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		section.querySelectorAll<HTMLElement>(STEP_SELECTOR).forEach((el) =>
			el.classList.add(VISIBLE_CLASS),
		);
		section.style.setProperty('--steps-progress', '1');
		reelVideo?.style.setProperty('--reel-scale', '1');
		return;
	}

	let trackTop = 0;
	let trackHeight = 0;
	let reelTop = 0;
	let scrollPending = false;
	let inViewport = false;

	const measure = () => {
		if (track) {
			const rect = track.getBoundingClientRect();
			trackTop = rect.top + window.scrollY;
			trackHeight = track.offsetHeight;
		}
		if (reel && !mobile) {
			const rect = reel.getBoundingClientRect();
			reelTop = rect.top + window.scrollY;
		}
	};

	const applyProgress = () => {
		scrollPending = false;

		if (track) {
			section.style.setProperty(
				'--steps-progress',
				calcTrackProgress(trackTop, trackHeight).toFixed(4),
			);
		}

		if (reelVideo && !mobile) {
			reelVideo.style.setProperty('--reel-scale', calcReelScale(reelTop).toFixed(4));
		}
	};

	const onScroll = () => {
		if (scrollPending) return;
		scrollPending = true;
		requestAnimationFrame(applyProgress);
	};

	const resizeObserver = new ResizeObserver(() => {
		measure();
		onScroll();
	});

	if (track) resizeObserver.observe(track);
	if (reel && !mobile) resizeObserver.observe(reel);

	new IntersectionObserver(
		([entry]) => {
			if (entry.isIntersecting && !inViewport) {
				inViewport = true;
				measure();
				window.addEventListener('scroll', onScroll, { passive: true });
				applyProgress();
				return;
			}

			if (!entry.isIntersecting && inViewport) {
				inViewport = false;
				window.removeEventListener('scroll', onScroll);
				scrollPending = false;
			}
		},
		{ rootMargin: '15% 0px' },
	).observe(section);

	measure();
	applyProgress();

	const stepObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add(VISIBLE_CLASS);
					stepObserver.unobserve(entry.target);
				}
			});
		},
		{ threshold: 0.15 },
	);

	section.querySelectorAll<HTMLElement>(STEP_SELECTOR).forEach((item) =>
		stepObserver.observe(item),
	);
}

export function initStepsScroll(root: ParentNode = document): void {
	root.querySelectorAll<HTMLElement>(SECTION_SELECTOR).forEach(bindSection);
}
