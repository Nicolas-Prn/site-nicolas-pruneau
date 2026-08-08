export function initReveal() {
	const items = document.querySelectorAll("[data-reveal]");
	if (!items.length) return;

	const observer = new IntersectionObserver(
		(entries) => {
			let batch = 0;
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				const el = entry.target;
				window.setTimeout(() => el.classList.add("is-visible"), batch * 130);
				batch += 1;
				observer.unobserve(el);
			});
		},
		{ threshold: 0, rootMargin: "0px 0px -40px 0px" },
	);

	items.forEach((el) => observer.observe(el));
}

export function initGlow() {
	document.querySelectorAll("[data-glow]").forEach((el) => {
		const layer = el.querySelector("[data-glow-layer]");
		if (!layer) return;
		el.addEventListener("pointermove", (event) => {
			const rect = el.getBoundingClientRect();
			layer.style.setProperty("--mx", `${event.clientX - rect.left}px`);
			layer.style.setProperty("--my", `${event.clientY - rect.top}px`);
			layer.style.opacity = "1";
		});
		el.addEventListener("pointerleave", () => {
			layer.style.opacity = "0";
		});
	});
}

export function initProgress() {
	const bar = document.querySelector("[data-progress]");
	if (!bar) return;

	let ticking = false;
	const update = () => {
		const doc = document.documentElement;
		const max = doc.scrollHeight - window.innerHeight;
		const pct = max > 0 ? Math.min(1, window.scrollY / max) : 0;
		bar.style.width = `${(pct * 100).toFixed(1)}%`;
		ticking = false;
	};

	window.addEventListener(
		"scroll",
		() => {
			if (ticking) return;
			ticking = true;
			window.requestAnimationFrame(update);
		},
		{ passive: true },
	);
	update();
}

export function initFaq() {
	const items = document.querySelectorAll("[data-faq-item]");
	if (!items.length) return;

	const panels = Array.from(items).map((item) => ({
		item,
		button: item.querySelector("[data-faq-trigger]"),
		panel: item.querySelector("[data-faq-panel]"),
	}));

	const setOpen = (target, open) => {
		target.button.setAttribute("aria-expanded", String(open));
		target.item.querySelector("[data-faq-marker]").textContent = open ? "–" : "+";
		if (open) {
			target.panel.style.maxHeight = `${target.panel.scrollHeight}px`;
			target.panel.style.opacity = "1";
		} else {
			target.panel.style.maxHeight = "0px";
			target.panel.style.opacity = "0";
		}
	};

	panels.forEach((target, index) => {
		setOpen(target, index === 0);
		target.button.addEventListener("click", () => {
			const willOpen = target.button.getAttribute("aria-expanded") !== "true";
			panels.forEach((other) => setOpen(other, other === target ? willOpen : false));
		});
	});

	window.addEventListener("resize", () => {
		panels.forEach((target) => {
			if (target.button.getAttribute("aria-expanded") === "true") {
				target.panel.style.maxHeight = `${target.panel.scrollHeight}px`;
			}
		});
	});
}
