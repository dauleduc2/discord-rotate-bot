import { Client, SlashCommandBuilder, TextChannel } from "discord.js";
import { COMMANDS, INTERACTIONS } from "./constants/commands";
import cron from "node-cron";
import { globalState } from ".";
import { tagUser } from "./utils/user";

export const registerCommands = (client: Client) => {
  const skip = new SlashCommandBuilder()
    .setName(COMMANDS.SKIP)
    .setDescription("Skip today turn");

  const list = new SlashCommandBuilder()
    .setName(COMMANDS.LIST)
    .setDescription("List the current queue");

  const add = new SlashCommandBuilder()
    .setName(COMMANDS.ADD)
    .setDescription("Add one or more members to the queue");

  const remove = new SlashCommandBuilder()
    .setName(COMMANDS.REMOVE)
    .setDescription("Remove a member from the queue");

  const reset = new SlashCommandBuilder()
    .setName(COMMANDS.RESET)
    .setDescription("Reset the queue to the initial state");

  const resetQueue = new SlashCommandBuilder()
    .setName(COMMANDS.START_OVER)
    .setDescription("Start over the queue");

  const configChannel = new SlashCommandBuilder()
    .setName(COMMANDS.CONFIG_CHANNEL)
    .setDescription("Config the channel to announce the member");

  const setReminderTime = new SlashCommandBuilder()
    .setName(COMMANDS.SET_REMINDER_TIME)
    .setDescription("Set the reminder time to announce")
    .addStringOption((option) =>
      option
        .setName(INTERACTIONS.TIME_INPUT_KEY)
        .setDescription("Set daily announce with format HH:mm (e.g. 14:00)")
        .setRequired(true)
    );

  const getInviteLink = new SlashCommandBuilder()
    .setName(COMMANDS.GET_INVITE_LINK)
    .setDescription("Get the invite link of the bot to your server");

  const setWeeklyTime = new SlashCommandBuilder()
    .setName(COMMANDS.SET_WEEKLY_TIME)
    .setDescription("Set the weekly time to announce");

  const viewWeeklyTime = new SlashCommandBuilder()
    .setName(COMMANDS.VIEW_WEEKLY_TIME)
    .setDescription("View the weekly time to announce");

  const help = new SlashCommandBuilder()
    .setName(COMMANDS.HELP)
    .setDescription("Show all commands and description of them");

  client.application?.commands.create(list);
  client.application?.commands.create(add);
  client.application?.commands.create(remove);
  client.application?.commands.create(reset);
  client.application?.commands.create(skip);
  client.application?.commands.create(configChannel);
  client.application?.commands.create(resetQueue);
  client.application?.commands.create(setReminderTime);
  client.application?.commands.create(getInviteLink);
  client.application?.commands.create(setWeeklyTime);
  client.application?.commands.create(viewWeeklyTime);
  client.application?.commands.create(help);
};

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
