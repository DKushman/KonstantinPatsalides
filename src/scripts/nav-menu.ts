const PANEL = '#site-nav-panel';
const TOGGLE = '.site-header__toggle';

function closeMs(header: HTMLElement): number {
	const total = getComputedStyle(header).getPropertyValue('--nav-close-total').trim();
	const ms = parseFloat(total) * 1000;
	return Number.isFinite(ms) ? ms : 1400;
}

function bindHeader(header: HTMLElement): void {
	if (header.dataset.navBound === 'true') return;
	header.dataset.navBound = 'true';

	const panel = header.querySelector<HTMLElement>(PANEL);
	const toggle = header.querySelector<HTMLButtonElement>(TOGGLE);
	if (!panel || !toggle) return;

	let closeTimer = 0;

	const finishClose = () => {
		panel.classList.remove('is-open', 'is-closing');
		panel.setAttribute('inert', '');
		panel.setAttribute('aria-hidden', 'true');
	};

	const setOpen = (open: boolean) => {
		window.clearTimeout(closeTimer);

		if (open) {
			panel.classList.remove('is-closing');
			panel.removeAttribute('inert');
			panel.setAttribute('aria-hidden', 'false');
			panel.classList.add('is-open');
			toggle.setAttribute('aria-expanded', 'true');
			document.documentElement.classList.add('is-nav-open');
			return;
		}

		if (!panel.classList.contains('is-open')) return;

		panel.classList.add('is-closing');
		toggle.setAttribute('aria-expanded', 'false');
		document.documentElement.classList.remove('is-nav-open');

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			finishClose();
			return;
		}

		closeTimer = window.setTimeout(finishClose, closeMs(header));
	};

	toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

	panel.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
		link.addEventListener('click', () => setOpen(false));
	});

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
			setOpen(false);
			toggle.focus();
		}
	});
}

export function initNavMenu(root: ParentNode = document): void {
	root.querySelectorAll<HTMLElement>('.site-header').forEach(bindHeader);
}
