import { ModelItems } from "./ModelBase";

export class Row<T extends ModelItems>{
  protected row: T = <T>{}

  public constructor(rowItems?: T) {
    if (rowItems) {
      this.row = rowItems
    }
    return new Proxy(this, {
      get: function (target, prop) {
        return target.row[prop] || ''
      }
    })
  }
}