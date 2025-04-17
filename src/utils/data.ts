import { StateAdapter } from "../store/abstract/StateAdapter";
import { GlobalState } from "../store/globalState";

export const applyDatabaseMigrations = async (
  db: StateAdapter<string>,
  globalState: GlobalState<string>
) => {
  const guildIds = await db.getAllGuildIds();

  for (const guildId of guildIds) {
    const guildState = await db.getGuildState(guildId);

    if (!guildState) continue;

    globalState.set(guildId, guildState);
  }
};
