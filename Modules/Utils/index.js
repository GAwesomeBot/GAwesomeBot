module.exports = {
	ClearServerStats: require("./ClearServerStats.js"),
	FilterChecker: require("./FilterChecker.js"),
	GetFlagForRegion: require("./GetFlagForRegion.js"),
	GetValue: require("./GetValue.js"),
	Gist: require("./GitHubGist.js"),
	GlobalDefines: require("./GlobalDefines.js"),
	IsURL: url => {
		const pattern = [
			`^(https?:\\/\\/)`,
			`((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|`,
			`((\\d{1,3}\\.){3}\\d{1,3}))`,
			`(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*`,
			`(\\?[;&a-z\\d%_.~+=-]*)?`,
			`(\\#[-a-z\\d_]*)?$`,
		].join("");
		return new RegExp(pattern, "i").test(url);
	},
	MessageOfTheDay: require("./MessageOfTheDay.js"),
	ObjectDefines: require("./ObjectDefines.js"),
	PromiseWait: waitFor => new Promise(resolve => setTimeout(resolve, waitFor)),
	RankScoreCalculator: (messages, voice) => messages + voice,
	RegExpMaker: require("./RegExpMaker.js"),
	RemoveFormatting: require("./RemoveFormatting.js"),
	RSS: require("./RSS.js"),
	SearchiTunes: require("./SearchiTunes.js"),
	SetCountdown: require("./SetCountdown.js"),
	SetReminder: require("./SetReminder.js"),
	Stopwatch: require("./Stopwatch"),
	StreamChecker: require("./StreamChecker.js"),
	StreamerUtils: require("./StreamerUtils.js"),
	StreamingRSS: require("./StreamingRSS.js"),
	StructureExtender: require("./StructureExtender.js"),
};
