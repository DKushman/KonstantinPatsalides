const MAX_FILE_MB = 8;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const CONTACT_EMAIL = 'kontakt@konstantinpatsalides.de';

type FieldKey = 'photo' | 'name' | 'linkedin';

export function initNetzwerkSignup() {
	const root = document.querySelector<HTMLElement>('[data-net-signup]');
	if (!root || root.dataset.netSignupInit === 'true') return;
	root.dataset.netSignupInit = 'true';

	const form = root.querySelector<HTMLFormElement>('[data-net-signup-form]');
	const photoInput = root.querySelector<HTMLInputElement>('[data-net-signup-photo]');
	const photoZone = root.querySelector<HTMLElement>('[data-net-signup-photo-zone]');
	const photoPreview = root.querySelector<HTMLImageElement>('[data-net-signup-photo-preview]');
	const photoPlaceholder = root.querySelector<HTMLElement>('[data-net-signup-photo-placeholder]');
	const photoOverlay = root.querySelector<HTMLElement>('[data-net-signup-photo-overlay]');
	const photoHint = root.querySelector<HTMLElement>('#net-signup-photo-hint');
	const textInput = root.querySelector<HTMLTextAreaElement>('[data-net-signup-text]');
	const textCount = root.querySelector<HTMLElement>('[data-net-signup-text-count]');
	const nameInput = root.querySelector<HTMLInputElement>('[name="name"]');
	const companyInput = root.querySelector<HTMLInputElement>('[name="company"]');
	const linkedinInput = root.querySelector<HTMLInputElement>('[name="linkedin"]');

	if (
		!form ||
		!photoInput ||
		!photoZone ||
		!photoPreview ||
		!photoPlaceholder ||
		!textInput ||
		!nameInput ||
		!companyInput ||
		!linkedinInput
	) {
		return;
	}

	let previewUrl: string | null = null;

	const setFieldError = (field: FieldKey, message: string) => {
		const errorEl = root.querySelector<HTMLElement>(`[data-net-signup-error="${field}"]`);
		const fieldEl =
			field === 'photo'
				? root.querySelector('.net-signup__photo-wrap')
				: root.querySelector<HTMLElement>(`[data-net-signup-field="${field}"]`);

		if (errorEl) {
			errorEl.textContent = message;
			errorEl.hidden = !message;
		}

		if (field === 'photo') {
			photoZone.classList.toggle('is-invalid', Boolean(message));
		} else {
			fieldEl?.classList.toggle('is-invalid', Boolean(message));
		}
	};

	const clearErrors = () => {
		(['photo', 'name', 'linkedin'] as const).forEach((field) => setFieldError(field, ''));
	};

	const revokePreview = () => {
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			previewUrl = null;
		}
	};

	const clearPhoto = () => {
		revokePreview();
		photoInput.value = '';
		photoPreview.hidden = true;
		photoPreview.removeAttribute('src');
		photoPlaceholder.hidden = false;
		photoOverlay?.setAttribute('hidden', '');
		photoZone.classList.remove('has-file');
		if (photoHint) photoHint.textContent = 'Porträt hochladen';
	};

	const showPhoto = (file: File) => {
		revokePreview();
		previewUrl = URL.createObjectURL(file);
		photoPreview.src = previewUrl;
		photoPreview.hidden = false;
		photoPlaceholder.hidden = true;
		photoOverlay?.removeAttribute('hidden');
		photoZone.classList.add('has-file');
		photoZone.classList.remove('is-invalid');
		if (photoHint) photoHint.textContent = file.name;
		setFieldError('photo', '');
	};

	const validateFile = (file: File | null | undefined): string | null => {
		if (!file) return 'Bitte wählen Sie ein Porträtfoto aus.';
		if (!ACCEPT.includes(file.type)) return 'Erlaubt sind JPG, PNG oder WebP.';
		if (file.size > MAX_FILE_MB * 1024 * 1024) return `Maximal ${MAX_FILE_MB} MB.`;
		return null;
	};

	const normalizeLinkedin = (value: string) => {
		const trimmed = value.trim();
		if (!trimmed) return '';
		if (/^https?:\/\//i.test(trimmed)) return trimmed;
		return `https://${trimmed.replace(/^\/+/, '')}`;
	};

	const handleFile = (file: File | null | undefined) => {
		const error = validateFile(file);
		if (error) {
			clearPhoto();
			setFieldError('photo', error);
			return;
		}
		showPhoto(file!);
	};

	photoInput.addEventListener('change', () => handleFile(photoInput.files?.[0]));

	photoZone.addEventListener('dragover', (event) => {
		event.preventDefault();
		photoZone.classList.add('is-dragover');
	});

	photoZone.addEventListener('dragleave', () => {
		photoZone.classList.remove('is-dragover');
	});

	photoZone.addEventListener('drop', (event) => {
		event.preventDefault();
		photoZone.classList.remove('is-dragover');
		const file = event.dataTransfer?.files?.[0];
		if (!file) return;
		const dt = new DataTransfer();
		dt.items.add(file);
		photoInput.files = dt.files;
		handleFile(file);
	});

	const updateTextCount = () => {
		if (textCount) textCount.textContent = String(textInput.value.length);
	};

	const bindInput = (input: HTMLInputElement | HTMLTextAreaElement, field?: FieldKey) => {
		input.addEventListener('input', () => {
			if (field) setFieldError(field, '');
		});
	};

	bindInput(nameInput, 'name');
	bindInput(linkedinInput, 'linkedin');
	textInput.addEventListener('input', updateTextCount);
	updateTextCount();

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		clearErrors();

		const name = nameInput.value.trim();
		const company = companyInput.value.trim();
		const linkedinRaw = linkedinInput.value.trim();
		const linkedin = normalizeLinkedin(linkedinRaw);
		const text = textInput.value.trim();
		const file = photoInput.files?.[0];

		let firstInvalid: HTMLElement | null = null;

		const fileError = validateFile(file);
		if (fileError) {
			setFieldError('photo', fileError);
			firstInvalid = photoZone;
		}

		if (!name) {
			setFieldError('name', 'Bitte geben Sie Ihren Namen an.');
			firstInvalid ??= nameInput;
		}

		if (linkedinRaw && !/^https?:\/\/.+\..+/i.test(linkedin)) {
			setFieldError('linkedin', 'Bitte geben Sie einen gültigen LinkedIn-Link ein.');
			firstInvalid ??= linkedinInput;
		}

		if (firstInvalid) {
			firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
			if (firstInvalid instanceof HTMLInputElement || firstInvalid instanceof HTMLTextAreaElement) {
				firstInvalid.focus();
			}
			return;
		}

		if (linkedin && linkedin !== linkedinRaw) {
			linkedinInput.value = linkedin;
		}

		const body = [
			'Netzwerk-Anmeldung',
			'',
			`Name: ${name}`,
			`Stelle / Unternehmen: ${company || '—'}`,
			`LinkedIn: ${linkedin || '—'}`,
			'',
			'Kurzer Text:',
			text || '—',
			'',
			'Porträt bitte als Anhang mitsenden.',
		].join('\n');

		window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Netzwerk: ${name}`)}&body=${encodeURIComponent(body)}`;
	});
}
