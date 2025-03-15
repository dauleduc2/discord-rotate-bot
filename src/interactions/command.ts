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

export const handleCommand = async (interaction: CommandInteraction) => {
  const { user, guildId } = interaction;
  if (!guildId) return;

  const { commandName } = interaction;
  const precheckError = isPassPrecheck(commandName, guildId, globalState);

  if (precheckError) {
    await interaction.reply(precheckError);
    return;
  }

  try {
    switch (commandName) {
      case COMMANDS.ACCEPT:
        await interaction.reply(`${tagUser(user)} accept today turn`);
        break;
      case COMMANDS.CONFIG: {
        const guildState = globalState.get(guildId);
        guildState.setAnnounceChannel(interaction.channelId);
        await interaction.reply(`Config the channel to announce success!`);
        break;
      }
      case COMMANDS.SKIP:
        await interaction.reply(`Skip today turn`);
        break;
      case COMMANDS.LIST: {
        const guildState = globalState.get(guildId);
        const members = guildState.getMembersInQueue();

        if (members.length === 0) {
          await interaction.reply("No members found");
          return;
        }

        const memberTags = members.map((memberId) => tagUser(memberId));
        await interaction.reply(`Booking list: ${memberTags.join(", ")}`);
        break;
      }
      case COMMANDS.RESET: {
        const guildState = globalState.get(guildId);
        guildState.reset();

        await interaction.reply(`Reset the booking list success!`);
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
          .addOptions(onlyUnattendedMembers);
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
