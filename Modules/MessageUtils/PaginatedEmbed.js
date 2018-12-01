const { Colors, PageEmojis } = require("../../Internals/Constants");

class PaginatedEmbed {
	/**
	 * After creating a PaginatedEmbed call `#init()` to set it up and start listening for reactions.
	 *
	 * @param {Message} originalMsg 	The original message that created this paginated embed.
	 * 						May be a custom object, the only required fields are `channel` and `author.id`
	 * @param embedTemplate A slightly edited embed object that serves as the base template for all pages,
	 * 						with strings being formatted via templates
	 * @param pageData		All the data used for the different pages of the embed pages,
	 * 						with the fields being arrays with values (or null) for every page
	 */
	constructor (originalMsg, embedTemplate, {
		authors = [],
		titles = [],
		colors = [],
		urls = [],
		descriptions = [],
		fields = [],
		timestamps = [],
		thumbnails = [],
		images = [],
		footers = [],
		pageCount = null,
	} = {}) {
		this.channel = originalMsg.channel;
		this.authorID = originalMsg.author.id;
		this.pageEmojis = PageEmojis;
		this.pageEmojiArray = [...Object.values(this.pageEmojis)];

		this.authors = authors;
		this.titles = titles;
		this.colors = colors;
		this.urls = urls;
		this.descriptions = descriptions;
		this.fields = fields;
		this.timestamps = timestamps;
		this.thumbnails = thumbnails;
		this.images = images;
		this.footers = footers;

		this.embedTemplate = Object.assign({
			author: "{author}",
			authorIcon: null,
			authorUrl: null,
			title: "{title}",
			color: Colors.INFO,
			url: null,
			description: "{description}",
			fields: null,
			timestamp: null,
			thumbnail: null,
			image: null,
			footer: "{footer}Page {currentPage} out of {totalPages}",
			footerIcon: null,
		}, embedTemplate);

		this.currentPage = 0;
		this.totalPages = pageCount || this.descriptions.length;
	}

	async init (timeout = 300000) {
		await this._sendInitialMessage();
		if (this.totalPages > 1) {
			this.collector = this.msg.createReactionCollector(
				(reaction, user) => user.id === this.authorID && this.pageEmojiArray.includes(reaction.emoji.name),
				{ time: timeout }
			);
			await this._prepareReactions();
			this._startCollector();
		}
	}

	async _prepareReactions () {
		await this.msg.react(this.pageEmojis.back);
		await this.msg.react(this.pageEmojis.stop);
		await this.msg.react(this.pageEmojis.forward);
	}

	async _startCollector () {
		const pageChangeEmojis = [this.pageEmojis.back, this.pageEmojis.forward];
		this.collector.on("collect", reaction => {
			if (reaction.emoji.name === this.pageEmojis.stop) return this.collector.stop();
			if (pageChangeEmojis.includes(reaction.emoji.name)) return this._handlePageChange(reaction);
		});

		this.collector.once("end", this._handleStop.bind(this));
	}

	async _handleStop () {
		try {
			await this.msg.reactions.removeAll();
		} catch (err) {
			winston.verbose(`Failed to clear all reactions for paginated menu, will remove only the bots reaction!`, { err: err.name });
			this.msg.reactions.forEach(r => r.users.remove());
		}
		this.collector = null;
	}

	async _handlePageChange (reaction) {
		switch (reaction.emoji.name) {
			case this.pageEmojis.back: {
				this._removeUserReaction(reaction, this.authorID);
				if (this.currentPage === 0) return;
				this.currentPage--;
				this._updateMessage();
				break;
			}
			case this.pageEmojis.forward: {
				this._removeUserReaction(reaction, this.authorID);
				if (this.currentPage === this.totalPages - 1) return;
				this.currentPage++;
				this._updateMessage();
				break;
			}
		}
	}

	async _removeUserReaction (reaction, user) {
		try {
			await reaction.users.remove(user);
		} catch (err) {
			winston.verbose(`Failed to remove the reaction for user!`, { user, message: reaction.message.id, err: err.name });
		}
	}

	get _currentMessageContent () {
		return {
			embed: {
				author: {
					name: this.embedTemplate.author.format(this._getFormatOptions({ author: this.authors[this.currentPage] || "" })),
					icon_url: this.embedTemplate.authorIcon,
					url: this.embedTemplate.authorUrl,
				},
				title: this.embedTemplate.title.format(this._getFormatOptions({ title: this.titles[this.currentPage] || "" })),
				color: this.colors[this.currentPage] || this.embedTemplate.color,
				url: this.urls[this.currentPage] || this.embedTemplate.url,
				description: this.embedTemplate.description.format(this._getFormatOptions({ description: this.descriptions[this.currentPage] || "" })),
				fields: this.fields[this.currentPage] || this.embedTemplate.fields,
				timestamp: this.timestamps[this.currentPage] || this.embedTemplate.timestamp,
				thumbnail: {
					url: this.thumbnails[this.currentPage] || this.embedTemplate.thumbnail,
				},
				image: {
					url: this.images[this.currentPage] || this.embedTemplate.image,
				},
				footer: {
					text: this.embedTemplate.footer.format(this._getFormatOptions({ footer: this.footers[this.currentPage] || "" })),
					icon_url: this.embedTemplate.footerIcon,
				},
			},
		};
	}

	async _sendInitialMessage () {
		this.msg = await this.channel.send(this._currentMessageContent);
	}

	async _updateMessage () {
		this.msg = await this.msg.edit(this._currentMessageContent);
	}

	_getFormatOptions (obj) {
		return Object.assign({ currentPage: this.currentPage + 1, totalPages: this.totalPages }, obj);
	}
}

module.exports = PaginatedEmbed;
