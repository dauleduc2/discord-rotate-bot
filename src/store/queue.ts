import { StateAdapter } from "./abstract/StateAdapter";

interface QueueProps<T> {
  isEqual: (a: T, b: T) => boolean;
  dbAdapter?: StateAdapter<T>;
  guildId?: string;
  data?: T[];
}

export class PersistQueue<T> {
  private data: T[] = [];
  private readonly isEqual: QueueProps<T>["isEqual"];
  private currentIndex = 0;
  private readonly dbAdapter: StateAdapter<T> | undefined;
  private readonly guildId: string | undefined;

  constructor(props?: Partial<QueueProps<T>>) {
    this.isEqual = props?.isEqual || ((a, b) => a === b);
    this.dbAdapter = props?.dbAdapter;
    this.guildId = props?.guildId;
    this.data = props?.data || [];

    return new Proxy(this, {
      set: (target, key, value) => {
        if (this.dbAdapter && this.guildId) {
          switch (key) {
            case "currentIndex":
              this.dbAdapter.updateQueueIndex(this.guildId, value as number);
              break;

            default:
              break;
          }
        }

        return true;
      },
    });
  }

  getAll() {
    return this.data;
  }

  push(item: T) {
    if (this.dbAdapter && this.guildId)
      this.dbAdapter.addMemberToQueue(this.guildId, item);

    this.data.push(item);
  }

  pushAll(items: T[]) {
    if (this.dbAdapter && this.guildId)
      this.dbAdapter.addMembersToQueue(this.guildId, items);

    this.data.push(...items);
  }

  getNext() {
    return this.data[this.currentIndex];
  }

  getPreviousIndex() {
    let previousIndex;

    if (this.currentIndex === 0) {
      previousIndex = this.data.length - 1;
    } else {
      previousIndex = this.currentIndex - 1;
    }

    return previousIndex;
  }

  getPrevious() {
    let previousIndex = this.getPreviousIndex();

    return this.data[previousIndex];
  }

  movePrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else {
      this.currentIndex = this.data.length - 1;
    }
  }

  moveNext() {
    if (this.currentIndex < this.data.length - 1) {
      this.currentIndex++;
    } else {
      this.currentIndex = 0;
    }
  }

  get length() {
    return this.data.length;
  }

  reset() {
    this.data = [];
  }

  startOver() {
    this.currentIndex = 0;
  }

  findIndex(item: T) {
    return this.data.findIndex((data) => this.isEqual(data, item));
  }

  remove(item: T) {
    if (this.dbAdapter && this.guildId) {
      this.dbAdapter.removeMemberFromQueue(
        this.guildId,
        item as unknown as any
      );
    }

    const index = this.findIndex(item);

    if (index === -1) return;

    this.data.splice(index, 1);
  }

  isAlreadyExist(item: T) {
    return this.findIndex(item) !== -1;
  }
}
