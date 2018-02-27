const PaginatedEmbed = require("../../Modules/MessageUtils/PaginatedEmbed");

module.exports = async ({ configJS, Constants: { Colors, Text } }, { serverDocument }, msg, commandData) => {
	if (msg.suffix) {
		const createCount = async name => {
			const prompt = await msg.channel.send({
				embed: {
					color: Colors.PROMPT,
					description: `I can't find a count called \`${name}\`.\nWould you like to create it? ✏`,
					footer: {
						text: "You have 1 minute to respond.",
					},
				},
			});
			const response = (await msg.channel.awaitMessages(res => res.author.id === msg.author.id, { max: 1, time: 60000 })).first();
			if (response) {
				try {
					await response.delete();
				} catch (_) {
					// /shrug
				}
			}
			if (response && configJS.yesStrings.includes(response.content.toLowerCase().trim())) {
				serverDocument.config.count_data.push({ _id: name });
				prompt.edit({
					embed: {
						color: Colors.SUCCESS,
						description: `Started counting **${name}** 🔢`,
						footer: {
							text: `Use "${msg.guild.commandPrefix}${commandData.name} ${name} | +1" to increment the count or "${msg.guild.commandPrefix}${commandData.name} ${name} | ." to stop counting.`,
						},
					},
				});
			}
		};
		if (msg.suffix.includes("|")) {
			const params = msg.suffix.split("|").trimAll();
			if (params.length === 2 && params[0] && (!params[1] || [".", "+1", "++", "-1", "--", "-", "+"].includes(params[1]))) {
				const countDocument = serverDocument.config.count_data.id(params[0].toLowerCase().trim());
				if (countDocument) {
					let action;
					switch (params[1]) {
						case "":
						case ".":
							countDocument.remove();
							msg.send({
								embed: {
									color: Colors.SUCCESS,
									title: `Poof! 💨 "${countDocument._id}" is gone!`,
									description: `\`${countDocument._id}\` ended at \`${countDocument.value}\`.`,
								},
							});
							return;
						case "+1":
						case "++":
						case "+":
							action = "📈";
							countDocument.value++;
							break;
						case "-1":
						case "--":
						case "-":
							if (countDocument.value > 0) {
								action = "📉";
								countDocument.value--;
								break;
							} else {
								msg.send({
									embed: {
										color: Colors.SOFT_ERR,
										description: "Sorry, but we're all about positivity here 🙃",
									},
								});
								return;
							}
					}
					msg.send({
						embed: {
							color: Colors.SUCCESS,
							description: `\`${countDocument._id}\` is now at **${countDocument.value}** ${action}`,
						},
					});
				} else {
					createCount(params[0].toLowerCase());
				}
			} else {
				winston.verbose(`Invalid parameters "${msg.suffix}" provided for ${commandData.name} command`, { svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id });
				msg.send({
					embed: {
						color: Colors.INVALID,
						description: Text.INVALID_USAGE(commandData),
					},
				});
			}
		} else {
			const countDocument = serverDocument.config.count_data.id(msg.suffix.toLowerCase().trim());
			if (countDocument) {
				msg.send({
					embed: {
						color: Colors.INFO,
						description: `\`${countDocument._id}\` is currently at **${countDocument.value}** 📊`,
						footer: {
							text: `Use "${msg.guild.commandPrefix}${commandData.name} ${countDocument._id} | +1" to increment the count or "${msg.guild.commandPrefix}${commandData.name} ${countDocument._id} | -1" to subtract from it.`,
						},
					},
				});
			} else {
				createCount(msg.suffix.toLowerCase().trim());
			}
		}
	} else {
		const info = serverDocument.config.count_data.map(countDocument => countDocument._id).sort();
		if (info.length) {
			const chunks = info.map(count => {
				const countDocument = serverDocument.config.count_data.id(count);
				return [
					`» **${countDocument._id}** «`,
					`\tCurrently at **${countDocument.value}** 📊`,
				].join("\n");
			}).chunk(10);
			const description = [];
			for (const chunk of chunks) {
				description.push(chunk.join("\n\n"));
			}
			const menu = new PaginatedEmbed(msg, description, {
				title: `There ${info.length === 1 ? "is" : "are"} ${info.length} count${info.length === 1 ? "" : "s"} on "${msg.guild}" 📋`,
				color: Colors.INFO,
				footer: `Page {current description} out of {total descriptions}`,
			});
			await menu.init();
		} else {
			msg.send({
				embed: {
					color: Colors.INFO,
					description: `No one on this server is counting anything 📒`,
					footer: {
						text: `Use "${msg.guild.commandPrefix}${commandData.name} <name>" to start tallying something`,
					},
				},
			});
		}
	}
};
