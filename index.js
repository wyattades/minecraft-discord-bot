const mcServerUtil = require("minecraft-server-util");
const discord = require("discord.js");

const { registerCommands } = require("./registerCommands");

let config;
try {
  config = require("./config.json");
} catch (_) {}
config ||= {};
if (typeof config.bot_token !== "string") {
  console.error(
    'A file "config.json" must exist with the key "bot_token" set to a string.'
  );
  process.exit(1);
}
config.mcserver_address ||= "localhost";
config.mcserver_port ||= 25565;
config.polling_interval ||= 10000;

const discordClient = new discord.Client({
  intents: [],
});

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

/**
 * @param {discord.Client} discordClient
 */
const setupGuilds = async (discordClient) => {
  const guilds = await discordClient.guilds.fetch();

  await Promise.all(
    [...guilds.values()].map(async (guild) => {
      await registerCommands(guild.id);
    })
  );

  discordClient.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === "mcstatus") {
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
                `IP: ${config.mcserver_address}:${config.mcserver_port}`
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
    }
  });

  console.log(`Registered commands for ${guilds.size} guilds\n`);
};

const run = async () => {
  await new Promise((resolve) => {
    discordClient.on("ready", resolve);

    discordClient.on("error", (err) => {
      console.error("discord error:", err);
    });

    discordClient.login(config.bot_token);
  });

  console.log("Discord bot client is online!\n");

  setupGuilds(discordClient);

  setInterval(async () => {
    const serverStatus = await mcServerUtil
      .status(config.mcserver_address, config.mcserver_port)
      .then((s) => ({
        motd: s.motd.clean,
        mcVersion: s.version.name,
        samplePlayerNames: s.players.sample?.map((p) => p.name) || [],
        playersOnline: s.players.online,
        online: true,
      }))
      .catch(() => ({
        motd: null,
        mcVersion: null,
        samplePlayerNames: null,
        playersOnline: null,
        online: false,
      }));

    if (!statusCache || statusDifferent(statusCache, serverStatus)) {
      updateBotStatus(serverStatus).catch((err) => {
        console.error("failed to update bot status", err);
      });

      statusCache = serverStatus;
    }
  }, config.polling_interval);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
