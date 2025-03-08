import { Queue } from "./queue";

export type State<T> = {
  [key: string]: Queue<T>;
};

export class GlobalState<T> {
  private state: State<T> = {};

  public get(guildId: string) {
    const guildState = this.state[guildId];

    if (!guildState) this.state[guildId] = new Queue<T>();

    return this.state[guildId];
  }

  public set(guildId: string, queue: Queue<T>) {
    this.state[guildId] = queue;
  }

  public remove(guildId: string) {
    delete this.state[guildId];
  }

  public reset(guildId: string) {
    this.state[guildId].reset();
  }
}
