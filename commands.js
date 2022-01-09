const { SlashCommandBuilder } = require("@discordjs/builders");

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

exports.commands = commands;
