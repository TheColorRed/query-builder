import { ModelItems } from "./ModelBase";

export class Row<T extends ModelItems> {

  private _row: T = <T>{}
  private _dirty: boolean = false
  private _newRow: boolean = true
  private pointer: number = 0

  public get row() { return this._row }
  public get isDirty() { return this._dirty }
  public get isNewRow() { return this._newRow }

  public dirty() {
    this._dirty = true
  }

  public newRow() {
    this._newRow = true
  }

  public constructor(rowItems?: T) {
    if (rowItems) {
      this._row = rowItems
    }
    return new Proxy(this, {
      get: function (target, prop) {
        return (<any>target)[prop] || target._row[prop] || ''
      },
      set: function (target, prop, value) {
        target._row[prop] = value
        return true
        // if (target._row[prop]) {
        //   target._row[prop] = value
        //   return true
        // }
        // else {
        //   (<any>target)[prop] = value
        // }
        // return false
      }
    })
  }

  // public next(): IteratorResult<Row<T>> {
  //   if (this.pointer < this.rows.length) {
  //     return { done: false, value: this.rows[this.pointer++] }
  //   } else {
  //     this.pointer = 0
  //     return { done: true, value: undefined } as any as IteratorResult<Row<T>>
  //   }
  // }
}