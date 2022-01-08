const mcServerUtil = require("minecraft-server-util");
const discord = require("discord.js");

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

const run = async () => {
  await new Promise((resolve) => {
    discordClient.on("ready", resolve);

    discordClient.on("error", (err) => {
      console.error("discord error:", err);
    });

    discordClient.login(config.bot_token);
  });

  console.log("Discord bot client is online!\n");

  setInterval(async () => {
    const serverStatus = await mcServerUtil
      .status(config.mcserver_address, config.mcserver_port)
      .then((s) => ({
        samplePlayerNames: s.players.sample?.map((p) => p.name) || [],
        playersOnline: s.players.online,
        online: true,
      }))
      .catch(() => ({
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
