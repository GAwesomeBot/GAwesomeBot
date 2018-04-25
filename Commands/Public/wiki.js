const wiki = require("wikijs").default();

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	await msg.send({
		embed: {
			color: Colors.INFO,
			title: `Searching Wikipedia just for you ⌛`,
			description: `Please stand by...`,
		},
	});
	let result;
	if (!msg.suffix) {
		const random = await wiki.random(1);
		result = await wiki.page(random[0]);
	} else {
		const search = await wiki.search(msg.suffix, 1);
		if (!search.results.length) {
			return msg.send({
				embed: {
					color: Colors.SOFT_ERR,
					title: "What was that again? 📚🤓",
					description: "A result could not be found for your search query.",
					footer: {
						text: "Check for typos or try something else!",
					},
				},
			});
		}
		result = await wiki.page(search.results[0]);
	}
	let description = await result.summary();
	if (description.length < 100) {
		// 100 is a bit short so load the full description in that case
		description = await result.content();
	}
	if (description.length > 2040) {
		description = `${description.substring(0, 2040)}...`;
	}
	// Sometimes wikijs crashes when attempting to grab a main image. If it works, great. If not, too bad.
	const mainImage = await result.mainImage().catch(() => null);
	const fields = [
		{
			name: "Permalink",
			value: result.raw.fullurl,
			inline: false,
		},
	];
	msg.send({
		embed: {
			color: Colors.RESPONSE,
			title: result.raw.title,
			description,
			fields,
			image: {
				url: mainImage,
			},
		},
	});
};
