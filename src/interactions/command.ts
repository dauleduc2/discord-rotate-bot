import {
  ActionRowBuilder,
  CommandInteraction,
  StringSelectMenuBuilder,
} from "discord.js";
import {
  getGuildMembers,
  isPassPrecheck,
  membersToSelectOptions,
  tagUser,
} from "../util";
import { COMMANDS, INTERACTIONS } from "../constants";
import { client, globalState } from "..";
import { TIME_INPUT_FORMAT_REGEX } from "../regex";

export const handleCommand = async (interaction: CommandInteraction) => {
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
      case COMMANDS.SKIP:
        await interaction.reply(`Skip today turn`);
        break;
      case COMMANDS.LIST: {
        const members = guildState.getMembersInQueue();

        if (members.length === 0) {
          await interaction.reply("No members found");
          return;
        }

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
        if (!members) return;
        const options = membersToSelectOptions(members, false);
        // filter already exist members
        const guildState = globalState.get(guildId);
        const onlyUnattendedMembers = options.filter(
          (option) => !guildState.isMemberExist(option.value)
        );
        if (onlyUnattendedMembers.length === 0) {
          await interaction.editReply(
            "No members found or all members are joined"
          );
          return;
        }
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
