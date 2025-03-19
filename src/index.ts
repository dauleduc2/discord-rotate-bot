import dotenv from "dotenv";
dotenv.config();

import { Client, Events, GatewayIntentBits } from "discord.js";
import { isPassPrecheck } from "./util";
import { GlobalState } from "./globalState";
import { GuildState } from "./guildState";
import { handleCommand } from "./interactions/command";
import { handleSelectStringMenu } from "./interactions/stringMenu";
import { registerCommands, registerCronJob } from "./config";
import { ENV_VARIABLES } from "./constants/envVariables";
import { mockTestData } from "./mocks/guild";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Logged in as ${c.user?.tag}`);

  registerCommands(client);
  registerCronJob(client);
});

export const globalState = new GlobalState<string>();

if (ENV_VARIABLES.MODE === "development") {
  mockTestData(globalState);
}

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

client.login(ENV_VARIABLES.DISCORD_TOKEN);
