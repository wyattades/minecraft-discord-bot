const mcServerUtil = require("minecraft-server-util");

const { getConfig } = require("./getConfig");

const getMcStatus = async (
  host = getConfig().mcserver_address,
  port = getConfig().mcserver_port
) => {
  try {
    const s = await mcServerUtil.status(host, port, { timeout: 10000 });

    return {
      motd: s.motd.clean,
      mcVersion: s.version.name,
      samplePlayerNames: s.players.sample?.map((p) => p.name) || [],
      playersOnline: s.players.online,
      online: true,
    };
  } catch (err) {
    return {
      motd: null,
      mcVersion: null,
      samplePlayerNames: null,
      playersOnline: null,
      online: false,
    };
  }
};
exports.getMcStatus = getMcStatus;

const printMcStatus = async () => {
  console.log(
    `Querying ${getConfig().mcserver_address}:${getConfig().mcserver_port}...\n`
  );

  const serverStatus = await getMcStatus();
  if (!serverStatus) {
    console.log("Server offline.");

    return;
  }

  console.log("Server online.");
  console.log("Version:", serverStatus.mcVersion);
  console.log("MOTD:", serverStatus.motd);
  console.log("Players:", serverStatus.playersOnline);
  console.log(
    "Player sample:",
    `${serverStatus.samplePlayerNames?.join(", ") || ""}`
  );
};

exports.printMcStatus = printMcStatus;
