import { EmbedBuilder, StringSelectMenuInteraction } from "discord.js";
import { INTERACTIONS } from "../constants";
import { globalState } from "..";

export const handleSelectStringMenu = async (
  interaction: StringSelectMenuInteraction
) => {
  const { customId, guild } = interaction;

  if (!guild) return;

  if (customId === INTERACTIONS.ADD_MEMBER) {
    const selectedMemberId = interaction.values[0];
    const member = await guild.members.fetch(selectedMemberId);

    const guildState = globalState.get(guild.id);
    const isAlreadyExist = guildState.isMemberExist(member.id);

    if (isAlreadyExist) {
      return await interaction.reply({
        content: "Member already exist",
      });
    } else {
      guildState.addMember(member.id);
      const embed = new EmbedBuilder()
        .setTitle("Add member to booking list success")
        .setDescription(`You selected: **${member.user.tag}**`);

      return await interaction.reply({ embeds: [embed] });
    }
  }

  if (customId === INTERACTIONS.REMOVE_MEMBER) {
    const selectedMemberId = interaction.values[0];
    const member = await guild.members.fetch(selectedMemberId);

    const guildState = globalState.get(guild.id);

    guildState.removeMember(member.id);
    const embed = new EmbedBuilder()
      .setTitle("Remove member from booking list success")
      .setDescription(`You selected: **${member.user.tag}**`);

    return await interaction.reply({ embeds: [embed] });
  }
};
