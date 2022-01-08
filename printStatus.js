const mcServerUtil = require("minecraft-server-util");

let config;
try {
  config = require("./config.json");
} catch (_) {}
config ||= {};
config.mcserver_address ||= "localhost";
config.mcserver_port ||= 25565;

const run = async () => {
  console.log(
    `Querying ${config.mcserver_address}:${config.mcserver_port}...\n`
  );

  try {
    const serverStatus = await mcServerUtil.status(
      config.mcserver_address,
      config.mcserver_port
    );

    console.log("Server online.");
    console.log("Version:", serverStatus.version.name);
    console.log("MOTD:", serverStatus.motd.clean);
    console.log(
      "Players:",
      `${serverStatus.players.online} out of ${serverStatus.players.max}`
    );
    console.log(
      "Player sample:",
      `${serverStatus.players.sample?.map((p) => p.name).join(", ")}`
    );
  } catch (err) {
    console.log("Server offline.");
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
