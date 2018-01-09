const { RandomAnimals } = require("../../Modules/");

module.exports = async ({ Constants: { Colors } }, documents, msg, commandData) => {
	let m = await msg.channel.send({
		embed: {
			color: Colors.INFO,
			title: `We're getting you a cute dog picture 🐶`,
			description: `Please stand by...`,
		},
	});
	try {
		let dog = await RandomAnimals.dog();
		if (dog) {
			m.edit({
				embed: {
					color: Colors.LIGHT_GREEN,
					title: `Here's your adorale dog picture! Woof! 🐶`,
					image: {
						url: dog,
					},
				},
			});
		}
	} catch (err) {
		return m.edit({
			embed: {
				color: Colors.SOFT_ERR,
				description: `I failed to fetch a dog picture...`,
				footer: {
					text: `Pwease try again...`,
				},
			},
		});
	}
};
