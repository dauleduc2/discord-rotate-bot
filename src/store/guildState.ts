import { WEEKLY_DAYS } from "../constants/time";
import { StateAdapter } from "./abstract/StateAdapter";
import { PersistQueue } from "./queue";

export interface GuildStateProps<T> {
  queue: PersistQueue<T>;
  isEqual: (a: T, b: T) => boolean;
  guildId?: string;
}

export class GuildState<T> {
  private readonly queue: PersistQueue<T>;
  private readonly guildId: string | undefined;
  private announceChannel: string | null = null;
  private reminderTime: string = "11:00"; // Default to 11:00 AM everyday
  private readonly isEqual: GuildStateProps<T>["isEqual"];
  private weeklyDays: string[] = WEEKLY_DAYS;
  public shouldReAnnounce = false;
  private readonly dbAdapter: StateAdapter<T> | undefined;

  constructor(props: Partial<GuildStateProps<T>>, adapter?: StateAdapter<T>) {
    this.dbAdapter = adapter;
    this.guildId = props.guildId;
    this.queue =
      props.queue ??
      new PersistQueue<T>({ isEqual: props.isEqual, dbAdapter: adapter });
    this.isEqual = props.isEqual ?? ((a, b) => a === b);

    return new Proxy(this, {
      set: (target, key, value) => {
        if (this.dbAdapter && this.guildId) {
          switch (key) {
            case "announceChannel":
              this.dbAdapter.saveAnnounceChannel(this.guildId, value as string);
              break;
            case "reminderTime":
              this.dbAdapter.saveReminderTime(this.guildId, value as string);
              break;
            case "weeklyDays":
              this.dbAdapter.saveWeeklyDays(this.guildId, value as string[]);
              break;
            case "shouldReAnnounce":
              this.dbAdapter.saveShouldReAnnounce(
                this.guildId,
                value as boolean
              );
              break;
            default:
              break;
          }
        }

        target[key as keyof GuildState<T>] = value;
        return true;
      },
    });
  }

  public getQueue() {
    return this.queue;
  }

  public getMembersInQueue() {
    return this.queue.getAll();
  }

  public addMember(member: T) {
    this.queue.push(member);
  }

  public addMembers(members: T[]) {
    this.queue.pushAll(members);
  }

  public removeMember(member: T) {
    this.queue.remove(member);
  }

  public isMemberExist(member: T) {
    return this.queue.getAll().some((m) => this.isEqual(m, member));
  }

  public reset() {
    this.queue.reset();
  }

  public getNextMember() {
    return this.queue.getNext();
  }

  public getPreviousMember() {
    return this.queue.getPrevious();
  }

  public moveNext() {
    this.queue.moveNext();
  }

  public setAnnounceChannel(channelId: string) {
    this.announceChannel = channelId;
  }

  public getAnnounceChannel() {
    return this.announceChannel;
  }

  public startOver() {
    this.queue.startOver();
  }

  public setReminderTime(time: string) {
    this.reminderTime = time;
  }

  public getReminderTime() {
    return this.reminderTime;
  }

  public isTimeToAnnounce() {
    const now = new Date();
    const [hour, minute] = this.reminderTime?.split(":") ?? [];
    const isOnTime =
      now.getHours() === Number(hour) &&
      now.getMinutes() === Number(minute) &&
      now.getSeconds() === 0;
    const isOnWeeklyDays = this.weeklyDays.includes(
      now.toLocaleDateString("en-US", { weekday: "long" })
    );

    return isOnTime && isOnWeeklyDays;
  }

  public skipToNext() {
    this.queue.moveNext();
  }

  public setWeeklyDays(days: string[]) {
    this.weeklyDays = days;
  }

  public getWeeklyDays() {
    return this.weeklyDays;
  }
}
