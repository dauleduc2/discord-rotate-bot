import { Queue } from "./queue";

export interface GuildStateProps<T> {
  queue: Queue<T>;
  isEqual: (a: T, b: T) => boolean;
}

export class GuildState<T> {
  private queue: Queue<T>;
  private members: T[] = [];
  private readonly isEqual: GuildStateProps<T>["isEqual"];
  constructor(props: Partial<GuildStateProps<T>>) {
    this.queue = props.queue ?? new Queue<T>({ isEqual: props.isEqual });
    this.isEqual = props.isEqual ?? ((a, b) => a === b);
  }

  public getQueue() {
    return this.queue;
  }

  public getMembers() {
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
}
