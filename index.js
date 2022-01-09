const discord = require("discord.js");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const { getConfig } = require("./getConfig");
const { getMcStatus } = require("./mcStatus");
const { commands } = require("./commands");

const discordClient = new discord.Client({
  intents: [],
});

const restApi = new REST({ version: "9" }).setToken(getConfig().bot_token);

let statusCache = null;

const statusDifferent = (prev, next) => {
  if (prev.online !== next.online) return true;
  if (prev.playersOnline !== next.playersOnline) return true;
  return false;
};

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

const setupStatusPolling = () => {
  setInterval(async () => {
    const serverStatus = await getMcStatus();

    if (!statusCache || statusDifferent(statusCache, serverStatus)) {
      updateBotStatus(serverStatus).catch((err) => {
        console.error("failed to update bot status", err);
      });

      statusCache = serverStatus;
    }
  }, getConfig().polling_interval);
};

const run = async () => {
  discordClient.on("error", (err) => {
    console.error("discord client error:", err);
  });

  await discordClient.login(getConfig().bot_token);

  console.log("Discord bot client is online!\n");

  setupGuilds();
  setupStatusPolling();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
