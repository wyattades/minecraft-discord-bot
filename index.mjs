import discord from "discord.js";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";

import { getConfig } from "./getConfig.mjs";
import { getMcStatus } from "./mcStatus.mjs";
import { commands } from "./commands.mjs";
import { subscribeToMcStatus } from "./mcStatus.mjs";

const discordClient = new discord.Client({
  intents: [],
});

const restApi = new REST({ version: "9" }).setToken(getConfig().bot_token);

// const updateBotDetails = async ({ avatar, username }) => {
//   await discordClient.user.setAvatar(avatar);
//   await discordClient.user.setUsername(username);
// };

const updateBotStatus = async ({
  online,
  playersOnline,
  samplePlayerNames,
}) => {
  console.log("Updating bot status:", {
    online,
    playersOnline,
    samplePlayerNames,
  });

  let status, message;
  if (online) {
    if (playersOnline > 0) {
      status = "online";
      message = `${playersOnline} player${
        playersOnline === 1 ? "" : "s"
      } online :bite:`;
    } else {
      status = "idle";
      message = "No one online 😿";
    }
  } else {
    status = "dnd";
    message = "Offline 🛑";
  }

  await discordClient.user.setPresence({
    status,
    activities: [
      {
        type: "PLAYING",
        name: message,
      },
    ],
  });

  console.log("Bot updated.");
};

const commandsJson = commands.map((command) => command.builder.toJSON());

const setupGuilds = async () => {
  const guilds = await discordClient.guilds.fetch();

  await Promise.all(
    [...guilds.values()].map(async (guild) => {
      await restApi.put(
        Routes.applicationGuildCommands(getConfig().client_id, guild.id),
        {
          body: commandsJson,
        }
      );
    })
  );

  discordClient.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    const command = commands.find((c) => c.builder.name === commandName);
    if (command) {
      await command.onInteraction(interaction);
    }
  });

  console.log(
    `Registered ${commands.length} commands for ${guilds.size} guilds\n`
  );
};

const run = async () => {
  discordClient.on("error", (err) => {
    console.error("discord client error:", err);
  });

  await discordClient.login(getConfig().bot_token);

  console.log("Discord bot client is online!\n");

  setupGuilds();
  subscribeToMcStatus(updateBotStatus);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
