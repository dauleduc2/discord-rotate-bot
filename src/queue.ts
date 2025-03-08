interface QueueProps<T> {
  isEqual: (a: T, b: T) => boolean;
}

export class Queue<T> {
  private data: T[] = [];
  private readonly isEqual: QueueProps<T>["isEqual"];

  constructor(props?: Partial<QueueProps<T>>) {
    this.isEqual = props?.isEqual || ((a, b) => a === b);
  }

  push(item: T) {
    this.data.push(item);
  }

  pop() {
    return this.data.shift();
  }

  get length() {
    return this.data.length;
  }

  reset() {
    this.data = [];
  }

  findIndex(item: T) {
    return this.data.findIndex((data) => this.isEqual(data, item));
  }

  remove(item: T) {
    const index = this.findIndex(item);

    if (index === -1) return;

    this.data.splice(index, 1);
  }

  isAlreadyExist(item: T) {
    return this.findIndex(item) !== -1;
  }
}
