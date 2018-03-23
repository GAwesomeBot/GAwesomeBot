const { MessageAttachment } = require("discord.js");

module.exports = async ({ client, Constants: { Colors, Text, WorkerTypes } }, documents, msg, commandData) => {
	if (msg.suffix) {
		let m = await msg.channel.send({
			embed: {
				color: Colors.INFO,
				description: `We're processing your input.`,
				footer: {
					text: `This might take a while.`,
				},
			},
		});
		const emojis = msg.suffix.replace(/[\r\n]/g, " ").split(/\s+/).trimAll();
		const { buffer, animated } = await client.workerManager.getValueFromWorker(WorkerTypes.EMOJI, { data: emojis });
		await m.delete();
		await msg.channel.send({
			embed: {
				files: [new MessageAttachment(buffer, `jumbo.${animated ? "gif" : "png"}`)],
				color: Colors.SUCCESS,
				image: {
					url: `attachment://jumbo.${animated ? "gif" : "png"}`,
				},
				description: animated ? [
					`**Please note**`,
					`This image was automatically generated. Thereby, it has some caveats:`,
					`\t- It might show some emojis too fast / slow depending on their original framerate (we render them in 50fps)`,
					`\t- Certain emojis might cut off.`,
				].join("\n") : "",
				footer: {
					// Because he was such a good 🅱️oi
					text: `Credit to TTtie for helping with this command`,
				},
			},
		});
	} else {
		winston.verbose(`Emoji(s) not provided for "${commandData.name}" command`, { svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id });
		msg.send({
			embed: {
				color: Colors.INVALID,
				description: Text.INVALID_USAGE(commandData, msg.guild.commandPrefix),
				title: `What would you like to jumbo today? 🤔`,
			},
		});
	}
};
