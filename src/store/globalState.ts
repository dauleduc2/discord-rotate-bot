import { StateAdapter } from "./abstract/StateAdapter";
import { GuildState } from "./guildState";

export type GlobalStateProps<T> = {
  [key: string]: GuildState<T>;
};

export class GlobalState<T> {
  private state: GlobalStateProps<T> = {};
  private readonly dbAdapter: StateAdapter<T> | undefined;

  constructor(adapter?: StateAdapter<T>) {
    this.dbAdapter = adapter;
  }

  public get(guildId: string) {
    const guildState = this.state[guildId];

    if (!guildState)
      this.state[guildId] = new GuildState<T>({}, this.dbAdapter);

    return this.state[guildId];
  }

  public async set(guildId: string, guild: GuildState<T>) {
    const existingGuild = await this.dbAdapter?.getGuildState(guildId);

    if (!existingGuild) {
      await this.dbAdapter?.saveGuild(guildId);
    }
    this.state[guildId] = guild;
  }

  public remove(guildId: string) {
    delete this.state[guildId];
  }
}
