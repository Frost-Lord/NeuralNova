const { EmbedBuilder, PermissionsBitField, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const GenerationSchema = require("../../database/Schema/generation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("manage the bot"),
  run: async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      const embed = new EmbedBuilder()
        .setTitle("Error")
        .setDescription("You need to have the 'ADMINISTRATOR' permission to run this command.")
        .setColor("RED");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const data = await GenerationSchema.findOne({ id: 1 });

    if (!data) {
      await new GenerationSchema({
        id: 1,
        Generation: 0,
        CPUhours: 0,
        Lastmessage: "None",
        Lastintent: "None",
      }).save();
    }

    const totalSeconds = data.CPUhours || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const seconds = totalSeconds % 3600;
    const formattedTime = `${hours}h ${seconds.toFixed(2)}s`;

    const embed = new EmbedBuilder()
      .setTitle("Tensor Information:")
      .setColor(0x00ff00)
      .setDescription(`The following are the statistics for the bot's TensorFlow model: \n **Note:** The bot's TensorFlow model is currently in beta. \n\n **Generation:** \n  \`\`\` ${data.Generation || 0} \`\`\` \n **TensorFlow GPU hours:** \n \`\`\` ${formattedTime} \`\`\` \n **Last message inputted:** \n \`\`\` ${data.Lastmessage || 'None'} \`\`\` \n **Last intent selected:** \n \`\`\` ${data.Lastintent || 'None'} \`\`\``)

    return interaction.reply({ embeds: [embed] });

  },
};
