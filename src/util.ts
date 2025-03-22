import { Client, Collection, GuildMember, User } from "discord.js";
import { globalState } from ".";
import { COMMANDS } from "./constants/commands";
import { TIME_INPUT_FORMAT_REGEX } from "./constants/regex";

export const tagUser = (user: User | string) => {
  if (typeof user === "string") return `<@${user}>`;

  return `<@${user.id}>`;
};

export const getGuildMembers = async (client: Client, guildId: string) => {
  const guild = client.guilds.cache.get(guildId);

  const members = await guild?.members.fetch();

  return members;
};

export const membersToSelectOptions = (
  members: Collection<string, GuildMember>,
  filterBot = true
) => {
  const options = members
    .filter((member) => {
      if (!filterBot) return true;

      return !member.user.bot;
    })
    .map((member) => {
      return {
        label: member.user.username,
        value: member.id,
      };
    });

  return options;
};

export const isPassPrecheck = (
  command: string,
  guildId: string,
  state: typeof globalState
): string | null => {
  const guildState = state.get(guildId);
  const needChannelConfigCommands = [
    COMMANDS.ACCEPT,
    COMMANDS.ADD,
    COMMANDS.LIST,
    COMMANDS.REMOVE,
    COMMANDS.RESET,
    COMMANDS.START_OVER,
    COMMANDS.SKIP,
  ];

  const requiredMembersCommands = [
    COMMANDS.ACCEPT,
    COMMANDS.LIST,
    COMMANDS.REMOVE,
    COMMANDS.START_OVER,
    COMMANDS.SKIP,
  ];

  if (
    needChannelConfigCommands.includes(command) &&
    !guildState.getAnnounceChannel()
  ) {
    return `Please config the announce channel by using ***/${COMMANDS.CONFIG_CHANNEL}*** before using other commands`;
  }

  if (
    requiredMembersCommands.includes(command) &&
    guildState.getMembersInQueue().length === 0
  ) {
    return "No members found, please add members first";
  }

  return null;
};

export const extractTimeFromInput = (timeInput: string) => {
  const time = timeInput.match(TIME_INPUT_FORMAT_REGEX);

  if (!time) return null;

  return time[0].split(":");
};

export const weekTimeToSelections = (time: string[], selected: string[]) => {
  return time.map((t) => {
    return {
      label: t,
      value: t,
      default: selected.includes(t),
    };
  });
};
