import { ModelItems } from "./ModelBase";
import { Row } from "./Row";

export default class DataSet<T extends ModelItems> {

  protected readonly results: Row<T>[] = []
  protected pointer: number = 0

  public get length(): number { return this.results.length }

  public constructor(rows: Row<T>[]) {
    this.results = rows
  }

  public toArray() {
    return this.results
  }

  public forEach(callback: (row: T) => void) {
    this.results.forEach(row => callback(<any>row))
  }

  public next(): IteratorResult<Row<T>> {
    if (this.pointer < this.results.length) {
      return { done: false, value: this.results[this.pointer++] }
    } else {
      this.pointer = 0
      return { done: true, value: undefined } as any as IteratorResult<Row<T>>
    }
  }

}