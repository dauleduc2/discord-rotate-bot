import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { isPassPrecheck } from "./util";
import { GlobalState } from "./globalState";
import { GuildState } from "./guildState";
import { handleCommand } from "./interactions/command";
import { handleSelectStringMenu } from "./interactions/stringMenu";
import { registerCommands, registerCronJob } from "./config";

dotenv.config();

// IDEA: Doing an rotate booking bot that rotate the booking members in a discord server
// The bot will have a command to accept the booking
// The bot will have a command to skip the current turn and pass to the next one
// The bot will have a command to show the current booking list
// The bot will have a command to add a new member to the booking list
// The bot will have a command to remove a member from the booking list
// The bot will have a command to reset the booking list
// The bot will automatically send a message to announce the next booking member at 11:00 AM everyday

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.login(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user?.tag}`);

  registerCommands(client);
  registerCronJob(client);
});

export const globalState = new GlobalState<string>();

client.on(Events.GuildCreate, async (guild) => {
  globalState.set(guild.id, new GuildState<string>({}));
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, guildId } = interaction;

  if (!guildId) return;

  const precheckError = isPassPrecheck(commandName, guildId, globalState);

  if (precheckError) {
    await interaction.reply(precheckError);
    return;
  }

  handleCommand(interaction);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  handleSelectStringMenu(interaction);
});

client.login(process.env.DISCORD_TOKEN);
