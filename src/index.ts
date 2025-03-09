import {
  Client,
  Events,
  SlashCommandBuilder,
  GatewayIntentBits,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  EmbedBuilder,
} from "discord.js";
import dotenv from "dotenv";
import { getGuildMembers, membersToSelectOptions, tagUser } from "./util";
import { Queue } from "./queue";
import { COMMANDS, INTERACTIONS } from "./constants";
import { GlobalState } from "./globalState";
import { GuildState } from "./guildState";

dotenv.config();

// IDEA: Doing an rotate booking bot that rotate the booking members in a discord server
// The bot will have a command to accept the booking
// The bot will have a command to skip the current turn and pass to the next one
// The bot will have a command to show the current booking list
// The bot will have a command to add a new member to the booking list
// The bot will have a command to remove a member from the booking list
// The bot will have a command to reset the booking list
// The bot will automatically send a message to announce the next booking member at 11:00 AM everyday

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.login(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user?.tag}`);

  const accept = new SlashCommandBuilder()
    .setName(COMMANDS.ACCEPT)
    .setDescription("Accept today turn");

  const skip = new SlashCommandBuilder()
    .setName(COMMANDS.SKIP)
    .setDescription("Skip today turn");

  const list = new SlashCommandBuilder()
    .setName(COMMANDS.LIST)
    .setDescription("List the current booking list");

  const add = new SlashCommandBuilder()
    .setName(COMMANDS.ADD)
    .setDescription("Add a new member to the booking list");

  const remove = new SlashCommandBuilder()
    .setName(COMMANDS.REMOVE)
    .setDescription("Remove a member from the booking list");

  const reset = new SlashCommandBuilder()
    .setName(COMMANDS.RESET)
    .setDescription("Reset the booking list");

  client.application?.commands.create(accept);
  client.application?.commands.create(list);
  client.application?.commands.create(add);
  client.application?.commands.create(remove);
  client.application?.commands.create(reset);
  client.application?.commands.create(skip);
});

const globalState = new GlobalState<string>();

client.on(Events.GuildCreate, async (guild) => {
  globalState.set(guild.id, new GuildState<string>({}));
});

client.on(Events.InteractionCreate, async (interaction) => {
  const { user, guildId } = interaction;
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  try {
    switch (commandName) {
      case COMMANDS.ACCEPT:
        await interaction.reply(`${tagUser(user)} accept today turn`);
        break;
      case COMMANDS.SKIP:
        await interaction.reply(`Skip today turn`);
        break;
      case COMMANDS.LIST:
        await interaction.reply(`List the current booking list`);
        break;
      case COMMANDS.RESET:
        await interaction.reply(`Reset the booking list`);
        break;
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
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, guildId } = interaction;

  if (!guildId) return;

  switch (commandName) {
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

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        selectMenu
      );

      await interaction.editReply({
        content: "Select a member from the dropdown:",
        components: [row],
      });

      break;
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
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
});

client.login(process.env.DISCORD_TOKEN);
