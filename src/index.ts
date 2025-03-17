import { Client, Events, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { isPassPrecheck } from "./util";
import { GlobalState } from "./globalState";
import { GuildState } from "./guildState";
import { handleCommand } from "./interactions/command";
import { handleSelectStringMenu } from "./interactions/stringMenu";
import { registerCommands, registerCronJob } from "./config";

dotenv.config();

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
