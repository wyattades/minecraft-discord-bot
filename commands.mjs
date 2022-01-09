import { SlashCommandBuilder } from "@discordjs/builders";

import { getMcStatusCache } from "./mcStatus.mjs";

export const commands = [
  {
    builder: new SlashCommandBuilder()
      .setName("mcstatus")
      .setDescription("View the status of the Minecraft server"),

    onInteraction: async () => {
      if (!getMcStatusCache()?.online) {
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
              .addField(
                "Players:",
                getMcStatusCache().samplePlayerNames.join(", ") || "none"
              )
              .addField("MOTD:", getMcStatusCache().motd || "none")
              .addField("MC Version:", getMcStatusCache().mcVersion || "???")
              .setImage(
                "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fi0.kym-cdn.com%2Fphotos%2Fimages%2Foriginal%2F001%2F289%2F984%2F425.png&f=1&nofb=1"
              ),
          ],
        });
      }
    },
  },
];
