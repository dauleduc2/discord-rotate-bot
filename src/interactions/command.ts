import {
  ActionRowBuilder,
  CommandInteraction,
  StringSelectMenuBuilder,
} from "discord.js";

import { COMMANDS, INTERACTIONS } from "../constants/commands";
import { client } from "..";
import { TIME_INPUT_FORMAT_REGEX } from "../constants/regex";
import { GlobalState } from "../store/globalState";
import { ENV_VARIABLES } from "../constants/envVariables";
import { WEEKLY_DAYS } from "../constants/time";
import { isPassPrecheck } from "../utils/command";
import {
  getGuildMembers,
  membersToSelectOptions,
  tagUser,
} from "../utils/user";
import { weekTimeToSelections } from "../utils/time";

export const handleCommand = async (
  interaction: CommandInteraction,
  globalState: GlobalState<string>
) => {
  const { user, guildId } = interaction;
  if (!guildId) return;

  const { commandName } = interaction;
  const precheckError = isPassPrecheck(commandName, guildId, globalState);
  const guildState = globalState.get(guildId);

  if (precheckError) {
    await interaction.reply(precheckError);
    return;
  }

  try {
    switch (commandName) {
      case COMMANDS.ACCEPT:
        await interaction.reply(`${tagUser(user)} accept today turn`);
        break;
      case COMMANDS.CONFIG_CHANNEL: {
        guildState.setAnnounceChannel(interaction.channelId);
        await interaction.reply(`Config the channel to announce success!`);
        break;
      }
      case COMMANDS.SKIP: {
        const currentMember = guildState.getPreviousMember();
        // To announce next number on next interval check
        guildState.shouldReAnnounce = true;
        await interaction.reply(
          `${tagUser(currentMember)} has skipped today's turn.`
        );
        break;
      }
      case COMMANDS.LIST: {
        const members = guildState.getMembersInQueue();

        const memberTags = members.map((memberId) => tagUser(memberId));
        await interaction.reply(`Queue list: ${memberTags.join(", ")}`);
        break;
      }
      case COMMANDS.RESET: {
        guildState.reset();
        await interaction.reply(`Reset the queue list success!`);
        break;
      }

      case COMMANDS.START_OVER: {
        guildState.startOver();
        await interaction.reply(`Start over the queue success!`);
        break;
      }

      case COMMANDS.SET_REMINDER_TIME: {
        if (!interaction.isChatInputCommand()) return;

        const time = interaction.options.getString(INTERACTIONS.TIME_INPUT_KEY);

        if (!time) {
          await interaction.reply(
            "Please provide the time to set the reminder"
          );
          return;
        }

        const isValidFormat = TIME_INPUT_FORMAT_REGEX.test(time);

        if (!isValidFormat) {
          await interaction.reply(
            "Invalid time format, please use HH:mm format (e.g. 14:00)"
          );
          return;
        }

        guildState.setReminderTime(time);

        await interaction.reply(`Set the reminder time to ${time} everyday`);

        break;
      }

      case COMMANDS.ADD: {
        await interaction.deferReply();
        const members = await getGuildMembers(client, guildId);
        if (members === undefined) return;
        const options = membersToSelectOptions(
          members,
          ENV_VARIABLES.MODE === "production"
        );
        // filter already exist members
        const guildState = globalState.get(guildId);
        const onlyUnattendedMembers = options.filter(
          (option) => !guildState.isMemberExist(option.value)
        );
        if (onlyUnattendedMembers.length === 0)
          return interaction.editReply(
            "No members found or all members are joined"
          );
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(INTERACTIONS.ADD_MEMBER)
          .setPlaceholder("Select a member")
          .addOptions(onlyUnattendedMembers)
          .setMinValues(1)
          .setMaxValues(onlyUnattendedMembers.length);

        const row =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            selectMenu
          );
        await interaction.editReply({
          content: "Select a member from the dropdown:",
          components: [row],
        });
        break;
      }

      case COMMANDS.REMOVE: {
        await interaction.deferReply();
        const guildState = globalState.get(guildId);
        const allMembers = await getGuildMembers(client, guildId);
        const alreadyJoinedMemberIds = guildState.getMembersInQueue();
        const alreadyJoinedMembers = allMembers?.filter((member) =>
          alreadyJoinedMemberIds.includes(member.id)
        );
        if (!alreadyJoinedMembers) return;
        const options = membersToSelectOptions(alreadyJoinedMembers, true);
        if (options.length === 0) {
          await interaction.editReply(
            "No members found or there's no member to remove"
          );
          return;
        }
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(INTERACTIONS.REMOVE_MEMBER)
          .setPlaceholder("Select a member")
          .addOptions(options);
        const row =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            selectMenu
          );
        await interaction.editReply({
          content: "Select a member from the dropdown:",
          components: [row],
        });
        break;
      }
      case COMMANDS.GET_INVITE_LINK: {
        await interaction.reply(
          `${tagUser(user)} here is the invite link: ${
            ENV_VARIABLES.INVITE_LINK
          }`
        );
        return;
      }
      case COMMANDS.SET_WEEKLY_TIME: {
        await interaction.deferReply();
        const guildState = globalState.get(guildId);
        const weekTimeOptions = weekTimeToSelections(
          WEEKLY_DAYS,
          guildState.getWeeklyDays()
        );
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId(INTERACTIONS.WEEKLY_TIME_INPUT)
          .setPlaceholder("Select all days you want to announce")
          .addOptions(weekTimeOptions)
          .setMinValues(0)
          .setMaxValues(weekTimeOptions.length);

        const row =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            selectMenu
          );

        await interaction.editReply({
          content: "Select all days that you want to announce:",
          components: [row],
        });
        return;
      }
      case COMMANDS.VIEW_WEEKLY_TIME: {
        const guildState = globalState.get(guildId);
        const selectedDays = guildState.getWeeklyDays();
        await interaction.reply(
          `Weekly time to announce: ${selectedDays.join(", ")}`
        );
        break;
      }
      default:
        break;
    }
  } catch (error) {
    if (error instanceof Error) {
      interaction.reply({
        content: `[Dev] Error: ${error.message}`,
        ephemeral: true,
      });
    } else {
      interaction.reply({
        content: `[Dev] An unknown error occurred.`,
        ephemeral: true,
      });
    }
  }
};
