const { InteractionType } = require("discord.js");
const MessageSchemas = require("../database/Schema/messages.js");
const { ButtonBuilder, ActionRowBuilder, EmbedBuilder, ButtonStyle } = require("discord.js");

module.exports = {
	name: 'interactionCreate',
	execute: async (interaction) => {
		let client = interaction.client;
		if (interaction.type == InteractionType.ApplicationCommand) {
			if (interaction.user.bot) return;
			try {
				const command = await client.slashcommands.get(interaction.commandName)
				if (!command) return;
				await command.run(client, interaction)
			} catch(e) {
				console.log(e);
				interaction.reply({ content: "A problem was encountered while running the command! Please try again.", ephemeral: true })
			}
		}

		if (interaction.type == 3) {
			if (interaction.user.bot) return;
			try {

				const embed = new EmbedBuilder()
					.setTitle('Feedback')
					.setColor(0x0099ff)
					.setDescription(`Thank you for your feedback!`);

				const MessageData = await MessageSchemas.findOne({ messageid: interaction.message.id });
				if (!MessageData) {
					return;
				}

				if (MessageData.users.includes(interaction.user.id)) {
					return interaction.reply({ content: "You have already voted on this message!", ephemeral: true });
				}

				let correctCount, incorrectCount;
				if (interaction.customId === 'correct') {
					MessageData.correctCount = MessageData.correctCount + 1;
					MessageData.users.push(interaction.user.id);
					MessageData.save();
					correctCount = MessageData.correctCount;
					incorrectCount = MessageData.incorrectCount;
				} else if (interaction.customId === 'incorrect') {
					MessageData.incorrectCount = MessageData.incorrectCount + 1;
					MessageData.users.push(interaction.user.id);
					MessageData.save();
					correctCount = MessageData.correctCount;
					incorrectCount = MessageData.incorrectCount;
				}

				const row = new ActionRowBuilder()
					.addComponents(
						new ButtonBuilder()
							.setStyle(ButtonStyle.Primary)
							.setLabel(`Correct (${correctCount})`)
							.setCustomId('correct'),
						new ButtonBuilder()
							.setStyle(ButtonStyle.Danger)
							.setLabel(`Incorrect (${incorrectCount})`)
							.setCustomId('incorrect')
					);

				await interaction.update({ components: [row] });
				await interaction.followUp({ embeds: [embed], ephemeral: true });
			} catch(e) {
				console.log(e)
				interaction.reply({ content: "A problem was encountered while running the button! Please try again.", ephemeral: true })
			}
		}
	}
}
