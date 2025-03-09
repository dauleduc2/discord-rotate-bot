import { Client, Collection, GuildMember, User } from "discord.js";

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
