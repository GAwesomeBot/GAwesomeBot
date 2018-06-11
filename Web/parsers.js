/* eslint-disable max-len */
const moment = require("moment");
const xssFilters = require("xss-filters");
const showdown = require("showdown");
const md = new showdown.Converter({
	tables: true,
	simplifiedAutoLink: true,
	strikethrough: true,
	tasklists: true,
	smoothLivePreview: true,
	smartIndentationFix: true,
});
md.setFlavor("github");
const { GetGuild } = require("../Modules").getGuild;

const parsers = module.exports;

parsers.serverData = async (req, serverDocument, webp = false) => {
	let data;
	const svr = new GetGuild(req.app.client, serverDocument._id);
	await svr.initialize(["OWNER", req.app.client.user.id]);
	await svr.fetchProperty("createdAt");
	if (svr.success) {
		const owner = req.app.client.users.get(svr.ownerID) || svr.members[svr.ownerID].user;
		data = {
			name: svr.name,
			id: svr.id,
			icon: req.app.client.getAvatarURL(svr.id, svr.icon, "icons", webp),
			owner: {
				username: owner.username,
				id: owner.id,
				avatar: req.app.client.getAvatarURL(owner.id, owner.avatar, "avatars", webp),
				name: owner.username,
			},
			members: svr.memberCount,
			messages: serverDocument.messages_today,
			rawCreated: moment(svr.createdAt).format(configJS.moment_date_format),
			relativeCreated: Math.ceil((Date.now() - new Date(svr.createdAt)) / 86400000),
			command_prefix: req.app.client.getCommandPrefix(svr, serverDocument),
			category: serverDocument.config.public_data.server_listing.category,
			description: serverDocument.config.public_data.server_listing.isEnabled ? md.makeHtml(xssFilters.inHTMLData(serverDocument.config.public_data.server_listing.description || "No description provided.")) : null,
			invite_link: serverDocument.config.public_data.server_listing.isEnabled ? serverDocument.config.public_data.server_listing.invite_link || "javascript:alert('Invite link not available');" : null,
		};
	}
	return data;
};


parsers.userData = async (req, usr, userDocument) => {
	const botServers = await GetGuild.getAll(req.app.client, { mutualOnlyTo: usr.id, fullResolveMembers: ["OWNER"], parse: "noKeys" });
	const mutualServers = botServers.sort((a, b) => a.name.localeCompare(b.name));
	const userProfile = {
		username: usr.username,
		discriminator: usr.discriminator,
		avatar: usr.avatarURL() || "/static/img/discord-icon.png",
		id: usr.id,
		status: usr.presence.status,
		game: await req.app.client.getGame(usr),
		roundedAccountAge: moment(usr.createdAt).fromNow(),
		rawAccountAge: moment(usr.createdAt).format(configJS.moment_date_format),
		backgroundImage: userDocument.profile_background_image || "http://i.imgur.com/8UIlbtg.jpg",
		points: userDocument.points || 1,
		lastSeen: userDocument.last_seen ? moment(userDocument.last_seen).fromNow() : null,
		rawLastSeen: userDocument.last_seen ? moment(userDocument.last_seen).format(configJS.moment_date_format) : null,
		pastNameCount: (userDocument.past_names || {}).length || 0,
		isAfk: userDocument.afk_message !== undefined && userDocument.afk_message !== "" && userDocument.afk_message !== null,
		isMaintainer: configJSON.maintainers.includes(usr.id) || configJSON.sudoMaintainers.includes(usr.id),
		isContributor: configJSON.wikiContributors.includes(usr.id) || configJSON.maintainers.includes(usr.id) || configJSON.sudoMaintainers.includes(usr.id),
		isSudoMaintainer: configJSON.sudoMaintainers.includes(usr.id),
		mutualServers: [],
		mutualServerCount: mutualServers.length,
	};
	switch (userProfile.status) {
		case "online":
			userProfile.statusColor = "is-success";
			break;
		case "idle":
			userProfile.statusColor = "is-warning";
			break;
		case "dnd":
			userProfile.statusColor = "is-danger";
			userProfile.status = "Do Not Disturb";
			break;
		case "offline":
		default:
			userProfile.statusColor = "is-dark";
			break;
	}
	if (userDocument.isProfilePublic) {
		let profileFields;
		if (userDocument.profile_fields) {
			profileFields = {};
			for (const key in userDocument.profile_fields) {
				profileFields[key] = md.makeHtml(xssFilters.inHTMLData(userDocument.profile_fields[key]));
				profileFields[key] = profileFields[key].substring(3, profileFields[key].length - 4);
			}
		}
		userProfile.profileFields = profileFields;
		userProfile.pastNames = userDocument.past_names;
		userProfile.afkMessage = userDocument.afk_message;
		for (const svr of mutualServers) {
			const owner = svr.members[svr.ownerID];
			userProfile.mutualServers.push({
				name: svr.name,
				id: svr.id,
				icon: req.app.client.getAvatarURL(svr.id, svr.icon, "icons"),
				owner: owner.username,
			});
		}
	}
	return userProfile;
};

