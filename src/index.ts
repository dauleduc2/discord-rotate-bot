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
import { GlobalState } from "./guildState";

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
    .setName("accept")
    .setDescription("Accept today turn");

  const skip = new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip today turn");

  const list = new SlashCommandBuilder()
    .setName("list")
    .setDescription("List the current booking list");

  const add = new SlashCommandBuilder()
    .setName("add")
    .setDescription("Add a new member to the booking list");

  const remove = new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a member from the booking list");

  const reset = new SlashCommandBuilder()
    .setName("reset")
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
  globalState.set(guild.id, new Queue<string>());
});

client.on(Events.InteractionCreate, async (interaction) => {
  const { user, guildId } = interaction;
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  try {
    switch (commandName) {
      case "accept":
        await interaction.reply(`${tagUser(user)} accept today turn`);
        break;
      case "skip":
        await interaction.reply(`Skip today turn`);
        break;
      case "list":
        await interaction.reply(`List the current booking list`);
        break;
      case "reset":
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
    case "add": {
      await interaction.deferReply();
      const members = await getGuildMembers(client, guildId);

      if (!members) return;

      const options = membersToSelectOptions(members, false);

      if (options.length === 0) {
        await interaction.editReply("No members found");
        return;
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("add_member")
        .setPlaceholder("Select a member")
        .addOptions(options);

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

  if (customId === "add_member") {
    const selectedMemberId = interaction.values[0];
    const member = await guild.members.fetch(selectedMemberId);

    const bookingQueue = globalState.get(guild.id);
    const isAlreadyExist = bookingQueue.isAlreadyExist(member.id);

    if (isAlreadyExist) {
      return await interaction.reply({
        content: "Member already exist",
        ephemeral: true,
      });
    } else {
      bookingQueue.push(member.id);
      const embed = new EmbedBuilder()
        .setTitle("Add member to booking list success")
        .setDescription(`You selected: **${member.user.tag}**`);

      return await interaction.reply({ embeds: [embed] });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
