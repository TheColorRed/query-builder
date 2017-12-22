import { ModelItems } from "./ModelBase";

// export type Row<T extends ModelItems> = {
//   [key: string]: T
// }// & {[P in T]}

export interface Row<T extends ModelItems> {
  [key: string]: T
}

export class Row<T extends ModelItems> {

  private _row: T = <T>{}
  private _dirty: boolean = false
  private _newRow: boolean = true

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
        if (['_row', '_dirty', '_newRow'].indexOf(prop.toString()) == -1) {
          target._row[prop] = value
        } else {
          (<any>target)[prop] = value
        }
        return true
      }
    })
  }

}