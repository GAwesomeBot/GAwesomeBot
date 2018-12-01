const { get } = require("snekfetch");
const PaginatedEmbed = require("../../Modules/MessageUtils/PaginatedEmbed");

module.exports = async ({ Constants: { Colors, Text, APIs } }, { serverDocument }, msg, commandData) => {
	let number = msg.suffix;
	if (number < 1) number = serverDocument.config.command_fetch_properties.default_count;
	else if (number > serverDocument.config.command_fetch_properties.max_count) number = serverDocument.config.command_fetch_properties.max_count;
	else if (isNaN(number)) number = serverDocument.config.command_fetch_properties.default_count;
	else number = parseInt(number);

	const { body, statusCode, statusText } = await get(APIs.DOGFACT(number));
	if (statusCode === 200 && body && body.facts.length) {
		const descriptions = [];
		body.facts.forEach(d => {
			descriptions.push(d);
		});
		const menu = new PaginatedEmbed(msg, {
			color: Colors.RESPONSE,
			title: `Dog fact {currentPage} out of {totalPages}`,
			footer: ``,
		}, {
			descriptions,
		});
		await menu.init();
	} else {
		winston.verbose(`Failed to fetch dog facts...`, { svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id, statusCode, err: statusText });
		msg.send({
			embed: {
				color: Colors.SOFT_ERR,
				title: Text.COMMAND_ERR(),
				description: `I was unable to fetch your perfect dog facts...`,
			},
		});
	}
};
