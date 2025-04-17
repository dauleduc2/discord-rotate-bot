type GuildTable = {
  id: number;
  guildId: string;
  queue: string;
  queueIndex: number;
  announceChannel: string;
  reminderTime: string;
  weeklyDays: string;
  shouldReAnnounce: boolean;
};

namespace GuildTable {
  export const stringToArray = (str: string | null | undefined): string[] => {
    if (!str) return [];

    return str.split(",").map((item) => item.trim());
  };

  export const arrayToString = (arr: string[] | null | undefined): string => {
    if (!arr) return "";

    return arr.join(",").trim();
  };
}

export default GuildTable;
