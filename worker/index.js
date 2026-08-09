/**
 * The site is static assets served by this Worker. The only dynamic route is
 * the contact endpoint, so everything else falls straight through to the
 * asset binding.
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

	if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
		console.error("contact: delivery is not configured");
		return json({ ok: false, error: "unconfigured" }, 500);
	}

	const lines = [
		`Nom : ${name}`,
		`E-mail : ${email}`,
		`Sujet : ${SUBJECTS[data.subject] || "non précisé"}`,
		`Budget : ${BUDGETS[data.budget] || "non précisé"}`,
		"",
		message,
	];

	const sent = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			authorization: `Bearer ${env.RESEND_API_KEY}`,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			from: env.CONTACT_FROM,
			to: [env.CONTACT_TO],
			reply_to: email,
			subject: `Site — ${name}`,
			text: lines.join("\n"),
		}),
	});

	if (!sent.ok) {
		console.error("contact: delivery failed", sent.status, await sent.text());
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
