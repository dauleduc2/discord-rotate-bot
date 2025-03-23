import { globalState } from "..";
import { COMMANDS } from "../constants/commands";

export const isPassPrecheck = (
  command: string,
  guildId: string,
  state: typeof globalState
): string | null => {
  const guildState = state.get(guildId);
  const needChannelConfigCommands = [
    COMMANDS.ADD,
    COMMANDS.LIST,
    COMMANDS.REMOVE,
    COMMANDS.RESET,
    COMMANDS.START_OVER,
    COMMANDS.SKIP,
  ];

  const requiredMembersCommands = [
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
