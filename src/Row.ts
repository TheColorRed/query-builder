import { ModelItems } from "./ModelBase";

export type Row<I extends ModelItems> = _Row<I> & I

export class _Row<I extends ModelItems> {

  private _row: I = <I>{}
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

  public constructor(rowItems?: I) {
    if (rowItems) {
      this._row = JSON.parse(JSON.stringify(rowItems))
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

// export const Row = _Row as (new <T extends ModelItems>(rowItems?: T) => Row<T>)

export const Row = _Row as {
  new <I>(rowItems?: I): Row<I>
  prototype: _Row<{}>
}