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
 * Records where the pointer crossed the edge, so the fill can grow from that
 * exact point rather than from the middle. Keyboard focus falls back to the
 * centre, which is the only honest origin when there is no pointer.
 */
export function initOriginFill() {
	document.querySelectorAll("[data-origin-fill]").forEach((el) => {
		const setOrigin = (x, y) => {
			const rect = el.getBoundingClientRect();
			el.style.setProperty("--ox", `${x - rect.left}px`);
			el.style.setProperty("--oy", `${y - rect.top}px`);
			/* Radius that still covers the far corner from wherever we started. */
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
