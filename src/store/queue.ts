interface QueueProps<T> {
  isEqual: (a: T, b: T) => boolean;
}

export class PersistQueue<T> {
  private data: T[] = [];
  private readonly isEqual: QueueProps<T>["isEqual"];
  private currentIndex = 0;

  constructor(props?: Partial<QueueProps<T>>) {
    this.isEqual = props?.isEqual || ((a, b) => a === b);
  }

  push(item: T) {
    this.data.push(item);
  }

  pushAll(items: T[]) {
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
    const index = this.findIndex(item);

    if (index === -1) return;

    this.data.splice(index, 1);
  }

  isAlreadyExist(item: T) {
    return this.findIndex(item) !== -1;
  }
}
