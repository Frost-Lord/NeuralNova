const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const client = global.client = new Client({
    partials: [
        Partials.Message,
        Partials.GuildPresences,
        Partials.Channel,
        Partials.GuildMember,
        Partials.Reaction,
        Partials.GuildScheduledEvent,
        Partials.User,
        Partials.ThreadMember,
        Partials.MessageReaction,
        Partials.Invite,
        Partials.Webhook,
        Partials.Emoji,
        Partials.Guild,
        Partials.GuildChannel,
        Partials.GuildEmoji,
        Partials.GuildMember,
        Partials.GuildMemberRole,
        Partials.GuildMessage,
        Partials.GuildMessageReaction,
        Partials.GuildRole,
    ],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ],
});

mongoose
    .connect("mongodb://127.0.0.1:27017/AI", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log("Unable to connect to MongoDB Database.\nError: " + err);
    });
mongoose.connection.on("err", (err) => {
    console.error(`Mongoose connection error: \n ${err.stack}`);
});
mongoose.connection.on("disconnected", () => {
    console.log("Mongoose connection disconnected");
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const correctCounts = new Map();
const incorrectCounts = new Map();

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    const { PredictedIntent } = require("./AI");

    const predictionResult = await PredictedIntent(message.content);

    const correctCount = correctCounts.get(message.id) || 0;
    const incorrectCount = incorrectCounts.get(message.id) || 0;

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

    if (predictionResult.predictedIntent) {
        if (predictionResult.predictedIntent === 'none') return;
        const embed = new EmbedBuilder()
            .setTitle('Prediction Result:')
            .setColor(0x0099ff)
            .setDescription(`The predicted intent is **${predictionResult.predictedIntent}** with a confidence of **${predictionResult.maxPrediction.toFixed(2) * 100}%**`);
        const sentMessage = await message.reply({ embeds: [embed], components: [row] });
        correctCounts.set(sentMessage.id, correctCount);
        incorrectCounts.set(sentMessage.id, incorrectCount);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const embed = new EmbedBuilder()
        .setTitle('Feedback')
        .setColor(0x0099ff)
        .setDescription(`Thank you for your feedback!`);

    let correctCount, incorrectCount;
    if (interaction.customId === 'correct') {
        correctCount = (correctCounts.get(interaction.message.id) || 0) + 1;
        correctCounts.set(interaction.message.id, correctCount);
        incorrectCount = incorrectCounts.get(interaction.message.id) || 0;
    } else if (interaction.customId === 'incorrect') {
        correctCount = correctCounts.get(interaction.message.id) || 0;
        incorrectCount = (incorrectCounts.get(interaction.message.id) || 0) + 1;
        incorrectCounts.set(interaction.message.id, incorrectCount);
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
});



client.login("OTg3NjM5MjI4ODk4ODg5NzQ4.GDjIkg.1sYwn6uEFU7p4A9d6I36fjESh5nSZdgnd6e_aI");