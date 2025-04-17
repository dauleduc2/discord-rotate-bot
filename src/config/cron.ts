import { Client, TextChannel } from "discord.js";
import cron from "node-cron";
import { globalState } from "..";
import { tagUser } from "../utils/user";

export const registerCronJob = (client: Client) => {
  // Run cron job to announce the next member
  cron.schedule("0,10,20,30,40,50 * * * * *", () => {
    console.log(`⏰ Cron job triggered at: ${new Date().toLocaleTimeString()}`);

    const guilds = client.guilds.cache;

    guilds.forEach(async (guild) => {
      const guildState = globalState.get(guild.id);
      const members = guildState.getMembersInQueue();

      if (members.length === 0) {
        return;
      }

      // check if the current time is matched with the reminder time
      const shouldAnnounce =
        guildState.isTimeToAnnounce() || guildState.shouldReAnnounce;

      if (!shouldAnnounce) {
        return;
      }

      const nextMemberId = guildState.getNextMember();

      const channel = guild.channels.cache.find(
        (channel) => channel.id === guildState.getAnnounceChannel()
      );

      if (!channel || !(channel instanceof TextChannel) || !nextMemberId) {
        return;
      }

      guildState.moveNext();
      guildState.shouldReAnnounce = false;
      channel.send(`Next member in queue is: ${tagUser(nextMemberId)}`);
    });
  });
};
