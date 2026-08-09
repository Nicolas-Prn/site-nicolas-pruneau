/**
 * Advances the drawing set. The background is fixed, so it never slides with
 * the scroll: it steps once, decisively, whenever a different section takes the
 * viewport — in either direction — and the arriving sheet is drawn from scratch.
 */
export function initSheets() {
	const stage = document.querySelector("[data-sheets-stage]");
	const folio = document.querySelector("[data-folio]");
	const sections = document.querySelectorAll("[data-sheet-section]");
	if (!stage || !sections.length) return;

	const sheets = new Map();
	stage.querySelectorAll("[data-sheet]").forEach((el) => sheets.set(el.dataset.sheet, el));

	let current = null;
	const show = (id) => {
		if (id === current) return;
		current = id;
		sheets.forEach((el, key) => {
			/* Re-adding the attribute restarts the draw, so a sheet revisited on
			   the way back up is plotted again rather than simply revealed. */
			el.removeAttribute("data-active");
			if (key === id) {
				void el.getBoundingClientRect();
				el.setAttribute("data-active", "");
			}
		});
		stage.style.setProperty("--step", String(Number(id) - 1));
		if (folio) folio.textContent = id;
	};

	const observer = new IntersectionObserver(
		(entries) => {
			/* The section covering the middle of the viewport is the one on the
			   machine; ties go to whichever is most visible. */
			const visible = entries
				.filter((entry) => entry.isIntersecting)
				.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
			if (visible) show(visible.target.dataset.sheetSection);
		},
		{ rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5, 1] }
	);

	sections.forEach((section) => observer.observe(section));
}

/**
 * Reports the drawn width of the block the dimension sits under, in the CSS
 * pixels the visitor's screen is actually using, and keeps reporting it while
 * the window is resized. Nothing here is decorative: the number is measured.
 */
export function initMeasure() {
	const el = document.querySelector("[data-measure]");
	const value = document.querySelector("[data-measure-value]");
	if (!el || !value) return;

	const format = new Intl.NumberFormat("fr-BE");
	const update = () => {
		value.textContent = `${format.format(Math.round(el.getBoundingClientRect().width))} px`;
	};

	update();
	new ResizeObserver(update).observe(el);
}

/**
 * Submits the contact form without leaving the page, and reports what actually
 * happened. Without script the form still posts normally, so the endpoint stays
 * reachable either way.
 */
export function initContactForm() {
	const form = document.querySelector("[data-contact-form]");
	if (!form) return;

	const status = form.querySelector("[data-form-status]");
	const button = form.querySelector("button[type='submit']");
	const say = (text, tone) => {
		status.textContent = text;
		if (tone) status.dataset.tone = tone;
		else delete status.dataset.tone;
	};

	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		/* Let the browser explain what is missing — it does it in the visitor's
		   own language and reads it to a screen reader. */
		if (!form.checkValidity()) {
			form.reportValidity();
			return;
		}

		button.disabled = true;
		say("Envoi en cours…");

		try {
			const response = await fetch(form.action, {
				method: "POST",
				body: new FormData(form),
				headers: { accept: "application/json" },
			});
			const result = await response.json().catch(() => ({}));

			if (!response.ok || !result.ok) throw new Error(result.error || "failed");

			form.dataset.sent = "";
			say("Message envoyé. Je vous réponds sous 24 à 48 heures.");
		} catch {
			button.disabled = false;
			say("L'envoi a échoué. Écrivez-moi directement à contact@nicolas-pruneau.com.", "error");
		}
	});
}

/**
 * Records where the pointer crossed the edge, so the fill grows from that exact
 * point rather than from the middle. Keyboard focus falls back to the centre,
 * the only honest origin when there is no pointer.
 */
export function initOriginFill() {
	document.querySelectorAll("[data-origin-fill]").forEach((el) => {
		const setOrigin = (x, y) => {
			const rect = el.getBoundingClientRect();
			el.style.setProperty("--ox", `${x - rect.left}px`);
			el.style.setProperty("--oy", `${y - rect.top}px`);
			const dx = Math.max(x - rect.left, rect.right - x);
			const dy = Math.max(y - rect.top, rect.bottom - y);
			el.style.setProperty("--or", `${Math.ceil(Math.hypot(dx, dy))}px`);
		};

		el.addEventListener("pointerenter", (event) => setOrigin(event.clientX, event.clientY));
		el.addEventListener("focus", () => {
			const rect = el.getBoundingClientRect();
			setOrigin(rect.left + rect.width / 2, rect.top + rect.height / 2);
		});
	});
}

/**
 * Keeps the way to reach him one tap away through the middle of the document,
 * and stands down once the contact section is on screen — offering a shortcut
 * to something already in front of you is just clutter.
 */
export function initContactDock() {
	const dock = document.querySelector("[data-dock]");
	const contact = document.querySelector("#contact");
	const cover = document.querySelector(".cover");
	if (!dock || !contact || !cover) return;

	let coverVisible = true;
	let contactVisible = false;

	const apply = () => {
		const show = !coverVisible && !contactVisible;
		dock.hidden = false;
		dock.dataset.state = show ? "in" : "out";
	};

	const watch = (target, assign) =>
		new IntersectionObserver(
			([entry]) => {
				assign(entry.isIntersecting);
				apply();
			},
			{ threshold: 0 }
		).observe(target);

	watch(cover, (v) => (coverVisible = v));
	watch(contact, (v) => (contactVisible = v));
	apply();
}

/**
 * One open answer at a time. Panels are height-animated from their measured
 * content, so nothing is clipped when the text reflows.
 */
export function initFaq() {
	const elements = document.querySelectorAll("[data-faq-item]");
	if (!elements.length) return;

	const items = Array.from(elements).map((item) => ({
		button: item.querySelector("[data-faq-trigger]"),
		marker: item.querySelector("[data-faq-marker]"),
		panel: item.querySelector("[data-faq-panel]"),
	}));

	const setOpen = (item, open) => {
		item.button.setAttribute("aria-expanded", String(open));
		item.marker.textContent = open ? "–" : "+";
		item.panel.style.maxHeight = open ? `${item.panel.scrollHeight}px` : "0px";
		item.panel.style.opacity = open ? "1" : "0";
	};

	items.forEach((item) => {
		setOpen(item, false);
		item.button.addEventListener("click", () => {
			const open = item.button.getAttribute("aria-expanded") !== "true";
			items.forEach((other) => setOpen(other, other === item && open));
		});
	});

	window.addEventListener("resize", () => {
		items.forEach((item) => {
			if (item.button.getAttribute("aria-expanded") === "true") {
				item.panel.style.maxHeight = `${item.panel.scrollHeight}px`;
			}
		});
	});
}
