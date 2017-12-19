import { ModelItems } from "./ModelBase";
import { Row } from "./Row";

export default class DataSet<I extends ModelItems> {

  private readonly rows: Row<I>[] | Row<I>
  private pointer: number = 0

  public get length(): number {
    if (this.rows)
      return this.rows instanceof Row ? 1 : this.rows.length || 0
    else
      return 0
  }

  public constructor(rows: Row<I>[] | Row<I>) {
    this.rows = rows
  }

  public toArray() {
    return this.rows
  }

  public set(index: number, value: Row<I>) {
    if (Array.isArray(this.rows)) {
      let idx = this.rows.indexOf(value)
      if (idx > -1) {
        this.rows[index] = value
      }
    }
  }

  public forEach(callback: (row: Row<I>, index: number) => void) {
    if (Array.isArray(this.rows))
      this.rows.forEach(async (row, idx) => await callback(row, idx))
    else if (this.rows instanceof Row)
      callback(this.rows, 0)
    return this
  }

  public next(): IteratorResult<Row<I>> {
    if (Array.isArray(this.rows)) {
      if (this.pointer < this.rows.length) {
        return { done: false, value: this.rows[this.pointer++] }
      } else {
        this.pointer = 0
        return { done: true, value: undefined } as any as IteratorResult<Row<I>>
      }
    } else if (this.rows instanceof Row) {
      return { done: true, value: this.rows }
    } else {
      return { done: true, value: undefined } as any as IteratorResult<Row<I>>
    }
  }

}