parsers.extensionData = async (req, galleryDocument) => {
	const owner = await req.app.client.users.fetch(galleryDocument.owner_id, true) || {};
	let typeIcon, typeDescription;
	switch (galleryDocument.type) {
		case "command":
			typeIcon = "magic";
			typeDescription = galleryDocument.key;
			break;
		case "keyword":
			typeIcon = "key";
			typeDescription = galleryDocument.keywords.join(", ");
			break;
		case "timer":
			typeIcon = "clock-o";
			if (moment(galleryDocument.interval)) {
				const interval = moment.duration(galleryDocument.interval);
				typeDescription = `${interval.hours()} hour(s) and ${interval.minutes()} minute(s)`;
			} else {
				typeDescription = `${galleryDocument.interval}ms`;
			}
			break;
		case "event":
			typeIcon = "code";
			typeDescription = `${galleryDocument.event}`;
			break;
	}
	return {
		_id: galleryDocument._id,
		name: galleryDocument.name,
		type: galleryDocument.type,
		typeIcon,
		typeDescription,
		description: md.makeHtml(xssFilters.inHTMLData(galleryDocument.description)),
		featured: galleryDocument.featured,
		owner: {
			name: owner.username || "invalid-user",
			id: owner.id || "invalid-user",
			discriminator: owner.discriminator || "0000",
			avatar: owner.avatarURL() || "/static/img/discord-icon.png",
		},
		status: galleryDocument.state,
		points: galleryDocument.points,
		relativeLastUpdated: moment(galleryDocument.last_updated).fromNow(),
		rawLastUpdated: moment(galleryDocument.last_updated).format(configJS.moment_date_format),
		scopes: galleryDocument.scopes,
		fields: galleryDocument.fields,
		timeout: galleryDocument.timeout,
	};
};

parsers.blogData = async (req, blogDocument) => {
	const author = await req.app.client.users.fetch(blogDocument.author_id, true) || {
		id: "invalid-user",
		username: "invalid-user",
	};
	let categoryColor;
	switch (blogDocument.category) {
		case "Development":
			categoryColor = "is-warning";
			break;
		case "Announcement":
			categoryColor = "is-danger";
			break;
		case "New Stuff":
			categoryColor = "is-info";
			break;
		case "Tutorial":
			categoryColor = "is-success";
			break;
		case "Random":
			categoryColor = "is-primary";
			break;
	}
	const avatarURL = (await req.app.client.users.fetch(blogDocument.author_id, true)).avatarURL();
	return {
		id: blogDocument._id,
		title: blogDocument.title,
		author: {
			name: author.username,
			id: author.id,
			avatar: avatarURL || "/static/img/discord-icon.png",
		},
		category: blogDocument.category,
		categoryColor,
		rawPublished: moment(blogDocument.published_timestamp).format(configJS.moment_date_format),
		roundedPublished: moment(blogDocument.published_timestamp).fromNow(),
		content: blogDocument.content,
	};
};

parsers.commandOptions = (req, command, data) => {
	const serverDocument = req.svr.document;

	const commandData = req.app.client.getPublicCommandMetadata(command);
	if (commandData) {
		if (!serverDocument.config.commands[command]) {
			serverDocument.config.commands[command] = {};
		}
		if (commandData.defaults.adminLevel < 4) {
			serverDocument.config.commands[command].isEnabled = data[`${command}-isEnabled`] === "on";
			serverDocument.config.commands[command].admin_level = data[`${command}-adminLevel`] || 0;
			serverDocument.config.commands[command].disabled_channel_ids = [];
			Object.values(req.svr.channels).forEach(ch => {
				if (ch.type === "text") {
					if (!data[`${command}-disabled_channel_ids-${ch.id}`]) {
						serverDocument.config.commands[command].disabled_channel_ids.push(ch.id);
					}
				}
			});
		}
	}
};
