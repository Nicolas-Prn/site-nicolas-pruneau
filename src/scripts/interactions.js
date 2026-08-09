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
