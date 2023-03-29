const { EmbedBuilder, PermissionsBitField, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const TrainingSchema = require("../../database/Schema/training");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addtraining")
    .setDescription("add training data to the ai model")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("The text to add to the training data")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("intent")
        .setDescription("The intent of the training data")
        .setRequired(true)
    ),
  run: async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription("You need to have the 'ADMINISTRATOR' permission to run this command.")
        .setColor("RED");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const text = interaction.options.getString("text");
    const intent = interaction.options.getString("intent");

    const data = await TrainingSchema.findOne({ text: text });
    if (data) {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription("This training data already exists.")
        .setColor("RED");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      const newData = new TrainingSchema({
        text: text,
        intent: intent,
      });
      await newData.save().catch((err) => console.log(err));
      const embed = new EmbedBuilder()
        .setTitle("Success")
        .setDescription("The training data has been added to the database.")
        .setColor(0x00FF00);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

  },
};
