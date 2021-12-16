const mcServerUtil = require("minecraft-server-util");
const discord = require("discord.js");

const config = require("./config.json");

const discordClient = new discord.Client({
  intents: [],
});

let statusCache = null;

const pollingInterval = config.polling_interval ?? 10000;

const statusDifferent = (prev, next) => {
  if (prev.online !== next.online) return true;
  if (prev.playersOnline !== next.playersOnline) return true;
  return false;
};

const updateBotStatus = async ({ playersOnline, online }) => {
  console.log("Updating bot status:", { playersOnline, online });

  if (online) {
    if (playersOnline > 0) {
      await discordClient.user.setActivity(
        `${playersOnline} player${playersOnline === 1 ? "" : "s"} online`,
        {
          type: "PLAYING",
        }
      );
      await discordClient.user.setStatus("online");
    } else {
      await discordClient.user.setActivity("No one online ☹️", {
        type: "PLAYING",
      });
      await discordClient.user.setStatus("idle");
    }
  } else {
    await discordClient.user.setActivity("Offline 🛑", { type: "PLAYING" });
    await discordClient.user.setStatus("dnd");
  }

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
      .status(config.mcserver_address, config.mcserver_port ?? 25565)
      .then((s) => ({
        playersOnline: s.players.online,
        online: true,
      }))
      .catch(() => ({
        playersOnline: null,
        online: false,
      }));

    if (!statusCache || statusDifferent(statusCache, serverStatus)) {
      updateBotStatus(serverStatus).catch((err) => {
        console.error("failed to update bot status", err);
      });

      statusCache = serverStatus;
    }
  }, pollingInterval);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
