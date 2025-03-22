import { WEEKLY_DAYS } from "./constants/time";
import { PersistQueue } from "./queue";

export interface GuildStateProps<T> {
  queue: PersistQueue<T>;
  isEqual: (a: T, b: T) => boolean;
}

export class GuildState<T> {
  private readonly queue: PersistQueue<T>;
  private members: T[] = [];
  private announceChannel: string | null = null;
  private reminderTime: string = "11:00"; // Default to 11:00 AM everyday
  private readonly isEqual: GuildStateProps<T>["isEqual"];
  private weeklyDays: string[] = WEEKLY_DAYS;
  public shouldReAnnounce = false;
  constructor(props: Partial<GuildStateProps<T>>) {
    this.queue = props.queue ?? new PersistQueue<T>({ isEqual: props.isEqual });
    this.isEqual = props.isEqual ?? ((a, b) => a === b);
  }

  public getQueue() {
    return this.queue;
  }

  public getMembersInQueue() {
    return this.members;
  }

  public addMember(member: T) {
    this.members.push(member);
    this.queue.push(member);
  }

  public addMembers(members: T[]) {
    this.members = [...this.members, ...members];
    this.queue.pushAll(members);
  }

  public removeMember(member: T) {
    this.queue.remove(member);
    this.members = this.members.filter((m) => !this.isEqual(m, member));
  }

  public isMemberExist(member: T) {
    return this.members.some((m) => this.isEqual(m, member));
  }

  public reset() {
    this.queue.reset();
    this.members = [];
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
