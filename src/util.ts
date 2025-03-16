import { Client, Collection, GuildMember, User } from "discord.js";
import { globalState } from ".";
import { COMMANDS } from "./constants";
import { TIME_INPUT_FORMAT_REGEX } from "./regex";

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
    COMMANDS.RESET_QUEUE,
    COMMANDS.SKIP,
  ];
  if (
    needChannelConfigCommands.includes(command) &&
    !guildState.getAnnounceChannel()
  ) {
    return `Please config the announce channel by using ***/${COMMANDS.CONFIG_CHANNEL}*** before using other commands`;
  }

  return null;
};

export const extractTimeFromInput = (timeInput: string) => {
  const time = timeInput.match(TIME_INPUT_FORMAT_REGEX);

  if (!time) return null;

  return time[0].split(":");
};
