import { GuildState } from "./guildState";

export type GlobalStateProps<T> = {
  [key: string]: GuildState<T>;
};

export class GlobalState<T> {
  private state: GlobalStateProps<T> = {};

  public get(guildId: string) {
    const guildState = this.state[guildId];

    if (!guildState) this.state[guildId] = new GuildState<T>({});

    return this.state[guildId];
  }

  public set(guildId: string, queue: GuildState<T>) {
    this.state[guildId] = queue;
  }

  public remove(guildId: string) {
    delete this.state[guildId];
  }
}
