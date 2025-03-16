import { Client, SlashCommandBuilder, TextChannel } from "discord.js";
import { COMMANDS, INTERACTIONS } from "./constants";
import cron from "node-cron";
import { globalState } from ".";
import { tagUser } from "./util";

export const registerCommands = (client: Client) => {
  const accept = new SlashCommandBuilder()
    .setName(COMMANDS.ACCEPT)
    .setDescription("Accept today turn");

  const skip = new SlashCommandBuilder()
    .setName(COMMANDS.SKIP)
    .setDescription("Skip today turn");

  const list = new SlashCommandBuilder()
    .setName(COMMANDS.LIST)
    .setDescription("List the current booking list");

  const add = new SlashCommandBuilder()
    .setName(COMMANDS.ADD)
    .setDescription("Add a new member to the booking list");

  const remove = new SlashCommandBuilder()
    .setName(COMMANDS.REMOVE)
    .setDescription("Remove a member from the booking list");

  const reset = new SlashCommandBuilder()
    .setName(COMMANDS.RESET)
    .setDescription("Reset the booking to the initial state");

  const resetQueue = new SlashCommandBuilder()
    .setName(COMMANDS.RESET_QUEUE)
    .setDescription("Start over the booking queue");

  const configChannel = new SlashCommandBuilder()
    .setName(COMMANDS.CONFIG_CHANNEL)
    .setDescription("Config the channel to announce the next booking member");

  const setReminderTime = new SlashCommandBuilder()
    .setName(COMMANDS.SET_REMINDER_TIME)
    .setDescription("Set the reminder time to announce the next booking member")
    .addStringOption((option) =>
      option
        .setName(INTERACTIONS.TIME_INPUT_KEY)
        .setDescription(
          "The time to announce the next booking member with format HH:mm (e.g. 14:00)"
        )
        .setRequired(true)
    );

  client.application?.commands.create(accept);
  client.application?.commands.create(list);
  client.application?.commands.create(add);
  client.application?.commands.create(remove);
  client.application?.commands.create(reset);
  client.application?.commands.create(skip);
  client.application?.commands.create(configChannel);
  client.application?.commands.create(resetQueue);
  client.application?.commands.create(setReminderTime);
};

export const registerCronJob = (client: Client) => {
  // Run cron job to announce the next booking member
  cron.schedule("0 * * * * *", () => {
    console.log("🔄 Running cron job...");

    const guilds = client.guilds.cache;

    guilds.forEach(async (guild) => {
      const guildState = globalState.get(guild.id);
      const members = guildState.getMembersInQueue();

      if (members.length === 0) {
        return;
      }

      // check if the current time is matched with the reminder time
      const shouldAnnounce = guildState.isTimeToAnnounce();

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

      channel.send(`Next booking member is: ${tagUser(nextMemberId)}`);
    });
  });
};
