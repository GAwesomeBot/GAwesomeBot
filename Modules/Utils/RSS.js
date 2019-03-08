const getRSS = new (require("rss-parser"))();

/**
 * Fetch RSS entries
 * @param {string} url The url of the feed
 * @param {number} num The number of RSS articles to fetch
 * @returns {?array}
 */
module.exports = (url, num) => new Promise((resolve, reject) => {
	getRSS.parseURL(url).then(articles => resolve(articles.items.slice(0, num))).catch(err => {
		winston.debug(`Feed at URL ${url} did not respond with valid RSS.`, { err });
		reject("invalid");
	});
});
