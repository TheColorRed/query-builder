import { model } from 'query-builder'

export interface Purchase {
  id?: number
  amount?: number
}

export default class purchases extends model<Purchase> {

  public constructor() {
    super({
      table: 'purchases',
      fillable: ['amount'],
      primaryKey: ['id']
    })
  }

  public static awesome() {
    return this.create<purchases, Purchase>().awesome()
  }

  public awesome() {
    console.log('hi')
    return this
  }

}