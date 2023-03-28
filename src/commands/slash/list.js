const { EmbedBuilder, PermissionsBitField, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const TrainingSchema = require("../../database/Schema/training");


const MAX_ITEMS_PER_PAGE = 10;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription("list all training data of the ai model"),
  run: async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription("You need to have the 'ADMINISTRATOR' permission to run this command.")
        .setColor("RED");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const data = await TrainingSchema.find({});

    if (data.length === 0) {
      return interaction.reply({
        content: "There are no training data available.",
        ephemeral: true,
      });
    }

    let page = 0;
    let maxPages = Math.ceil(data.length / MAX_ITEMS_PER_PAGE);

    const embed = createEmbed(page, data);

    const leftButton = new ButtonBuilder()
      .setCustomId("previous_page")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("⬅️")
      .setDisabled(true);
    const rightButton = new ButtonBuilder()
      .setCustomId("next_page")
      .setStyle(ButtonStyle.Primary)
      .setEmoji("➡️")
      .setDisabled(maxPages === 1);

    const actionRow = new ActionRowBuilder().addComponents(
      leftButton,
      rightButton
    );

    const message = await interaction.reply({
      embeds: [embed],
      components: [actionRow],
    });

    const filter = (interaction) =>
      interaction.customId === "previous_page" ||
      interaction.customId === "next_page";

    const collector = message.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "previous_page") {
        page--;
      } else if (interaction.customId === "next_page") {
        page++;
      }

      leftButton.setDisabled(page === 0);
      rightButton.setDisabled(page === maxPages - 1);

      const newEmbed = createEmbed(page, data);

      await interaction.update({
        embeds: [newEmbed],
        components: [actionRow],
      });
    });

    collector.on("end", () => {
      actionRow.components.forEach((component) =>
        component.setDisabled(true)
      );
      message.edit({ components: [actionRow] });
    });
  },
};

function createEmbed(page, data) {
  const start = page * MAX_ITEMS_PER_PAGE;
  const end = start + MAX_ITEMS_PER_PAGE;
  const items = data.slice(start, end);

  const embed = new EmbedBuilder()
    .setTitle("**Training Data:**")
    .setColor(0x00FF00)
    .setDescription(`Displaying items: **${start + 1}-${end}** of **${data.length}**`);

  items.forEach((item) => {
    embed.addFields({ name: `Input: ${item.intent}`, value: `Output: ${item.text}`});
  });

  return embed;
};
