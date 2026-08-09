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
