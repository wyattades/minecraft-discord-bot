const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const { client_id, bot_token } = require("./config.json");

const commands = [
  new SlashCommandBuilder()
    .setName("mcstatus")
    .setDescription("View the status of the Minecraft server"),
].map((command) => command.toJSON());

const rest = new REST({ version: "9" }).setToken(bot_token);

exports.registerCommands = async (guildId) => {
  await rest.put(Routes.applicationGuildCommands(client_id, guildId), {
    body: commands,
  });
};
