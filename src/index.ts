import dotenv from "dotenv";
dotenv.config();

import { Client, Events, GatewayIntentBits } from "discord.js";
import { GlobalState } from "./store/globalState";
import { GuildState } from "./store/guildState";
import { handleCommand } from "./interactions/command";
import { handleSelectStringMenu } from "./interactions/stringMenu";
import { ENV_VARIABLES } from "./constants/envVariables";
import { mockTestData } from "./mocks/guild";
import { isPassPrecheck } from "./utils/command";
import { registerCommands } from "./config/register";
import { registerCronJob } from "./config/cron";
import DB from "./config/db";
import { applyDatabaseMigrations } from "./utils/data";

export const db = new DB();

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

export const globalState = new GlobalState<string>(db);

(async () => {
  await db.init();
  await applyDatabaseMigrations(db, globalState);

  client.once(Events.ClientReady, (c) => {
    console.log(`Logged in as ${c.user?.tag}`);

    registerCommands(client);
    registerCronJob(client);
  });

  // if (ENV_VARIABLES.MODE === "development") {
  // mockTestData(globalState);
  // }

  client.on(Events.GuildCreate, async (guild) => {
    globalState.set(guild.id, new GuildState<string>({}, db));
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

    handleCommand(interaction, globalState);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    handleSelectStringMenu(interaction, globalState);
  });

  client.login(ENV_VARIABLES.DISCORD_TOKEN);
})();
