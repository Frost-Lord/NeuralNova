const { EmbedBuilder, PermissionsBitField, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { Train } = require("../../AI/AI.js");
const GenerationSchema = require("../../databse/Schema/generation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("train")
    .setDescription("retrain the ai"),
  run: async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription("You need to have the 'ADMINISTRATOR' permission to run this command.")
        .setColor("RED");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const datagen = await GenerationSchema.findOne({ id: 1 });

    if (!datagen) {
      await new GenerationSchema({
        id: 1,
        Generation: 1,
        CPUhours: 0,
        Lastmessage: "None",
        Lastintent: "None",
      }).save();
    }

    if (datagen) {
      datagen.Generation = datagen.Generation + 1;
      datagen.save();
    }

    

    function generateProgressBar(percentage) {
      const filled = "■";
      const empty = "□";
      const progressBarLength = 20;
      const progressBarFullLength = Math.floor(
        (progressBarLength * percentage) / 100
      );
      const progressBarEmptyLength = progressBarLength - progressBarFullLength;

      const progressBar = [
        filled.repeat(progressBarFullLength),
        empty.repeat(progressBarEmptyLength),
      ].join("");

      const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setLabel(`${percentage}%`)
          .setCustomId('percentagetraining')
          .setDisabled(true),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Success)
          .setLabel(progressBar)
          .setCustomId('percentagebartraining')
          .setDisabled(true)
      );


      return row;
    }

    const Rembed = new EmbedBuilder()
      .setTitle("Retraining the AI")
      .setDescription("Retraining the AI. This may take a while...")
      .setColor(0xffff00);

    const message = await interaction.reply({ embeds: [Rembed] });

    const successEmbed = new EmbedBuilder()
      .setTitle("Success")
      .setDescription("The AI has been retrained successfully.")
      .setColor(0x00FF00);

    const progressBarInterval = setInterval(async() => {
      const currentPercentage = Math.floor((Date.now() - startTime) / 100);
      const progressBar = generateProgressBar(currentPercentage);

      message.edit({
        embeds: [Rembed],
        components: [progressBar.toJSON()],
      });      

      if (currentPercentage >= 100) {
        clearInterval(progressBarInterval);

        message.edit({
          embeds: [successEmbed],
          components: [],
        });
        await Train();
      }
    }, 500);

    const startTime = Date.now();

    const data = await GenerationSchema.findOne({ id: 1 });

    if (!data) {
      await new GenerationSchema({
        id: 1,
        Generation: 1,
        CPUhours: 0,
        Lastmessage: "None",
        Lastintent: "None",
      }).save();
    }

    if (data) {
      data.Generation = data.Generation + 1;
      data.save();
    }
  }
};
