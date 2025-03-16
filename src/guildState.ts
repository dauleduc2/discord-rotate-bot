import { PersistQueue } from "./queue";

export interface GuildStateProps<T> {
  queue: PersistQueue<T>;
  isEqual: (a: T, b: T) => boolean;
}

export class GuildState<T> {
  private queue: PersistQueue<T>;
  private members: T[] = [];
  private announceChannel: string | null = null;
  private readonly isEqual: GuildStateProps<T>["isEqual"];
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

  public setAnnounceChannel(channelId: string) {
    this.announceChannel = channelId;
  }

  public getAnnounceChannel() {
    return this.announceChannel;
  }

  public startOver() {
    this.queue.startOver();
  }
}
