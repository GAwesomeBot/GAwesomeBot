const moment = require("moment");
const { parseAuthUser, getRoundedUptime } = require("../helpers");

module.exports = async (req, res) => {
	const uptime = process.uptime();
	const guildSize = await req.app.client.guilds.totalCount;
	const userSize = await req.app.client.users.totalCount;
	res.render("pages/landing.ejs", {
		authUser: req.isAuthenticated() ? parseAuthUser(req.user) : null,
		bannerMessage: configJSON.homepageMessageHTML,
		rawServerCount: guildSize,
		roundedServerCount: Math.floor(guildSize / 100) * 100,
		rawUserCount: `${Math.floor(userSize / 1000)}K`,
		rawUptime: moment.duration(uptime, "seconds").humanize(),
		roundedUptime: getRoundedUptime(uptime),
	});
};
