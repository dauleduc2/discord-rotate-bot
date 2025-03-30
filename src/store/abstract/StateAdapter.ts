import { GuildState } from "../guildState";

export abstract class StateAdapter<T> {
  // Initialization
  public abstract init(): void;
  public abstract close(): void;

  // Global
  public abstract getAllGuildIds(): string[];

  // Guild
  public abstract getGuildState(guildId: string): GuildState<T>;
  public abstract saveAnnounceChannel(guildId: string, channelId: string): void;
  public abstract saveReminderTime(guildId: string, time: string): void;
  public abstract saveWeeklyDays(guildId: string, days: string[]): void;
  public abstract saveShouldReAnnounce(
    guildId: string,
    shouldReAnnounce: boolean
  ): void;

  // Queue
  public abstract addMemberToQueue(guildId: string, member: T): void;
  public abstract addMembersToQueue(guildId: string, members: T[]): void;
  public abstract updateQueueIndex(guildId: string, index: number): void;
  public abstract resetQueue(guildId: string): void;
  public abstract removeMemberFromQueue(guildId: string): T[];
}
