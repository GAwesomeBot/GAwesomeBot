const { Structures } = require("discord.js");

module.exports = () => {
	Structures.extend("Guild", Guild => {
		class GABGuild extends Guild {
			get defaultChannel () {
				if (this.channels.filter(c => c.type === "text").size === 0) return null;

				let generalChannel = this.channels.find(ch => (ch.name === "general" || ch.name === "mainchat") && ch.type === "text");
				if (generalChannel && generalChannel.permissionsFor(this.me).has(["VIEW_CHANNEL", "SEND_MESSAGES"])) {
					return generalChannel;
				}
				const defaultChannel = this.channels.filter(c => c.type === "text" && c.permissionsFor(this.me).has(["VIEW_CHANNEL", "SEND_MESSAGES"]))
					.sort((a, b) => a.rawPosition - b.rawPosition)
					.first();
				if (!defaultChannel) return null;
				return defaultChannel;
			}

			get serverDocument () {
				return this.client.cache.get(this.id);
			}

			get commandPrefix () {
				if (this._commandPrefix) return this._commandPrefix;
				Object.defineProperty(this, "_commandPrefix", {
					value: this.client.getCommandPrefix(this, this.serverDocument),
					enumerable: false,
				});
				return this._commandPrefix;
			}
		}
		return GABGuild;
	});

	Structures.extend("Message", Message => {
		class GABMessage extends Message {
			constructor (client, data, channel) {
				super(client, data, channel);
				if (channel.guild) {
					client.checkCommandTag(data.content, channel.guild.serverDocument)
						.then(object => {
							Object.defineProperty(this, "_commandObject", {
								enumerable: false,
								value: object,
							});
						});
				} else {
					let command = data.content.toLowerCase().trim();
					let suffix = null;
					if (command.includes(" ")) {
						command = command.split(/\s+/)[0].trim();
						suffix = data.content.split(/\s+/)
							.splice(1)
							.join(" ")
							.trim();
					}
					Object.defineProperty(this, "_commandObject", {
						enumerable: false,
						value: {
							command,
							suffix,
						},
					});
				}
			}

			get command () {
				return this._commandObject.command || null;
			}

			get suffix () {
				return this._commandObject.suffix || null;
			}
		}
		return GABMessage;
	});

	Structures.extend("GuildMember", GuildMember => {
		class GABGuildMember extends GuildMember {
			get memberDocument () {
				let doc = this.guild.serverDocument.members.id(this.id);
				if (!doc) {
					this.guild.serverDocument.members.push({ _id: this.id });
					doc = this.guild.serverDocument.members.id(this.id);
				}
				return doc;
			}
		}
		return GABGuildMember;
	});
};
