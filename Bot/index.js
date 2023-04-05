const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.MessageContent], shards: "auto", partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction, Partials.GuildScheduledEvent, Partials.User, Partials.ThreadMember] });
const { readdirSync } = require("fs");
const mongoose = require("mongoose");
const moment = require("moment");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
require("dotenv").config();
const TrainingSchema = require("./src/database/Schema/training.js");

if (process.env.TRAININGDATA) {
  const trainingData = JSON.parse(process.env.TRAININGDATA);

  Promise.all(
    trainingData.map(async (data) => {
      if (!data.text) return console.log("No text provided") && process.exit(1);
      if (!data.intent) return console.log("No intent provided") && process.exit(1);
      if (!data.response) return console.log("No response provided") && process.exit(1);
      const training = new TrainingSchema({
        text: data.text,
        intent: data.intent,
        response: data.response
      });
      await training.save().catch((err) => console.log(err));
    })
  ).then(() => {
    console.log("Training Data Saved!");
    delete process.env.TRAININGDATA;
  });
}

client.commands = new Collection()
client.slashcommands = new Collection()
client.commandaliases = new Collection()

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

const log = x => { console.log(`[${moment().format("DD-MM-YYYY HH:mm:ss")}] ${x}`) };


if (!process.env.TOKEN) return log("Please enter your token in the .env file!");
if (!process.env.MONGOURI) return log("Please enter your mongo uri in the .env file!");


mongoose
  .connect(process.env.MONGOURI, {
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

const slashcommands = [];
readdirSync('./src/commands/slash').forEach(async file => {
  const command = await require(`./src/commands/slash/${file}`);
  slashcommands.push(command.data.toJSON());
  client.slashcommands.set(command.data.name, command);
});

client.on("ready", async () => {
  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: slashcommands },
    );
  } catch (error) {
    console.error(error);
  }
  log(`${client.user.username} Activated!`);
})

readdirSync('./src/events').forEach(async file => {
  const event = await require(`./src/events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
});

client.login(process.env.TOKEN).catch(e => {
  console.log(e)
});
