const BaseEvent = require("../BaseEvent");
const { Colors } = require("../../Constants");

class VoteHandler extends BaseEvent {
	requirements (msg) {
		if (!msg.guild) return false;
		if (msg.editedAt) return false;
		if (msg.author.id === this.client.user.id || msg.author.bot || this.configJSON.userBlocklist.includes(msg.author.id)) {
			if (msg.author.id === this.client.user.id) {
				return false;
			} else {
				winston.silly(`Ignored ${msg.author.tag} for vote handler.`, { usrid: msg.author.id, globallyBlocked: this.configJSON.userBlocklist.includes(msg.author.id) });
				return false;
			}
		}
		return true;
	}
	async prerequisite (msg) {
		this.serverDocument = await this.client.cache.get(msg.guild.id);
	}

	async handle (msg) {
		// Vote based on mention
		if (this.serverDocument && this.serverDocument.config.commands.points.isEnabled && msg.guild.members.size > 2 &&
			!this.serverDocument.config.commands.points.disabled_channel_ids.includes(msg.channel.id) &&
			msg.content.startsWith("<@") && msg.content.indexOf(">") < msg.content.indexOf(" ") && msg.content.includes(" ") &&
			msg.content.indexOf(" ") < msg.content.length - 1) {
			let member;
			try {
				member = await this.client.memberSearch(msg.content.split(/\s+/)[0].trim(), msg.guild);
			} catch (_) {
				member = null;
			}
			const voteString = msg.content.split(/\s+/).splice(1).join(" ");
			if (member && ![this.client.user.id, msg.author.id].includes(member.id) && !member.user.bot) {
				const targetUserDocument = await Users.findOne({ _id: member.id });
				if (targetUserDocument) {
					let voteAction = null;

					// Check for +1 triggers
					for (const voteTrigger of this.configJS.voteTriggers) {
						if (voteString.startsWith(voteTrigger)) {
							voteAction = "upvoted";
							// Increment points and exit loop
							targetUserDocument.points++;
							break;
						}
					}

					// Check for gild trigger
					if (voteString.startsWith("gild") || voteString.startsWith("guild")) {
						voteAction = "gilded";
					}

					// Log and save changes, if necessary
					if (voteAction) {
						const saveTargetUserDocument = async () => {
							try {
								await targetUserDocument.save();
							} catch (err) {
								winston.debug(`Failed to save user data for points`, { usrid: member.id }, err);
							}
							winston.silly(`User "${member.user.tag}" ${voteAction} by user "${msg.author.tag}" on server "${msg.guild}"`, { svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id });
						};

						if (voteAction === "gilded") {
							// Get author data
							const authorDocument = await Users.findOne({ _id: msg.author.id });
							if (authorDocument) {
								if (authorDocument.points > 10) {
									authorDocument.points -= 10;
									await authorDocument.save().catch(err => {
										winston.debug("Failed to save user data for points", { usrid: msg.author.id }, err);
									});
									targetUserDocument.points += 10;
									await saveTargetUserDocument();
								} else {
									winston.verbose(`User "${msg.author.tag}" does not have enough points to gild "${member.user.tag}"`, { svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id });
									msg.channel.send({
										embed: {
											color: Colors.SOFT_ERR,
											description: `Hey ${msg.author}, you don't have enough GAwesomePoints to gild ${member}!`,
										},
									});
								}
							}
						} else {
							await saveTargetUserDocument();
						}
					}
				}
			}
		}

		// Vote based on previous message
		for (const voteTrigger of this.configJS.voteTriggers) {
			if (msg.content.trim().startsWith(voteTrigger)) {
				// Get previous message
				let fetchedMessages = await msg.channel.messages.fetch({ limit: 1, before: msg.id }).catch(err => {
					winston.debug(`Failed to fetch message for voting...`, err);
					fetchedMessages = null;
				});
				const message = fetchedMessages && fetchedMessages.first();
				if (message && ![this.client.user.id, msg.author.id].includes(message.author.id) && !message.author.bot) {
					// Get target user data
					const targetUserDocument = await Users.findOne({ _id: message.author.id });
					if (targetUserDocument) {
						winston.info(`User "${message.author.tag}" upvoted by user "${msg.author.tag}" on server "${msg.guild}"`, { svrid: msg.guild.id, chid: msg.channel.id, usrid: msg.author.id });

						// Increment points
						targetUserDocument.points++;

						// Save changes to targetUserDocument2
						await targetUserDocument.save().catch(err => {
							winston.debug(`Failed to save user data for points`, { usrid: msg.author.id }, err);
						});
					}
				}
				break;
			}
		}
	}
}

module.exports = VoteHandler;
