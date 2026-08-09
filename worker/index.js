/**
 * The site is static assets served by this Worker. The only dynamic route is
 * the contact endpoint, so everything else falls straight through to the
 * asset binding.
 *
 * Delivery goes through Cloudflare's own Email Sending binding: no API key, no
 * second vendor, and it sits alongside the Email Routing that already forwards
 * contact@ to a personal inbox.
 */

const FIELDS = ["name", "email", "subject", "budget", "message"];

const SUBJECTS = {
	vitrine: "Site vitrine",
	outil: "Outil ou automatisation",
	prototype: "Prototype",
	inconnu: "Je ne sais pas encore",
};

const BUDGETS = {
	"moins-750": "Moins de 750 €",
	"750-1500": "750 à 1 500 €",
	"plus-1500": "Plus de 1 500 €",
	inconnu: "Je n'en ai aucune idée",
};

const json = (body, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json; charset=utf-8" },
	});

const escapeHtml = (value) =>
	String(value).replace(
		/[&<>"']/g,
		(c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
	);

/** Deliberately vague to the client, precise in the logs: a validation message
 *  that enumerates what a spammer got wrong is a gift to the spammer. */
function validate(data) {
	const errors = [];
	const name = (data.name || "").trim();
	const email = (data.email || "").trim();
	const message = (data.message || "").trim();

	if (name.length < 2 || name.length > 120) errors.push("name");
	if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email) || email.length > 200) errors.push("email");
	if (message.length < 10 || message.length > 5000) errors.push("message");
	if (data.subject && !(data.subject in SUBJECTS)) errors.push("subject");
	if (data.budget && !(data.budget in BUDGETS)) errors.push("budget");

	return { errors, name, email, message };
}

async function handleContact(request, env) {
	if (request.method !== "POST") return json({ ok: false }, 405);

	let data;
	try {
		const form = await request.formData();
		data = Object.fromEntries(FIELDS.concat("company").map((k) => [k, form.get(k) ?? ""]));
	} catch {
		return json({ ok: false, error: "invalid" }, 400);
	}

	/* Honeypot: a field no human sees and no human fills. Answer 200 so the bot
	   records a success and does not retry. */
	if (String(data.company || "").trim() !== "") return json({ ok: true });

	const { errors, name, email, message } = validate(data);
	if (errors.length) return json({ ok: false, error: "invalid" }, 400);

	const summary = [
		["Nom", name],
		["E-mail", email],
		["Sujet", SUBJECTS[data.subject] || "non précisé"],
		["Budget", BUDGETS[data.budget] || "non précisé"],
	];

	const text = [...summary.map(([k, v]) => `${k} : ${v}`), "", message].join("\n");
	const html = [
		"<table>",
		...summary.map(
			([k, v]) => `<tr><th align="left">${k}</th><td>${escapeHtml(v)}</td></tr>`
		),
		"</table>",
		`<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
	].join("");

	try {
		await env.EMAIL.send({
			to: env.CONTACT_TO,
			from: { email: env.CONTACT_FROM, name: "nicolas-pruneau.com" },
			/* So replying in the mail client answers the visitor, not the site. */
			replyTo: email,
			subject: `Site — ${name}`,
			text,
			html,
		});
	} catch (error) {
		console.error("contact: delivery failed", error.code, error.message);
		/* The sender domain not being onboarded is a setup fault, not a visitor
		   fault, and it is the one worth naming separately in the logs. */
		return json({ ok: false, error: "delivery" }, 502);
	}

	return json({ ok: true });
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		if (url.pathname === "/api/contact") return handleContact(request, env);
		return env.ASSETS.fetch(request);
	},
};
