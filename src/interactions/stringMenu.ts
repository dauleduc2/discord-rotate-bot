import { EmbedBuilder, StringSelectMenuInteraction } from "discord.js";
import { INTERACTIONS } from "../constants/commands";
import { tagUser } from "../util";
import { GlobalState } from "../globalState";

export const handleSelectStringMenu = async (
  interaction: StringSelectMenuInteraction,
  globalState: GlobalState<string>
) => {
  const { customId, guild } = interaction;

  if (!guild) return;

  switch (customId) {
    case INTERACTIONS.ADD_MEMBER: {
      const selectedMemberIds = interaction.values;

      const guildState = globalState.get(guild.id);
      const isAlreadyExist = selectedMemberIds.some((id) =>
        guildState.isMemberExist(id)
      );

      if (isAlreadyExist) {
        return await interaction.reply({
          content: "One or more member already exist",
        });
      } else {
        guildState.addMembers(selectedMemberIds);
        const embed = new EmbedBuilder()
          .setTitle("Add member to queue success")
          .setDescription(
            `Added ${selectedMemberIds
              .map((id) => `**${tagUser(id)}**`)
              .join(", ")} to the queue`
          );

        return await interaction.reply({ embeds: [embed] });
      }
    }

    case INTERACTIONS.REMOVE_MEMBER: {
      const selectedMemberId = interaction.values[0];

      const guildState = globalState.get(guild.id);

      guildState.removeMember(selectedMemberId);
      const embed = new EmbedBuilder()
        .setTitle("Remove member from queue success")
        .setDescription(
          `You removed **${tagUser(selectedMemberId)}** from the queue`
        );

      return await interaction.reply({ embeds: [embed] });
    }

    case INTERACTIONS.WEEKLY_TIME_INPUT: {
      const selectedTime = interaction.values;

      const guildState = globalState.get(guild.id);
      guildState.setWeeklyDays(selectedTime);

      const embed = new EmbedBuilder()
        .setTitle("Set weekly time success")
        .setDescription(
          `Set weekly time to ${selectedTime
            .map((t) => "**" + t + "**")
            .join(", ")}`
        );

      return await interaction.reply({ embeds: [embed] });
    }
  }
};
