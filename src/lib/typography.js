/**
 * French high punctuation takes a space before it, and that space must never
 * be the one the line breaks on. Colons and units take a word space, the rest
 * a narrow one, per the Imprimerie nationale.
 *
 * Prose only — never run this over URLs or attribute values.
 */
export function fr(text) {
	return text
		.replace(/ ?([;!?])/g, " $1")
		.replace(/ ?:/g, " :")
		.replace(/« ?/g, "« ")
		.replace(/ ?»/g, " »")
		.replace(/ ?([%€])/g, " $1");
}
