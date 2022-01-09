const discord = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");

const { getConfig } = require("./getConfig");
const { getMcStatus } = require("./mcStatus");

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

const commands = [
  {
    builder: new SlashCommandBuilder()
      .setName("mcstatus")
      .setDescription("View the status of the Minecraft server"),
    onInteraction: async () => {
      if (!statusCache) {
        await interaction.reply({
          embeds: [
            new discord.MessageEmbed()
              .setColor("RED")
              .setTitle("Server is offline")
              .setThumbnail(
                "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fwww.clker.com%2Fcliparts%2F3%2F5%2Fc%2Fc%2F13465500031344967687cartoon-ugly-skull-md-hi.png&f=1&nofb=1"
              ),
          ],
        });
      } else {
        const names = statusCache?.samplePlayerNames;

        await interaction.reply({
          embeds: [
            new discord.MessageEmbed()
              .setColor("GREEN")
              .setTitle("Server is online!")
              .setDescription(
                `IP: ${getConfig().mcserver_address}:${
                  getConfig().mcserver_port
                }`
              )
              .setURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
              .addField("Players:", names.join(", ") || "none")
              .addField("MOTD:", statusCache.motd || "none")
              .addField("MC Version:", statusCache.mcVersion || "???")
              .setImage(
                "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fi0.kym-cdn.com%2Fphotos%2Fimages%2Foriginal%2F001%2F289%2F984%2F425.png&f=1&nofb=1"
              ),
          ],
        });
      }
    },
  },
];

const commandsJson = commands.map((command) => command.builder.toJSON());

/**
 * @param {discord.Client} discordClient
 */
const setupGuilds = async (discordClient) => {
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

  console.log(`Registered commands for ${guilds.size} guilds\n`);
};

const run = async () => {
  discordClient.on("error", (err) => {
    console.error("discord client error:", err);
  });

  await discordClient.login(getConfig().bot_token);

  console.log("Discord bot client is online!\n");

  setupGuilds(discordClient);

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

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
